import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen, Download } from "lucide-react";
import { getPreghiere } from "@/lib/db";
import PreghieraExpand from "@/components/PreghieraExpand";
import SectionVisibilityGate from "@/components/SectionVisibilityGate";
import { isGDriveUrl, toGDrivePreviewUrl } from "@/lib/gdrive";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("preghiere", "titolo", "sottotitolo", "/preghiere");
}

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
        <p className="eyebrow mb-2 animate-fade-in-up">{t("titolo")}</p>
        <h1 className="mb-3 animate-fade-in-up font-display text-3xl text-foreground sm:text-4xl">{t("titolo")}</h1>
        <p className="max-w-2xl animate-fade-in-up text-foreground/60 [animation-delay:100ms]">{t("sottotitolo")}</p>
      </div>

      <section className="space-y-5">
        <div className="max-w-2xl border-l-2 border-accent/30 pl-4">
          <h2 className="font-display text-2xl text-foreground">
            {t("sezionePreghiereTitolo")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">
            {t("sezionePreghiereDescrizione")}
          </p>
        </div>

        <div className="grid gap-4">
          {preghiere.map((preghiera, index) => {
            const isSquareIcon = index % 2 === 0;
            return (
            <article
              key={preghiera.id}
              className="card-hover rounded-xl border border-border/70 bg-surface p-6 shadow-sm"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={
                    isSquareIcon
                      ? "flex h-12 w-12 shrink-0 items-center justify-center border border-primary/30 text-primary"
                      : "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                  }
                >
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="badge-tag">
                        {localizeCategoria(preghiera.categoria)}
                      </span>
                      <h3 className="mt-1 font-display text-lg text-foreground">
                        {preghiera.titolo}
                      </h3>
                      {preghiera.descrizione ? (
                        <p className="mt-1 text-sm text-foreground/60">{preghiera.descrizione}</p>
                      ) : null}
                    </div>

                    {preghiera.urlPDF ? (
                      <a
                        href={isGDriveUrl(preghiera.urlPDF) ? toGDrivePreviewUrl(preghiera.urlPDF) : preghiera.urlPDF}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
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
            );
          })}

          {preghiere.length === 0 && (
            <div className="empty-state">{t("statoVuoto")}</div>
          )}
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
