/**
 * Calendario copto (Anno dei Martiri, A.M.) ↔ JDN.
 *
 * - 13 mesi: 12 da 30 giorni più Nassi (5 giorni, 6 negli anni bisestili).
 * - Anno bisestile quando (anno + 1) è divisibile per 4.
 * - Epoca: 1 Tut 1 A.M. = 29 agosto 284 giuliano = JDN 1825030.
 *
 * Il ciclo copto è giuliano (un bisestile ogni 4 anni, senza eccezioni
 * secolari): per questo il Capodanno cade l'11 settembre gregoriano, o il
 * 12 nell'anno che precede un bisestile, solo tra il 1900 e il 2099; nel
 * 2100 lo scarto aumenta di un giorno. Il calcolo per numeri di giorno
 * gestisce automaticamente ogni anno.
 */

import { fdiv, mod } from "./jdn";

export const COPTIC_EPOCH_JDN = 1825030;

export interface CopticDate {
  year: number;
  month: number; // 1-13 (13 = Nassi)
  day: number; // 1-30 (Nassi: 1-5 o 1-6)
}

export function isCopticLeapYear(year: number): boolean {
  return mod(year + 1, 4) === 0;
}

export function copticMonthLength(year: number, month: number): number {
  if (month < 13) return 30;
  return isCopticLeapYear(year) ? 6 : 5;
}

export function copticYearLength(year: number): number {
  return isCopticLeapYear(year) ? 366 : 365;
}

export function isValidCopticDate(year: number, month: number, day: number): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 13 &&
    day >= 1 &&
    day <= copticMonthLength(year, month)
  );
}

export function copticToJdn(year: number, month: number, day: number): number {
  return COPTIC_EPOCH_JDN - 1 + 365 * (year - 1) + fdiv(year, 4) + 30 * (month - 1) + day;
}

export function jdnToCoptic(jdn: number): CopticDate {
  const year = fdiv(4 * (jdn - COPTIC_EPOCH_JDN) + 1463, 1461);
  const dayOfYear = jdn - copticToJdn(year, 1, 1); // 0-based
  const month = fdiv(dayOfYear, 30) + 1;
  const day = dayOfYear - 30 * (month - 1) + 1;
  return { year, month, day };
}

/** JDN del 1 Tut dell'anno copto indicato. */
export function copticNewYearJdn(year: number): number {
  return copticToJdn(year, 1, 1);
}

const pad = (n: number, len = 2) => String(n).padStart(len, "0");

/** "AAAA-MM-GG" copto, es. "1741-04-27". */
export function copticKey(date: CopticDate): string {
  return `${pad(date.year, 4)}-${pad(date.month)}-${pad(date.day)}`;
}

/** "MM-GG" copto, chiave del livello fisso (Sinassario, feste fisse). */
export function copticFixedKey(month: number, day: number): string {
  return `${pad(month)}-${pad(day)}`;
}
