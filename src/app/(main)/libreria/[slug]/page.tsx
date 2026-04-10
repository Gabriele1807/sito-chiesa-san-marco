import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getTestoSacroBySlug, getIcone } from "@/lib/db";
import { BookOpen, Download, User, FileText } from "lucide-react";
import { toGDriveImageUrl, toGDrivePreviewUrl, toGDriveDownloadUrl, isGDriveUrl } from "@/lib/gdrive";
import BackLink from "@/components/BackLink";
import RelatedResourceCard from "@/components/RelatedResourceCard";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function TestoSacroDetailPage({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations("libreria");
  const testo = await getTestoSacroBySlug(slug);

  if (!testo) notFound();

  const allIcone = await getIcone();
  const iconeCorrelate = allIcone.filter((i) => testo.iconeCorrelate.includes(i.id));

  return (
    <div className="space-y-10">
      {/* FIX [22] — Back navigation link */}
      <BackLink href="/libreria" label={t("tornaLibreria")} />

      {/* Header */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="w-full md:w-56 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
            {testo.copertina ? (
              <img
                src={toGDriveImageUrl(testo.copertina)}
                alt={testo.titolo}
                className="w-full h-full object-cover"
              />
            ) : (
              <BookOpen className="w-16 h-16 text-primary/30" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                {testo.tipo}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">{testo.titolo}</h1>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{t("autore")}: {testo.autore}</span>
            </div>

            <p className="text-gray-600 leading-relaxed">{testo.descrizione}</p>

            <div className="flex flex-wrap gap-3 pt-2">
              {testo.urlPDF && (
                <>
                  <a
                    href={isGDriveUrl(testo.urlPDF) ? toGDrivePreviewUrl(testo.urlPDF) : testo.urlPDF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white
                               font-semibold rounded-lg btn-hover"
                  >
                    <FileText className="w-4 h-4" />
                    {t("leggiOnline")}
                  </a>
                  <a
                    href={isGDriveUrl(testo.urlPDF) ? toGDriveDownloadUrl(testo.urlPDF) : testo.urlPDF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary
                               font-semibold rounded-lg border border-primary/20 btn-hover"
                  >
                    <Download className="w-4 h-4" />
                    {t("scaricaPDF")}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      {testo.urlPDF && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-900 px-6 py-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">PDF Viewer</span>
          </div>
          <div className="aspect-[3/4] max-h-[700px]">
            <iframe
              src={isGDriveUrl(testo.urlPDF) ? toGDrivePreviewUrl(testo.urlPDF) : testo.urlPDF}
              className="w-full h-full border-0"
              allow="autoplay"
              title={testo.titolo}
            />
          </div>
        </section>
      )}

      {/* Related icons */}
      {iconeCorrelate.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("iconeCorrelate")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {iconeCorrelate.map((icona) => (
              <RelatedResourceCard
                key={icona.id}
                href={`/icone/${icona.slug}`}
                tag="Icona"
                tagColor="accent"
                title={icona.nomeSanto}
                subtitle={icona.posizione}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
