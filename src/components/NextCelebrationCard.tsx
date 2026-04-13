"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  const badge = celebration?.giorno ?? "";

  return (
    <Link href="/orari" className="group animate-fade-in-up" style={{ animationDelay: "300ms" }}>
      <div className="card-hover bg-slate-800 rounded-xl p-6 cursor-pointer h-full relative border-2 border-accent hover:border-accent-light">
        {badge && (
          <div className="absolute top-3 right-3">
            <span className="inline-block bg-amber-500 text-white text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
              {badge}
            </span>
          </div>
        )}
        <div className="flex flex-col items-center text-center gap-3">
          <Sparkles className="w-7 h-7 text-accent" />
          <h3 className="text-white font-bold text-sm uppercase tracking-wide">{title}</h3>
          <p className="text-xs leading-relaxed text-accent font-semibold">{description}</p>
        </div>
      </div>
    </Link>
  );
}
