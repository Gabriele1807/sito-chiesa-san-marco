import { describe, it, expect } from "vitest";
import { getNextCelebration, localizeGiorno } from "./next-celebration";
import type { OrarioSettimanale } from "@/types";

const orari: OrarioSettimanale[] = [
  { giorno: "Domenica", celebrazioni: [{ tipo: "Divina Liturgia", orario: "09:00" }] },
  { giorno: "Mercoledì", celebrazioni: [{ tipo: "Vespri", orario: "19:00" }] },
];

describe("getNextCelebration", () => {
  it("picks a later celebration on the same day", () => {
    // mercoledì 30 settembre 2026, 18:00 (ora locale)
    expect(getNextCelebration(orari, new Date(2026, 8, 30, 18, 0))).toMatchObject({
      giorno: "Mercoledì",
      tipo: "Vespri",
    });
  });

  it("moves to the following days once today's are over", () => {
    // mercoledì 30 settembre 2026, 20:00
    expect(getNextCelebration(orari, new Date(2026, 8, 30, 20, 0))).toMatchObject({
      giorno: "Domenica",
      orario: "09:00",
    });
  });

  it("returns null without schedules", () => {
    expect(getNextCelebration([])).toBeNull();
  });
});

describe("localizeGiorno", () => {
  it("translates the stored Italian day names to Arabic", () => {
    expect(localizeGiorno("Domenica", "ar")).toBe("الأحد");
    expect(localizeGiorno("Venerdì", "ar")).toBe("الجمعة");
  });

  it("keeps Italian and unknown values unchanged", () => {
    expect(localizeGiorno("Domenica", "it")).toBe("Domenica");
    expect(localizeGiorno("Festa", "ar")).toBe("Festa");
  });
});
