import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getTestiSacri } from "@/lib/db";
import { BookOpen, ArrowRight } from "lucide-react";
import { toGDriveImageUrl } from "@/lib/gdrive";
import SectionVisibilityGate from "@/components/SectionVisibilityGate";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("libreria", "titolo", "sottotitolo", "/libreria");
}

export default async function LibreriaPage() {
  const [t, testi] = await Promise.all([getTranslations("libreria"), getTestiSacri()]);

  const content = (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-2 animate-fade-in-up">{t("titolo")}</p>
        <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-3 animate-fade-in-up">
          {t("titolo")}
        </h1>
        <p className="text-foreground/60 leading-relaxed max-w-2xl animate-fade-in-up [animation-delay:100ms]">
          {t("sottotitolo")}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {testi.map((testo, index) => (
          <Link key={testo.id} href={`/libreria/${testo.slug}`} className="group animate-fade-in-up block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2" style={{ animationDelay: `${index * 60}ms` }}>
            <div className="card-hover bg-surface rounded-xl overflow-hidden shadow-sm border border-border/70 h-full flex flex-col">
              <div className="h-44 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden">
                {testo.copertina ? (
                  <img
                    src={toGDriveImageUrl(testo.copertina)}
                    alt={testo.titolo}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <BookOpen className="w-12 h-12 text-primary/30" />
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  {testo.tipo}
                </span>
                <h3 className="font-display text-lg text-foreground mt-1 group-hover:text-gold transition-colors">
                  {testo.titolo}
                </h3>
                <p className="text-sm text-foreground/60 mt-1">{testo.autore}</p>
                <p className="text-sm text-foreground/70 mt-2 line-clamp-3 flex-1">
                  {testo.descrizione}
                </p>
                <div className="flex items-center gap-1 text-foreground/60 font-medium text-sm mt-3 group-hover:text-gold transition-colors">
                  {t("leggiOnline")}
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {testi.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-foreground/60">
          Nessun contenuto disponibile al momento.
        </div>
      )}
    </div>
  );

  return (
    <SectionVisibilityGate sectionId="libreria" title={t("titolo")}>
      {content}
    </SectionVisibilityGate>
  );
}
