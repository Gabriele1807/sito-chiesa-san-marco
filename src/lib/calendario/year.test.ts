import { describe, it, expect, vi } from "vitest";

// Database non raggiungibile: l'elenco deve funzionare con i valori predefiniti.
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@/lib/mongo/client", () => ({
  getDb: vi.fn(async () => {
    throw new Error("MongoServerSelectionError: ECONNREFUSED");
  }),
}));

import { isoKeyOfJdn, gregorianToJdn } from "./jdn";
import { DEFAULT_CONFIG, type CalendarConfig } from "./resolver";
import { DEFAULT_FIXED_FEASTS } from "./rules";
import { buildCopticYearCalendar, markTimeline, type YearEntry } from "./year";
import { getCalendarConfigSafe } from "@/lib/calendario-data";

// Date attese ricavate dal riferimento indipendente di
// scripts/confronto-algoritmi/riferimento.py (non dal motore del sito).

const iso = (e: YearEntry) =>
  e.start.jdn === e.end.jdn
    ? isoKeyOfJdn(e.start.jdn)
    : `${isoKeyOfJdn(e.start.jdn)}/${isoKeyOfJdn(e.end.jdn)}`;

function byKey(year: number, config: CalendarConfig = DEFAULT_CONFIG) {
  const cal = buildCopticYearCalendar(year, config);
  return Object.fromEntries(cal.entries.map((e) => [e.key, iso(e)]));
}

const EXPECTED_KEYS = [
  "fissa:nayrouz",
  "fissa:croce",
  "fissa:epifania",
  "fissa:annunciazione",
  "fissa:apostoli",
  "fissa:assunzione",
  "mobile:palme",
  "mobile:pasqua",
  "mobile:ascensione",
  "mobile:pentecoste",
  "digiuno:giona",
  "digiuno:grande-quaresima",
  "digiuno:settimana-santa",
  "digiuno:apostoli",
  "digiuno:natale",
  "periodo:cinquantina",
];

