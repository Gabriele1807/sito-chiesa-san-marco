import { getTranslations } from "next-intl/server";
import { ExternalLink, PlayCircle, Youtube } from "lucide-react";
import { getVideoCorsi } from "@/lib/db";
import SectionVisibilityGate from "@/components/SectionVisibilityGate";

export const revalidate = 60;

export default async function VideoCorsiPage() {
  const [t, videoCorsi] = await Promise.all([
    getTranslations("preghiere"),
    getVideoCorsi(),
  ]);

  return (
    <SectionVisibilityGate sectionId="video-corsi" title={t("sezioneVideoTitolo")}>
      <div className="space-y-8">
        <div>
          <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">
            {t("sezioneVideoTitolo")}
          </h1>
          <p className="max-w-2xl text-gray-600">
            {t("sezioneVideoDescrizione")}
          </p>
        </div>

        <section className="space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                {t("sezioneVideoTitolo")}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {t("sezioneVideoTitolo")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {t("videoIntro")}
              </p>
            </div>
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent sm:flex">
              <Youtube className="h-5 w-5" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {videoCorsi.map((video) => (
              <a
                key={video.id}
                href={video.urlVideo}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-xl border border-gray-100 bg-gray-50 shadow-sm transition-colors hover:bg-gray-100"
              >
                <div className="relative aspect-video bg-gradient-to-br from-[#0f1a2e] via-[#15213b] to-[#c95d00]">
                  {video.thumbnail ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${video.thumbnail})` }}
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-accent shadow-lg transition-transform group-hover:scale-105">
                      <PlayCircle className="h-7 w-7" fill="currentColor" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                      {video.categoria}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors group-hover:text-accent">
                      {t("videoApri")}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 transition-colors group-hover:text-primary">
                    {video.titolo}
                  </h3>
                  {video.descrizione ? (
                    <p className="text-sm leading-relaxed text-gray-600">
                      {video.descrizione}
                    </p>
                  ) : null}
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </SectionVisibilityGate>
  );
}
