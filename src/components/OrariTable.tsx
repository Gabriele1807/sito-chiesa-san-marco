"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import type { OrarioSettimanale } from "@/types";
import { getNextCelebration } from "@/lib/next-celebration";

const GIORNI_IT = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

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

  const todayName = GIORNI_IT[now.getDay()];
  const nextCelebration = useMemo(() => getNextCelebration(orari, now), [orari, now]);
  const nextKey = useMemo(() => {
    if (!nextCelebration) return null;
    return `${nextCelebration.giorno}__${nextCelebration.tipo}__${nextCelebration.orario}`;
  }, [nextCelebration]);

  return (
    <>
      <div className="hidden sm:block overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">{labels.giorno}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">{labels.celebrazione}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">{labels.orario}</th>
              <th className="hidden md:table-cell text-left px-6 py-4 text-sm font-semibold text-foreground">{labels.note}</th>
            </tr>
          </thead>
          <tbody>
            {orari.map((giorno, gi) =>
              giorno.celebrazioni.map((cel, ci) => {
                const isNext = nextKey === `${giorno.giorno}__${cel.tipo}__${cel.orario}`;
                const isToday = giorno.giorno === todayName;
                const isNextDay = nextCelebration?.giorno === giorno.giorno;
                const rowBg = isNext ? "bg-accent/20" : gi % 2 === 0 ? "bg-background" : "bg-surface/50";
                const rowBorder = isNext ? "border-accent/30" : "border-border/30";
                const dayClasses = isToday
                  ? "text-accent underline decoration-accent/60 underline-offset-4"
                  : isNextDay
                  ? "text-accent underline decoration-accent/60 underline-offset-4"
                  : "text-foreground";

                return (
                  <tr
                    key={`${gi}-${ci}`}
                    className={`border-b ${rowBorder} ${rowBg} hover:bg-accent/10 transition-colors`}
                  >
                    {ci === 0 && (
                      <td
                        rowSpan={giorno.celebrazioni.length}
                        className={`px-6 py-3 font-semibold align-top ${dayClasses}`}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-accent" />
                          {giorno.giorno}
                        </div>
                      </td>
                    )}
                    <td className={`px-6 py-3 text-sm ${isNext ? "font-semibold text-accent underline decoration-accent/60 underline-offset-4" : "text-foreground/70"}`}>
                      {cel.tipo}
                    </td>
                    <td className={`px-6 py-3 text-sm font-medium ${isNext ? "text-accent underline decoration-accent/60 underline-offset-4" : "text-foreground"}`}>
                      {cel.orario}
                    </td>
                    <td className={`hidden md:table-cell px-6 py-3 text-sm ${isNext ? "text-accent" : "text-foreground/50"}`}>
                      {cel.note || "–"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden space-y-4 p-4">
        {orari.map((giorno, gi) => {
          const isToday = giorno.giorno === todayName;
          const isNextDay = nextCelebration?.giorno === giorno.giorno;
          const headerBg = isToday ? "bg-accent" : isNextDay ? "bg-accent" : "bg-surface";
          return (
            <div key={gi} className="animate-fade-in-up bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ animationDelay: `${gi * 80}ms` }}>
              <div className={`px-4 py-3 flex items-center gap-2 ${headerBg}`}>
                <Clock className="w-4 h-4 text-white" />
                <h3 className="font-semibold text-white text-sm">{giorno.giorno}</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {giorno.celebrazioni.map((cel, ci) => {
                  const isNext = nextKey === `${giorno.giorno}__${cel.tipo}__${cel.orario}`;
                  return (
                    <div key={ci} className={`px-4 py-3 ${isNext ? "bg-gold/20" : ""}`}>
                      <p className={`text-sm ${isNext ? "font-semibold text-gold underline decoration-gold/60 underline-offset-4" : "font-medium text-gray-900"}`}>
                        {cel.tipo}
                      </p>
                      <p className={`text-sm mt-0.5 ${isNext ? "font-semibold text-gold underline decoration-gold/60 underline-offset-4" : "text-primary font-semibold"}`}>
                        {cel.orario}
                      </p>
                      {cel.note && <p className={`text-xs mt-0.5 ${isNext ? "text-gold" : "text-gray-500"}`}>{cel.note}</p>}
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
