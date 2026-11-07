/**
 * Contenuti del giorno (Sinassario, letture, note) a tre livelli, indicizzati
 * da chiavi stabili:
 *
 * - fisso:      "MM-GG" copto                 → Sinassario, feste fisse
 * - mobile:     "E±N" (giorni dalla Pasqua)   → Quaresima, Settimana Santa, Cinquantina…
 * - stagionale: "MM-Sn-w" (mese, domeniche già trascorse nel mese, giorno della settimana)
 *
 * Il provider è un'interfaccia: lato server legge da MongoDB, nei test da
 * oggetti in memoria. Se un livello non ha dati (o la lettura fallisce)
 * restituisce `null` = "nessuna lettura disponibile".
 */

import type { LiturgicalDayInfo, CalendarConfig } from "./resolver";
import { ruleValue } from "./rules";

export interface LocalizedText {
  it?: string;
  ar?: string;
}

export const CONTENT_LEVELS = ["fixed", "movable", "seasonal"] as const;
export type ContentLevel = (typeof CONTENT_LEVELS)[number];

export const READING_IDS = ["vespri", "mattutino", "epistole", "atti", "salmi", "vangelo"] as const;
export type ReadingId = (typeof READING_IDS)[number];

export const KEY_PATTERNS: Record<ContentLevel, RegExp> = {
  fixed: /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|30)$|^13-0[1-6]$/,
  movable: /^E[+-](0|[1-9]\d{0,2})$/,
  seasonal: /^(0[1-9]|1[0-3])-S[0-5]-[0-6]$/,
};

export function isValidContentKey(level: ContentLevel, key: unknown): key is string {
  return typeof key === "string" && key.length <= 16 && KEY_PATTERNS[level].test(key);
}

/**
 * Punto di estensione: contenuto di un giorno per un livello. `feast` e
 * `season` sono predisposti per dati aggiuntivi (titoli, colori, inni…) e
 * per ora restano vuoti.
 */
export interface DayContent {
  level: ContentLevel;
  key: string;
  sinassario?: LocalizedText;
  letture?: Partial<Record<ReadingId, LocalizedText>>;
  note?: LocalizedText;
  feast?: Record<string, unknown>;
  season?: Record<string, unknown>;
}

export interface DayContentBundle {
  fixed: DayContent | null;
  movable: DayContent | null;
  seasonal: DayContent | null;
  /** false = "Letture del giorno in arrivo" */
  available: boolean;
}

export type ContentKeys = Record<ContentLevel, string>;

export interface DayContentProvider {
  get(level: ContentLevel, key: string): Promise<DayContent | null>;
}

/** Chiavi da cercare per un giorno, con le regole impostate applicate. */
export function contentKeysFor(info: LiturgicalDayInfo, config: CalendarConfig): ContentKeys {
  let fixed = info.keys.fixed;
  if (fixed === "13-06" && ruleValue(config.rules, "nasi6") === "come-5-nasi") fixed = "13-05";
  return { fixed, movable: info.keys.movable, seasonal: info.keys.seasonal };
}

export function hasAnyText(content: DayContent | null): boolean {
  if (!content) return false;
  const texts = [content.sinassario, content.note, ...Object.values(content.letture ?? {})] as (
    LocalizedText | undefined
  )[];
  return texts.some((t) => Boolean(t?.it?.trim() || t?.ar?.trim()));
}

export async function loadDayContent(
  keys: ContentKeys,
  provider: DayContentProvider
): Promise<DayContentBundle> {
  const [fixed, movable, seasonal] = await Promise.all(
    CONTENT_LEVELS.map((level) => provider.get(level, keys[level]).catch(() => null))
  );
  return {
    fixed,
    movable,
    seasonal,
    available: [fixed, movable, seasonal].some(hasAnyText),
  };
}
