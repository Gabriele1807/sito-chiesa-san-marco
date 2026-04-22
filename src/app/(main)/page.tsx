import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import {
  Clock,
  BookOpen,
  Image as ImageIcon,
  Library,
  CalendarDays,
  HandHeart,
  ChevronRight,
} from "lucide-react";
import { getTestiSacri, getPreghiere, getEventi, getOrari } from "@/lib/db";
import QuickAccessCard from "@/components/QuickAccessCard";
import NextCelebrationCard from "@/components/NextCelebrationCard";

export const revalidate = 60;

export default async function HomePage() {
  const t = await getTranslations("home");
  const testiSacri = await getTestiSacri();
  const preghiere = await getPreghiere();
  const eventi = await getEventi();
  const orari = await getOrari();

  // FIX [4] — Date now formatted with current locale instead of hardcoded "it-IT"
  const locale = await getLocale();
  const now = new Date();
  const dateLocale = locale === "ar" ? "ar-EG" : "it-IT";
  const dateStr = now.toLocaleDateString(dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* ====== ZONA 1 - WELCOME HEADER ====== */}
      <section className="relative -mx-4 sm:-mx-6 lg:-mx-10 -mt-8 sm:-mt-10 px-4 sm:px-6 lg:px-10 py-8 sm:py-10 bg-gradient-to-r from-primary via-primary-light to-primary overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent via-accent-light to-accent" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-tight">
              {t("dashboardTitolo")}
            </h1>
            <p className="text-white/70 text-sm mt-1">{t("dashboardSottotitolo")}</p>
          </div>
          <p className="text-white/50 text-xs uppercase tracking-wider font-medium">{dateStr}</p>
        </div>
      </section>

      {/* ====== ZONA 2 - QUICK ACCESS GRID ====== */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAccessCard href="/orari" icon={Clock} title={t("quickOrari")} description={t("quickOrariDesc")} delay={0} />
          <QuickAccessCard href="/preghiere" icon={BookOpen} title={t("quickPreghiere")} description={t("quickPreghiereDesc")} delay={60} />
          <QuickAccessCard href="/icone" icon={ImageIcon} title={t("quickIcone")} description={t("quickIconeDesc")} delay={120} />
          <QuickAccessCard href="/libreria" icon={Library} title={t("quickLibreria")} description={t("quickLibreriaDesc")} delay={180} />
          <QuickAccessCard href="/eventi" icon={CalendarDays} title={t("quickEventi")} description={t("quickEventiDesc")} delay={240} />
          {/* FIX [18] — Dynamic next celebration card */}
          <NextCelebrationCard orari={orari} title={t("quickProssima")} />
        </div>
      </section>

      {/* ====== ZONA 3 - DA FARE ====== */}
      <section className="animate-fade-in-up [animation-delay:200ms]">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">{t("daFare")}</h2>
          <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">2</span>
        </div>
        <div className="bg-surface rounded-xl border border-gray-200 divide-y divide-gray-200">
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <HandHeart className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{t("prossimaPreghiera")}</p>
                <p className="text-xs text-gray-500">{t("prossimaPreghieraOrario")}</p>
              </div>
            </div>
            <Link href="/preghiere" className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg btn-hover">
              {t("vaiPreghiere")} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{t("nuoveIcone")}</p>
                <p className="text-xs text-gray-500">{t("nuoveIconeDesc")}</p>
              </div>
            </div>
            <Link href="/icone" className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg btn-hover">
              {t("esploraIconeBtn")} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ====== ZONA 4 - STAT CARDS ====== */}
      {/* FIX [6] — Stat cards now wrapped in Link for clickability */}
      <section className="animate-fade-in-up [animation-delay:300ms]">
        <div className="grid grid-cols-2 gap-4">
          <Link href="/orari" className="block cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2">
            <div className="bg-surface rounded-xl border border-gray-200 p-6 text-center h-full">
              <Clock className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-5xl font-bold text-gray-900">5</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">{t("statCelebrazioni")}</p>
            </div>
          </Link>
          <Link href="/libreria" className="block cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2">
            <div className="bg-surface rounded-xl border border-gray-200 p-6 text-center h-full">
              <Library className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-5xl font-bold text-gray-900">{testiSacri.length}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">{t("statTesti")}</p>
            </div>
          </Link>
        </div>
      </section>

      {/* ====== ZONA 5 - WIDGET 2 COLONNE ====== */}
      <section className="animate-fade-in-up [animation-delay:400ms]">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-surface rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{t("prossimiEventi")}</h3>
              {/* FIX [7d] — "Vedi tutti" button more prominent with arrow */}
              <Link href="/eventi" className="text-amber-600 font-semibold text-sm hover:text-amber-700 hover:underline flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2">{t("vediTutti")} <span aria-hidden="true" className="text-base">→</span></Link>
            </div>
            <div className="p-5 space-y-3">
              {eventi.length > 0 ? (
                eventi.slice(0, 3).map((ev) => {
                  const d = new Date(ev.data);
                  const dayStr = d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
                  return (
                    // FIX [7] — Event rows now clickable with hover effect
                    <Link key={ev.id} href="/eventi" className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-gray-100 cursor-pointer transition-colors duration-150 group">
                      <span className="shrink-0 inline-block bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">{dayStr}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-amber-600 transition-colors">{ev.titolo}</p>
                        <p className="text-xs text-gray-500">{ev.luogo}</p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">{t("nessunEvento")}</p>
                  <p className="text-xs text-gray-300 mt-1">{t("controllaPiuTardi")}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{t("ultimePreghiere")}</h3>
              {/* FIX [8d] — "Vedi tutte" button more prominent with arrow */}
              <Link href="/preghiere" className="text-amber-600 font-semibold text-sm hover:text-amber-700 hover:underline flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2">{t("vediTutte")} <span aria-hidden="true" className="text-base">→</span></Link>
            </div>
            <div className="p-5 space-y-3">
              {preghiere.slice(0, 3).map((p) => (
                // FIX [8] — Prayer rows now clickable with hover effect
                <Link key={p.id} href="/preghiere" className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-gray-100 cursor-pointer transition-colors duration-150 group">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-amber-600 transition-colors">{p.titolo}</p>
                    <p className="text-xs text-gray-500">{p.categoria}</p>
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
