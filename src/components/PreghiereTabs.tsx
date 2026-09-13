"use client";

import { useState } from "react";
import { Download, BookOpen, PlayCircle, Youtube, ExternalLink } from "lucide-react";
import PreghieraExpand from "@/components/PreghieraExpand";
import { toGDrivePreviewUrl, isGDriveUrl } from "@/lib/gdrive";

interface Preghiera {
  id: string;
  categoria: string;
  titolo: string;
  descrizione?: string;
  urlPDF?: string | null;
  testoInline?: string | null;
}

interface Video {
  id: string;
  categoria?: string;
  titolo: string;
  descrizione?: string;
  thumbnail?: string | null;
  urlVideo: string;
}

interface Props {
  preghiere: Preghiera[];
  videoCorsi: Video[];
  texts: Record<string, string>;
}

export default function PreghiereTabs({ preghiere, videoCorsi, texts }: Props) {
  const [tab, setTab] = useState<"preghiere" | "video">("preghiere");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3" role="tablist" aria-label="Sezioni">
          <button
            role="tab"
            aria-selected={tab === "preghiere"}
            onClick={() => setTab("preghiere")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold ${
              tab === "preghiere" ? "bg-primary text-white shadow" : "bg-surface-2 text-foreground/80 hover:bg-surface-2"
            }`}
          >
            {texts.sezionePreghiereTitolo}
          </button>

          <button
            role="tab"
            aria-selected={tab === "video"}
            onClick={() => setTab("video")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold ${
              tab === "video" ? "bg-accent text-white shadow" : "bg-surface-2 text-foreground/80 hover:bg-surface-2"
            }`}
          >
            {texts.sezioneVideoTitolo}
          </button>
        </div>

        <div className="text-sm text-foreground/60">{tab === "preghiere" ? texts.sezionePreghiereDescrizione : texts.sezioneVideoDescrizione}</div>
      </div>

      <div>
        {tab === "preghiere" && (
          <section className="bg-surface rounded-xl shadow-sm border border-border p-6 sm:p-7 space-y-5 animate-fade-in-up">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                  {texts.sezionePreghiereTitolo}
                </p>
                <h2 className="text-2xl font-bold text-foreground mt-2">{texts.sezionePreghiereTitolo}</h2>
                <p className="text-sm text-foreground/70 mt-2 max-w-2xl leading-relaxed">{texts.sezionePreghiereDescrizione}</p>
              </div>
              <div className="hidden sm:flex w-12 h-12 rounded-xl bg-primary/10 items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
            </div>

            <div className="grid gap-4">
              {preghiere.map((preghiera, index) => (
                <article
                  key={preghiera.id}
                  className="animate-fade-in-up card-hover bg-surface rounded-xl p-6 shadow-sm border border-border"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-xs font-semibold text-accent uppercase tracking-wider">{preghiera.categoria}</span>
                          <h3 className="text-lg font-bold text-foreground mt-1">{preghiera.titolo}</h3>
                          {preghiera.descrizione ? <p className="text-sm text-foreground/70 mt-1">{preghiera.descrizione}</p> : null}
                        </div>

                        {preghiera.urlPDF && (
                          <a
                            href={isGDriveUrl(preghiera.urlPDF) ? toGDrivePreviewUrl(preghiera.urlPDF) : preghiera.urlPDF}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                          >
                            <Download className="w-3.5 h-3.5" />
                            PDF
                          </a>
                        )}
                      </div>

                      {preghiera.testoInline && (
                        <PreghieraExpand testo={preghiera.testoInline} labelRead={texts.leggiTesto} />
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "video" && (
          <section className="bg-surface rounded-xl shadow-sm border border-border p-6 sm:p-7 space-y-5 animate-fade-in-up">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{texts.sezioneVideoTitolo}</p>
                <h2 className="text-2xl font-bold text-foreground mt-2">{texts.sezioneVideoTitolo}</h2>
                <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{texts.sezioneVideoDescrizione}</p>
              </div>
              <div className="hidden sm:flex w-12 h-12 rounded-xl bg-accent/10 items-center justify-center shrink-0">
                <Youtube className="w-5 h-5 text-accent" />
              </div>
            </div>

            <p className="text-sm text-foreground/60 leading-relaxed">{texts.videoIntro}</p>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {videoCorsi.map((video, index) => (
                <a
                  key={video.id}
                  href={video.urlVideo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-xl border border-border bg-surface-2/50 hover:bg-surface-2 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
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
                    <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-surface/95 text-accent shadow-lg group-hover:scale-105 transition-transform">
                      <PlayCircle className="w-7 h-7" fill="currentColor" />
                    </div>
                  </div>

                  <div className="p-4 space-y-2 bg-surface">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-accent">{video.categoria}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground/60 group-hover:text-accent transition-colors">
                        {texts.videoApri}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{video.titolo}</h3>
                    {video.descrizione ? <p className="text-sm text-foreground/70 leading-relaxed">{video.descrizione}</p> : null}
                  </div>
                </a>
              ))}
            </div>

            <a
              href="#"
              className="inline-flex items-center gap-2 rounded text-sm font-semibold text-accent hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              onClick={(e) => {
                // default to YouTube channel link coming from texts if provided
                if (texts.youtubeChannel) {
                  window.open(texts.youtubeChannel, "_blank", "noopener,noreferrer");
                }
                e.preventDefault();
              }}
            >
              <Youtube className="w-4 h-4" />
              {texts.videoApriCanale}
            </a>
          </section>
        )}
      </div>
    </div>
  );
}
