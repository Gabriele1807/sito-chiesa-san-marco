/**
 * Risolutore del giorno liturgico: dato un giorno (JDN) restituisce una
 * descrizione strutturata calcolata solo da regole (rules.ts), senza
 * tabelle annuali né accessi alla rete o al database.
 *
 * La configurazione (feste fisse e regole impostate dall'admin) è un
 * semplice oggetto: se il database non risponde si usa `DEFAULT_CONFIG`.
 * I risultati sono memoizzati per configurazione.
 */

import { isoKeyOfJdn, jdnToGregorian, weekdayOfJdn, type YMD } from "./jdn";
import {
  jdnToCoptic,
  copticToJdn,
  copticKey,
  copticFixedKey,
  isCopticLeapYear,
  type CopticDate,
} from "./coptic";
import { easterJdnForCopticYear } from "./easter";
import type { LocalizedText } from "./content";
import {
  APOSTLES_FAST_END,
  DEFAULT_FIXED_FEASTS,
  MOVABLE_FEASTS,
  MOVABLE_RANGES,
  NATIVITY_FAST_DEFAULT_END,
  NATIVITY_FAST_START,
  NATIVITY_NAME,
  SEASON_PRIORITY,
  ruleIsActive,
  ruleValue,
  type FastId,
  type FixedFeastDef,
  type RuleId,
  type RuleSettings,
  type SeasonId,
} from "./rules";

export interface CalendarConfig {
  feasts: readonly FixedFeastDef[];
  rules: RuleSettings;
}

export const DEFAULT_CONFIG: CalendarConfig = { feasts: DEFAULT_FIXED_FEASTS, rules: {} };

export interface FeastRef {
  id: string;
  kind: "fixed" | "movable";
  name: LocalizedText;
}

export interface LiturgicalDayInfo {
  jdn: number;
  coptic: CopticDate;
  isLeapYear: boolean;
  /** Data gregoriana del giorno (diurno) corrispondente. */
  gregorian: YMD;
  weekday: number;
  /** Numero della domenica nel mese copto (1-5) se il giorno è domenica, altrimenti null. */
  sundayOfMonth: number | null;
  /** Domeniche del mese già trascorse, compresa quella del giorno (0 prima della prima). */
  weekOfMonth: number;
  easter: { jdn: number; isoKey: string };
  daysFromEaster: number;
  /** Stagione principale (secondo SEASON_PRIORITY), o null. */
  season: SeasonId | null;
  seasons: SeasonId[];
  fasts: FastId[];
  feasts: FeastRef[];
  /** Regole incerte non ancora impostate che toccano questo giorno. */
  uncertain: RuleId[];
  keys: {
    coptic: string;
    iso: string;
    fixed: string;
    movable: string;
    seasonal: string;
  };
}

const inRange = (n: number, r: { from: number; to: number }) => n >= r.from && n <= r.to;

function nativityJdn(copticYear: number, rules: RuleSettings): number | null {
  const mode = ruleValue(rules, "natale");
  if (!mode) return null;
  const k29 = copticToJdn(copticYear, 4, 29);
  if (mode === "29-koiak") return k29;
  // "7-gennaio": il 29 Kiahk se cade il 7 gennaio, altrimenti il giorno prima
  const g = jdnToGregorian(k29);
  return g.month === 1 && g.day === 8 ? k29 - 1 : k29;
}

