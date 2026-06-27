"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import type { OrarioSettimanale } from "@/types";
import { getNextCelebration } from "@/lib/next-celebration";

interface NextCelebrationCardProps {
  orari: OrarioSettimanale[];
  title: string;
  emptyLabel: string;
}

export default function NextCelebrationCard({ orari, title, emptyLabel }: NextCelebrationCardProps) {
  const [celebration, setCelebration] = useState(() => getNextCelebration(orari));

  useEffect(() => {
    // Aggiorna ogni minuto
    const interval = setInterval(() => {
      setCelebration(getNextCelebration(orari));
    }, 60_000);
    return () => clearInterval(interval);
  }, [orari]);

  const description = celebration
    ? `${celebration.tipo} – ${celebration.orario}`
    : emptyLabel;

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
      <div className="h-full rounded-[1.75rem] border border-accent/40 bg-gradient-to-br from-surface to-surface-2 p-5 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="flex flex-col items-center gap-2.5 text-center sm:gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 sm:h-12 sm:w-12">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-foreground font-semibold text-sm uppercase tracking-[0.2em]">{title}</h3>
          <p className="text-sm leading-relaxed text-accent font-semibold">{description}</p>
        </div>
      </div>
    </div>
  );
}
