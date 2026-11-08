import { describe, it, expect } from "vitest";
import { gregorianToJdn } from "./jdn";
import { localJdn, startOfDayInstant, zonedTimeToInstant, getZonedParts } from "./tz";
import { sunsetInstant } from "./sun";
import { computeDayState, DEFAULT_LOCATION } from "./service";

const MILANO = DEFAULT_LOCATION;
const CAIRO = { name: "Il Cairo", lat: 30.0444, lon: 31.2357 };
const NEW_YORK = { name: "New York", lat: 40.7128, lon: -74.006 };
const TOKYO = { name: "Tokyo", lat: 35.6762, lon: 139.6503 };

const at = (iso: string) => new Date(iso).getTime();
const minutes = (ms: number) => ms / 60_000;

describe("Fusi orari (Intl)", () => {
  it("legge data e ora locali in fusi diversi", () => {
    const t = at("2025-01-05T23:30:00Z");
    expect(localJdn(t, "Europe/Rome")).toBe(gregorianToJdn(2025, 1, 6));
    expect(localJdn(t, "America/New_York")).toBe(gregorianToJdn(2025, 1, 5));
    expect(getZonedParts(t, "Asia/Tokyo")).toMatchObject({ day: 6, hour: 8, minute: 30 });
  });

  it("trova la mezzanotte locale anche nei giorni del cambio d'ora", () => {
    const rome = "Europe/Rome";
    // 30 marzo 2025: si passa all'ora legale, il giorno dura 23 ore
    const mar30 = startOfDayInstant(gregorianToJdn(2025, 3, 30), rome);
    const mar31 = startOfDayInstant(gregorianToJdn(2025, 3, 31), rome);
    expect(new Date(mar30).toISOString()).toBe("2025-03-29T23:00:00.000Z");
    expect(new Date(mar31).toISOString()).toBe("2025-03-30T22:00:00.000Z");
    expect(minutes(mar31 - mar30)).toBe(23 * 60);
    // 26 ottobre 2025: si torna all'ora solare, il giorno dura 25 ore
    const oct26 = startOfDayInstant(gregorianToJdn(2025, 10, 26), rome);
    const oct27 = startOfDayInstant(gregorianToJdn(2025, 10, 27), rome);
    expect(minutes(oct27 - oct26)).toBe(25 * 60);
  });

  it("gestisce i fusi dove la mezzanotte non esiste (Cile, cambio d'ora alle 24)", () => {
    const santiago = "America/Santiago";
    const sep7 = startOfDayInstant(gregorianToJdn(2025, 9, 7), santiago);
    expect(localJdn(sep7, santiago)).toBe(gregorianToJdn(2025, 9, 7));
    expect(localJdn(sep7 - 1000, santiago)).toBe(gregorianToJdn(2025, 9, 6));
    expect(getZonedParts(sep7, santiago).hour).toBe(1);
  });

  it("converte un orario locale in istante", () => {
    const t = zonedTimeToInstant(gregorianToJdn(2025, 7, 1), 18, 30, "Europe/Rome");
    expect(new Date(t).toISOString()).toBe("2025-07-01T16:30:00.000Z");
  });
});

describe("Tramonto (algoritmo NOAA, nessuna rete)", () => {
  // Valori di riferimento delle effemeridi; tolleranza di 3 minuti.
  const cases: [string, typeof MILANO, [number, number, number], string][] = [
    ["Milano, solstizio d'estate", MILANO, [2025, 6, 21], "2025-06-21T19:15:00Z"],
    ["Milano, solstizio d'inverno", MILANO, [2025, 12, 21], "2025-12-21T15:42:00Z"],
    ["Il Cairo, giugno", CAIRO, [2025, 6, 21], "2025-06-21T16:59:00Z"],
    [
      "New York, giugno (tramonto dopo la mezzanotte UTC)",
      NEW_YORK,
      [2025, 6, 21],
      "2025-06-22T00:31:00Z",
    ],
  ];

  it.each(cases)("%s", (_label, loc, [y, m, d], expected) => {
    const sunset = sunsetInstant(gregorianToJdn(y, m, d), loc.lat, loc.lon);
    expect(sunset.kind).toBe("normal");
    expect(Math.abs(minutes(sunset.at! - at(expected)))).toBeLessThanOrEqual(3);
  });

  it("segnala notte o giorno polare", () => {
    expect(sunsetInstant(gregorianToJdn(2025, 6, 21), 78.2, 15.6).kind).toBe("midnight-sun");
    expect(sunsetInstant(gregorianToJdn(2025, 12, 21), 78.2, 15.6).kind).toBe("polar-night");
  });
});

