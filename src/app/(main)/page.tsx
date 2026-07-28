﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import {
  Clock,
  CalendarDays,
  BookOpen,
  MapPin,
} from "lucide-react";
import ScrollDownHint from "@/components/ScrollDownHint";
import { getTestiSacri, getPreghiere, getEventi, getOrari } from "@/lib/db";
import NextCelebrationCard from "@/components/NextCelebrationCard";
import OrariTable from "@/components/OrariTable";
import YouTubeLiveSection from "@/components/YouTubeLiveSection";

export const revalidate = 60;

export default async function HomePage() {
  const [t, tOrari, tContatti, locale, testiSacri, preghiere, eventi, orari] = await Promise.all([
    getTranslations("home"),
    getTranslations("orari"),
    getTranslations("contatti"),
    getLocale(),
    getTestiSacri(),
    getPreghiere(),
    getEventi(),
    getOrari(),
  ]);

  const now = new Date();
  const dateLocale = locale === "ar" ? "ar-EG" : "it-IT";
  const dateStr = now.toLocaleDateString(dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-0">
      {/* ZONA 1 - HERO */}
      <section className="relative animate-fade-in-up">
        <div className="relative lg:min-h-[560px]">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-sm sm:rounded-3xl">
            <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
            <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative flex min-w-0 flex-col gap-3 px-4 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-10 lg:min-h-[560px] lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10 lg:px-10 lg:pt-16 lg:pb-10">
              <div className="flex min-w-0 flex-col space-y-2.5 lg:justify-center">
                <div className="space-y-2.5 sm:space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accent">
                    {t("heroEyebrow")}
                  </p>

                  <h1 className="font-display text-2xl leading-tight text-foreground sm:text-4xl">
                    {t("heroTitle")}
                  </h1>

                  <p className="max-w-2xl text-sm leading-relaxed text-foreground/70 sm:text-base">
                    {t("heroSubtitle")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href="/#orari" className="btn-primary">
                    {t("heroCtaPrimary")}
                  </Link>

                  <Link href="/eventi" className="btn-secondary" aria-label={t("eventiOverviewCta")}>
                    {t("eventiOverviewCta")}
                  </Link>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-3 pt-1 sm:gap-4 lg:justify-end lg:pt-0">
                <div className="mb-4 flex flex-wrap items-center gap-2.5 text-xs text-foreground/60 sm:mb-6 sm:gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/70 px-3 py-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-accent" />
                    {dateStr}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/70 px-3 py-1.5">
                    <MapPin className="h-3.5 w-3.5 text-accent" />
                    {t("heroMetaLocation")}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {/* CTA Iscrizione agli eventi */}
                  <Link href="/eventi" className="group relative overflow-hidden rounded-2xl border-2 border-accent/40 bg-gradient-to-br from-accent/15 to-accent/5 p-4 transition-all hover:border-accent hover:shadow-lg hover:from-accent/20 hover:to-accent/10">
                    <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors" />
                    <div className="relative space-y-3">
                      {eventi.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                            {t("nextEventTitle")}
                          </p>
                          <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20">
                              <CalendarDays className="h-5 w-5 text-accent" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-1 text-sm font-bold text-foreground">
                                {eventi[0].titolo}
                              </p>
                              <p className="text-xs text-foreground/60">
                                {new Date(eventi[0].data).toLocaleDateString(dateLocale, {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <button className="w-full rounded-lg bg-accent/90 px-3 py-2.5 text-center text-sm font-bold text-white transition-all group-hover:bg-accent" aria-label={eventi.length > 0 ? t("eventiActionCta") : t("eventiOverviewCta")}>
                        {eventi.length > 0 ? t("eventiActionCta") : t("eventiOverviewCta")}
                      </button>
                    </div>
                  </Link>

                  <NextCelebrationCard
                    orari={orari}
                    title={t("quickProssima")}
                    emptyLabel={t("noCelebration")}
                  />
                </div>

                <div className="flex flex-col items-center gap-3 pt-2 text-foreground/70 lg:hidden">
                  <span className="text-center text-[10px] font-semibold uppercase tracking-[0.4em]">
                    {t("scrollHint")}
                  </span>
                  <ScrollDownHint targetId="orari" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ZONA 2 - ORARI + LIVE */}
      <section
        id="orari"
        className="mt-10 animate-fade-in-up animation-delay-[100ms] sm:mt-12"
      >
        <div className="mb-4 flex flex-col items-start gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              {t("viviChiesa")}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">
              {tOrari("titolo")}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/70">
              {tOrari("sottotitolo")}
            </p>
          </div>
          {/* <Link href="/video-corsi" className="btn-secondary w-full justify-center sm:w-auto">
            {tContatti("youtubeSezione")}
          </Link> */}
        </div>

        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="min-w-0 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-alt/70 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {tOrari("titolo")}
                </h3>
                <p className="text-sm text-foreground/55">
                  {t("quickProssima")}
                </p>
              </div>
              <div className="rounded-full bg-accent/10 p-2 text-accent">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <OrariTable
              orari={orari}
              labels={{
                giorno: tOrari("giorno"),
                celebrazione: tOrari("celebrazione"),
                orario: tOrari("orario"),
                note: tOrari("note"),
              }}
            />
          </div>

          <div id="live" className="min-w-0">
            <YouTubeLiveSection />
          </div>
        </div>
      </section>

      {/* ZONA 4 - FEATURED CONTENT */}
      <section className="mt-12 animate-fade-in-up animation-delay-[300ms] sm:mt-14">
        <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-foreground">
          {t("featuredTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Link href="/eventi" className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
              <h3 className="text-base font-bold uppercase tracking-wide text-foreground">
                {t("prossimiEventi")}
              </h3>
              <span className="text-sm font-semibold text-accent transition hover:text-accent/80">
                {t("vediTutti")} →
              </span>
            </div>
            <div className="divide-y divide-border/60 px-5 py-2 sm:px-6">
              {eventi.slice(0, 3).map((ev, index) => (
                <div key={ev.id ?? ev.slug ?? `evento-${index}`} className="flex items-start gap-3 py-3">
                  <div className="min-w-[60px] rounded-xl bg-accent/10 px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-accent">
                    {new Date(ev.data).toLocaleDateString(dateLocale, {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">{ev.titolo}</p>
                    <p className="mt-0.5 text-xs text-foreground/60">{ev.luogo}</p>
                  </div>
                </div>
              ))}
              {eventi.length === 0 && (
                <div className="py-6 text-sm text-foreground/60">
                  {t("nessunEvento")} — {t("controllaPiuTardi")}
                </div>
              )}
            </div>
          </Link>

          <Link href="/preghiere" className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
              <h3 className="text-base font-bold uppercase tracking-wide text-foreground">
                {t("ultimePreghiere")}
              </h3>
              <span className="text-sm font-semibold text-accent transition hover:text-accent/80">
                {t("vediTutte")} →
              </span>
            </div>
            <div className="divide-y divide-border/60 px-5 py-2 sm:px-6">
              {preghiere.slice(0, 3).map((p, index) => (
                <div key={p.id ?? p.slug ?? `preghiera-${index}`} className="flex items-start gap-3 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">{p.titolo}</p>
                    <p className="mt-0.5 text-xs text-foreground/60">{p.categoria}</p>
                  </div>
                </div>
              ))}
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
