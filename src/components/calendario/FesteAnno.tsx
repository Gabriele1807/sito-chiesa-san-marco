"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, CalendarCheck, Loader2, AlertCircle } from "lucide-react";
import type { PublicCalendarConfig } from "@/lib/mongo/calendario";
import type { CalendarConfig } from "@/lib/calendario/resolver";
import { NATIVITY_NAME } from "@/lib/calendario/rules";
import { isoKeyOfJdn } from "@/lib/calendario/jdn";
import { localJdn } from "@/lib/calendario/tz";
import { jdnToCoptic } from "@/lib/calendario/coptic";
import { nextLocalMidnight } from "@/lib/calendario/today";
import { COPTIC_YEAR_MAX, COPTIC_YEAR_MIN, parseCopticYearParam } from "@/lib/calendario/params";
import {
  buildCopticYearCalendar,
  markTimeline,
  type DayRef,
  type EntryStatus,
  type YearEntry,
  type YearEntryKind,
} from "@/lib/calendario/year";
import { useLiveClock } from "./useLiveClock";
import {
  formatGregorian,
  formatGregorianWith,
  formatNumber,
  localized,
  monthLabel,
} from "./format";

const KIND_STYLE: Record<YearEntryKind, { border: string; badge: string }> = {
  fissa: { border: "border-s-accent", badge: "bg-accent/10 text-accent" },
  mobile: { border: "border-s-primary", badge: "bg-primary/10 text-primary" },
  digiuno: { border: "border-s-foreground/30", badge: "bg-surface-2 text-foreground/75" },
  periodo: { border: "border-s-border", badge: "bg-surface-2 text-foreground/60" },
};

const dayHref = (day: DayRef) => `/calendario?data=${isoKeyOfJdn(day.jdn)}`;

/**
 * Elenco di feste, digiuni e periodi di un anno copto, con selettore
 * dell'anno. Il calcolo è nel browser e non dipende dal database (la
 * configurazione arriva dal server, con i valori predefiniti se il DB non
 * risponde). "Oggi" usa il giorno civile del dispositivo.
 */
