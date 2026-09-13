import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExternalLink, PlayCircle } from "lucide-react";
import { getVideoCorsi } from "@/lib/db";
import SectionVisibilityGate from "@/components/SectionVisibilityGate";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("preghiere", "sezioneVideoTitolo", "sezioneVideoDescrizione", "/video-corsi");
}

export default async function VideoCorsiPage() {
  const [t, videoCorsi] = await Promise.all([
    getTranslations("preghiere"),
    getVideoCorsi(),
  ]);

  return (
    <SectionVisibilityGate sectionId="video-corsi" title={t("sezioneVideoTitolo")}>
      <div className="space-y-8">
        <div>
          <p className="eyebrow mb-2">{t("sezioneVideoTitolo")}</p>
          <h1 className="mb-3 font-display text-3xl text-foreground sm:text-4xl">
            {t("sezioneVideoTitolo")}
          </h1>
          <p className="max-w-2xl text-foreground/60">
            {t("sezioneVideoDescrizione")}
          </p>
        </div>

        <section className="space-y-5">
          <div className="max-w-2xl border-l-2 border-accent/30 pl-4">
            <h2 className="font-display text-2xl text-foreground">
              {t("sezioneVideoTitolo")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              {t("videoIntro")}
            </p>
          </div>

          {videoCorsi.length === 0 && (
            <div className="empty-state">{t("sezioneVideoStatoVuoto")}</div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {videoCorsi.map((video, index) => (
              <a
                key={video.id}
                href={video.urlVideo}
                target="_blank"
                rel="noopener noreferrer"
                className={`group overflow-hidden rounded-xl border bg-surface-alt/40 shadow-sm transition-colors hover:bg-surface-alt/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
                  index === 0 ? "border-accent/40" : "border-border/70"
                }`}
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

                <div className="space-y-2 bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="badge-tag">
                      {video.categoria}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground/60 transition-colors group-hover:text-accent">
                      {t("videoApri")}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <h3 className="font-display text-base text-foreground transition-colors group-hover:text-primary">
                    {video.titolo}
                  </h3>
                  {video.descrizione ? (
                    <p className="text-sm leading-relaxed text-foreground/70">
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
