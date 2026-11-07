import type { Location } from "@/lib/calendario/service";
import type { StoredLocation } from "./prefs";

/** Località preimpostate; i nomi visibili sono in calendario.citta.<id>. */
export const PRESET_LOCATIONS: readonly { id: string; lat: number; lon: number }[] = [
  { id: "milano", lat: 45.4642, lon: 9.19 },
  { id: "roma", lat: 41.9028, lon: 12.4964 },
  { id: "torino", lat: 45.0703, lon: 7.6869 },
  { id: "cairo", lat: 30.0444, lon: 31.2357 },
  { id: "alessandria", lat: 31.2001, lon: 29.9187 },
];

export type LocationSource = "default" | "preset" | "geo" | "custom";

/** Località effettiva: preferenza del visitatore, altrimenti quella predefinita dall'admin. */
export function resolveLocation(
  stored: StoredLocation | undefined,
  fallback: Location,
  names: { preset: (id: string) => string; geo: string }
): { location: Location; source: LocationSource } {
  if (stored?.kind === "preset") {
    const p = PRESET_LOCATIONS.find((l) => l.id === stored.id);
    if (p)
      return { location: { name: names.preset(p.id), lat: p.lat, lon: p.lon }, source: "preset" };
  }
  if (stored?.kind === "geo") {
    return { location: { name: names.geo, lat: stored.lat, lon: stored.lon }, source: "geo" };
  }
  if (stored?.kind === "custom") {
    return {
      location: {
        name: stored.name || `${stored.lat}, ${stored.lon}`,
        lat: stored.lat,
        lon: stored.lon,
      },
      source: "custom",
    };
  }
  return { location: fallback, source: "default" };
}
