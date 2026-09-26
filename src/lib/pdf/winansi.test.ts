import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { createPdfTextSanitizer } from "./winansi";

describe("createPdfTextSanitizer", () => {
  it("keeps Latin text, folds diacritics outside WinAnsi, replaces the rest and reports it", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const text = createPdfTextSanitizer(font);

    expect(text.sanitize("Mario Rossi – “àèé” €")).toBe("Mario Rossi – “àèé” €");
    expect(text.hadReplacements).toBe(false);
    expect(text.sanitize("Ğirgis")).toBe("Girgis");
    expect(text.hadReplacements).toBe(false);

    const arabic = text.sanitize("مينا");
    expect(arabic).toBe("????");
    expect(text.hadReplacements).toBe(true);

    const page = doc.addPage();
    for (const s of ["مينا جرجس", "Ⲙⲏⲛⲁ", "🙏", "Ğ"]) {
      expect(() => page.drawText(text.sanitize(s), { font })).not.toThrow();
    }
  });
});
