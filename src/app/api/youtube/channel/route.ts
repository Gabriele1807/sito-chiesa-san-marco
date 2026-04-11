import { NextResponse } from "next/server";

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

let cache: { data: YouTubeChannelData; timestamp: number } | null = null;

async function fetchYouTubeData(): Promise<YouTubeChannelData | null> {
  if (!YOUTUBE_API_KEY) return null;

  try {
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?forHandle=${encodeURIComponent(CHANNEL_HANDLE)}&part=snippet,statistics&key=${YOUTUBE_API_KEY}`
    );
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];
    if (!channel) return null;

    const channelId = channel.id;

    const [searchRes, liveRes, upcomingRes] = await Promise.all([
      fetch(
        `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&order=date&maxResults=1&type=video&part=snippet&key=${YOUTUBE_API_KEY}`
      ),
      fetch(
        `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&eventType=live&type=video&part=snippet&key=${YOUTUBE_API_KEY}`
      ),
      fetch(
        `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&eventType=upcoming&type=video&part=snippet&maxResults=5&key=${YOUTUBE_API_KEY}`
      ),
    ]);

    const [searchData, liveData, upcomingData] = await Promise.all([
      searchRes.json(),
      liveRes.json(),
      upcomingRes.json(),
    ]);

    const latestVideo = searchData.items?.[0];
    const activeLive = liveData.items?.[0];
    const upcomingItems = upcomingData.items || [];

    return {
      channel: {
        id: channelId,
        title: channel.snippet.title,
        thumbnail: channel.snippet.thumbnails.default?.url || "",
        subscriberCount: channel.statistics.subscriberCount || "0",
        videoCount: channel.statistics.videoCount || "0",
      },
      latestVideo: latestVideo
        ? {
            id: latestVideo.id.videoId,
            title: latestVideo.snippet.title,
            thumbnail:
              latestVideo.snippet.thumbnails.high?.url ||
              latestVideo.snippet.thumbnails.default?.url ||
              "",
            publishedAt: latestVideo.snippet.publishedAt,
          }
        : null,
      isLive: !!activeLive,
      liveVideo: activeLive
        ? {
            id: activeLive.id.videoId,
            title: activeLive.snippet.title,
            thumbnail:
              activeLive.snippet.thumbnails.high?.url ||
              activeLive.snippet.thumbnails.default?.url ||
              "",
            publishedAt: activeLive.snippet.publishedAt,
          }
        : null,
      upcoming: upcomingItems.map((item: Record<string, unknown>) => {
        const snippet = item.snippet as Record<string, unknown>;
        const id = item.id as Record<string, string>;
        const thumbnails = snippet.thumbnails as Record<string, Record<string, string>>;
        return {
          id: id.videoId,
          title: snippet.title as string,
          thumbnail: thumbnails?.high?.url || thumbnails?.default?.url || "",
          publishedAt: snippet.publishedAt as string,
        };
      }),
    };
  } catch (error) {
    console.error("Errore fetch YouTube data:", error);
    return null;
  }
}

export async function GET() {
  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({
      success: false,
      error: "YouTube API key non configurata",
    });
  }

  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ success: true, data: cache.data });
  }

  const data = await fetchYouTubeData();
  if (!data) {
    return NextResponse.json({
      success: false,
      error: "Impossibile recuperare dati da YouTube",
    });
  }

  cache = { data, timestamp: Date.now() };
  return NextResponse.json({ success: true, data });
}
