import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import {
  Clock,
  BookOpen,
  Image as ImageIcon,
  Library,
  CalendarDays,
  Phone,
  MapPin,
} from "lucide-react";
import ScrollDownHint from "@/components/ScrollDownHint";
import { getTestiSacri, getPreghiere, getEventi, getOrari } from "@/lib/db";
import QuickAccessCard from "@/components/QuickAccessCard";
import NextCelebrationCard from "@/components/NextCelebrationCard";

export const revalidate = 60;

export default async function HomePage() {
  const [t, locale, testiSacri, preghiere, eventi, orari] = await Promise.all([
    getTranslations("home"),
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
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
            <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
            <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative flex flex-col gap-4 px-5 pt-12 pb-7 sm:px-8 sm:pt-10 sm:pb-10 lg:min-h-[560px] lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10 lg:px-10 lg:pt-16 lg:pb-10">
              <div className="flex flex-col space-y-3 lg:justify-center">
                <div className="space-y-3">
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
                  <Link href="/orari" className="btn-primary">
                    {t("heroCtaPrimary")}
                  </Link>

                  <Link href="/contatti" className="btn-secondary">
                    {t("heroCtaSecondary")}
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-1 sm:gap-4 lg:justify-end lg:pt-0">
                <div className="mb-8 flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/70 px-3 py-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-accent" />
                    {dateStr}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/70 px-3 py-1.5">
                    <MapPin className="h-3.5 w-3.5 text-accent" />
                    {t("heroMetaLocation")}
                  </span>
                </div>

                <NextCelebrationCard
                  orari={orari}
                  title={t("quickProssima")}
                  emptyLabel={t("noCelebration")}
                />

                <div className="flex flex-col items-center gap-4 pt-4 text-foreground/70 lg:hidden">
                  <span className="text-center text-[10px] font-semibold uppercase tracking-[0.4em]">
                    {t("scrollHint")}
                  </span>
                  <ScrollDownHint targetId="quick-access" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ZONA 2 - QUICK ACCESS GRID */}
      <section
        id="quick-access"
        className="mt-16 animate-fade-in-up animation-delay-[100ms] sm:mt-12"
      >
        <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-foreground">
          {t("quickAccessTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          <QuickAccessCard href="/orari" icon={Clock} title={t("quickOrari")} description={t("quickOrariDesc")} delay={0} />
          <QuickAccessCard href="/preghiere" icon={BookOpen} title={t("quickPreghiere")} description={t("quickPreghiereDesc")} delay={60} />
          <QuickAccessCard href="/icone" icon={ImageIcon} title={t("quickIcone")} description={t("quickIconeDesc")} delay={120} />
          <QuickAccessCard href="/libreria" icon={Library} title={t("quickLibreria")} description={t("quickLibreriaDesc")} delay={180} />
          <QuickAccessCard href="/eventi" icon={CalendarDays} title={t("quickEventi")} description={t("quickEventiDesc")} delay={240} />
          <QuickAccessCard href="/contatti" icon={Phone} title={t("quickContatti")} description={t("quickContattiDesc")} delay={300} />
        </div>
      </section>


      {/* ZONA 4 - FEATURED CONTENT */}
      <section className="mt-12 animate-fade-in-up animation-delay-[300ms] sm:mt-14">
        <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-foreground">
          {t("featuredTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
              <h3 className="text-base font-bold uppercase tracking-wide text-foreground">
                {t("prossimiEventi")}
              </h3>
              <Link href="/eventi" className="text-sm font-semibold text-accent transition hover:text-accent/80">
                {t("vediTutti")} →
              </Link>
            </div>
            <div className="divide-y divide-border/60 px-5 py-2 sm:px-6">
              {eventi.slice(0, 3).map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 py-3">
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
          </div>

          <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
              <h3 className="text-base font-bold uppercase tracking-wide text-foreground">
                {t("ultimePreghiere")}
              </h3>
              <Link href="/preghiere" className="text-sm font-semibold text-accent transition hover:text-accent/80">
                {t("vediTutte")} →
              </Link>
            </div>
            <div className="divide-y divide-border/60 px-5 py-2 sm:px-6">
              {preghiere.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-start gap-3 py-3">
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
          </div>
        </div>
      </section>
    </div>
  );
}
