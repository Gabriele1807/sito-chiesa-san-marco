import { describe, it, expect } from "vitest";
import { gregorianToJdn } from "./jdn";
import { copticToJdn, copticYearLength } from "./coptic";
import { resolveLiturgicalDay, DEFAULT_CONFIG, type CalendarConfig } from "./resolver";
import { CONFIGURABLE_RULES, DEFAULT_FIXED_FEASTS, ruleIsActive } from "./rules";
import { contentKeysFor, loadDayContent, type DayContent } from "./content";

const day = (y: number, m: number, d: number, config?: CalendarConfig) =>
  resolveLiturgicalDay(gregorianToJdn(y, m, d), config);

describe("Risolutore del giorno liturgico", () => {
  it("descrive un giorno con mese, settimana, Pasqua e chiavi", () => {
    const info = day(2025, 1, 5);
    expect(info.coptic).toEqual({ year: 1741, month: 4, day: 27 });
    expect(info.weekday).toBe(0);
    expect(info.sundayOfMonth).toBe(4);
    expect(info.easter.isoKey).toBe("2025-04-20");
    expect(info.daysFromEaster).toBe(-105);
    expect(info.keys).toEqual({
      coptic: "1741-04-27",
      iso: "2025-01-05",
      fixed: "04-27",
      movable: "E-105",
      seasonal: "04-S4-0",
    });
  });

  it("numera la settimana del mese dalla domenica precedente", () => {
    // 1 Tut 1741 = mercoledì 11 settembre 2024: prima della prima domenica
    expect(day(2024, 9, 11).keys.seasonal).toBe("01-S0-3");
    // 15 settembre 2024 = prima domenica di Tut
    const firstSunday = day(2024, 9, 15);
    expect(firstSunday.sundayOfMonth).toBe(1);
    expect(firstSunday.keys.seasonal).toBe("01-S1-0");
    expect(day(2024, 9, 16).keys.seasonal).toBe("01-S1-1");
    expect(day(2024, 9, 16).sundayOfMonth).toBeNull();
  });

  it("riconosce la Pasqua e le stagioni mobili", () => {
    const easter = day(2025, 4, 20);
    expect(easter.daysFromEaster).toBe(0);
    expect(easter.keys.movable).toBe("E+0");
    expect(easter.feasts.map((f) => f.id)).toContain("pasqua");
    expect(easter.season).toBe("cinquantina");

    expect(day(2025, 4, 13).season).toBe("settimana-santa"); // Palme
    expect(day(2025, 4, 13).feasts.map((f) => f.id)).toContain("palme");
    expect(day(2025, 2, 24).season).toBe("grande-quaresima"); // E-55
    expect(day(2025, 2, 23).season).not.toBe("grande-quaresima");
    expect(day(2025, 2, 10).fasts).toContain("giona"); // E-69
    expect(day(2025, 2, 12).fasts).toContain("giona"); // E-67
    expect(day(2025, 2, 13).fasts).not.toContain("giona");
    expect(day(2025, 6, 8).feasts.map((f) => f.id)).toContain("pentecoste"); // E+49
    expect(day(2025, 5, 29).feasts.map((f) => f.id)).toContain("ascensione"); // E+39
  });

  it("digiuno degli Apostoli: dal giorno dopo Pentecoste fino al 4 Abib", () => {
    expect(day(2025, 6, 8).fasts).not.toContain("apostoli");
    expect(day(2025, 6, 9).fasts).toContain("apostoli");
    expect(day(2025, 7, 11).coptic).toMatchObject({ month: 11, day: 4 });
    expect(day(2025, 7, 11).fasts).toContain("apostoli");
    expect(day(2025, 7, 12).fasts).not.toContain("apostoli");
    expect(day(2025, 7, 12).feasts.map((f) => f.id)).toContain("apostoli");
  });

  it("digiuno di Natale dal 16 Hatur al 28 Kiahk (finché la regola del Natale è disattivata)", () => {
    const start = resolveLiturgicalDay(copticToJdn(1741, 3, 16));
    expect(start.fasts).toContain("natale");
    expect(resolveLiturgicalDay(copticToJdn(1741, 3, 15)).fasts).not.toContain("natale");
    expect(resolveLiturgicalDay(copticToJdn(1741, 4, 28)).fasts).toContain("natale");
    expect(resolveLiturgicalDay(copticToJdn(1741, 4, 29)).fasts).not.toContain("natale");
  });

  it("feste fisse certe: Nayrouz, Croce, Epifania, Annunciazione, Apostoli, Assunzione", () => {
    const ids = (m: number, d: number) =>
      resolveLiturgicalDay(copticToJdn(1741, m, d)).feasts.map((f) => f.id);
    expect(ids(1, 1)).toContain("nayrouz");
    expect(ids(1, 17)).toContain("croce");
    expect(ids(5, 11)).toContain("epifania");
    expect(ids(7, 29)).toContain("annunciazione");
    expect(ids(11, 5)).toContain("apostoli");
    expect(ids(12, 16)).toContain("assunzione");
    expect(DEFAULT_FIXED_FEASTS).toHaveLength(6);
  });

  it("il Natale non viene mostrato finché la regola incerta è disattivata", () => {
    const christmas = day(2025, 1, 7);
    expect(christmas.feasts.map((f) => f.id)).not.toContain("natale");
    expect(christmas.uncertain).toContain("natale");
  });

  it("con la regola del Natale impostata, sposta festa e fine del digiuno", () => {
    const on29: CalendarConfig = {
      ...DEFAULT_CONFIG,
      rules: { natale: { enabled: true, value: "29-koiak" } },
    };
    const onJan7: CalendarConfig = {
      ...DEFAULT_CONFIG,
      rules: { natale: { enabled: true, value: "7-gennaio" } },
    };
    // 2025: 29 Kiahk = 7 gennaio, le due impostazioni coincidono
    expect(day(2025, 1, 7, on29).feasts.map((f) => f.id)).toContain("natale");
    expect(day(2025, 1, 7, onJan7).feasts.map((f) => f.id)).toContain("natale");
    // 2024: 29 Kiahk = 8 gennaio
    expect(day(2024, 1, 8, on29).feasts.map((f) => f.id)).toContain("natale");
    expect(day(2024, 1, 7, onJan7).feasts.map((f) => f.id)).toContain("natale");
    expect(day(2024, 1, 7, onJan7).coptic).toMatchObject({ month: 4, day: 28 });
    expect(day(2024, 1, 7, onJan7).fasts).not.toContain("natale");
    expect(day(2024, 1, 6, onJan7).fasts).toContain("natale");
    expect(day(2024, 1, 7, onJan7).uncertain).not.toContain("natale");
  });

  it("le regole incerte sono disattivate per impostazione predefinita", () => {
    for (const rule of CONFIGURABLE_RULES) {
      expect(rule.defaultEnabled).toBe(false);
      expect(ruleIsActive(DEFAULT_CONFIG.rules, rule.id)).toBe(false);
    }
    // una regola "attiva" senza valore valido resta disattivata
    expect(ruleIsActive({ natale: { enabled: true, value: "boh" } }, "natale")).toBe(false);
  });

  it("segnala le concomitanze tra feste fisse e Settimana Santa/Pasqua", () => {
    // 29 Baramhat 1747 cade il 7 aprile 2031... cerchiamo un anno con
    // l'Annunciazione nella Settimana Santa o a Pasqua
    let found = false;
    for (let y = 1700; y < 1800 && !found; y++) {
      const info = resolveLiturgicalDay(copticToJdn(y, 7, 29));
      if (info.season === "settimana-santa" || info.daysFromEaster === 0) {
        expect(info.uncertain).toContain("concomitanze");
        found = true;
      }
    }
    expect(found).toBe(true);
  });

  it("le feste fisse sono configurabili (disattivate o aggiunte dall'admin)", () => {
    const config: CalendarConfig = {
      ...DEFAULT_CONFIG,
      feasts: [
        ...DEFAULT_FIXED_FEASTS.filter((f) => f.id !== "croce"),
        { id: "prova", month: 2, day: 2, name: { it: "Prova" } },
      ],
    };
    expect(resolveLiturgicalDay(copticToJdn(1741, 1, 17), config).feasts).toHaveLength(0);
    expect(resolveLiturgicalDay(copticToJdn(1741, 2, 2), config).feasts[0].id).toBe("prova");
  });

  it("memoizza il risultato per configurazione", () => {
    const jdn = gregorianToJdn(2025, 1, 5);
    expect(resolveLiturgicalDay(jdn)).toBe(resolveLiturgicalDay(jdn));
  });
});

