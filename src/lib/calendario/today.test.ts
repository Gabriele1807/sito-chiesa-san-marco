import { describe, it, expect } from "vitest";
import { copticToday, nextLocalMidnight } from "./today";

const at = (iso: string) => Date.parse(iso);

describe("copticToday", () => {
  it("gives the Coptic date of the device's civil day", () => {
    // 9 novembre 2026, mattina in Italia
    expect(copticToday(at("2026-11-09T09:00:00Z"), "Europe/Rome").coptic).toEqual({
      year: 1743,
      month: 2,
      day: 30,
    });
  });

  it("changes at local midnight, not at UTC midnight", () => {
    // 00:30 del 10 novembre a Roma = 23:30 UTC del 9
    expect(copticToday(at("2026-11-09T23:30:00Z"), "Europe/Rome").coptic).toEqual({
      year: 1743,
      month: 3,
      day: 1,
    });
    // stesse ore a New York: è ancora il 9 novembre
    expect(copticToday(at("2026-11-10T02:00:00Z"), "America/New_York").coptic).toEqual({
      year: 1743,
      month: 2,
      day: 30,
    });
  });

  it("handles the Coptic new year and the sixth day of Nassi", () => {
    expect(copticToday(at("2026-09-11T10:00:00Z"), "Europe/Rome").coptic).toEqual({
      year: 1743,
      month: 1,
      day: 1,
    });
    // 1743 è bisestile: l'11 settembre 2027 è il 6 Nassi, il 12 il Capodanno 1744
    expect(copticToday(at("2027-09-11T10:00:00Z"), "Europe/Rome").coptic).toEqual({
      year: 1743,
      month: 13,
      day: 6,
    });
    expect(copticToday(at("2027-09-12T10:00:00Z"), "Europe/Rome").coptic).toEqual({
      year: 1744,
      month: 1,
      day: 1,
    });
  });

  it("returns the Gregorian civil date too", () => {
    expect(copticToday(at("2026-11-09T09:00:00Z"), "Europe/Rome").gregorian).toEqual({
      year: 2026,
      month: 11,
      day: 9,
    });
  });
});

describe("nextLocalMidnight", () => {
  it("is the next local midnight", () => {
    // Roma, 9 novembre 2026 (ora solare, UTC+1): mezzanotte = 23:00 UTC
    expect(nextLocalMidnight(at("2026-11-09T09:00:00Z"), "Europe/Rome")).toBe(
      at("2026-11-09T23:00:00Z")
    );
  });

  it("follows daylight saving changes", () => {
    // 28 marzo 2027, Roma: alle 3:00 inizia l'ora legale, la mezzanotte seguente è in UTC+2
    expect(nextLocalMidnight(at("2027-03-28T12:00:00Z"), "Europe/Rome")).toBe(
      at("2027-03-28T22:00:00Z")
    );
  });
});
