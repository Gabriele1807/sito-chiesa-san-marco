"use client";

import { useEffect, useState } from "react";
import type { ContentKeys, DayContentBundle } from "@/lib/calendario/content";

const EMPTY: DayContentBundle = { fixed: null, movable: null, seasonal: null, available: false };
const cache = new Map<string, DayContentBundle>();
const MAX_CACHE = 200;

const cacheKey = (keys: ContentKeys) => `${keys.fixed}|${keys.movable}|${keys.seasonal}`;

/**
 * Contenuto del giorno chiesto per chiave all'API pubblica, con cache in
 * memoria: si scarica solo ciò che serve, mai l'intero archivio. In caso
 * di errore di rete si considera "nessuna lettura disponibile".
 */
export function useDayContent(keys: ContentKeys | null): {
  bundle: DayContentBundle | null;
  loading: boolean;
} {
  const key = keys ? cacheKey(keys) : null;
  const [fetched, setFetched] = useState<{ key: string; bundle: DayContentBundle } | null>(null);

  useEffect(() => {
    if (!keys || !key || cache.has(key)) return;
    const controller = new AbortController();
    const params = new URLSearchParams(keys);
    fetch(`/api/calendario/giorno?${params}`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<DayContentBundle>) : EMPTY))
      .catch((err: unknown) => {
        if ((err as Error)?.name === "AbortError") throw err;
        return EMPTY;
      })
      .then((bundle) => {
        if (cache.size >= MAX_CACHE) cache.clear();
        cache.set(key, bundle);
        setFetched({ key, bundle });
      })
      .catch(() => {});
    return () => controller.abort();
    // `key` riassume `keys`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!key) return { bundle: null, loading: false };
  const bundle = cache.get(key) ?? (fetched?.key === key ? fetched.bundle : null);
  return { bundle, loading: bundle === null };
}
