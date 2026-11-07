"use client";

import { useCallback, useSyncExternalStore } from "react";
import { deviceTimeZone } from "@/lib/calendario/tz";

export interface ClockSnapshot {
  now: number;
  timeZone: string;
}

/** Tetto al ritardo del timer: ricontrolla almeno ogni ora (sospensione del dispositivo, deriva). */
const MAX_DELAY_MS = 60 * 60 * 1000;
/** Piccolo margine perché il timer scatti certamente dopo l'evento. */
const MARGIN_MS = 250;

let snapshot: ClockSnapshot | null = null;

function refresh(): ClockSnapshot {
  snapshot = { now: Date.now(), timeZone: deviceTimeZone() };
  return snapshot;
}

function getSnapshot(): ClockSnapshot {
  return snapshot ?? refresh();
}

const getServerSnapshot = () => null;

/** Istante corrente, da usare nei gestori di eventi (non durante il render). */
export function nowMs(): number {
  return Date.now();
}

/**
 * Orologio "a eventi": non ticchetta ogni secondo. Programma UN solo
 * `setTimeout` sul prossimo evento (tramonto o mezzanotte) restituito da
 * `nextEventAfter`, e si riallinea quando la scheda torna visibile
 * (visibilitychange/pageshow), dopo la sospensione del dispositivo o un
 * cambio di fuso orario. Sul server restituisce `null` (niente mismatch
 * di hydration fra server in UTC e telefono in ora locale).
 */
export function useLiveClock(
  enabled: boolean,
  nextEventAfter: (now: number, timeZone: string) => number
): ClockSnapshot | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!enabled) return () => {};
      let timer: ReturnType<typeof setTimeout> | undefined;

      const schedule = () => {
        clearTimeout(timer);
        const s = getSnapshot();
        const next = nextEventAfter(s.now, s.timeZone);
        const delay = Math.min(Math.max(next - Date.now() + MARGIN_MS, MARGIN_MS), MAX_DELAY_MS);
        timer = setTimeout(tick, delay);
      };
      const tick = () => {
        refresh();
        onChange();
        schedule();
      };
      const onVisibility = () => {
        if (document.visibilityState === "visible") tick();
      };

      // Riallinea subito: lo snapshot potrebbe risalire a una visita precedente.
      refresh();
      schedule();
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("pageshow", tick);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pageshow", tick);
      };
    },
    [enabled, nextEventAfter]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
