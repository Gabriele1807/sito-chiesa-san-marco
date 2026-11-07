"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, Moon, Sun, Sunset, Info } from "lucide-react";
import type { LiturgicalDayInfo } from "@/lib/calendario/resolver";
import type { DayState } from "@/lib/calendario/service";
import { jdnToGregorian } from "@/lib/calendario/jdn";
import { monthLabel } from "./format";
import {
  formatCoptic,
  formatGregorian,
  formatNumber,
  formatShortGregorian,
  formatTime,
  localized,
  weekdayName,
} from "./format";

interface DayCardProps {
  info: LiturgicalDayInfo;
  /** Stato completo (live o manuale): se assente (anteprima admin) si mostra solo il giorno liturgico. */
  state?: DayState;
  /** Tramonti che delimitano il giorno liturgico (dal precedente all'attuale). */
  bounds?: { start: number; end: number };
}

export default function DayCard({ info, state, bounds }: DayCardProps) {
  const t = useTranslations("calendario");
  const locale = useLocale();
  const era = t("annoMartiri");
  const tz = state?.timeZone ?? "UTC";
  const eve = jdnToGregorian(info.jdn - 1);
  const easterDate = formatGregorian(jdnToGregorian(info.easter.jdn), locale, false);

  const easterLine =
    info.daysFromEaster === 0
      ? t("pasquaOggi")
      : info.daysFromEaster < 0
        ? t("pasquaTra", { n: -info.daysFromEaster, data: easterDate })
        : t("pasquaDa", { n: info.daysFromEaster, data: easterDate });

  return (
    <article
      className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm"
      aria-labelledby="calendario-giorno-liturgico"
    >
      {/* Giorno liturgico */}
      <div className="bg-primary text-white">
        <div className="space-y-3 px-5 py-6 sm:px-8 sm:py-8">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-white/70 uppercase">
            <Sunset className="h-4 w-4 text-[#F0B35B]" aria-hidden />
            {t("giornoLiturgico")}
          </p>
          <h2
            id="calendario-giorno-liturgico"
            className="font-display text-4xl leading-tight sm:text-5xl"
            aria-live="polite"
          >
            {formatCoptic(info.coptic, locale, era)}
          </h2>
          <p className="text-lg text-white/90">
            {weekdayName(info.weekday, locale)} · {formatGregorian(info.gregorian, locale, false)}
          </p>
          <p className="text-sm text-white/70">
            {bounds
              ? t("giornoLiturgicoSpiega", {
                  inizio: `${formatShortGregorian(eve, locale)} (${formatTime(bounds.start, tz, locale)})`,
                  fine: `${formatShortGregorian(info.gregorian, locale)} (${formatTime(bounds.end, tz, locale)})`,
                })
              : t("giornoLiturgicoSpiega", {
                  inizio: formatShortGregorian(eve, locale),
                  fine: formatShortGregorian(info.gregorian, locale),
                })}
          </p>
          {state?.isAfterSunset && (
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              <Moon className="h-3.5 w-3.5" aria-hidden />
              {t("dopoTramonto")}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-8">
        {/* Giorno civile */}
        {state && (
          <section aria-labelledby="calendario-giorno-civile" className="flex items-start gap-3">
            <span className="icon-box-circle mt-0.5 h-9 w-9">
              <Sun className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3
                id="calendario-giorno-civile"
                className="text-foreground/60 text-xs font-semibold tracking-wider uppercase"
              >
                {t("giornoCivile")}
              </h3>
              <p className="text-foreground text-base font-semibold">
                {formatGregorian(state.civil.gregorian, locale)}
              </p>
              <p className="text-foreground/60 text-xs">{t("giornoCivileSpiega")}</p>
            </div>
          </section>
        )}

        {/* Tempo liturgico, digiuni, feste */}
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-foreground/60 text-xs font-semibold tracking-wider uppercase">
              {t("stagione")}
            </dt>
            <dd className="text-foreground mt-1 text-sm">
              {info.season ? t(`stagioni.${info.season}`) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-foreground/60 text-xs font-semibold tracking-wider uppercase">
              {t("digiuni")}
            </dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {info.fasts.length === 0 ? (
                <span className="text-foreground text-sm">—</span>
              ) : (
                info.fasts.map((f) => (
                  <span key={f} className="badge-neutral">
                    {t(`digiuniNomi.${f}`)}
                  </span>
                ))
              )}
            </dd>
          </div>
          <div>
            <dt className="text-foreground/60 text-xs font-semibold tracking-wider uppercase">
              {t("feste")}
            </dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {info.feasts.length === 0 ? (
                <span className="text-foreground text-sm">—</span>
              ) : (
                info.feasts.map((f) => (
                  <span key={f.id} className="badge-tipo-self">
                    {localized(f.name, locale)}
                  </span>
                ))
              )}
            </dd>
          </div>
        </dl>

        <ul className="text-foreground/70 space-y-1.5 text-sm">
          <li className="flex items-center gap-2">
            <CalendarDays className="text-accent h-4 w-4 shrink-0" aria-hidden />
            {easterLine}
          </li>
          {info.sundayOfMonth !== null && (
            <li className="flex items-center gap-2">
              <CalendarDays className="text-accent h-4 w-4 shrink-0" aria-hidden />
              {t("domenicaDelMese", {
                n: formatNumber(info.sundayOfMonth, locale),
                mese: monthLabel(info.coptic.month, locale),
              })}
            </li>
          )}
          {info.isLeapYear && info.coptic.month === 13 && (
            <li className="flex items-center gap-2">
              <CalendarDays className="text-accent h-4 w-4 shrink-0" aria-hidden />
              {t("annoBisestile")}
            </li>
          )}
          {info.uncertain.length > 0 && (
            <li className="flex items-center gap-2">
              <Info className="text-accent h-4 w-4 shrink-0" aria-hidden />
              {t("regoleInVerifica")}
            </li>
          )}
        </ul>
      </div>
    </article>
  );
}
