/**
 * Aritmetica sui numeri di giorno (Julian Day Number, JDN).
 *
 * Il JDN è un intero che identifica un giorno civile, indipendente da fusi
 * orari e ora legale: tutto il calendario lavora su questi numeri e mai su
 * `Date` o stringhe. JDN 2451545 = 1 gennaio 2000.
 *
 * Modulo puro: nessuna dipendenza da DOM, React o database.
 */

export interface YMD {
  year: number;
  month: number; // 1-12
  day: number;
}

/** Divisione intera verso -∞ (corretta anche per numeri negativi). */
export function fdiv(a: number, b: number): number {
  return Math.floor(a / b);
}

/** Resto sempre non negativo. */
export function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

/** Gregoriano prolettico → JDN (algoritmo di Fliegel e Van Flandern). */
export function gregorianToJdn(year: number, month: number, day: number): number {
  const a = fdiv(14 - month, 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + fdiv(153 * m + 2, 5) + 365 * y + fdiv(y, 4) - fdiv(y, 100) + fdiv(y, 400) - 32045;
}

export function jdnToGregorian(jdn: number): YMD {
  const a = jdn + 32044;
  const b = fdiv(4 * a + 3, 146097);
  const c = a - fdiv(146097 * b, 4);
  const d = fdiv(4 * c + 3, 1461);
  const e = c - fdiv(1461 * d, 4);
  const m = fdiv(5 * e + 2, 153);
  return {
    day: e - fdiv(153 * m + 2, 5) + 1,
    month: m + 3 - 12 * fdiv(m, 10),
    year: 100 * b + d - 4800 + fdiv(m, 10),
  };
}

/** Giuliano → JDN (serve al computo della Pasqua). */
export function julianToJdn(year: number, month: number, day: number): number {
  const a = fdiv(14 - month, 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + fdiv(153 * m + 2, 5) + 365 * y + fdiv(y, 4) - 32083;
}

export function jdnToJulian(jdn: number): YMD {
  const c = jdn + 32082;
  const d = fdiv(4 * c + 3, 1461);
  const e = c - fdiv(1461 * d, 4);
  const m = fdiv(5 * e + 2, 153);
  return {
    day: e - fdiv(153 * m + 2, 5) + 1,
    month: m + 3 - 12 * fdiv(m, 10),
    year: d - 4800 + fdiv(m, 10),
  };
}

/** Giorno della settimana: 0 = domenica … 6 = sabato. */
export function weekdayOfJdn(jdn: number): number {
  return mod(jdn + 1, 7);
}

export function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function gregorianMonthLength(year: number, month: number): number {
  if (month === 2) return isGregorianLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function isValidGregorianDate(year: number, month: number, day: number): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= gregorianMonthLength(year, month)
  );
}

const pad = (n: number, len = 2) => String(Math.abs(n)).padStart(len, "0");

/** "AAAA-MM-GG" gregoriano (chiave ISO del giorno civile). */
export function isoKeyOfJdn(jdn: number): string {
  const { year, month, day } = jdnToGregorian(jdn);
  return `${year < 0 ? "-" : ""}${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

export { pad };
