import type { YMD } from "@/lib/calendario/jdn";
import type { CopticDate } from "@/lib/calendario/coptic";
import { copticMonthName, type MonthNameStyle } from "@/lib/calendario/months";
import type { LocalizedText } from "@/lib/calendario/content";

/** Formattazione con Intl nativo, formatter memoizzati. */

export const intlLocale = (locale: string) => (locale === "ar" ? "ar-EG" : "it-IT");

const formatters = new Map<string, Intl.DateTimeFormat>();
function dtf(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(intlLocale(locale), options);
    formatters.set(key, f);
  }
  return f;
}

function utcNoon({ year, month, day }: YMD): Date {
  const d = new Date(0);
  d.setUTCFullYear(year, month - 1, day);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

export function formatGregorian(date: YMD, locale: string, withWeekday = true): string {
  return dtf(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withWeekday ? { weekday: "long" } : {}),
  }).format(utcNoon(date));
}

export function formatShortGregorian(date: YMD, locale: string): string {
  return dtf(locale, { timeZone: "UTC", day: "numeric", month: "long" }).format(utcNoon(date));
}

export function weekdayName(weekday: number, locale: string): string {
  // 1 gennaio 2023 era domenica
  return dtf(locale, { timeZone: "UTC", weekday: "long" }).format(
    utcNoon({ year: 2023, month: 1, day: 1 + weekday })
  );
}

export function formatTime(instant: number, timeZone: string, locale: string): string {
  return dtf(locale, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    instant
  );
}

const numberFormats = new Map<string, Intl.NumberFormat>();
export function formatNumber(n: number, locale: string): string {
  let f = numberFormats.get(locale);
  if (!f) {
    f = new Intl.NumberFormat(intlLocale(locale), { useGrouping: false });
    numberFormats.set(locale, f);
  }
  return f.format(n);
}

/** Stile dei nomi dei mesi per lingua: in arabo i nomi arabi, altrimenti la traslitterazione. */
export const monthStyleFor = (locale: string): MonthNameStyle =>
  locale === "ar" ? "ar" : "translit";

export function monthLabel(month: number, locale: string): string {
  return copticMonthName(month, monthStyleFor(locale));
}

export function formatCoptic(date: CopticDate, locale: string, era: string): string {
  return `${formatNumber(date.day, locale)} ${monthLabel(date.month, locale)} ${formatNumber(
    date.year,
    locale
  )} ${era}`;
}

export function localized(text: LocalizedText | undefined, locale: string): string {
  if (!text) return "";
  return (locale === "ar" ? text.ar || text.it : text.it || text.ar) ?? "";
}

/** "YYYY-MM-DD" per <input type="date">. */
export function toDateInput({ year, month, day }: YMD): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseDateInput(value: string): YMD | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) } : null;
}

export function parseTimeInput(value: string): { hour: number; minute: number } | null {
  const m = /^(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  return hour < 24 && minute < 60 ? { hour, minute } : null;
}

export const toTimeInput = (hour: number, minute: number) =>
  `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
