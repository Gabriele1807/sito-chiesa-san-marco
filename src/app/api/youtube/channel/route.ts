import { NextResponse } from "next/server";
import { getClientIp, isIpRateLimited, recordIpRequest } from "@/lib/auth/rate-limit";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_HANDLE = "SanMarco-Milano";
const CACHE_TTL = 5 * 60 * 1000; // 5 minuti

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

interface YouTubeChannelData {
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

type FetchedData = YouTubeChannelData & { videosOk: boolean };

let cache: { data: YouTubeChannelData; timestamp: number } | null = null;

async function fetchYouTubeData(): Promise<FetchedData | null> {
  if (!YOUTUBE_API_KEY) return null;

  try {
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?forHandle=${encodeURIComponent(CHANNEL_HANDLE)}&part=snippet,statistics,contentDetails&key=${YOUTUBE_API_KEY}`
    );
    const channelData = await channelRes.json();
    if (channelData.error) {
      console.error("YouTube channels:", channelData.error.message);
      return null;
    }
    const channel = channelData.items?.[0];
    if (!channel) return null;

    const channelId = channel.id;

    // La playlist "uploads" e videos.list costano 1 unità di quota l'una;
    // search.list ne costa 100 e, esaurita la quota, lasciava la home senza
    // video pur con le statistiche del canale caricate.
    const uploadsId: string | undefined = channel.contentDetails?.relatedPlaylists?.uploads;
    const videos: YouTubeVideo[] = [];
    let live: YouTubeVideo | null = null;
    const upcomingVideos: YouTubeVideo[] = [];
    let videosOk = false;

    if (uploadsId) {
      const listRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${uploadsId}&maxResults=15&part=contentDetails&key=${YOUTUBE_API_KEY}`
      );
      const listData = await listRes.json();
      if (listData.error) console.error("YouTube playlistItems:", listData.error.message);
      const ids: string[] = (listData.items ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => item.contentDetails?.videoId)
        .filter(Boolean);

      if (ids.length > 0) {
        const detailRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?id=${ids.join(",")}&part=snippet,status&key=${YOUTUBE_API_KEY}`
        );
        const detailData = await detailRes.json();
        if (detailData.error) console.error("YouTube videos:", detailData.error.message);
        videosOk = Array.isArray(detailData.items);
        const byId = new Map<string, Record<string, any>>( // eslint-disable-line @typescript-eslint/no-explicit-any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (detailData.items ?? []).map((item: any) => [item.id, item])
        );
        for (const id of ids) {
          const item = byId.get(id);
          if (!item || item.status?.embeddable === false || item.status?.privacyStatus !== "public") {
            continue;
          }
          const video: YouTubeVideo = {
            id,
            title: item.snippet.title,
            thumbnail:
              item.snippet.thumbnails?.high?.url ||
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.default?.url ||
              "",
            publishedAt: item.snippet.publishedAt,
          };
          const state = item.snippet.liveBroadcastContent;
          if (state === "live") live ??= video;
          else if (state === "upcoming") upcomingVideos.push(video);
          else videos.push(video);
        }
      }
    }

    return {
      channel: {
        id: channelId,
        title: channel.snippet.title,
        thumbnail:
          channel.snippet.thumbnails.high?.url ||
          channel.snippet.thumbnails.default?.url ||
          "",
        subscriberCount: channel.statistics.subscriberCount || "0",
        videoCount: channel.statistics.videoCount || "0",
      },
      latestVideo: videos[0] ?? null,
      isLive: live !== null,
      liveVideo: live,
      upcoming: upcomingVideos,
      videosOk,
    };
  } catch (error) {
    console.error("Errore fetch YouTube data:", error);
    return null;
  }
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (await isIpRateLimited(ip)) {
    return NextResponse.json({
      success: false,
      error: "Too many requests, please try again later.",
    }, { status: 429 });
  }
  await recordIpRequest(ip);

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({
      success: false,
      error: "YouTube API key non configurata",
    });
  }

  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ success: true, data: cache.data });
  }

  const fetched = await fetchYouTubeData();
  if (!fetched) {
    // Errore o quota esaurita: meglio l'ultimo dato noto che nessun video.
    if (cache) return NextResponse.json({ success: true, data: cache.data });
    return NextResponse.json({
      success: false,
      error: "Impossibile recuperare dati da YouTube",
    });
  }

  const { videosOk, ...data } = fetched;
  // Senza video (chiamata fallita) si riprova al prossimo giro senza
  // sostituire un'eventuale cache che il video ce l'ha.
  if (!videosOk && cache?.data.latestVideo) {
    return NextResponse.json({ success: true, data: cache.data });
  }
  if (videosOk) cache = { data, timestamp: Date.now() };
  return NextResponse.json({ success: true, data });
}
