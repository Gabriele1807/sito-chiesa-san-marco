"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import type { OrarioSettimanale } from "@/types";
import { getNextCelebration } from "@/lib/next-celebration";

interface NextCelebrationCardProps {
  orari: OrarioSettimanale[];
  title: string;
}

export default function NextCelebrationCard({ orari, title }: NextCelebrationCardProps) {
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
    : "Nessuna celebrazione in programma";

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
      <div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-2xl p-6 h-full border-2 border-accent shadow-sm">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wide">{title}</h3>
          <p className="text-xs leading-relaxed text-accent font-semibold">{description}</p>
        </div>
      </div>
    </div>
  );
}
