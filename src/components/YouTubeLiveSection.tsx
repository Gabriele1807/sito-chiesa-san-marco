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
    fetchData();
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const featuredVideo =
    data?.isLive && data.liveVideo ? data.liveVideo : data?.latestVideo;

  const videoUrl = featuredVideo
    ? `https://www.youtube.com/watch?v=${featuredVideo.id}`
    : YOUTUBE_CHANNEL_URL;

  return (
    <section>
      <div className="rounded-2xl overflow-hidden bg-[#0F1A2E] shadow-2xl">
        {/* Top bar decorativo */}
        <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />

        <div className="p-8 sm:p-10 lg:p-12">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">
            {/* ── Colonna sinistra: brand + testo + CTA ── */}
            <div className="flex-1 min-w-0">
              {/* YouTube badge + live indicator */}
              <div className="flex items-center gap-3 mb-6">
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

              <p className="text-gray-300 leading-relaxed mb-3">
                {t("youtubeDesc")}
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                {t("youtubeStreaming")}
              </p>

              {/* Quando trasmettiamo */}
              <div className="flex flex-wrap gap-3 mb-8">
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
              <div className="flex flex-wrap gap-6 mb-8">
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
              <div className="flex flex-wrap gap-3">
                <a
                  href={YOUTUBE_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg text-sm"
                >
                  <Bell className="w-4 h-4" />
                  {t("youtubeIscriviti")}
                </a>
                <a
                  href={`${YOUTUBE_CHANNEL_URL}/videos`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors border border-white/20 text-sm"
                >
                  <Play className="w-4 h-4" />
                  {t("youtubeGuardaTutti")}
                </a>
              </div>
            </div>

            {/* ── Colonna destra: video featured + info canale ── */}
            <div className="w-full lg:w-80 shrink-0 space-y-4">
              {/* Featured video thumbnail */}
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-video rounded-xl overflow-hidden border border-white/10 relative group cursor-pointer"
              >
                {featuredVideo ? (
                  <img
                    src={featuredVideo.thumbnail}
                    alt={featuredVideo.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-black/40" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {!featuredVideo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Cross className="w-16 h-16 text-white/10" />
                  </div>
                )}
                {/* Live badge */}
                {data?.isLive &&
                  data.liveVideo &&
                  featuredVideo?.id === data.liveVideo.id && (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </div>
                  )}
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play
                      className="w-6 h-6 text-white ml-0.5"
                      fill="currentColor"
                    />
                  </div>
                </div>
                {/* Bottom label */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">
                    {data?.isLive
                      ? t("youtubeLiveLabel")
                      : t("youtubeRecenteLabel")}
                  </p>
                  <p className="text-white text-xs font-semibold line-clamp-2">
                    {featuredVideo?.title || t("youtubeUltima")}
                  </p>
                </div>
              </a>

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
                  aria-label="Vai al canale"
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
