"use client";

import { useSyncExternalStore } from "react";

const MINUTE_MS = 60_000;

function subscribe(onChange: () => void) {
  const interval = setInterval(onChange, MINUTE_MS);
  return () => clearInterval(interval);
}

const getMinute = () => Math.floor(Date.now() / MINUTE_MS);
const getServerMinute = () => null;

/**
 * Ora corrente arrotondata al minuto, letta solo nel browser (sul server
 * `null`). Evita che il server, in UTC, e il telefono, in ora italiana,
 * calcolino una "prossima celebrazione" diversa: HTML non corrispondente
 * all'hydration e celebrazione sbagliata evidenziata.
 */
export function useMinuteClock(): Date | null {
  const minute = useSyncExternalStore(subscribe, getMinute, getServerMinute);
  return minute === null ? null : new Date(minute * MINUTE_MS);
}
