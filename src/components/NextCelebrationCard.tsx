"use client";

import { Sparkles } from "lucide-react";
import { useLocale } from "next-intl";
import type { OrarioSettimanale } from "@/types";
import { getNextCelebration, localizeGiorno } from "@/lib/next-celebration";
import { useMinuteClock } from "./useMinuteClock";

interface NextCelebrationCardProps {
  orari: OrarioSettimanale[];
  title: string;
  emptyLabel: string;
}

export default function NextCelebrationCard({ orari, title, emptyLabel }: NextCelebrationCardProps) {
  const locale = useLocale();
  // Calcolata solo nel browser, con l'ora del dispositivo (vedi useMinuteClock).
  const now = useMinuteClock();
  const celebration = now ? getNextCelebration(orari, now) : null;

  const description = !now
    ? "\u00a0"
    : celebration
    ? `${localizeGiorno(celebration.giorno, locale)} · ${celebration.tipo} – ${celebration.orario}`
    : emptyLabel;

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
      <div className="h-full rounded-[1.75rem] border border-accent/40 bg-gradient-to-br from-surface to-surface-2 p-5 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="flex flex-col items-center gap-2.5 text-center sm:gap-3">
          <div className="flex h-11 w-11 items-center justify-center border border-accent/40 sm:h-12 sm:w-12">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <h3 className="eyebrow">{title}</h3>
          <p className="text-sm leading-relaxed text-accent font-semibold">{description}</p>
        </div>
      </div>
    </div>
  );
}
