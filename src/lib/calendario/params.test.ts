import { describe, it, expect } from "vitest";
import { parseCopticYearParam, parseDateParam } from "./params";

describe("parseDateParam (?data= di /calendario)", () => {
  it("accepts a valid Gregorian date", () => {
    expect(parseDateParam("2027-05-02")).toBe("2027-05-02");
    expect(parseDateParam(["2024-02-29", "2025-01-01"])).toBe("2024-02-29");
  });

  it("rejects missing, malformed or impossible dates", () => {
    expect(parseDateParam(undefined)).toBeNull();
    expect(parseDateParam("")).toBeNull();
    expect(parseDateParam("2025-2-1")).toBeNull();
    expect(parseDateParam("2100-02-29")).toBeNull();
    expect(parseDateParam("2025-13-01")).toBeNull();
    expect(parseDateParam("0000-01-01")).toBeNull();
    expect(parseDateParam("<script>")).toBeNull();
  });
});

describe("parseCopticYearParam (?anno= di /calendario/feste)", () => {
  it("accepts a Coptic year in the supported range", () => {
    expect(parseCopticYearParam("1743")).toBe(1743);
    expect(parseCopticYearParam(["1", "2"])).toBe(1);
    expect(parseCopticYearParam("9000")).toBe(9000);
  });

  it("rejects anything else", () => {
    expect(parseCopticYearParam(undefined)).toBeNull();
    expect(parseCopticYearParam("0")).toBeNull();
    expect(parseCopticYearParam("9001")).toBeNull();
    expect(parseCopticYearParam("17.5")).toBeNull();
    expect(parseCopticYearParam("1743abc")).toBeNull();
    expect(parseCopticYearParam("-5")).toBeNull();
  });
});
