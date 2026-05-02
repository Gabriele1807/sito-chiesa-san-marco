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
      <div className="bg-gradient-to-br from-surface to-surface-2 rounded-3xl p-6 h-full border border-accent/40 shadow-sm">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-foreground font-semibold text-sm uppercase tracking-[0.2em]">{title}</h3>
          <p className="text-sm leading-relaxed text-accent font-semibold">{description}</p>
        </div>
      </div>
    </div>
  );
}
