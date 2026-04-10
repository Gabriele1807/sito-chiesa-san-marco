import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getIconaBySlug, getIcone, getTestiSacri } from "@/lib/db";
import { MapPin, Palette, User, CalendarDays } from "lucide-react";
import IconaQRSection from "@/components/IconaQRSection";
import BackLink from "@/components/BackLink";
import RelatedResourceCard from "@/components/RelatedResourceCard";
import { toGDriveImageUrl } from "@/lib/gdrive";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function IconaDetailPage({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations("icone");
  const icona = await getIconaBySlug(slug);

  if (!icona) notFound();

  const testiSacri = await getTestiSacri();
  const tCorrelati = testiSacri.filter((ts) => icona.testiCorrelati.includes(ts.id));

  const allIcone = await getIcone();
  const iconeCorrelate = allIcone.filter((i) => icona.iconeCorrelate.includes(i.id));

  return (
    <div className="space-y-12">
      {/* FIX [22] — Back navigation link */}
      <BackLink href="/icone" label={t("tornaGalleria")} />

      {/* Top section: 2 columns */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Image */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl aspect-square flex items-center justify-center overflow-hidden">
          {icona.immagini?.[0] ? (
            <img
              src={toGDriveImageUrl(icona.immagini[0])}
              alt={icona.nomeSanto}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-8xl opacity-30">🖼️</span>
          )}
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              {icona.categoria}
            </span>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">
              {icona.nomeSanto}
            </h1>
            {/* FIX [17] — Removed redundant subtitle "Icona di [nome]", position already shown below */}
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t("posizione")}: {icona.posizione}</span>
          </div>

          <p className="text-gray-600 leading-relaxed">
            {icona.descrizione}
          </p>

          {/* QR Code section */}
          <IconaQRSection slug={icona.slug} />
        </div>
      </div>

      {/* Story section */}
      <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {t("storiaSanto")}
        </h2>
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
          {icona.descrizioneEstesa}
        </p>
      </section>

      {/* Technical details */}
      <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t("dettagliTecnici")}
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{t("tecnica")}</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{icona.tecnica}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{t("autore")}</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{icona.autore}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{t("anno")}</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{icona.anno}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Related resources */}
      {(tCorrelati.length > 0 || iconeCorrelate.length > 0) && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t("risorseCollegate")}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tCorrelati.map((testo) => (
              <RelatedResourceCard
                key={testo.id}
                href={`/libreria/${testo.slug}`}
                tag={testo.tipo}
                tagColor="primary"
                title={testo.titolo}
                subtitle={testo.descrizione}
              />
            ))}
            {iconeCorrelate.map((ic) => (
              <RelatedResourceCard
                key={ic.id}
                href={`/icone/${ic.slug}`}
                tag="Icona"
                tagColor="accent"
                title={ic.nomeSanto}
                subtitle={ic.posizione}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
