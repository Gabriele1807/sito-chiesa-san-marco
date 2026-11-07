/**
 * Fusi orari con la sola API Intl nativa (nessuna libreria, nessuna rete).
 *
 * Gli istanti sono millisecondi Unix; il giorno civile locale è un JDN.
 * Ora legale e fusi con offset non interi sono gestiti da Intl stesso:
 * qui si cercano solo gli istanti che corrispondono a un orario locale.
 */

import { gregorianToJdn, jdnToGregorian } from "./jdn";

const DAY_MS = 86_400_000;
const UNIX_EPOCH_JDN = 2440588;

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      era: "short",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** Fuso del dispositivo (Intl), con ripiego su UTC. */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

export function getZonedParts(instant: number, timeZone: string): ZonedParts {
  const parts = formatterFor(timeZone).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const era = parts.find((p) => p.type === "era")?.value;
  const rawYear = get("year");
  return {
    year: era === "BC" || era === "B" ? 1 - rawYear : rawYear,
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

/** JDN del giorno civile locale in cui cade l'istante. */
export function localJdn(instant: number, timeZone: string): number {
  const p = getZonedParts(instant, timeZone);
  return gregorianToJdn(p.year, p.month, p.day);
}

/** Scarto del fuso (ms) rispetto a UTC nell'istante dato. */
export function zoneOffsetMs(instant: number, timeZone: string): number {
  const p = getZonedParts(instant, timeZone);
  const asUtc =
    (gregorianToJdn(p.year, p.month, p.day) - UNIX_EPOCH_JDN) * DAY_MS +
    ((p.hour * 60 + p.minute) * 60 + p.second) * 1000;
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** Mezzanotte UTC del giorno `jdn`, in ms. */
export function utcMidnightOfJdn(jdn: number): number {
  return (jdn - UNIX_EPOCH_JDN) * DAY_MS;
}

const startCache = new Map<string, number>();

/**
 * Primo istante del giorno civile `jdn` nel fuso: di solito la mezzanotte,
 * ma dove il cambio d'ora avviene alle 24 (es. Cile) il giorno inizia
 * all'01:00. Ricerca binaria al secondo, memoizzata.
 */
export function startOfDayInstant(jdn: number, timeZone: string): number {
  const cacheKey = `${timeZone}|${jdn}`;
  const cached = startCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const base = utcMidnightOfJdn(jdn);
  // Gli scarti reali sono compresi tra -12 e +14 ore.
  let lo = (base - 15 * 3_600_000) / 1000;
  let hi = (base + 15 * 3_600_000) / 1000;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (localJdn(mid * 1000, timeZone) >= jdn) hi = mid;
    else lo = mid;
  }
  const result = hi * 1000;
  if (startCache.size > 2000) startCache.clear();
  startCache.set(cacheKey, result);
  return result;
}

/**
 * Istante dell'orario locale `hour:minute` del giorno `jdn`. Se l'orario
 * non esiste (salto dell'ora legale) restituisce l'istante subito dopo il
 * salto; se esiste due volte, il primo.
 */
export function zonedTimeToInstant(
  jdn: number,
  hour: number,
  minute: number,
  timeZone: string
): number {
  const wall = utcMidnightOfJdn(jdn) + (hour * 60 + minute) * 60_000;
  const first = wall - zoneOffsetMs(wall - 12 * 3_600_000, timeZone);
  const second = wall - zoneOffsetMs(wall + 12 * 3_600_000, timeZone);
  const candidates = [first, second]
    .filter((t) => {
      const p = getZonedParts(t, timeZone);
      return (
        gregorianToJdn(p.year, p.month, p.day) === jdn && p.hour === hour && p.minute === minute
      );
    })
    .sort((a, b) => a - b);
  if (candidates.length > 0) return candidates[0];
  // Orario inesistente: il primo istante valido dopo il salto.
  return Math.max(first, second);
}

/** Orario locale "HH:MM" di un istante. */
export function formatLocalTime(instant: number, timeZone: string): string {
  const p = getZonedParts(instant, timeZone);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

export { jdnToGregorian };
