import { getTranslations } from "next-intl/server";
import { getPreghiere, getVideoCorsi } from "@/lib/db";
import { Download, BookOpen, ExternalLink, PlayCircle, Youtube } from "lucide-react";
import PreghieraExpand from "@/components/PreghieraExpand";
import { toGDrivePreviewUrl, isGDriveUrl } from "@/lib/gdrive";

export const revalidate = 60;

const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@SanMarco-Milano/videos";

export default async function PreghierePage() {
  const [t, preghiere, videoCorsi] = await Promise.all([
    getTranslations("preghiere"),
    getPreghiere(),
    getVideoCorsi(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 animate-fade-in-up">
          {t("titolo")}
        </h1>
        <p className="text-gray-600 leading-relaxed max-w-2xl animate-fade-in-up [animation-delay:100ms]">
          {t("sottotitolo")}
        </p>
      </div>

      {/* Due sezioni visibili: la raccolta attuale resta server-rendered, mentre i video mock hanno una colonna dedicata per separare chiaramente i contenuti. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)] items-start">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-7 space-y-5 animate-fade-in-up">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                {t("sezionePreghiereTitolo")}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-2">
                {t("sezionePreghiereTitolo")}
              </h2>
              <p className="text-sm text-gray-600 mt-2 max-w-2xl leading-relaxed">
                {t("sezionePreghiereDescrizione")}
              </p>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-primary/10 items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="grid gap-4">
            {preghiere.map((preghiera, index) => (
              <div
                key={preghiera.id}
                className="animate-fade-in-up card-hover bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                style={{ animationDelay: `${index * 60}ms` }}
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
                          href={isGDriveUrl(preghiera.urlPDF) ? toGDrivePreviewUrl(preghiera.urlPDF) : preghiera.urlPDF}
                          target="_blank"
                          rel="noopener noreferrer"
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
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-7 space-y-5 animate-fade-in-up [animation-delay:120ms]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                {t("sezioneVideoTitolo")}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-2">
                {t("sezioneVideoTitolo")}
              </h2>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                {t("sezioneVideoDescrizione")}
              </p>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-accent/10 items-center justify-center shrink-0">
              <Youtube className="w-5 h-5 text-accent" />
            </div>
          </div>

          <p className="text-sm text-gray-500 leading-relaxed">
            {t("videoIntro")}
          </p>

          <div className="space-y-4">
            {videoCorsi.map((video, index) => (
              <a
                key={video.id}
                href={video.urlVideo}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm"
                style={{ animationDelay: `${140 + index * 60}ms` }}
              >
                <div className="aspect-video bg-gradient-to-br from-[#0f1a2e] via-[#15213b] to-[#c95d00] relative flex items-center justify-center">
                  {video.thumbnail ? (
                    <div
                      className="absolute inset-0 bg-center bg-cover"
                      style={{ backgroundImage: `url(${video.thumbnail})` }}
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-white/95 text-accent shadow-lg group-hover:scale-105 transition-transform">
                    <PlayCircle className="w-7 h-7" fill="currentColor" />
                  </div>
                </div>

                <div className="p-4 space-y-2 bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                      {video.categoria}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 group-hover:text-accent transition-colors">
                      {t("videoApri")}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors">
                    {video.titolo}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {video.descrizione}
                  </p>
                </div>
              </a>
            ))}
          </div>

          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-primary transition-colors"
          >
            <Youtube className="w-4 h-4" />
            {t("videoApriCanale")}
          </a>
        </section>
      </div>
    </div>
  );
}
