"use client";

import type { CalendarConfig } from "@/lib/calendario/resolver";
import type { RuleSettings } from "@/lib/calendario/rules";
import type { CalendarioContenuto, FestaFissa, RegolaView } from "@/lib/mongo/calendario";

export type { CalendarioContenuto, FestaFissa, RegolaView };

export const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none bg-surface";
export const labelClass = "mb-1 block text-xs font-semibold uppercase text-foreground/70";
export const cardClass = "border-border bg-surface rounded-xl border p-5";
export const primaryButton =
  "bg-gold hover:bg-gold-light inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";
export const secondaryButton =
  "border-border hover:bg-surface-2 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

/** Configurazione del risolutore costruita dai dati del pannello (feste attive e regole). */
export function configFrom(feste: FestaFissa[], regole: RegolaView[]): CalendarConfig {
  const rules: RuleSettings = {};
  for (const r of regole) rules[r.id] = { enabled: r.attiva, value: r.valore };
  return {
    feasts: feste
      .filter((f) => f.attiva)
      .map((f) => ({ id: f.id, month: f.mese, day: f.giorno, name: f.nome })),
    rules,
  };
}

export async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}
