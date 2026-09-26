import type { PDFFont } from "pdf-lib";

/**
 * I font standard di pdf-lib (Helvetica, ecc.) usano la codifica WinAnsi:
 * `drawText` lancia un'eccezione su qualunque carattere fuori da quel set
 * (arabo, copto, emoji, molte lettere accentate dell'Europa orientale), e una
 * sola iscrizione con un nome in arabo faceva fallire l'intero export (500).
 *
 * Questo helper rende il testo sempre disegnabile: prima prova a togliere i
 * segni diacritici ("Ğ" → "G"), poi sostituisce ciò che resta di non
 * rappresentabile con "?" e segnala la sostituzione, così il chiamante può
 * avvisarlo nel documento invece di perdere il dato in silenzio.
 */
export function createPdfTextSanitizer(font: PDFFont) {
  const supported = new Set(font.getCharacterSet());
  let replaced = false;

  function sanitize(text: string): string {
    let out = "";
    for (const ch of text) {
      if (supported.has(ch.codePointAt(0)!)) {
        out += ch;
        continue;
      }
      const base = ch.normalize("NFD").replace(/\p{M}/gu, "");
      if (base && Array.from(base).every((c) => supported.has(c.codePointAt(0)!))) {
        out += base;
      } else {
        out += "?";
        replaced = true;
      }
    }
    return out;
  }

  return {
    sanitize,
    get hadReplacements() {
      return replaced;
    },
  };
}
