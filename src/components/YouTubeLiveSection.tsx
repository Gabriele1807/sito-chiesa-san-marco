/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Youtube,
  ExternalLink,
  Play,
  Bell,
  Video,
  Cross,
  Radio,
  Calendar,
} from "lucide-react";

const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@SanMarco-Milano";
const YOUTUBE_CHANNEL_ID = "UC-dfc8zOfM7eBPMB7kvXkug";

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

function formatCount(count: string): string {
  const n = parseInt(count, 10);
  if (isNaN(n)) return count;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
  return count;
}

export default function YouTubeLiveSection() {
  const t = useTranslations("contatti");
  const [data, setData] = useState<YouTubeData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/youtube/channel");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch {
      // Silently fail, show static fallback
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const featuredVideo =
    data?.isLive && data.liveVideo ? data.liveVideo : data?.latestVideo;
  const channelId = data?.channel.id || YOUTUBE_CHANNEL_ID;

  const videoUrl = featuredVideo
    ? `https://www.youtube.com/watch?v=${featuredVideo.id}`
    : YOUTUBE_CHANNEL_URL;
  const embedUrl = featuredVideo
    ? `https://www.youtube.com/embed/${featuredVideo.id}?rel=0`
    : `https://www.youtube.com/embed/live_stream?channel=${channelId}&rel=0`;

  return (
    <section>
      <div className="overflow-hidden rounded-[1.5rem] bg-primary shadow-2xl sm:rounded-2xl">
        {/* Top bar decorativo */}
        <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />

        <div className="p-5 sm:p-8 lg:p-12">
          <div className="flex flex-col items-start gap-6 sm:gap-8 lg:flex-row lg:gap-14">
            {/* ── Colonna sinistra: brand + testo + CTA ── */}
            <div className="flex-1 min-w-0">
              {/* YouTube badge + live indicator */}
              <div className="mb-4 flex flex-wrap items-center gap-2.5 sm:mb-6 sm:gap-3">
                <div className="inline-flex items-center gap-2.5 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  <Youtube className="w-4.5 h-4.5" />
                  YouTube
                </div>
                {data?.isLive && (
                  <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/40 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse">
                    <Radio className="w-3.5 h-3.5" />
                    LIVE
                  </div>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-snug">
                {t("youtubeSezione")}
              </h2>

              <p className="mb-2 text-gray-300 leading-relaxed sm:mb-3">
                {t("youtubeDesc")}
              </p>
              <p className="mb-5 text-sm leading-relaxed text-gray-400 sm:mb-6">
                {t("youtubeStreaming")}
              </p>

              {/* Quando trasmettiamo */}
              <div className="mb-5 flex flex-wrap gap-2.5 sm:mb-6 sm:gap-3">
                {(["youtubeDomenica", "youtubeFeste", "youtubeGiovedì"] as const).map(
                  (key) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10"
                    >
                      <Video className="w-3.5 h-3.5 text-red-400" />
                      {t(key)}
                    </span>
                  )
                )}
              </div>

              {/* Statistiche canale */}
              <div className="mb-5 flex flex-wrap items-center gap-4 sm:mb-6 sm:gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {data ? formatCount(data.channel.subscriberCount) : "—"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t("youtubeIscritti")}
                  </p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {data ? formatCount(data.channel.videoCount) : "—"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t("youtubeVideo")}
                  </p>
                </div>
                {data?.isLive && (
                  <>
                    <div className="w-px bg-white/10" />
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <p className="text-xs text-red-400 font-bold">
                        {t("youtubeLiveOra")}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
                <a
                  href={YOUTUBE_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-red-700"
                >
                  <Bell className="w-4 h-4" />
                  {t("youtubeIscriviti")}
                </a>
                <a
                  href={`${YOUTUBE_CHANNEL_URL}/videos`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                >
                  <Play className="w-4 h-4" />
                  {t("youtubeGuardaTutti")}
                </a>
              </div>
            </div>

            {/* ── Colonna destra: video featured + info canale ── */}
            <div className="w-full shrink-0 space-y-3 sm:space-y-4 lg:w-80">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
                <div className="aspect-video">
                  <iframe
                    src={embedUrl}
                    title={featuredVideo?.title || t("youtubeUltima")}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <div className="border-t border-white/10 bg-black/70 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        {data?.isLive ? t("youtubeLiveLabel") : t("youtubeRecenteLabel")}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-white">
                        {featuredVideo?.title || t("youtubeUltima")}
                      </p>
                    </div>
                    {data?.isLive && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-red-400 transition-colors hover:text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t("youtubeGuardaTutti")}
                  </a>
                </div>
              </div>

              {/* Channel info strip */}
              <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                {data?.channel.thumbnail ? (
                  <img
                    src={data.channel.thumbnail}
                    alt={data.channel.title}
                    className="w-10 h-10 rounded-full shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">☦</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">
                    {data?.channel.title || "Chiesa Copta San Marco"}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    @SanMarco-Milano
                  </p>
                </div>
                <a
                  href={YOUTUBE_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 ml-auto"
                  aria-label={t("youtubeIscriviti")}
                >
                  <ExternalLink className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                </a>
              </div>

              {/* Upcoming streams */}
              {data?.upcoming && data.upcoming.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                    {t("youtubeInProgramma")}
                  </p>
                  {data.upcoming.slice(0, 2).map((item) => (
                    <a
                      key={item.id}
                      href={`https://www.youtube.com/watch?v=${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-white text-xs font-medium truncate">
                        {item.title}
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