function compute(jdn: number, config: CalendarConfig): LiturgicalDayInfo {
  const coptic = jdnToCoptic(jdn);
  const weekday = weekdayOfJdn(jdn);
  const easterJdn = easterJdnForCopticYear(coptic.year);
  const e = jdn - easterJdn;

  // Settimana del mese copto, contata dalle domeniche
  const firstWeekday = weekdayOfJdn(jdn - coptic.day + 1);
  const firstSunday = 1 + ((7 - firstWeekday) % 7);
  const weekOfMonth =
    coptic.day >= firstSunday ? Math.floor((coptic.day - firstSunday) / 7) + 1 : 0;

  const seasons = new Set<SeasonId>();
  const fasts: FastId[] = [];
  const feasts: FeastRef[] = [];
  const uncertain = new Set<RuleId>();

  // --- Mobili ---
  if (inRange(e, MOVABLE_RANGES.giona)) {
    seasons.add("digiuno-giona");
    fasts.push("giona");
  }
  if (inRange(e, MOVABLE_RANGES.grandeQuaresima)) {
    seasons.add("grande-quaresima");
    fasts.push("grande-quaresima");
  }
  if (inRange(e, MOVABLE_RANGES.settimanaSanta)) {
    seasons.add("settimana-santa");
    fasts.push("settimana-santa");
  }
  if (inRange(e, MOVABLE_RANGES.cinquantina)) seasons.add("cinquantina");

  const apostlesEnd = copticToJdn(coptic.year, APOSTLES_FAST_END.month, APOSTLES_FAST_END.day);
  if (e >= MOVABLE_RANGES.apostoliStart && jdn <= apostlesEnd) {
    seasons.add("digiuno-apostoli");
    fasts.push("apostoli");
  }

  for (const f of MOVABLE_FEASTS) {
    if (f.offset === e) feasts.push({ id: f.id, kind: "movable", name: f.name });
  }

  // --- Natività: digiuno e festa ---
  const nativity = nativityJdn(coptic.year, config.rules);
  const fastStart = copticToJdn(coptic.year, NATIVITY_FAST_START.month, NATIVITY_FAST_START.day);
  const fastEnd =
    nativity !== null
      ? nativity - 1
      : copticToJdn(coptic.year, NATIVITY_FAST_DEFAULT_END.month, NATIVITY_FAST_DEFAULT_END.day);
  if (jdn >= fastStart && jdn <= fastEnd) {
    seasons.add("digiuno-natale");
    fasts.push("natale");
  }
  if (nativity !== null && jdn === nativity) {
    feasts.push({ id: "natale", kind: "fixed", name: NATIVITY_NAME });
  }
  if (nativity === null && coptic.month === 4 && (coptic.day === 28 || coptic.day === 29)) {
    uncertain.add("natale");
  }

  // --- Feste fisse (configurabili) ---
  const fixedToday = config.feasts.filter((f) => f.month === coptic.month && f.day === coptic.day);
  const holyWeekOrEaster = seasons.has("settimana-santa") || e === 0;
  if (fixedToday.length > 0 && holyWeekOrEaster) {
    const mode = ruleValue(config.rules, "concomitanze");
    if (!mode) uncertain.add("concomitanze");
    if (mode !== "prevale-stagione-mobile") {
      for (const f of fixedToday) feasts.push({ id: f.id, kind: "fixed", name: f.name });
    }
  } else {
    for (const f of fixedToday) feasts.push({ id: f.id, kind: "fixed", name: f.name });
  }

  // --- Nassi ---
  if (coptic.month === 13 && coptic.day === 6 && !ruleIsActive(config.rules, "nasi6")) {
    uncertain.add("nasi6");
  }

  // TODO: digiuno del mercoledì e del venerdì (regola "mercolediVenerdi"):
  // le esenzioni non sono ancora definite, quindi non viene calcolato
  // nemmeno quando la regola è attivata. Vedi docs/calendario.md.

  const orderedSeasons = SEASON_PRIORITY.filter((s) => seasons.has(s));
  const sign = e >= 0 ? "+" : "-";

  return {
    jdn,
    coptic,
    isLeapYear: isCopticLeapYear(coptic.year),
    gregorian: jdnToGregorian(jdn),
    weekday,
    sundayOfMonth: weekday === 0 ? Math.ceil(coptic.day / 7) : null,
    weekOfMonth,
    easter: { jdn: easterJdn, isoKey: isoKeyOfJdn(easterJdn) },
    daysFromEaster: e,
    season: orderedSeasons[0] ?? null,
    seasons: orderedSeasons,
    fasts,
    feasts,
    uncertain: [...uncertain],
    keys: {
      coptic: copticKey(coptic),
      iso: isoKeyOfJdn(jdn),
      fixed: copticFixedKey(coptic.month, coptic.day),
      movable: `E${sign}${Math.abs(e)}`,
      seasonal: `${String(coptic.month).padStart(2, "0")}-S${weekOfMonth}-${weekday}`,
    },
  };
}

const memo = new WeakMap<CalendarConfig, Map<number, LiturgicalDayInfo>>();
const MEMO_LIMIT = 1000;

export function resolveLiturgicalDay(
  jdn: number,
  config: CalendarConfig = DEFAULT_CONFIG
): LiturgicalDayInfo {
  let cache = memo.get(config);
  if (!cache) {
    cache = new Map();
    memo.set(config, cache);
  }
  let info = cache.get(jdn);
  if (!info) {
    info = compute(jdn, config);
    if (cache.size >= MEMO_LIMIT) cache.clear();
    cache.set(jdn, info);
  }
  return info;
}
