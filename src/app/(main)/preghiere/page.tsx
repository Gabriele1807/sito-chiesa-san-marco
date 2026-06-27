import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen, Download } from "lucide-react";
import { getPreghiere } from "@/lib/db";
import PreghieraExpand from "@/components/PreghieraExpand";
import SectionVisibilityGate from "@/components/SectionVisibilityGate";
import { isGDriveUrl, toGDrivePreviewUrl } from "@/lib/gdrive";

export const revalidate = 60;

export default async function PreghierePage() {
  const [t, locale, preghiere] = await Promise.all([
    getTranslations("preghiere"),
    getLocale(),
    getPreghiere(),
  ]);

  function localizeCategoria(categoria: string) {
    if (locale !== "ar") return categoria;

    const categoryMap: Record<string, string> = {
      "Preghiere fondamentali": "صلوات أساسية",
      Agpeya: "الأجبية",
      "Preghiere liturgiche": "صلوات ليتورجية",
      "Preghiere mariane": "صلوات مريمية",
      Altro: "متفرقات",
    };

    return categoryMap[categoria] ?? categoria;
  }

  const content = (
    <div className="space-y-8">
      <div>
        <h1 className="mb-3 animate-fade-in-up text-3xl font-bold text-gray-900 sm:text-4xl">{t("titolo")}</h1>
        <p className="max-w-2xl animate-fade-in-up text-gray-600 [animation-delay:100ms]">{t("sottotitolo")}</p>
      </div>

      <section className="space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              {t("sezionePreghiereTitolo")}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {t("sezionePreghiereTitolo")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
              {t("sezionePreghiereDescrizione")}
            </p>
          </div>
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        <div className="grid gap-4">
          {preghiere.map((preghiera, index) => (
            <article
              key={preghiera.id}
              className="card-hover rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                        {localizeCategoria(preghiera.categoria)}
                      </span>
                      <h3 className="mt-1 text-lg font-bold text-gray-900">
                        {preghiera.titolo}
                      </h3>
                      {preghiera.descrizione ? (
                        <p className="mt-1 text-sm text-gray-600">{preghiera.descrizione}</p>
                      ) : null}
                    </div>

                    {preghiera.urlPDF ? (
                      <a
                        href={isGDriveUrl(preghiera.urlPDF) ? toGDrivePreviewUrl(preghiera.urlPDF) : preghiera.urlPDF}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t("scaricaPDF")}
                      </a>
                    ) : null}
                  </div>

                  {preghiera.testoInline ? (
                    <PreghieraExpand testo={preghiera.testoInline} labelRead={t("leggiTesto")} />
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <SectionVisibilityGate sectionId="preghiere" title={t("titolo")}>
      {content}
    </SectionVisibilityGate>
  );
}
