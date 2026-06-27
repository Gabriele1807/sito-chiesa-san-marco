"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import type { OrarioSettimanale } from "@/types";
import { getNextCelebration } from "@/lib/next-celebration";

interface OrariTableProps {
  orari: OrarioSettimanale[];
  labels: {
    giorno: string;
    celebrazione: string;
    orario: string;
    note: string;
  };
}

export default function OrariTable({ orari, labels }: OrariTableProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const nextCelebration = useMemo(() => getNextCelebration(orari, now), [orari, now]);
  const nextKey = useMemo(() => {
    if (!nextCelebration) return null;
    return `${nextCelebration.giorno}__${nextCelebration.tipo}__${nextCelebration.orario}`;
  }, [nextCelebration]);

  return (
    <>
      <div className="hidden sm:block min-w-0 overflow-x-auto">
        <table className="w-full min-w-full table-auto max-w-full">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">{labels.giorno}</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">{labels.celebrazione}</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">{labels.orario}</th>
              <th className="hidden md:table-cell text-left px-4 py-3 text-sm font-semibold text-foreground">{labels.note}</th>
            </tr>
          </thead>
          <tbody>
            {orari.map((giorno, gi) =>
              giorno.celebrazioni.map((cel, ci) => {
                const isNext = nextKey === `${giorno.giorno}__${cel.tipo}__${cel.orario}`;
                const isFirstInDay = ci === 0;
                const rowBg = isNext ? "bg-accent/20" : gi % 2 === 0 ? "bg-background" : "bg-surface/50";
                const rowBorder = isNext ? "border-accent/30" : "border-border/30";
                const dayClasses = isNext
                  ? "text-accent underline decoration-accent/60 underline-offset-4 font-semibold"
                  : isFirstInDay
                  ? "text-foreground font-semibold"
                  : "text-foreground/50";

                return (
                  <tr
                    key={`${gi}-${ci}`}
                    className={`border-b ${rowBorder} ${rowBg} hover:bg-accent/10 transition-colors`}
                  >
                    <td className={`px-4 py-3 align-top ${dayClasses}`}>
                      <div className="flex items-center gap-2">
                        {isFirstInDay ? (
                          <Clock className="w-4 h-4 text-accent" />
                        ) : (
                          <span className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span className="truncate">{giorno.giorno}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm ${isNext ? "font-semibold text-accent underline decoration-accent/60 underline-offset-4" : "text-foreground/70"}`}>
                      {cel.tipo}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${isNext ? "text-accent underline decoration-accent/60 underline-offset-4" : "text-foreground"}`}>
                      {cel.orario}
                    </td>
                    <td className={`hidden md:table-cell px-4 py-3 text-sm ${isNext ? "text-accent" : "text-foreground/50"}`}>
                      {cel.note || "–"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden min-w-0 space-y-4 px-4 pb-4">
        {orari.map((giorno, gi) => {
          const hasNextInDay = giorno.celebrazioni.some(
            (cel) => nextKey === `${giorno.giorno}__${cel.tipo}__${cel.orario}`
          );
          const headerClass = hasNextInDay ? "bg-accent text-white" : "bg-surface-alt text-foreground";
          return (
            <div key={gi} className="animate-fade-in-up min-w-0 bg-surface rounded-2xl shadow-sm border border-border overflow-hidden" style={{ animationDelay: `${gi * 80}ms` }}>
              <div className={`px-4 py-3 flex items-center gap-2 ${headerClass}`}>
                <Clock className={`w-4 h-4 ${hasNextInDay ? "text-white" : "text-accent"}`} />
                <h3 className={`font-semibold text-sm ${hasNextInDay ? "text-white" : "text-foreground"}`}>
                  {giorno.giorno}
                </h3>
              </div>
              <div className="divide-y divide-border/70">
                {giorno.celebrazioni.map((cel, ci) => {
                  const isNext = nextKey === `${giorno.giorno}__${cel.tipo}__${cel.orario}`;
                  return (
                    <div key={ci} className={`px-4 py-3 transition-colors ${isNext ? "bg-gold/15" : "bg-surface"}`}>
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="min-w-0">
                          <p className={`text-sm ${isNext ? "font-semibold text-gold underline decoration-gold/60 underline-offset-4" : "font-medium text-foreground"}`}>
                            {cel.tipo}
                          </p>
                          {cel.note && (
                            <p className={`text-xs mt-1 ${isNext ? "text-gold/80" : "text-foreground/60"}`}>
                              {cel.note}
                            </p>
                          )}
                        </div>
                        <p className={`shrink-0 text-sm ${isNext ? "font-semibold text-gold underline decoration-gold/60 underline-offset-4" : "text-primary font-semibold"}`}>
                          {cel.orario}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
