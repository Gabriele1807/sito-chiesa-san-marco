/**
 * Pasqua copta: computo giuliano (algoritmo di Meeus) espresso come JDN,
 * quindi convertibile in qualsiasi calendario senza tabelle annuali né
 * scarti fissi tipo "+13 giorni" (che vale solo per il 1900-2099).
 */

import { julianToJdn, jdnToGregorian, fdiv, type YMD } from "./jdn";

/** JDN della Pasqua copta dell'anno (giuliano/gregoriano) `year`. */
export function copticEasterJdn(year: number): number {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = fdiv(d + e + 114, 31);
  const day = ((d + e + 114) % 31) + 1;
  return julianToJdn(year, month, day);
}

/** Data gregoriana della Pasqua copta. */
export function copticEaster(year: number): YMD {
  return jdnToGregorian(copticEasterJdn(year));
}

const cache = new Map<number, number>();

/**
 * Pasqua dell'anno liturgico copto `copticYear` (che inizia il 1 Tut):
 * cade nella primavera dell'anno gregoriano `copticYear + 284`.
 */
export function easterJdnForCopticYear(copticYear: number): number {
  let jdn = cache.get(copticYear);
  if (jdn === undefined) {
    jdn = copticEasterJdn(copticYear + 284);
    cache.set(copticYear, jdn);
  }
  return jdn;
}