describe("buildCopticYearCalendar", () => {
  it("covers the whole Coptic year, 1 Tut to the last day of Nassi", () => {
    const leap = buildCopticYearCalendar(1743);
    expect(leap.isLeapYear).toBe(true);
    expect(isoKeyOfJdn(leap.start.jdn)).toBe("2026-09-11");
    expect(isoKeyOfJdn(leap.end.jdn)).toBe("2027-09-11");
    expect(leap.end.coptic).toEqual({ year: 1743, month: 13, day: 6 });

    const normal = buildCopticYearCalendar(1742);
    expect(normal.isLeapYear).toBe(false);
    expect(isoKeyOfJdn(normal.end.jdn)).toBe("2026-09-10");
    expect(normal.end.coptic).toEqual({ year: 1742, month: 13, day: 5 });
  });

  it.each([1739, 1740, 1741, 1742, 1743, 1744])(
    "lists the expected feasts, fasts and periods in %i, sorted by date",
    (year) => {
      const cal = buildCopticYearCalendar(year);
      expect(cal.entries.map((e) => e.key).sort()).toEqual([...EXPECTED_KEYS].sort());
      const starts = cal.entries.map((e) => e.start.jdn);
      expect(starts).toEqual([...starts].sort((a, b) => a - b));
      for (const e of cal.entries) {
        expect(e.start.jdn).toBeGreaterThanOrEqual(cal.start.jdn);
        expect(e.end.jdn).toBeLessThanOrEqual(cal.end.jdn);
        expect(e.end.jdn).toBeGreaterThanOrEqual(e.start.jdn);
      }
    }
  );

  it("gives the verified dates for 1743 A.M. (leap year)", () => {
    expect(byKey(1743)).toEqual({
      "fissa:nayrouz": "2026-09-11",
      "fissa:croce": "2026-09-27",
      "digiuno:natale": "2026-11-25/2027-01-06",
      "fissa:epifania": "2027-01-19",
      "digiuno:giona": "2027-02-22/2027-02-24",
      "digiuno:grande-quaresima": "2027-03-08/2027-04-24",
      "fissa:annunciazione": "2027-04-07",
      "mobile:palme": "2027-04-25",
      "digiuno:settimana-santa": "2027-04-25/2027-05-01",
      "mobile:pasqua": "2027-05-02",
      "periodo:cinquantina": "2027-05-02/2027-06-20",
      "mobile:ascensione": "2027-06-10",
      "mobile:pentecoste": "2027-06-20",
      "digiuno:apostoli": "2027-06-21/2027-07-11",
      "fissa:apostoli": "2027-07-12",
      "fissa:assunzione": "2027-08-22",
    });
  });

  it("gives the verified dates for 1740 A.M. (new year on 12 September)", () => {
    const d = byKey(1740);
    expect(d["fissa:nayrouz"]).toBe("2023-09-12");
    expect(d["fissa:epifania"]).toBe("2024-01-20");
    expect(d["mobile:pasqua"]).toBe("2024-05-05");
    expect(d["digiuno:natale"]).toBe("2023-11-26/2024-01-07");
    expect(d["digiuno:apostoli"]).toBe("2024-06-24/2024-07-11");
  });

  it("puts a feast before a fast or period starting on the same day", () => {
    const keys = buildCopticYearCalendar(1743).entries.map((e) => e.key);
    expect(keys.indexOf("mobile:palme")).toBeLessThan(keys.indexOf("digiuno:settimana-santa"));
    expect(keys.indexOf("mobile:pasqua")).toBeLessThan(keys.indexOf("periodo:cinquantina"));
  });

  it("does not invent a date for Christmas while the rule is not set", () => {
    const cal = buildCopticYearCalendar(1743);
    expect(cal.entries.some((e) => e.id === "natale" && e.kind === "fissa")).toBe(false);
    expect(cal.pending).toContainEqual({ id: "natale", rule: "natale" });
  });

  it("shows Christmas when the admin has set the rule", () => {
    const k29: CalendarConfig = {
      feasts: DEFAULT_FIXED_FEASTS,
      rules: { natale: { enabled: true, value: "29-koiak" } },
    };
    expect(byKey(1740, k29)["fissa:natale"]).toBe("2024-01-08");
    const jan7: CalendarConfig = {
      feasts: DEFAULT_FIXED_FEASTS,
      rules: { natale: { enabled: true, value: "7-gennaio" } },
    };
    expect(byKey(1740, jan7)["fissa:natale"]).toBe("2024-01-07");
    // il digiuno termina la vigilia
    expect(byKey(1740, k29)["digiuno:natale"]).toBe("2023-11-26/2024-01-07");
    expect(buildCopticYearCalendar(1740, k29).pending.some((p) => p.id === "natale")).toBe(false);
  });

  it("flags the sixth day of Nassi only in leap years while its rule is not set", () => {
    const leap = buildCopticYearCalendar(1743).pending.find((p) => p.id === "nasi6");
    expect(leap?.day && isoKeyOfJdn(leap.day.jdn)).toBe("2027-09-11");
    expect(buildCopticYearCalendar(1742).pending.some((p) => p.id === "nasi6")).toBe(false);
    const set: CalendarConfig = {
      feasts: DEFAULT_FIXED_FEASTS,
      rules: { nasi6: { enabled: true, value: "come-5-nasi" } },
    };
    expect(buildCopticYearCalendar(1743, set).pending.some((p) => p.id === "nasi6")).toBe(false);
  });

  it("flags a fixed feast in Holy Week (Annunciation, 7 April 2026) as uncertain", () => {
    const e = buildCopticYearCalendar(1742).entries.find((x) => x.key === "fissa:annunciazione");
    expect(e && isoKeyOfJdn(e.start.jdn)).toBe("2026-04-07");
    expect(e?.uncertain).toEqual(["concomitanze"]);
    const other = buildCopticYearCalendar(1743).entries.find(
      (x) => x.key === "fissa:annunciazione"
    );
    expect(other?.uncertain).toEqual([]);
  });

  it("follows the admin's feasts: disabled feasts are absent, new ones appear", () => {
    const config: CalendarConfig = {
      feasts: [
        ...DEFAULT_FIXED_FEASTS.filter((f) => f.id !== "croce"),
        { id: "san-marco", month: 8, day: 30, name: { it: "San Marco" } },
      ],
      rules: {},
    };
    const d = byKey(1743, config);
    expect(d["fissa:croce"]).toBeUndefined();
    expect(d["fissa:san-marco"]).toBe("2027-05-08");
  });

  it("works when the database is unreachable (same path as the page)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { data, fallback } = await getCalendarConfigSafe();
    expect(fallback).toBe(true);
    const config: CalendarConfig = { feasts: data.feasts, rules: data.rules };
    expect(byKey(1743, config)).toEqual(byKey(1743));
    expect(buildCopticYearCalendar(1743, config).pending.map((p) => p.id)).toEqual([
      "natale",
      "nasi6",
    ]);
  });

  it("memoizes the result per configuration and year", () => {
    expect(buildCopticYearCalendar(1743)).toBe(buildCopticYearCalendar(1743));
    expect(buildCopticYearCalendar(1743)).not.toBe(buildCopticYearCalendar(1744));
  });
});

describe("markTimeline", () => {
  const cal = buildCopticYearCalendar(1743);
  const status = (jdn: number) => markTimeline(cal, jdn);

  it("marks past, current and future entries and the next feast", () => {
    const today = gregorianToJdn(2026, 11, 9);
    const m = status(today);
    expect(m.status["fissa:nayrouz"]).toBe("passata");
    expect(m.status["digiuno:natale"]).toBe("futura");
    expect(m.nextFeastKey).toBe("fissa:epifania");
  });

  it("treats a fast in progress as current and a feast today as the next one", () => {
    const m = status(gregorianToJdn(2026, 12, 1));
    expect(m.status["digiuno:natale"]).toBe("in-corso");
    const easter = status(gregorianToJdn(2027, 5, 2));
    expect(easter.status["mobile:pasqua"]).toBe("in-corso");
    expect(easter.nextFeastKey).toBe("mobile:pasqua");
  });

  it("highlights nothing outside the selected year", () => {
    expect(status(gregorianToJdn(2030, 1, 1)).nextFeastKey).toBeNull();
    expect(status(gregorianToJdn(2020, 1, 1)).nextFeastKey).toBeNull();
    expect(status(gregorianToJdn(2020, 1, 1)).status["fissa:nayrouz"]).toBe("futura");
  });
});
