import { getTranslations } from "next-intl/server";
import { getOrari } from "@/lib/db";
import { Clock, CalendarDays, Sparkles } from "lucide-react";
import NextCelebrationCard from "@/components/NextCelebrationCard";

export const revalidate = 60;

export default async function OrariPage() {
  const [t, orari] = await Promise.all([getTranslations("orari"), getOrari()]);

  const totalCelebrazioni = orari.reduce((count, giorno) => count + giorno.celebrazioni.length, 0);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
          <Clock className="w-3.5 h-3.5" />
          Orari settimanali
        </div>
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 animate-fade-in-up">
            {t("titolo")}
          </h1>
          <p className="text-gray-600 leading-relaxed animate-fade-in-up [animation-delay:100ms]">
            {t("sottotitolo")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 animate-fade-in-up [animation-delay:150ms]">
          <div className="rounded-2xl border border-gold/15 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{orari.length}</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Giorni attivi</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gold/15 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{totalCelebrazioni}</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Celebrazioni</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gold/15 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">Live</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Aggiornamento ogni minuto</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
        <div className="rounded-3xl border border-gold/15 bg-white shadow-sm overflow-hidden animate-fade-in-up [animation-delay:200ms]">
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 bg-surface-alt/70">
            <div>
              <h2 className="text-base font-bold text-gray-900">Calendario settimanale</h2>
              <p className="text-sm text-gray-500">Tutti gli orari della liturgia disponibili in settimana</p>
            </div>
          </div>

          <div className="hidden sm:block overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="text-left px-6 py-4 text-sm font-semibold">{t("giorno")}</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">{t("celebrazione")}</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">{t("orario")}</th>
                  <th className="hidden md:table-cell text-left px-6 py-4 text-sm font-semibold">{t("note")}</th>
                </tr>
              </thead>
              <tbody>
                {orari.map((giorno, gi) =>
                  giorno.celebrazioni.map((cel, ci) => (
                    <tr
                      key={`${gi}-${ci}`}
                      className={`border-b border-gray-50 ${gi % 2 === 0 ? "bg-gray-50/50" : "bg-white"} hover:bg-primary/5 transition-colors`}
                    >
                      {ci === 0 && (
                        <td
                          rowSpan={giorno.celebrazioni.length}
                          className="px-6 py-3 font-semibold text-gray-900 align-top"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-accent" />
                            {giorno.giorno}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-3 text-sm text-gray-700">{cel.tipo}</td>
                      <td className="px-6 py-3 text-sm font-medium text-primary">{cel.orario}</td>
                      <td className="hidden md:table-cell px-6 py-3 text-sm text-gray-500">{cel.note || "–"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden space-y-4 p-4">
            {orari.map((giorno, gi) => (
              <div key={gi} className="animate-fade-in-up bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ animationDelay: `${gi * 80}ms` }}>
                <div className="bg-primary px-4 py-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold text-white text-sm">{giorno.giorno}</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {giorno.celebrazioni.map((cel, ci) => (
                    <div key={ci} className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{cel.tipo}</p>
                      <p className="text-primary font-semibold text-sm mt-0.5">{cel.orario}</p>
                      {cel.note && <p className="text-xs text-gray-500 mt-0.5">{cel.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 animate-fade-in-up [animation-delay:250ms]">
          <NextCelebrationCard orari={orari} title="Prossima celebrazione" />
          <div className="rounded-3xl border border-gold/15 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-2">Come leggere gli orari</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Gli orari sono aggiornati settimanalmente. Se un giorno contiene più celebrazioni, le trovi raggruppate sotto lo stesso giorno con eventuali note in evidenza.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-3 w-3 rounded-full bg-primary flex-shrink-0" />
                <span className="text-xs font-medium text-gray-600">Orario della celebrazione</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-3 w-3 rounded-full bg-accent flex-shrink-0" />
                <span className="text-xs font-medium text-gray-600">Elemento evidenziato</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
