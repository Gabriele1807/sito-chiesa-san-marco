/**
 * Letture pubbliche del calendario dal database, con cache e timeout.
 *
 * Il calendario funziona anche senza database: se MongoDB è lento o
 * irraggiungibile si usano la configurazione predefinita del codice e
 * nessun contenuto ("Letture del giorno in arrivo"), senza errori.
 *
 * ⚠️ Solo lato server.
 */

import { unstable_cache } from "next/cache";
import {
  DEFAULT_PUBLIC_CONFIG,
  getPublishedContent,
  readPublicCalendarConfig,
  type PublicCalendarConfig,
} from "@/lib/mongo/calendario";
import {
  CONTENT_LEVELS,
  loadDayContent,
  type ContentKeys,
  type ContentLevel,
  type DayContent,
  type DayContentBundle,
} from "@/lib/calendario/content";

const REVALIDATE_SECONDS = 300;
export const CALENDARIO_TIMEOUT_MS = 1500;

export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timeout ${ms} ms`)), ms);
    });
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

const getConfigCached = unstable_cache(
  async () => readPublicCalendarConfig(),
  ["calendario-config"],
  { revalidate: REVALIDATE_SECONDS, tags: ["content", "calendario"] }
);

const getContentCached = unstable_cache(
  async (level: ContentLevel, key: string) => getPublishedContent(level, key),
  ["calendario-contenuto"],
  { revalidate: REVALIDATE_SECONDS, tags: ["content", "calendario"] }
);

export interface SafeResult<T> {
  data: T;
  /** true se il database non ha risposto e si usano i valori predefiniti. */
  fallback: boolean;
}

export async function getCalendarConfigSafe(
  read: () => Promise<PublicCalendarConfig> = getConfigCached
): Promise<SafeResult<PublicCalendarConfig>> {
  try {
    return { data: await withTimeout(read(), CALENDARIO_TIMEOUT_MS), fallback: false };
  } catch (err) {
    console.error(
      "[calendario] configurazione non leggibile:",
      err instanceof Error ? err.message : err
    );
    return { data: DEFAULT_PUBLIC_CONFIG, fallback: true };
  }
}

export async function getDayContentSafe(
  keys: ContentKeys,
  read: (level: ContentLevel, key: string) => Promise<DayContent | null> = getContentCached
): Promise<SafeResult<DayContentBundle>> {
  let failed = false;
  const bundle = await loadDayContent(keys, {
    get: (level, key) =>
      withTimeout(read(level, key), CALENDARIO_TIMEOUT_MS).catch((err) => {
        failed = true;
        console.error(
          `[calendario] contenuto ${level}:${key} non leggibile:`,
          err instanceof Error ? err.message : err
        );
        return null;
      }),
  });
  return { data: bundle, fallback: failed };
}

export { CONTENT_LEVELS };
