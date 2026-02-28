import { getTranslations } from "next-intl/server";
import { getOrari } from "@/lib/db";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrariPage() {
  const t = await getTranslations("orari");
  const orari = await getOrari();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          {t("titolo")}
        </h1>
        <p className="text-gray-600 leading-relaxed max-w-2xl">
          {t("sottotitolo")}
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-primary text-white">
              <th className="text-left px-6 py-4 text-sm font-semibold">{t("giorno")}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold">{t("celebrazione")}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold">{t("orario")}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold">{t("note")}</th>
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
                  <td className="px-6 py-3 text-sm text-gray-500">{cel.note || "–"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-4">
        {orari.map((giorno, gi) => (
          <div key={gi} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
  );
}