describe("Copertura completa dell'anno", () => {
  it.each([
    [1741, 365],
    [1743, 366],
  ])("ogni giorno dell'anno copto %i viene risolto (%i giorni)", (year, length) => {
    expect(copticYearLength(year)).toBe(length);
    const first = copticToJdn(year, 1, 1);
    const fixedKeys = new Set<string>();
    for (let jdn = first; jdn < first + length; jdn++) {
      const info = resolveLiturgicalDay(jdn);
      expect(info.coptic.year).toBe(year);
      expect(info.keys.fixed).toMatch(/^(0[1-9]|1[0-3])-(0[1-9]|[12]\d|30)$/);
      expect(info.keys.movable).toMatch(/^E[+-]\d+$/);
      expect(info.keys.seasonal).toMatch(/^(0[1-9]|1[0-3])-S[0-5]-[0-6]$/);
      expect(info.keys.coptic).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(info.keys.iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      fixedKeys.add(info.keys.fixed);
    }
    expect(fixedKeys.size).toBe(length);
  });
});

describe("Chiavi dei contenuti e provider", () => {
  it("il 6 di Nassi usa la propria chiave finché la regola è disattivata", () => {
    const info = resolveLiturgicalDay(copticToJdn(1743, 13, 6));
    expect(contentKeysFor(info, DEFAULT_CONFIG).fixed).toBe("13-06");
    expect(info.uncertain).toContain("nasi6");
    const config: CalendarConfig = {
      ...DEFAULT_CONFIG,
      rules: { nasi6: { enabled: true, value: "come-5-nasi" } },
    };
    expect(
      contentKeysFor(resolveLiturgicalDay(copticToJdn(1743, 13, 6), config), config).fixed
    ).toBe("13-05");
  });

  it("restituisce 'nessuna lettura disponibile' se un livello non ha dati o fallisce", async () => {
    const info = day(2025, 1, 5);
    const fixed: DayContent = { level: "fixed", key: "04-27", sinassario: { it: "Testo" } };
    const bundle = await loadDayContent(contentKeysFor(info, DEFAULT_CONFIG), {
      async get(level, key) {
        if (level === "fixed" && key === "04-27") return fixed;
        if (level === "movable") throw new Error("database irraggiungibile");
        return null;
      },
    });
    expect(bundle).toEqual({ fixed, movable: null, seasonal: null, available: true });

    const empty = await loadDayContent(contentKeysFor(info, DEFAULT_CONFIG), {
      async get() {
        throw new Error("offline");
      },
    });
    expect(empty.available).toBe(false);
  });
});

describe("Ricerca di un giorno per chiave (anteprima admin)", () => {
  it("trova un giorno per chiavi fisse, mobili, stagionali e il 6 di Nassi", async () => {
    const { findDayForKey } = await import("./lookup");
    expect(findDayForKey("fixed", "04-27", DEFAULT_CONFIG, 1741)?.keys.iso).toBe("2025-01-05");
    expect(findDayForKey("movable", "E+0", DEFAULT_CONFIG, 1741)?.keys.iso).toBe("2025-04-20");
    expect(findDayForKey("seasonal", "04-S4-0", DEFAULT_CONFIG, 1741)?.keys.iso).toBe("2025-01-05");
    expect(findDayForKey("fixed", "13-06", DEFAULT_CONFIG, 1741)?.coptic.year).toBe(1743);
    expect(findDayForKey("movable", "E+999", DEFAULT_CONFIG, 1741)).toBeNull();
  });
});
