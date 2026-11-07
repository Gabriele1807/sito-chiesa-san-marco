import { describe, it, expect } from "vitest";
import { parsePrefs } from "./prefs";
import { resolveLocation } from "./locations";
import { DEFAULT_LOCATION } from "@/lib/calendario/service";

describe("preferenze del visitatore (localStorage)", () => {
  it("accetta solo valori ben formati", () => {
    expect(parsePrefs(null)).toEqual({});
    expect(parsePrefs("{non json")).toEqual({});
    expect(parsePrefs(JSON.stringify({ location: { kind: "geo", lat: 200, lon: 0 } }))).toEqual({});
    expect(
      parsePrefs(
        JSON.stringify({
          location: { kind: "geo", lat: 45.5, lon: 9.2 },
          manualSunset: { hour: 18, minute: 30 },
        })
      )
    ).toEqual({
      location: { kind: "geo", lat: 45.5, lon: 9.2 },
      manualSunset: { hour: 18, minute: 30 },
    });
    expect(parsePrefs(JSON.stringify({ manualSunset: { hour: 25, minute: 0 } }))).toEqual({});
  });

  it("ripiega sulla località predefinita se la preferenza manca o è sconosciuta", () => {
    const names = { preset: (id: string) => id, geo: "La mia posizione" };
    expect(resolveLocation(undefined, DEFAULT_LOCATION, names)).toEqual({
      location: DEFAULT_LOCATION,
      source: "default",
    });
    expect(
      resolveLocation({ kind: "preset", id: "atlantide" }, DEFAULT_LOCATION, names).source
    ).toBe("default");
    expect(
      resolveLocation({ kind: "preset", id: "cairo" }, DEFAULT_LOCATION, names).location.lat
    ).toBe(30.0444);
  });
});
