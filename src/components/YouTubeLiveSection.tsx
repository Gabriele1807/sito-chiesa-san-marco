/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Youtube, Play, Bell } from "lucide-react";

const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@SanMarco-Milano";

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

interface YouTubeData {
  channel: {
    id: string;
    title: string;
    thumbnail: string;
    subscriberCount: string;
    videoCount: string;
  };
  latestVideo: YouTubeVideo | null;
  isLive: boolean;
  liveVideo: YouTubeVideo | null;
  upcoming: YouTubeVideo[];
}

/**
 * Sezione YouTube della home.
 *
 * - Il lettore YouTube si carica solo quando si tocca l'anteprima: prima
 *   l'iframe partiva a ogni apertura della home (peso su telefono).
 * - Senza dati dall'API (chiave assente o errore) niente contenuti inventati:
 *   al posto del video un invito ad aprire il canale, niente statistiche.
 * - Impaginazione decisa dalla larghezza della sezione (container query):
 *   testo e video affiancati solo da @4xl, così a 1024px non si schiacciano.
 */
export default function YouTubeLiveSection() {
  const t = useTranslations("contatti");
  const locale = useLocale();
  const numberLocale = locale === "ar" ? "ar-EG" : "it-IT";
  const [data, setData] = useState<YouTubeData | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/youtube/channel");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch {
      // Nessun dato: resta l'invito ad aprire il canale.
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const isLive = Boolean(data?.isLive && data.liveVideo);
  const video = isLive ? data!.liveVideo : (data?.latestVideo ?? null);
  const playing = video !== null && playingId === video.id;
  const thumbnail = video
    ? video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
    : null;
  const published =
    video && !isLive && video.publishedAt
      ? new Date(video.publishedAt).toLocaleDateString(numberLocale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  const formatNumber = (value: string) => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString(numberLocale) : value;
  };

  const actions = (
    <div className="flex flex-wrap gap-3">
      <a
        href={YOUTUBE_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-visible:ring-gold focus-visible:ring-offset-primary inline-flex min-h-11 flex-1 basis-40 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-lg transition-colors hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Bell className="h-4 w-4" aria-hidden />
        {t("youtubeIscriviti")}
      </a>
      <a
        href={`${YOUTUBE_CHANNEL_URL}/videos`}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-visible:ring-gold focus-visible:ring-offset-primary inline-flex min-h-11 flex-1 basis-40 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Play className="h-4 w-4" aria-hidden />
        {t("youtubeGuardaTutti")}
      </a>
    </div>
  );

  return (
    <section aria-labelledby="youtube-title" className="@container">
      <div className="bg-primary max-w-full min-w-0 overflow-hidden rounded-3xl shadow-xl">
        <div className="grid gap-6 p-5 sm:p-6 @4xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] @4xl:gap-10 @4xl:p-8">
          {/* Video: anteprima, il lettore parte al tocco */}
          <div className="min-w-0 @4xl:order-2">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              <div className="relative aspect-video">
                {video && playing ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0&autoplay=1`}
                    title={video.title}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : video ? (
                  <button
                    type="button"
                    onClick={() => setPlayingId(video.id)}
                    className="group focus-visible:ring-gold absolute inset-0 h-full w-full focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                    aria-label={`${t("youtubePlay")}: ${video.title}`}
                  >
                    {thumbnail && (
                      <img
                        src={thumbnail}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    )}
                    <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/15" />
                    <span className="absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 shadow-lg transition-transform group-hover:scale-105">
                      <Play className="h-7 w-7 translate-x-0.5 fill-white text-white" aria-hidden />
                    </span>
                    {isLive && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                        {t("youtubeLiveOra")}
                      </span>
                    )}
                  </button>
                ) : (
                  <a
                    href={YOUTUBE_CHANNEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-visible:ring-gold absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-white/10 to-transparent px-6 text-center transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600">
                      <Youtube className="h-8 w-8 text-white" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {t("youtubeVaiAlCanale")}
                    </span>
                  </a>
                )}
              </div>

              {video && (
                <div className="border-t border-white/10 px-4 py-3 sm:px-5">
                  <p className="text-xs font-semibold text-red-400">
                    {isLive ? t("youtubeLiveLabel") : t("youtubeRecenteLabel")}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-white" dir="auto">
                    {video.title}
                  </p>
                  {published && <p className="mt-0.5 text-xs text-white/55">{published}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Testo, canale, azioni */}
          <div className="flex min-w-0 flex-col gap-5 @4xl:order-1 @4xl:justify-center">
            <div>
              <h2
                id="youtube-title"
                className="font-display flex items-center gap-3 text-2xl leading-tight text-white sm:text-3xl"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600">
                  <Youtube className="h-5 w-5 text-white" aria-hidden />
                </span>
                {t("youtubeSezione")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
                {t("youtubeDesc")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{t("youtubeStreaming")}</p>
            </div>

            {data && (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                {data.channel.thumbnail ? (
                  <img
                    src={data.channel.thumbnail}
                    alt=""
                    loading="lazy"
                    className="h-11 w-11 shrink-0 rounded-full"
                  />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-600">
                    <Youtube className="h-5 w-5 text-white" aria-hidden />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{data.channel.title}</p>
                  <p className="truncate text-xs text-white/55">
                    {t("youtubeIscrittiCount", {
                      count: formatNumber(data.channel.subscriberCount),
                    })}
                    {" · "}
                    {t("youtubeVideoCount", { count: formatNumber(data.channel.videoCount) })}
                  </p>
                </div>
              </div>
            )}

            {actions}
          </div>
        </div>
      </div>
    </section>
  );
}
