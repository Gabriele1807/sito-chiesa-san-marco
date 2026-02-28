import { getTranslations } from "next-intl/server";
import { getPreghiere } from "@/lib/db";
import { FileText, Download, BookOpen } from "lucide-react";
import PreghieraExpand from "@/components/PreghieraExpand";

export const dynamic = "force-dynamic";

export default async function PreghierePage() {
  const t = await getTranslations("preghiere");
  const preghiere = await getPreghiere();

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

      <div className="grid gap-4">
        {preghiere.map((preghiera) => (
          <div
            key={preghiera.id}
            className="card-hover bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                      {preghiera.categoria}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">
                      {preghiera.titolo}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {preghiera.descrizione}
                    </p>
                  </div>
                  {preghiera.urlPDF && (
                    <a
                      href={preghiera.urlPDF}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary
                                 text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </a>
                  )}
                </div>

                {preghiera.testoInline && (
                  <PreghieraExpand
                    testo={preghiera.testoInline}
                    labelRead={t("leggiTesto")}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
