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
      <div className="min-w-0 max-w-full overflow-hidden rounded-[1.5rem] bg-primary shadow-2xl sm:rounded-2xl">
        {/* Top bar decorativo */}
        <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />

        <div className="min-w-0 max-w-full p-4 sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.25fr_minmax(18rem,1fr)]">
            <div className="flex flex-col justify-center">
              <div className="inline-flex items-center gap-2.5 bg-red-600 text-white px-3.5 py-1.5 rounded-full text-sm font-bold shadow-lg">
                <Youtube className="w-4.5 h-4.5" />
                YouTube
              </div>

              <h2 className="mt-5 text-2xl font-bold text-white sm:text-3xl lg:text-3xl leading-tight">
                {t("youtubeSezione")}
              </h2>

              <p className="mt-5 text-gray-300 leading-relaxed">
                {t("youtubeDesc")}
              </p>

              <p className="mt-5 text-sm leading-relaxed text-gray-400">
                {t("youtubeStreaming")}
              </p>
            </div>

            <div className="min-w-0 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                <div className="aspect-video">
                  <iframe
                    src={embedUrl}
                    title={featuredVideo?.title || t("youtubeUltima")}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>

                <div className="border-t border-white/10 bg-black/70 px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        {data?.isLive ? t("youtubeLiveLabel") : t("youtubeRecenteLabel")}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-white">
                        {featuredVideo?.title || t("youtubeUltima")}
                      </p>
                    </div>

                    {data?.isLive && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold text-white">
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>

                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-red-400 transition-colors hover:text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t("youtubeGuardaTutti")}
                  </a>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-inner">
                <div className="flex items-center gap-3">
                  {data?.channel.thumbnail ? (
                    <img
                      src={data.channel.thumbnail}
                      alt={data.channel.title}
                      className="w-12 h-12 rounded-full shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">☦</span>
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {data?.channel.title || "Chiesa Copta San Marco"}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      @SanMarco-Milano
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white/5 p-4 text-center">
                    <p className="text-2xl font-bold text-white">
                      {data ? formatCount(data.channel.subscriberCount) : "—"}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-gray-400">
                      {t("youtubeIscritti")}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-4 text-center">
                    <p className="text-2xl font-bold text-white">
                      {data ? formatCount(data.channel.videoCount) : "—"}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-gray-400">
                      {t("youtubeVideo")}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <a
                    href={YOUTUBE_CHANNEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-red-700"
                  >
                    <Bell className="w-4 h-4" />
                    {t("youtubeIscriviti")}
                  </a>
                  <a
                    href={`${YOUTUBE_CHANNEL_URL}/videos`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                  >
                    <Play className="w-4 h-4" />
                    {t("youtubeGuardaTutti")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
