"use client";

import { useSyncExternalStore } from "react";
import type { ManualSunset } from "@/lib/calendario/service";

/**
 * Preferenze personali del visitatore (località e tramonto manuale), solo
 * in localStorage: non lasciano mai il dispositivo. Ogni accesso è in
 * try/catch (navigazione privata, storage bloccato).
 */

export type StoredLocation =
  | { kind: "preset"; id: string }
  | { kind: "geo"; lat: number; lon: number }
  | { kind: "custom"; name: string; lat: number; lon: number };

export interface CalendarPrefs {
  location?: StoredLocation;
  manualSunset?: ManualSunset | null;
}

const KEY = "calendario:prefs:v1";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedValue: CalendarPrefs = {};

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function isFiniteIn(n: unknown, min: number, max: number): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
}

/** Accetta solo valori ben formati: il contenuto di localStorage non è affidabile. */
export function parsePrefs(raw: string | null): CalendarPrefs {
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const out: CalendarPrefs = {};
    const loc = data.location as Record<string, unknown> | undefined;
    if (loc?.kind === "preset" && typeof loc.id === "string") {
      out.location = { kind: "preset", id: loc.id };
    } else if (
      (loc?.kind === "geo" || loc?.kind === "custom") &&
      isFiniteIn(loc.lat, -90, 90) &&
      isFiniteIn(loc.lon, -180, 180)
    ) {
      out.location =
        loc.kind === "geo"
          ? { kind: "geo", lat: loc.lat, lon: loc.lon }
          : {
              kind: "custom",
              name: typeof loc.name === "string" ? loc.name.slice(0, 80) : "",
              lat: loc.lat,
              lon: loc.lon,
            };
    }
    const ms = data.manualSunset as Record<string, unknown> | null | undefined;
    if (ms && Number.isInteger(ms.hour) && Number.isInteger(ms.minute)) {
      if (isFiniteIn(ms.hour, 0, 23) && isFiniteIn(ms.minute, 0, 59)) {
        out.manualSunset = { hour: ms.hour, minute: ms.minute };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function getSnapshot(): CalendarPrefs {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parsePrefs(raw);
  }
  return cachedValue;
}

const getServerSnapshot = (): CalendarPrefs | null => null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCalendarPrefs(): CalendarPrefs | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function updateCalendarPrefs(patch: Partial<CalendarPrefs>) {
  const next = { ...getSnapshot(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage non disponibile: la preferenza vale solo per questa visita
    cachedRaw = JSON.stringify(next);
    cachedValue = next;
  }
  listeners.forEach((l) => l());
}
