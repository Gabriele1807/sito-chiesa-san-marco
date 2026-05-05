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

  // FIX [4] — Date now formatted with current locale instead of hardcoded "it-IT"
  const now = new Date();
  const dateLocale = locale === "ar" ? "ar-EG" : "it-IT";
  const dateStr = now.toLocaleDateString(dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-12">
      {/* ====== ZONA 1 - HERO ====== */}
      <section className="animate-fade-in-up">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
          <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] p-8 sm:p-10 lg:p-12">
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.4em] text-accent font-semibold">
                  {t("heroEyebrow")}
                </p>
                <h1 className="font-display text-3xl sm:text-5xl text-foreground leading-tight">
                  {t("heroTitle")}
                </h1>
                <p className="text-base sm:text-lg text-foreground/70 max-w-2xl">
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

              <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/70 px-3 py-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-accent" />
                  {dateStr}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/70 px-3 py-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  {t("heroMetaLocation")}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <NextCelebrationCard
                orari={orari}
                title={t("quickProssima")}
                emptyLabel={t("noCelebration")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ====== ZONA 2 - QUICK ACCESS GRID - RESPONSIVE ====== */}
      <section className="animate-fade-in-up [animation-delay:100ms]">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-wide mb-6">
          {t("quickAccessTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <QuickAccessCard href="/orari" icon={Clock} title={t("quickOrari")} description={t("quickOrariDesc")} delay={0} />
          <QuickAccessCard href="/preghiere" icon={BookOpen} title={t("quickPreghiere")} description={t("quickPreghiereDesc")} delay={60} />
          <QuickAccessCard href="/icone" icon={ImageIcon} title={t("quickIcone")} description={t("quickIconeDesc")} delay={120} comingSoon />
          <QuickAccessCard href="/libreria" icon={Library} title={t("quickLibreria")} description={t("quickLibreriaDesc")} delay={180} comingSoon />
          <QuickAccessCard href="/eventi" icon={CalendarDays} title={t("quickEventi")} description={t("quickEventiDesc")} delay={240} comingSoon />
          <QuickAccessCard href="/contatti" icon={Phone} title={t("quickContatti")} description={t("quickContattiDesc")} delay={300} />
        </div>
      </section>

      {/* ====== ZONA 3 - STAT CARDS ====== */}
      <section className="animate-fade-in-up [animation-delay:200ms]">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-wide mb-6">
          {t("statsTitle")}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          <Link href="/orari" className="block cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
            <div className="bg-surface rounded-2xl border border-border p-6 text-center h-full shadow-sm hover:shadow-md transition-shadow">
              <Clock className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-5xl font-display font-semibold text-foreground">5</p>
              <p className="text-xs text-foreground/60 uppercase tracking-wider font-semibold mt-1">{t("statCelebrazioni")}</p>
            </div>
          </Link>
          <Link href="/libreria" className="block cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
            <div className="bg-surface rounded-2xl border border-border p-6 text-center h-full shadow-sm hover:shadow-md transition-shadow">
              <Library className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-5xl font-display font-semibold text-foreground">{testiSacri.length}</p>
              <p className="text-xs text-foreground/60 uppercase tracking-wider font-semibold mt-1">{t("statTesti")}</p>
            </div>
          </Link>
        </div>
      </section>

      {/* ====== ZONA 4 - WIDGET 2 COLONNE ====== */}
      <section className="animate-fade-in-up [animation-delay:300ms]">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-wide mb-6">
          {t("featuredTitle")}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-surface rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">{t("prossimiEventi")}</h3>
              <Link href="/eventi" className="btn-link">
                {t("vediTutti")} <span aria-hidden="true" className="text-base">→</span>
              </Link>
            </div>
            <div className="p-5 space-y-3">
              {eventi.length > 0 ? (
                eventi.slice(0, 3).map((ev) => {
                  const d = new Date(ev.data);
                  const dayStr = d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
                  return (
                    <Link key={ev.id} href="/eventi" className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-surface-2 cursor-pointer transition-colors duration-150 group">
                      <span className="shrink-0 inline-block bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">{dayStr}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-gold transition-colors">{ev.titolo}</p>
                        <p className="text-xs text-foreground/60">{ev.luogo}</p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <CalendarDays className="w-8 h-8 text-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-foreground/50">{t("nessunEvento")}</p>
                  <p className="text-xs text-foreground/40 mt-1">{t("controllaPiuTardi")}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">{t("ultimePreghiere")}</h3>
              <Link href="/preghiere" className="btn-link">
                {t("vediTutte")} <span aria-hidden="true" className="text-base">→</span>
              </Link>
            </div>
            <div className="p-5 space-y-3">
              {preghiere.slice(0, 3).map((p) => (
                <Link key={p.id} href="/preghiere" className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-surface-2 cursor-pointer transition-colors duration-150 group">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-gold transition-colors">{p.titolo}</p>
                    <p className="text-xs text-foreground/60">{p.categoria}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
