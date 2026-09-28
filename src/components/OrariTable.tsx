"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import type { OrarioSettimanale } from "@/types";
import { GIORNI_IT, getNextCelebration, localizeGiorno } from "@/lib/next-celebration";
import { useMinuteClock } from "./useMinuteClock";

interface OrariTableProps {
  orari: OrarioSettimanale[];
  labels: {
    oggi: string;
    prossima: string;
    vuoto: string;
  };
}

/**
 * Orari settimanali come elenco per giorno, uguale su telefono e desktop:
 * il giorno una sola volta, sotto le celebrazioni con l'ora in una colonna
 * fissa e la nota sotto il nome. Da `sm` il giorno sta in una colonna a
 * sinistra. La prossima celebrazione ha sfondo tenue ed etichetta, il giorno
 * corrente l'etichetta "Oggi"; entrambi calcolati solo nel browser.
 */
export default function OrariTable({ orari, labels }: OrariTableProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const now = useMinuteClock();

  const nextKey = useMemo(() => {
    if (!now) return null;
    const next = getNextCelebration(orari, now);
    return next ? `${next.giorno}__${next.tipo}__${next.orario}` : null;
  }, [orari, now]);
  const today = now ? GIORNI_IT[now.getDay()] : null;

  if (!orari.some((giorno) => giorno.celebrazioni.length > 0)) {
    return <p className="text-foreground/60 px-5 py-8 text-center text-sm">{labels.vuoto}</p>;
  }

  return (
    <ol className="divide-border/70 divide-y" dir={isAr ? "rtl" : "ltr"}>
      {orari
        .filter((giorno) => giorno.celebrazioni.length > 0)
        .map((giorno) => {
          const isToday = giorno.giorno === today;
          return (
            <li
              key={giorno.giorno}
              className="grid gap-x-6 gap-y-2 px-5 py-4 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:px-6 sm:py-5"
            >
              <div className="flex items-center gap-2 sm:items-start sm:pt-2">
                <h3 className="font-display text-foreground text-base font-semibold">
                  {localizeGiorno(giorno.giorno, locale)}
                </h3>
                {isToday && (
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[11px] font-semibold">
                    {labels.oggi}
                  </span>
                )}
              </div>

              <ul className="-mx-3 space-y-1">
                {giorno.celebrazioni.map((cel, ci) => {
                  const isNext = nextKey === `${giorno.giorno}__${cel.tipo}__${cel.orario}`;
                  return (
                    <li
                      key={`${ci}-${cel.orario}`}
                      className={`flex items-baseline gap-4 rounded-xl px-3 py-2 ${
                        isNext ? "bg-accent/10 ring-accent/25 ring-1 ring-inset" : ""
                      }`}
                    >
                      <time
                        className={`w-12 shrink-0 text-sm font-semibold tabular-nums ${
                          isNext ? "text-accent" : "text-primary"
                        }`}
                      >
                        {cel.orario}
                      </time>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm ${isNext ? "text-foreground font-semibold" : "text-foreground/85"}`}
                        >
                          {cel.tipo}
                        </p>
                        {cel.note && (
                          <p className="text-foreground/60 mt-0.5 text-xs leading-relaxed">
                            {cel.note}
                          </p>
                        )}
                      </div>
                      {isNext && (
                        <span className="bg-accent shrink-0 self-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-white">
                          {labels.prossima}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
    </ol>
  );
}
