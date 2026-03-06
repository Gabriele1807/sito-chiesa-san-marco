import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getTestiSacri } from "@/lib/db";
import { BookOpen, ArrowRight } from "lucide-react";
import { toGDriveImageUrl } from "@/lib/gdrive";

export const dynamic = "force-dynamic";

export default async function LibreriaPage() {
  const t = await getTranslations("libreria");
  const testi = await getTestiSacri();

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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {testi.map((testo) => (
          <Link key={testo.id} href={`/libreria/${testo.slug}`} className="group">
            <div className="card-hover bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 h-full flex flex-col">
              <div className="h-44 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden">
                {testo.copertina ? (
                  <img
                    src={toGDriveImageUrl(testo.copertina)}
                    alt={testo.titolo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="w-12 h-12 text-primary/30" />
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  {testo.tipo}
                </span>
                {/* FIX [21] — Title gray-900 at rest, amber-600 on hover only */}
                <h3 className="font-bold text-gray-900 mt-1 group-hover:text-amber-600 transition-colors">
                  {testo.titolo}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{testo.autore}</p>
                <p className="text-sm text-gray-600 mt-2 line-clamp-3 flex-1">
                  {testo.descrizione}
                </p>
                {/* FIX [21] — Link text amber-600 on hover */}
                <div className="flex items-center gap-1 text-gray-500 font-medium text-sm mt-3 group-hover:text-amber-600 transition-colors">
                  {t("leggiOnline")}
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
