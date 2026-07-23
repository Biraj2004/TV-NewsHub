import { useState, useEffect } from 'react';

/**
 * Resolves the current live video ID for a YouTube channel.
 *
 * Strategy (in order):
 * 1. Fetch the channel's /live page (Desktop UA) and extract videoId via multiple patterns.
 * 2. Fall back to the UULV RSS feed to get the most recent live/scheduled video.
 *
 * Performance: Results are cached per channelId for 5 minutes to prevent
 * duplicate network requests when tiles remount.
 * Security: Each fetch uses a 10-second AbortController timeout to prevent
 * stale requests from leaking memory.
 */

export interface LiveChannelDetails {
  videoId: string | null;
  videoTitle: string | null;
  isLoading: boolean;
  isError: boolean;
}

interface CacheEntry {
  videoId: string | null;
  videoTitle: string | null;
  isError: boolean;
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT_MS = 10_000;     // 10 seconds
const resolverCache = new Map<string, CacheEntry>();

function getCached(channelId: string): CacheEntry | null {
  const entry = resolverCache.get(channelId);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    resolverCache.delete(channelId);
    return null;
  }
  return entry;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function useLiveChannelResolver(youtubeChannelId: string | null): LiveChannelDetails {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    if (!youtubeChannelId) {
      setVideoId(null);
      setVideoTitle(null);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    // Return cached result immediately if fresh
    const cached = getCached(youtubeChannelId);
    if (cached) {
      setVideoId(cached.videoId);
      setVideoTitle(cached.videoTitle);
      setIsError(cached.isError);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setIsError(false);
    setVideoId(null);
    setVideoTitle(null);

    const resolveLiveStream = async () => {
      try {
        // --- Strategy 1: Desktop /live HTML page scan ---
        const liveUrl = `https://www.youtube.com/channel/${youtubeChannelId}/live`;
        const liveResponse = await fetchWithTimeout(
          liveUrl,
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          },
          FETCH_TIMEOUT_MS,
        );

        if (liveResponse.ok) {
          const html = await liveResponse.text();

          // Extract program title — more resilient multi-pattern approach
          let title: string | null = null;
          const titlePatterns = [
            // videoDetails object title
            /"videoDetails"\s*:\s*\{"videoId"\s*:\s*"[a-zA-Z0-9_-]{11}"\s*,\s*"title"\s*:\s*"([^"]+)"/,
            // og:title meta
            /<meta property="og:title" content="([^"]+)"/,
            // page <title> tag
            /<title>([^<]+)<\/title>/,
          ];
          for (const pattern of titlePatterns) {
            const m = html.match(pattern);
            if (m?.[1]) {
              title = m[1].replace(' - YouTube', '').replace(/\\u0026/g, '&').trim();
              break;
            }
          }

          // Check pattern 1: Canonical watch URL
          const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
          if (canonicalMatch?.[1]) {
            const result: CacheEntry = { videoId: canonicalMatch[1], videoTitle: title, isError: false, fetchedAt: Date.now() };
            resolverCache.set(youtubeChannelId, result);
            if (isMounted) { setVideoId(result.videoId); setVideoTitle(result.videoTitle); setIsLoading(false); }
            return;
          }

          // Check pattern 2: isLive:true + nearby videoId
          const isLiveMatch = html.match(/"isLive"\s*:\s*true[^}]{0,200}?"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/);
          if (isLiveMatch?.[1]) {
            const result: CacheEntry = { videoId: isLiveMatch[1], videoTitle: title, isError: false, fetchedAt: Date.now() };
            resolverCache.set(youtubeChannelId, result);
            if (isMounted) { setVideoId(result.videoId); setVideoTitle(result.videoTitle); setIsLoading(false); }
            return;
          }

          // Check pattern 3: liveStreamabilityRenderer
          const streamabilityMatch = html.match(/"liveStreamabilityRenderer"[^}]{0,300}?"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/);
          if (streamabilityMatch?.[1]) {
            const result: CacheEntry = { videoId: streamabilityMatch[1], videoTitle: title, isError: false, fetchedAt: Date.now() };
            resolverCache.set(youtubeChannelId, result);
            if (isMounted) { setVideoId(result.videoId); setVideoTitle(result.videoTitle); setIsLoading(false); }
            return;
          }
        }

        // --- Strategy 2: YouTube RSS live-streams feed fallback ---
        const uulvId = youtubeChannelId.replace(/^UC/, 'UULV');
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${uulvId}`;
        const rssResponse = await fetchWithTimeout(
          rssUrl,
          { headers: { Accept: 'application/xml, text/xml, */*' } },
          FETCH_TIMEOUT_MS,
        );

        if (rssResponse.ok) {
          const xml = await rssResponse.text();
          const videoIdMatch = xml.match(/<yt:videoId>([^<]{11})<\/yt:videoId>/);
          const rssTitle = xml.match(/<title>([^<]+)<\/title>/);
          if (videoIdMatch?.[1]) {
            const result: CacheEntry = { videoId: videoIdMatch[1], videoTitle: rssTitle?.[1] ?? null, isError: false, fetchedAt: Date.now() };
            resolverCache.set(youtubeChannelId, result);
            if (isMounted) { setVideoId(result.videoId); setVideoTitle(result.videoTitle); setIsLoading(false); }
            return;
          }
        }

        // Channel is offline or unresolvable
        const result: CacheEntry = { videoId: null, videoTitle: null, isError: false, fetchedAt: Date.now() };
        resolverCache.set(youtubeChannelId, result);
        if (isMounted) { setVideoId(null); setVideoTitle(null); setIsLoading(false); }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.warn('[LiveResolver] Fetch timed out for channel:', youtubeChannelId);
        } else {
          console.warn('[LiveResolver] Error resolving channel:', err);
        }
        if (isMounted) {
          setIsError(true);
          setIsLoading(false);
        }
      }
    };

    resolveLiveStream();

    return () => {
      isMounted = false;
    };
  }, [youtubeChannelId]);

  return { videoId, videoTitle, isLoading, isError };
}
