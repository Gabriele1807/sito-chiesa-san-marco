import { describe, it, expect } from "vitest";
import { gregorianToJdn, jdnToGregorian, julianToJdn, jdnToJulian, weekdayOfJdn } from "./jdn";
import {
  copticToJdn,
  jdnToCoptic,
  isCopticLeapYear,
  copticMonthLength,
  isValidCopticDate,
  copticNewYearJdn,
} from "./coptic";
import { COPTIC_MONTHS } from "./months";
import { copticEasterJdn, copticEaster } from "./easter";

const g = (y: number, m: number, d: number) => jdnToCoptic(gregorianToJdn(y, m, d));

describe("Julian Day Number", () => {
  it("matches reference values", () => {
    expect(gregorianToJdn(2000, 1, 1)).toBe(2451545);
    expect(gregorianToJdn(1970, 1, 1)).toBe(2440588);
    expect(gregorianToJdn(1858, 11, 17)).toBe(2400001);
    // 4 ottobre 1582 (giuliano) è seguito dal 15 ottobre 1582 (gregoriano)
    expect(julianToJdn(1582, 10, 4) + 1).toBe(gregorianToJdn(1582, 10, 15));
  });

  it("round-trips Gregorian and Julian dates", () => {
    for (let jdn = gregorianToJdn(1700, 1, 1); jdn < gregorianToJdn(2300, 1, 1); jdn += 7) {
      const { year, month, day } = jdnToGregorian(jdn);
      expect(gregorianToJdn(year, month, day)).toBe(jdn);
      const j = jdnToJulian(jdn);
      expect(julianToJdn(j.year, j.month, j.day)).toBe(jdn);
    }
  });

  it("computes the weekday (0 = domenica)", () => {
    expect(weekdayOfJdn(gregorianToJdn(2025, 1, 5))).toBe(0);
    expect(weekdayOfJdn(gregorianToJdn(2025, 1, 7))).toBe(2);
    expect(weekdayOfJdn(gregorianToJdn(2000, 1, 1))).toBe(6);
  });
});

describe("Calendario copto: casi di riferimento", () => {
  it("11 settembre 2024 = 1 Thout 1741 (Capodanno)", () => {
    expect(g(2024, 9, 11)).toEqual({ year: 1741, month: 1, day: 1 });
  });

  it("5 gennaio 2025 = 27 Koiak 1741", () => {
    expect(g(2025, 1, 5)).toEqual({ year: 1741, month: 4, day: 27 });
  });

  it("7 gennaio 2025 = 29 Koiak 1741", () => {
    expect(g(2025, 1, 7)).toEqual({ year: 1741, month: 4, day: 29 });
  });

  it("28 giugno 2025 = 21 Paoni (Paone) 1741", () => {
    expect(g(2025, 6, 28)).toEqual({ year: 1741, month: 10, day: 21 });
    expect(COPTIC_MONTHS[9].translit).toBe("Paoni");
  });

  it("10, 11, 12 settembre in un anno normale (2025 precede il 2026, non bisestile)", () => {
    expect(g(2025, 9, 10)).toEqual({ year: 1741, month: 13, day: 5 });
    expect(g(2025, 9, 11)).toEqual({ year: 1742, month: 1, day: 1 });
    expect(g(2025, 9, 12)).toEqual({ year: 1742, month: 1, day: 2 });
  });

  it("10, 11, 12 settembre prima di un anno bisestile gregoriano (2023 → 2024)", () => {
    expect(isCopticLeapYear(1739)).toBe(true);
    expect(g(2023, 9, 10)).toEqual({ year: 1739, month: 13, day: 5 });
    expect(g(2023, 9, 11)).toEqual({ year: 1739, month: 13, day: 6 });
    expect(g(2023, 9, 12)).toEqual({ year: 1740, month: 1, day: 1 });
  });

  it("Capodanno l'11 settembre, o il 12 se l'anno gregoriano successivo è bisestile", () => {
    for (let gy = 1800; gy <= 2200; gy++) {
      const next = gy + 1;
      const nextIsLeap = (next % 4 === 0 && next % 100 !== 0) || next % 400 === 0;
      const ny = jdnToGregorian(copticNewYearJdn(gy - 283));
      // Fuori dall'intervallo 1900-2099 lo scarto giuliano-gregoriano cambia:
      // il Capodanno resta il 1 Thout, ma la data gregoriana slitta.
      if (gy >= 1900 && gy <= 2098) {
        expect(ny).toEqual({ year: gy, month: 9, day: nextIsLeap ? 12 : 11 });
      }
      expect(jdnToCoptic(copticNewYearJdn(gy - 283))).toEqual({
        year: gy - 283,
        month: 1,
        day: 1,
      });
    }
  });

  it("28 e 29 febbraio, 1 marzo 2024", () => {
    expect(g(2024, 2, 28)).toEqual({ year: 1740, month: 6, day: 20 });
    expect(g(2024, 2, 29)).toEqual({ year: 1740, month: 6, day: 21 });
    expect(g(2024, 3, 1)).toEqual({ year: 1740, month: 6, day: 22 });
    // anno non bisestile: dal 28 febbraio si passa al 1 marzo
    expect(g(2025, 2, 28)).toEqual({ year: 1741, month: 6, day: 21 });
    expect(g(2025, 3, 1)).toEqual({ year: 1741, month: 6, day: 22 });
  });

  it("31 dicembre e 1 gennaio non cambiano l'anno copto", () => {
    expect(g(2024, 12, 31)).toEqual({ year: 1741, month: 4, day: 22 });
    expect(g(2025, 1, 1)).toEqual({ year: 1741, month: 4, day: 23 });
  });

  it("giorni 5 e 6 di Nasi", () => {
    expect(copticMonthLength(1739, 13)).toBe(6);
    expect(copticMonthLength(1740, 13)).toBe(5);
    expect(isValidCopticDate(1740, 13, 6)).toBe(false);
    expect(isValidCopticDate(1743, 13, 6)).toBe(true);
    expect(jdnToGregorian(copticToJdn(1743, 13, 6))).toEqual({ year: 2027, month: 9, day: 11 });
    expect(jdnToGregorian(copticToJdn(1740, 13, 5))).toEqual({ year: 2024, month: 9, day: 10 });
  });

  it("anno bisestile copto quando (anno + 1) è divisibile per 4", () => {
    expect([1735, 1739, 1743, 1747].every(isCopticLeapYear)).toBe(true);
    expect([1740, 1741, 1742, 1744].some(isCopticLeapYear)).toBe(false);
  });

  it("la differenza tra anno gregoriano e copto è 284 prima del Capodanno e 283 dopo", () => {
    expect(2025 - g(2025, 9, 10).year).toBe(284);
    expect(2025 - g(2025, 9, 11).year).toBe(283);
  });
});