export default function FesteAnno({
  initialConfig,
  initialYear,
}: {
  initialConfig: PublicCalendarConfig;
  initialYear: number | null;
}) {
  const t = useTranslations("calendario");
  const locale = useLocale();
  const id = useId();

  const config = useMemo<CalendarConfig>(
    () => ({ feasts: initialConfig.feasts, rules: initialConfig.rules }),
    [initialConfig]
  );

  const clock = useLiveClock(true, nextLocalMidnight);
  const todayJdn = clock ? localJdn(clock.now, clock.timeZone) : null;
  const currentYear = todayJdn !== null ? jdnToCoptic(todayJdn).year : null;

  const [chosen, setChosen] = useState<number | null>(initialYear);
  const [draft, setDraft] = useState<string | null>(null);
  const year = chosen ?? currentYear;

  // Già memoizzato per configurazione e anno in buildCopticYearCalendar.
  const cal = year !== null ? buildCopticYearCalendar(year, config) : null;
  const timeline = cal && todayJdn !== null ? markTimeline(cal, todayJdn) : null;

  function selectYear(next: number | null) {
    setChosen(next);
    setDraft(null);
    const url = next === null ? window.location.pathname : `?anno=${next}`;
    window.history.replaceState(null, "", url);
  }

  const era = t("annoMartiri");
  const fmtCoptic = (d: DayRef) =>
    `${formatNumber(d.coptic.day, locale)} ${monthLabel(d.coptic.month, locale)}`;
  const fmtShort = (d: DayRef) =>
    formatGregorianWith(d.gregorian, locale, { day: "numeric", month: "short", year: "numeric" });
  const fmtLong = (d: DayRef) => formatGregorian(d.gregorian, locale);

  function entryName(e: YearEntry): string {
    if (e.kind === "digiuno") return t(`digiuniNomi.${e.id}` as Parameters<typeof t>[0]);
    if (e.kind === "periodo") return t(`stagioni.${e.id}` as Parameters<typeof t>[0]);
    return localized(e.name, locale) || e.id;
  }

  const statusLabel = (status: EntryStatus | undefined, isNext: boolean, single: boolean) => {
    if (isNext) return status === "in-corso" ? t("festeAnno.oggi") : t("festeAnno.prossima");
    if (status === "in-corso") return single ? t("festeAnno.oggi") : t("festeAnno.inCorso");
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Selettore dell'anno */}
      <section
        aria-labelledby={`${id}-anno`}
        className="border-border bg-surface space-y-3 rounded-2xl border px-5 py-4"
      >
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label
              id={`${id}-anno`}
              htmlFor={`${id}-input`}
              className="text-foreground/70 mb-1 block text-xs font-semibold"
            >
              {t("festeAnno.anno")}
            </label>
            <input
              id={`${id}-input`}
              type="number"
              inputMode="numeric"
              min={COPTIC_YEAR_MIN}
              max={COPTIC_YEAR_MAX}
              className="input-field w-32"
              value={draft ?? (year !== null ? String(year) : "")}
              disabled={year === null}
              onChange={(e) => {
                setDraft(e.target.value);
                const y = parseCopticYearParam(e.target.value);
                if (y !== null) {
                  setChosen(y);
                  window.history.replaceState(null, "", `?anno=${y}`);
                }
              }}
              onBlur={() => setDraft(null)}
            />
          </div>
          <button
            type="button"
            className="btn-secondary px-3"
            disabled={year === null || year <= COPTIC_YEAR_MIN}
            onClick={() => year !== null && selectYear(year - 1)}
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            {t("festeAnno.annoPrecedente")}
          </button>
          <button
            type="button"
            className="btn-secondary px-3"
            disabled={year === null || year >= COPTIC_YEAR_MAX}
            onClick={() => year !== null && selectYear(year + 1)}
          >
            {t("festeAnno.annoSuccessivo")}
            <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </button>
          <button
            type="button"
            className="btn-secondary px-3"
            disabled={currentYear === null || year === currentYear}
            onClick={() => selectYear(null)}
          >
            <CalendarCheck className="h-4 w-4" aria-hidden />
            {t("festeAnno.annoCorrente")}
          </button>
        </div>

        {cal && (
          <p className="text-foreground/70 text-sm" aria-live="polite">
            <span className="text-foreground font-semibold">
              {formatNumber(cal.year, locale)} {era}
            </span>
            {" · "}
            {t("festeAnno.intervallo", { inizio: fmtShort(cal.start), fine: fmtShort(cal.end) })}
            {cal.isLeapYear && (
              <>
                {" · "}
                {t("annoBisestile")}
              </>
            )}
          </p>
        )}
      </section>

      {!cal ? (
        <div className="empty-state flex items-center justify-center gap-2" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {t("caricamento")}
        </div>
      ) : (
        <>
          <section aria-labelledby={`${id}-elenco`} className="space-y-3">
            <h2 id={`${id}-elenco`} className="font-display text-foreground text-2xl">
              {t("festeAnno.elenco", { anno: `${formatNumber(cal.year, locale)} ${era}` })}
            </h2>
            <ol className="space-y-2">
              {cal.entries.map((e) => {
                const status = timeline?.status[e.key];
                const isNext = timeline?.nextFeastKey === e.key;
                const single = e.start.jdn === e.end.jdn;
                const label = statusLabel(status, isNext, single);
                const style = KIND_STYLE[e.kind];
                return (
                  <li key={e.key}>
                    <Link
                      href={dayHref(e.start)}
                      className={`bg-surface hover:bg-surface-2 focus-visible:ring-gold flex items-start gap-4 rounded-xl border border-s-4 px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none ${style.border} ${
                        isNext ? "border-accent ring-accent/40 ring-1" : "border-border"
                      } ${status === "passata" ? "opacity-60" : ""}`}
                    >
                      <span className="w-14 shrink-0 text-center" aria-hidden>
                        <span className="font-display text-foreground block text-2xl leading-none">
                          {formatGregorianWith(e.start.gregorian, locale, { day: "numeric" })}
                        </span>
                        <span className="text-foreground/60 mt-1 block text-[11px] uppercase">
                          {formatGregorianWith(e.start.gregorian, locale, { month: "short" })}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-foreground font-semibold">{entryName(e)}</span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${style.badge}`}
                          >
                            {t(`festeAnno.tipi.${e.kind}`)}
                          </span>
                          {label && (
                            <span className="bg-accent rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-white">
                              {label}
                            </span>
                          )}
                          {status === "passata" && (
                            <span className="sr-only">{t("festeAnno.passata")}</span>
                          )}
                        </span>
                        <span className="text-foreground/65 mt-1 block text-xs leading-relaxed">
                          {single
                            ? `${fmtLong(e.start)} · ${fmtCoptic(e.start)}`
                            : `${t("festeAnno.intervallo", {
                                inizio: fmtShort(e.start),
                                fine: fmtShort(e.end),
                              })} · ${fmtCoptic(e.start)} – ${fmtCoptic(e.end)}`}
                        </span>
                        {e.uncertain.length > 0 && (
                          <span className="text-foreground/70 mt-1 flex items-center gap-1 text-xs">
                            <AlertCircle className="text-accent h-3.5 w-3.5 shrink-0" aria-hidden />
                            {t("festeAnno.concomitanza")}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>

          {cal.pending.length > 0 && (
            <section aria-labelledby={`${id}-verifica`} className="space-y-2">
              <h2 id={`${id}-verifica`} className="font-display text-foreground text-xl">
                {t("festeAnno.inVerificaTitolo")}
              </h2>
              <ul className="space-y-2">
                {cal.pending.map((p) => (
                  <li
                    key={p.id}
                    className="border-border bg-surface rounded-xl border border-dashed px-4 py-3 text-sm"
                  >
                    {p.id === "natale" ? (
                      <>
                        <span className="text-foreground font-semibold">
                          {localized(NATIVITY_NAME, locale)}
                        </span>
                        <span className="text-foreground/65 block text-xs">
                          {t("festeAnno.natalePending")}
                        </span>
                      </>
                    ) : (
                      p.day && (
                        <Link
                          href={dayHref(p.day)}
                          className="focus-visible:ring-gold block rounded focus-visible:ring-2 focus-visible:outline-none"
                        >
                          <span className="text-foreground font-semibold">
                            {fmtCoptic(p.day)} · {fmtLong(p.day)}
                          </span>
                          <span className="text-foreground/65 block text-xs">
                            {t("festeAnno.nasi6Pending")}
                          </span>
                        </Link>
                      )
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
