/**
 * Servizio: dato un istante, un fuso e una località, calcola
 *
 * - il GIORNO CIVILE: il giorno gregoriano locale, da mezzanotte a mezzanotte;
 * - il GIORNO LITURGICO: il giorno copto, da tramonto a tramonto. Dopo il
 *   tramonto del giorno civile G il giorno liturgico è già quello di G+1;
 * - il prossimo istante in cui uno dei due cambia (tramonto o mezzanotte),
 *   su cui l'interfaccia programma un solo timer.
 *
 * Funzione pura: nessun accesso a DOM, orologio di sistema o rete. Il
 * giorno civile è sempre quello del fuso indicato (il dispositivo); la
 * località serve solo per il tramonto.
 */

import { gregorianToJdn, jdnToGregorian, isoKeyOfJdn, weekdayOfJdn, type YMD } from "./jdn";
import { jdnToCoptic, copticKey, type CopticDate } from "./coptic";
import { localJdn, startOfDayInstant, zonedTimeToInstant } from "./tz";
import { sunsetInstant, type SunsetKind } from "./sun";

export interface Location {
  name: string;
  lat: number;
  lon: number;
}

export const DEFAULT_LOCATION: Location = { name: "Milano", lat: 45.4642, lon: 9.19 };

/** Ripiego quando il Sole non tramonta o non sorge (latitudini polari). */
export const FALLBACK_SUNSET = { hour: 18, minute: 0 } as const;

export interface ManualSunset {
  hour: number;
  minute: number;
}

export interface CivilDay {
  jdn: number;
  gregorian: YMD;
  /** "AAAA-MM-GG" gregoriano */
  isoKey: string;
  weekday: number;
}

export interface LiturgicalDayRef {
  jdn: number;
  coptic: CopticDate;
  /** "AAAA-MM-GG" copto */
  copticKey: string;
  /** Data gregoriana del giorno (diurno) a cui corrisponde il giorno liturgico. */
  gregorian: YMD;
  isoKey: string;
  weekday: number;
}

export interface DayState {
  instant: number;
  timeZone: string;
  location: Location;
  civil: CivilDay;
  liturgical: LiturgicalDayRef;
  sunset: {
    /** Tramonto del giorno civile corrente. */
    at: number;
    source: "astronomical" | "manual" | "fallback";
    kind: SunsetKind;
  };
  isAfterSunset: boolean;
  nextChangeAt: number;
  nextChangeKind: "sunset" | "midnight";
}

export function civilDayOf(jdn: number): CivilDay {
  return {
    jdn,
    gregorian: jdnToGregorian(jdn),
    isoKey: isoKeyOfJdn(jdn),
    weekday: weekdayOfJdn(jdn),
  };
}

export function liturgicalDayOf(jdn: number): LiturgicalDayRef {
  const coptic = jdnToCoptic(jdn);
  return {
    jdn,
    coptic,
    copticKey: copticKey(coptic),
    gregorian: jdnToGregorian(jdn),
    isoKey: isoKeyOfJdn(jdn),
    weekday: weekdayOfJdn(jdn),
  };
}

export function sunsetForDay(
  jdn: number,
  timeZone: string,
  location: Location,
  manual?: ManualSunset | null
): DayState["sunset"] {
  if (manual) {
    return {
      at: zonedTimeToInstant(jdn, manual.hour, manual.minute, timeZone),
      source: "manual",
      kind: "normal",
    };
  }
  const result = sunsetInstant(jdn, location.lat, location.lon);
  if (result.kind === "normal" && result.at !== undefined) {
    return { at: result.at, source: "astronomical", kind: "normal" };
  }
  return {
    at: zonedTimeToInstant(jdn, FALLBACK_SUNSET.hour, FALLBACK_SUNSET.minute, timeZone),
    source: "fallback",
    kind: result.kind,
  };
}

export function computeDayState(
  instant: number,
  timeZone: string,
  location: Location = DEFAULT_LOCATION,
  manualSunset?: ManualSunset | null
): DayState {
  const civilJdn = localJdn(instant, timeZone);
  const sunset = sunsetForDay(civilJdn, timeZone, location, manualSunset);
  const isAfterSunset = instant >= sunset.at;
  const nextMidnight = startOfDayInstant(civilJdn + 1, timeZone);
  const sunsetIsNext = !isAfterSunset && sunset.at < nextMidnight;

  return {
    instant,
    timeZone,
    location,
    civil: civilDayOf(civilJdn),
    liturgical: liturgicalDayOf(isAfterSunset ? civilJdn + 1 : civilJdn),
    sunset,
    isAfterSunset,
    nextChangeAt: sunsetIsNext ? sunset.at : nextMidnight,
    nextChangeKind: sunsetIsNext ? "sunset" : "midnight",
  };
}

/** Istante di un orario locale scelto a mano (modalità manuale). */
export function instantFromLocal(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): number {
  return zonedTimeToInstant(gregorianToJdn(year, month, day), hour, minute, timeZone);
}