describe("Andata e ritorno e invarianza", () => {
  it("gregoriano → copto → gregoriano su 1800-2200", () => {
    const start = gregorianToJdn(1800, 1, 1);
    const end = gregorianToJdn(2200, 12, 31);
    let prev = jdnToCoptic(start - 1);
    for (let jdn = start; jdn <= end; jdn++) {
      const c = jdnToCoptic(jdn);
      expect(copticToJdn(c.year, c.month, c.day)).toBe(jdn);
      // i giorni copti si susseguono senza salti
      const continues =
        (c.year === prev.year && c.month === prev.month && c.day === prev.day + 1) ||
        (c.year === prev.year && c.month === prev.month + 1 && c.day === 1) ||
        (c.year === prev.year + 1 && c.month === 1 && c.day === 1);
      if (!continues) throw new Error(`salto a JDN ${jdn}: ${JSON.stringify([prev, c])}`);
      prev = c;
    }
  });

  it("ogni anno copto ha 365 o 366 giorni", () => {
    for (let y = 1500; y <= 1950; y++) {
      expect(copticNewYearJdn(y + 1) - copticNewYearJdn(y)).toBe(isCopticLeapYear(y) ? 366 : 365);
    }
  });
});

describe("Pasqua copta", () => {
  // Date note della Pasqua copta/ortodossa (calendario gregoriano)
  const known: [number, number, number][] = [
    [2000, 4, 30],
    [2001, 4, 15],
    [2002, 5, 5],
    [2003, 4, 27],
    [2004, 4, 11],
    [2005, 5, 1],
    [2010, 4, 4],
    [2011, 4, 24],
    [2012, 4, 15],
    [2013, 5, 5],
    [2014, 4, 20],
    [2015, 4, 12],
    [2016, 5, 1],
    [2017, 4, 16],
    [2018, 4, 8],
    [2019, 4, 28],
    [2020, 4, 19],
    [2021, 5, 2],
    [2022, 4, 24],
    [2023, 4, 16],
    [2024, 5, 5],
    [2025, 4, 20],
    [2026, 4, 12],
    [2027, 5, 2],
    [2028, 4, 16],
    [2029, 4, 8],
    [2030, 4, 28],
  ];

  it.each(known)("Pasqua %i = %i/%i", (year, month, day) => {
    expect(copticEaster(year)).toEqual({ year, month, day });
  });

  it("cade sempre di domenica, tra il 22 marzo e il 25 aprile giuliani (1800-2200)", () => {
    for (let y = 1800; y <= 2200; y++) {
      const jdn = copticEasterJdn(y);
      expect(weekdayOfJdn(jdn)).toBe(0);
      const j = jdnToJulian(jdn);
      expect(j.year).toBe(y);
      const md = j.month * 100 + j.day;
      expect(md >= 322 && md <= 425).toBe(true);
    }
  });
});

describe("Mesi", () => {
  it("13 mesi, 12 da 30 giorni più Nasi", () => {
    expect(COPTIC_MONTHS.map((m) => m.translit)).toEqual([
      "Thout",
      "Paope",
      "Hathor",
      "Koiak",
      "Tobi",
      "Meshir",
      "Paremhat",
      "Paremoude",
      "Pashons",
      "Paoni",
      "Epip",
      "Mesori",
      "Nasi",
    ]);
    for (let m = 1; m <= 12; m++) expect(copticMonthLength(1741, m)).toBe(30);
  });
});
