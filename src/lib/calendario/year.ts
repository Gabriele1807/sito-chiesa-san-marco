/**
 * Feste, digiuni e periodi di un anno copto (1 Tut → ultimo giorno di Nassi).
 *
 * L'elenco non ha regole proprie: scorre ogni giorno dell'anno con
 * `resolveLiturgicalDay`, quindi coincide sempre con ciò che mostra la
 * pagina del giorno (feste dell'admin, regole impostate, concomitanze).
 * Funzione pura, indipendente dal database; risultato memoizzato per
 * configurazione e anno.
 *
 * Regole incerte non impostate: il Natale non riceve una data (voce in
 * `pending`), il 6 Nassi degli anni bisestili è segnalato in `pending`.
 */

import { jdnToGregorian, type YMD } from "./jdn";
import {
  copticToJdn,
  copticYearLength,
  isCopticLeapYear,
  jdnToCoptic,
  type CopticDate,
} from "./coptic";
import { easterJdnForCopticYear } from "./easter";
import type { LocalizedText } from "./content";
import { resolveLiturgicalDay, DEFAULT_CONFIG, type CalendarConfig } from "./resolver";
import { ruleIsActive, type RuleId } from "./rules";

export interface DayRef {
  jdn: number;
  coptic: CopticDate;
  gregorian: YMD;
}

export type YearEntryKind = "fissa" | "mobile" | "digiuno" | "periodo";

export interface YearEntry {
  /** Univoca nell'anno: `${kind}:${id}`. */
  key: string;
  /** Id della festa (config/rules), del digiuno (FastId) o del periodo (SeasonId). */
  id: string;
  kind: YearEntryKind;
  /** Nome per le feste; digiuni e periodi usano le traduzioni per id. */
  name?: LocalizedText;
  start: DayRef;
  end: DayRef;
  /** Regole incerte non impostate che toccano la voce. */
  uncertain: RuleId[];
}

export interface PendingEntry {
  id: "natale" | "nasi6";
  rule: RuleId;
  /** Giorno interessato, quando è certo (6 Nassi); il Natale non ne ha. */
  day?: DayRef;
}

export interface CopticYearCalendar {
  year: number;
  isLeapYear: boolean;
  start: DayRef;
  end: DayRef;
  easter: DayRef;
  entries: YearEntry[];
  pending: PendingEntry[];
}

export function dayRef(jdn: number): DayRef {
  return { jdn, coptic: jdnToCoptic(jdn), gregorian: jdnToGregorian(jdn) };
}

const KIND_ORDER: Record<YearEntryKind, number> = { fissa: 0, mobile: 1, digiuno: 2, periodo: 3 };
/** Periodi (non digiuni) mostrati nell'elenco. */
const PERIODS = ["cinquantina"] as const;

function compute(year: number, config: CalendarConfig): CopticYearCalendar {
  const first = copticToJdn(year, 1, 1);
  const last = first + copticYearLength(year) - 1;
  const entries: YearEntry[] = [];
  const open = new Map<string, { id: string; kind: YearEntryKind; start: number }>();

  const close = (key: string, endJdn: number) => {
    const run = open.get(key)!;
    entries.push({
      key,
      id: run.id,
      kind: run.kind,
      start: dayRef(run.start),
      end: dayRef(endJdn),
      uncertain: [],
    });
    open.delete(key);
  };

  for (let jdn = first; jdn <= last; jdn++) {
    const info = resolveLiturgicalDay(jdn, config);

    for (const f of info.feasts) {
      const kind: YearEntryKind = f.kind === "fixed" ? "fissa" : "mobile";
      const ref = dayRef(jdn);
      entries.push({
        key: `${kind}:${f.id}`,
        id: f.id,
        kind,
        name: f.name,
        start: ref,
        end: ref,
        uncertain:
          kind === "fissa" && info.uncertain.includes("concomitanze") ? ["concomitanze"] : [],
      });
    }

    const today = new Set<string>([
      ...info.fasts.map((f) => `digiuno:${f}`),
      ...PERIODS.filter((p) => info.seasons.includes(p)).map((p) => `periodo:${p}`),
    ]);
    for (const key of [...open.keys()]) if (!today.has(key)) close(key, jdn - 1);
    for (const key of today) {
      if (!open.has(key)) {
        const [kind, id] = key.split(":") as [YearEntryKind, string];
        open.set(key, { id, kind, start: jdn });
      }
    }
  }
  for (const key of [...open.keys()]) close(key, last);

  entries.sort(
    (a, b) =>
      a.start.jdn - b.start.jdn ||
      KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
      a.id.localeCompare(b.id)
  );

  const pending: PendingEntry[] = [];
  if (!ruleIsActive(config.rules, "natale")) pending.push({ id: "natale", rule: "natale" });
  if (isCopticLeapYear(year) && !ruleIsActive(config.rules, "nasi6")) {
    pending.push({ id: "nasi6", rule: "nasi6", day: dayRef(copticToJdn(year, 13, 6)) });
  }

  return {
    year,
    isLeapYear: isCopticLeapYear(year),
    start: dayRef(first),
    end: dayRef(last),
    easter: dayRef(easterJdnForCopticYear(year)),
    entries,
    pending,
  };
}

const memo = new WeakMap<CalendarConfig, Map<number, CopticYearCalendar>>();
const MEMO_LIMIT = 50;

export function buildCopticYearCalendar(
  year: number,
  config: CalendarConfig = DEFAULT_CONFIG
): CopticYearCalendar {
  let cache = memo.get(config);
  if (!cache) {
    cache = new Map();
    memo.set(config, cache);
  }
  let cal = cache.get(year);
  if (!cal) {
    cal = compute(year, config);
    if (cache.size >= MEMO_LIMIT) cache.clear();
    cache.set(year, cal);
  }
  return cal;
}

export type EntryStatus = "passata" | "in-corso" | "futura";

export interface Timeline {
  status: Record<string, EntryStatus>;
  /** Prima festa (fissa o mobile) di oggi o successiva, solo se oggi cade nell'anno. */
  nextFeastKey: string | null;
}

export function markTimeline(cal: CopticYearCalendar, todayJdn: number): Timeline {
  const status: Record<string, EntryStatus> = {};
  for (const e of cal.entries) {
    status[e.key] =
      e.end.jdn < todayJdn ? "passata" : e.start.jdn > todayJdn ? "futura" : "in-corso";
  }
  const inYear = todayJdn >= cal.start.jdn && todayJdn <= cal.end.jdn;
  const next = inYear
    ? cal.entries.find(
        (e) => (e.kind === "fissa" || e.kind === "mobile") && e.start.jdn >= todayJdn
      )
    : undefined;
  return { status, nextFeastKey: next?.key ?? null };
}