describe("Giorno liturgico dal tramonto precedente", () => {
  const rome = "Europe/Rome";

  it("prima del tramonto il giorno liturgico coincide con quello civile", () => {
    const s = computeDayState(at("2025-01-05T11:00:00Z"), rome, MILANO);
    expect(s.civil.isoKey).toBe("2025-01-05");
    expect(s.liturgical.coptic).toEqual({ year: 1741, month: 4, day: 27 });
    expect(s.isAfterSunset).toBe(false);
    expect(s.nextChangeAt).toBe(s.sunset.at);
    expect(s.nextChangeKind).toBe("sunset");
  });

  it("dopo il tramonto il giorno liturgico è già quello successivo", () => {
    const s = computeDayState(at("2025-01-05T17:00:00Z"), rome, MILANO);
    expect(s.civil.isoKey).toBe("2025-01-05");
    expect(s.liturgical.coptic).toEqual({ year: 1741, month: 4, day: 28 });
    expect(s.liturgical.isoKey).toBe("2025-01-06");
    expect(s.isAfterSunset).toBe(true);
    expect(new Date(s.nextChangeAt).toISOString()).toBe("2025-01-05T23:00:00.000Z");
    expect(s.nextChangeKind).toBe("midnight");
  });

  it("a mezzanotte cambia il giorno civile ma non quello liturgico", () => {
    const before = computeDayState(at("2025-01-05T22:59:59Z"), rome, MILANO);
    const after = computeDayState(at("2025-01-05T23:00:00Z"), rome, MILANO);
    expect(before.civil.isoKey).toBe("2025-01-05");
    expect(after.civil.isoKey).toBe("2025-01-06");
    expect(after.liturgical.jdn).toBe(before.liturgical.jdn);
  });

  it("il passaggio avviene esattamente all'istante del tramonto", () => {
    const s = computeDayState(at("2025-01-05T11:00:00Z"), rome, MILANO);
    const justBefore = computeDayState(s.sunset.at - 1, rome, MILANO);
    const atSunset = computeDayState(s.sunset.at, rome, MILANO);
    expect(justBefore.liturgical.jdn + 1).toBe(atSunset.liturgical.jdn);
  });

  it("vigilia del Natale copto: dopo il tramonto del 6 gennaio 2025 è già 29 Kiahk", () => {
    const s = computeDayState(at("2025-01-06T18:00:00Z"), rome, MILANO);
    expect(s.liturgical.coptic).toEqual({ year: 1741, month: 4, day: 29 });
  });

  it("vigilia del Capodanno copto: la sera del 10 settembre 2024 è già 1 Tut 1741", () => {
    const s = computeDayState(at("2024-09-10T19:00:00Z"), rome, MILANO);
    expect(s.liturgical.coptic).toEqual({ year: 1741, month: 1, day: 1 });
  });

  it("funziona in altri fusi (New York, Tokyo, Il Cairo)", () => {
    // New York, 21 giugno 2025 ore 21:00 EDT = 01:00Z del 22: dopo il tramonto (20:31)
    const ny = computeDayState(at("2025-06-22T01:00:00Z"), "America/New_York", NEW_YORK);
    expect(ny.civil.isoKey).toBe("2025-06-21");
    expect(ny.liturgical.isoKey).toBe("2025-06-22");
    // Tokyo, 21 giugno 2025 ore 12:00 JST
    const tk = computeDayState(at("2025-06-21T03:00:00Z"), "Asia/Tokyo", TOKYO);
    expect(tk.civil.isoKey).toBe("2025-06-21");
    expect(tk.liturgical.isoKey).toBe("2025-06-21");
    // Il Cairo, 21 giugno 2025 ore 20:30 locali (17:30Z): dopo il tramonto
    const cairo = computeDayState(at("2025-06-21T17:30:00Z"), "Africa/Cairo", CAIRO);
    expect(cairo.liturgical.isoKey).toBe("2025-06-22");
  });

  it("nei giorni del cambio d'ora il prossimo evento resta corretto", () => {
    // 30 marzo 2025 sera: la mezzanotte successiva è alle 22:00Z (ora legale)
    const s = computeDayState(at("2025-03-30T20:00:00Z"), rome, MILANO);
    expect(s.isAfterSunset).toBe(true);
    expect(new Date(s.nextChangeAt).toISOString()).toBe("2025-03-30T22:00:00.000Z");
    // 29 marzo sera: la mezzanotte successiva è ancora in ora solare
    const s2 = computeDayState(at("2025-03-29T20:00:00Z"), rome, MILANO);
    expect(new Date(s2.nextChangeAt).toISOString()).toBe("2025-03-29T23:00:00.000Z");
  });

  it("rispetta un orario di tramonto impostato a mano", () => {
    const manual = { hour: 18, minute: 30 };
    const s = computeDayState(at("2025-07-01T16:29:00Z"), rome, MILANO, manual);
    expect(s.sunset.source).toBe("manual");
    expect(new Date(s.sunset.at).toISOString()).toBe("2025-07-01T16:30:00.000Z");
    expect(s.isAfterSunset).toBe(false);
    expect(computeDayState(at("2025-07-01T16:30:00Z"), rome, MILANO, manual).isAfterSunset).toBe(
      true
    );
  });

  it("senza tramonto (latitudini polari) ripiega sulle 18:00 locali e lo segnala", () => {
    const svalbard = { name: "Svalbard", lat: 78.2, lon: 15.6 };
    const s = computeDayState(at("2025-06-21T10:00:00Z"), "Arctic/Longyearbyen", svalbard);
    expect(s.sunset.source).toBe("fallback");
    expect(getZonedParts(s.sunset.at, "Arctic/Longyearbyen").hour).toBe(18);
  });

  it("è invariante su anni lontani (1900 e 2200)", () => {
    const s1900 = computeDayState(at("1900-03-01T10:00:00Z"), "UTC", MILANO);
    expect(s1900.liturgical.coptic).toEqual({ year: 1616, month: 6, day: 22 });
    const s2200 = computeDayState(at("2200-01-01T10:00:00Z"), "UTC", MILANO);
    expect(s2200.civil.isoKey).toBe("2200-01-01");
    expect(s2200.liturgical.isoKey).toBe("2200-01-01");
  });
});
