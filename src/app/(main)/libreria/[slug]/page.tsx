import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getTestoSacroBySlug, getIcone } from "@/lib/db";
import { BookOpen, Download, User, FileText } from "lucide-react";

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
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover placeholder */}
          <div className="w-full md:w-56 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="w-16 h-16 text-primary/30" />
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
              <a
                href={testo.urlPDF}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white
                           font-semibold rounded-lg btn-hover"
              >
                <FileText className="w-4 h-4" />
                {t("leggiOnline")}
              </a>
              <a
                href={testo.urlPDF}
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary
                           font-semibold rounded-lg border border-primary/20 btn-hover"
              >
                <Download className="w-4 h-4" />
                {t("scaricaPDF")}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer placeholder */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 px-6 py-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">PDF Viewer</span>
        </div>
        <div className="aspect-[3/4] max-h-[600px] bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Il viewer PDF verrà integrato qui.
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {testo.urlPDF}
            </p>
          </div>
        </div>
      </section>

      {/* Related icons */}
      {iconeCorrelate.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("iconeCorrelate")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {iconeCorrelate.map((icona) => (
              <Link key={icona.id} href={`/icone/${icona.slug}`} className="group">
                <div className="card-hover bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                    Icona
                  </span>
                  <h4 className="font-bold text-gray-900 mt-1 group-hover:text-primary transition-colors">
                    {icona.nomeSanto}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">{icona.posizione}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
