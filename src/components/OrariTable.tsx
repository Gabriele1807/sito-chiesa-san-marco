"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useLocale } from "next-intl";
import type { OrarioSettimanale } from "@/types";
import { GIORNI_IT, getNextCelebration, localizeGiorno, shortGiorno } from "@/lib/next-celebration";
import { useMinuteClock } from "./useMinuteClock";

interface OrariTableProps {
  orari: OrarioSettimanale[];
  labels: {
    oggi: string;
    prossima: string;
    vuoto: string;
  };
}

type Celebrazione = OrarioSettimanale["celebrazioni"][number];

const celebrationKey = (giorno: string, cel: Celebrazione) =>
  `${giorno}__${cel.tipo}__${cel.orario}`;

/**
 * Orari settimanali.
 *
 * Telefono: fila di giorni da toccare (tab) e sotto solo le celebrazioni del
 * giorno scelto; si apre sul giorno della prossima celebrazione. Con molti
 * orari l'elenco completo diventava uno scorrimento lunghissimo.
 * Da `sm`: elenco completo per giorno, giorno in colonna a sinistra.
 *
 * Giorni senza celebrazioni non compaiono. Prossima celebrazione e "Oggi"
 * sono calcolati solo nel browser (useMinuteClock).
 */
export default function OrariTable({ orari, labels }: OrariTableProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const now = useMinuteClock();
  const [picked, setPicked] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const giorni = useMemo(() => orari.filter((g) => g.celebrazioni.length > 0), [orari]);
  const next = useMemo(() => (now ? getNextCelebration(giorni, now) : null), [giorni, now]);
  const nextKey = next ? `${next.giorno}__${next.tipo}__${next.orario}` : null;
  const today = now ? GIORNI_IT[now.getDay()] : null;

  if (giorni.length === 0) {
    return <p className="text-foreground/60 px-5 py-8 text-center text-sm">{labels.vuoto}</p>;
  }

  // Scelta dell'utente, altrimenti il giorno della prossima celebrazione.
  const selected =
    giorni.find((g) => g.giorno === picked) ??
    giorni.find((g) => g.giorno === next?.giorno) ??
    giorni[0];

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const forward = isAr ? "ArrowLeft" : "ArrowRight";
    const backward = isAr ? "ArrowRight" : "ArrowLeft";
    let target: number | null = null;
    if (event.key === forward) target = (index + 1) % giorni.length;
    else if (event.key === backward) target = (index - 1 + giorni.length) % giorni.length;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = giorni.length - 1;
    if (target === null) return;
    event.preventDefault();
    setPicked(giorni[target].giorno);
    tabRefs.current[target]?.focus();
  }

  const rows = (giorno: OrarioSettimanale, size: "lg" | "md") => (
    <ul className="-mx-3 space-y-1">
      {giorno.celebrazioni.map((cel, ci) => (
        <CelebrationRow
          key={`${ci}-${cel.orario}`}
          cel={cel}
          isNext={nextKey === celebrationKey(giorno.giorno, cel)}
          nextLabel={labels.prossima}
          size={size}
        />
      ))}
    </ul>
  );

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      {/* ── Telefono: giorni a schede ── */}
      <div className="sm:hidden">
        <div
          role="tablist"
          aria-orientation="horizontal"
          className="border-border/70 bg-surface-alt/60 flex gap-1 overflow-x-auto border-b p-2 [scrollbar-width:none]"
        >
          {giorni.map((giorno, index) => {
            const isSelected = giorno.giorno === selected.giorno;
            const hasNext = giorno.giorno === next?.giorno;
            return (
              <button
                key={giorno.giorno}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`orari-tab-${index}`}
                aria-selected={isSelected}
                aria-controls="orari-panel"
                aria-label={localizeGiorno(giorno.giorno, locale)}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setPicked(giorno.giorno)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                className={`focus-visible:ring-gold relative flex min-h-12 min-w-11 flex-1 flex-col items-center justify-center rounded-xl px-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                  isSelected
                    ? "bg-accent text-white shadow-sm"
                    : giorno.giorno === today
                      ? "text-primary ring-primary/25 bg-surface ring-1 ring-inset"
                      : "text-foreground/70 hover:bg-surface hover:text-foreground"
                }`}
              >
                <span aria-hidden>{shortGiorno(giorno.giorno, locale)}</span>
                <span
                  aria-hidden
                  className={`mt-1 h-1.5 w-1.5 rounded-full ${
                    hasNext ? (isSelected ? "bg-white" : "bg-accent") : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div
          id="orari-panel"
          role="tabpanel"
          aria-labelledby={`orari-tab-${giorni.indexOf(selected)}`}
          className="px-5 pt-4 pb-5"
        >
          <div className="mb-2 flex items-center gap-2">
            <h3 className="font-display text-foreground text-lg font-semibold">
              {localizeGiorno(selected.giorno, locale)}
            </h3>
            {selected.giorno === today && <TodayBadge label={labels.oggi} />}
          </div>
          {rows(selected, "lg")}
        </div>
      </div>

      {/* ── Da sm: elenco completo ── */}
      <ol className="divide-border/70 hidden divide-y sm:block">
        {giorni.map((giorno) => (
          <li
            key={giorno.giorno}
            className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-6 px-6 py-5"
          >
            <div className="flex items-start gap-2 pt-2">
              <h3 className="font-display text-foreground text-base font-semibold">
                {localizeGiorno(giorno.giorno, locale)}
              </h3>
              {giorno.giorno === today && <TodayBadge label={labels.oggi} />}
            </div>
            {rows(giorno, "md")}
          </li>
        ))}
      </ol>
    </div>
  );
}

function TodayBadge({ label }: { label: string }) {
  return (
    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[11px] font-semibold">
      {label}
    </span>
  );
}

function CelebrationRow({
  cel,
  isNext,
  nextLabel,
  size,
}: {
  cel: Celebrazione;
  isNext: boolean;
  nextLabel: string;
  size: "lg" | "md";
}) {
  const lg = size === "lg";
  return (
    <li
      className={`flex items-baseline gap-4 rounded-xl px-3 ${lg ? "py-2.5" : "py-2"} ${
        isNext ? "bg-accent/10 ring-accent/25 ring-1 ring-inset" : ""
      }`}
    >
      <time
        className={`shrink-0 font-semibold tabular-nums ${lg ? "w-14 text-base" : "w-12 text-sm"} ${
          isNext ? "text-accent" : "text-primary"
        }`}
      >
        {cel.orario}
      </time>
      <div className="min-w-0 flex-1">
        <p
          className={`${lg ? "text-[15px]" : "text-sm"} ${
            isNext ? "text-foreground font-semibold" : "text-foreground/85"
          }`}
        >
          {cel.tipo}
        </p>
        {cel.note && (
          <p className="text-foreground/60 mt-0.5 text-xs leading-relaxed">{cel.note}</p>
        )}
      </div>
      {isNext && (
        <span className="bg-accent shrink-0 self-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-white">
          {nextLabel}
        </span>
      )}
    </li>
  );
}
