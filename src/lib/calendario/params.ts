/**
 * Parametri d'indirizzo delle pagine del calendario, validati.
 *
 * - `/calendario?data=AAAA-MM-GG`: apre la pagina in modalità Manuale su quel giorno;
 * - `/calendario/feste?anno=N`: anno copto dell'elenco delle feste.
 */

import { isValidGregorianDate } from "./jdn";

type Param = string | string[] | undefined;

const first = (value: Param) => (Array.isArray(value) ? value[0] : value);

/** Anni copti accettati (come nella conversione inversa della pagina). */
export const COPTIC_YEAR_MIN = 1;
export const COPTIC_YEAR_MAX = 9000;

/** "AAAA-MM-GG" gregoriano valido (anni 1-9999), altrimenti null. */
export function parseDateParam(value: Param): string | null {
  const v = first(value);
  const m = v ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v) : null;
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return year >= 1 && isValidGregorianDate(year, month, day) ? v! : null;
}

export function parseCopticYearParam(value: Param): number | null {
  const v = first(value);
  if (!v || !/^\d{1,4}$/.test(v)) return null;
  const year = Number(v);
  return year >= COPTIC_YEAR_MIN && year <= COPTIC_YEAR_MAX ? year : null;
}
