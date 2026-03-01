import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Clock,
  BookOpen,
  Image as ImageIcon,
  Library,
  CalendarDays,
  HandHeart,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { getTestiSacri, getPreghiere, getEventi } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getTranslations("home");
  const testiSacri = await getTestiSacri();
  const preghiere = await getPreghiere();
  const eventi = await getEventi();

  const now = new Date();
  const dateStr = now.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* ====== ZONA 1 - WELCOME HEADER ====== */}
      <section className="relative -mx-6 sm:-mx-8 lg:-mx-10 -mt-10 px-6 sm:px-8 lg:px-10 py-10 bg-gradient-to-r from-primary via-primary-light to-primary overflow-hidden">
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
          <Link href="/orari" className="group">
            <div className="card-hover bg-slate-800 rounded-xl p-6 border border-white/10 hover:border-accent cursor-pointer h-full">
              <div className="flex flex-col items-center text-center gap-3">
                <Clock className="w-7 h-7 text-accent" />
                <h3 className="text-white font-bold text-sm uppercase tracking-wide">{t("quickOrari")}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{t("quickOrariDesc")}</p>
              </div>
            </div>
          </Link>

          <Link href="/preghiere" className="group">
            <div className="card-hover bg-slate-800 rounded-xl p-6 border border-white/10 hover:border-accent cursor-pointer h-full">
              <div className="flex flex-col items-center text-center gap-3">
                <BookOpen className="w-7 h-7 text-accent" />
                <h3 className="text-white font-bold text-sm uppercase tracking-wide">{t("quickPreghiere")}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{t("quickPreghiereDesc")}</p>
              </div>
            </div>
          </Link>

          <Link href="/icone" className="group">
            <div className="card-hover bg-slate-800 rounded-xl p-6 border border-white/10 hover:border-accent cursor-pointer h-full">
              <div className="flex flex-col items-center text-center gap-3">
                <ImageIcon className="w-7 h-7 text-accent" />
                <h3 className="text-white font-bold text-sm uppercase tracking-wide">{t("quickIcone")}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{t("quickIconeDesc")}</p>
              </div>
            </div>
          </Link>

          <Link href="/libreria" className="group">
            <div className="card-hover bg-slate-800 rounded-xl p-6 border border-white/10 hover:border-accent cursor-pointer h-full">
              <div className="flex flex-col items-center text-center gap-3">
                <Library className="w-7 h-7 text-accent" />
                <h3 className="text-white font-bold text-sm uppercase tracking-wide">{t("quickLibreria")}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{t("quickLibreriaDesc")}</p>
              </div>
            </div>
          </Link>

          <Link href="/eventi" className="group">
            <div className="card-hover bg-slate-800 rounded-xl p-6 border border-white/10 hover:border-accent cursor-pointer h-full">
              <div className="flex flex-col items-center text-center gap-3">
                <CalendarDays className="w-7 h-7 text-accent" />
                <h3 className="text-white font-bold text-sm uppercase tracking-wide">{t("quickEventi")}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{t("quickEventiDesc")}</p>
              </div>
            </div>
          </Link>

          <Link href="/orari" className="group">
            <div className="card-hover bg-slate-800 rounded-xl p-6 border-2 border-accent hover:border-accent-light cursor-pointer h-full relative">
              <div className="absolute top-3 right-3">
                <span className="inline-block bg-accent text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">{t("domenica")}</span>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <Sparkles className="w-7 h-7 text-accent" />
                <h3 className="text-white font-bold text-sm uppercase tracking-wide">{t("quickProssima")}</h3>
                <p className="text-accent text-xs font-semibold">{t("quickProssimaDesc")}</p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ====== ZONA 3 - DA FARE ====== */}
      <section>
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
      <section>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface rounded-xl border border-gray-200 p-6 text-center">
            <Clock className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-5xl font-bold text-gray-900">5</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">{t("statCelebrazioni")}</p>
          </div>
          <div className="bg-surface rounded-xl border border-gray-200 p-6 text-center">
            <Library className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-5xl font-bold text-gray-900">{testiSacri.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">{t("statTesti")}</p>
          </div>
        </div>
      </section>

      {/* ====== ZONA 5 - WIDGET 2 COLONNE ====== */}
      <section>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-surface rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{t("prossimiEventi")}</h3>
              <Link href="/eventi" className="text-xs font-semibold text-accent hover:text-primary transition-colors">{t("vediTutti")}</Link>
            </div>
            <div className="p-5 space-y-3">
              {eventi.length > 0 ? (
                eventi.slice(0, 3).map((ev) => {
                  const d = new Date(ev.data);
                  const dayStr = d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
                  return (
                    <div key={ev.id} className="flex items-center gap-3">
                      <span className="shrink-0 inline-block bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">{dayStr}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{ev.titolo}</p>
                        <p className="text-xs text-gray-500">{ev.luogo}</p>
                      </div>
                    </div>
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
              <Link href="/preghiere" className="text-xs font-semibold text-accent hover:text-primary transition-colors">{t("vediTutte")}</Link>
            </div>
            <div className="p-5 space-y-3">
              {preghiere.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.titolo}</p>
                    <p className="text-xs text-gray-500">{p.categoria}</p>
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
