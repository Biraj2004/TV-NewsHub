import { useState, useEffect } from 'react';

/**
 * Resolves the current live video ID for a YouTube channel.
 *
 * Strategy (in order):
 * 1. Fetch the channel's UULV live-stream RSS feed — this is a YouTube-provided
 *    Atom feed that lists the most recent live/scheduled streams. No scraping needed.
 *    UULV prefix = "UC" replaced with "UULV" in the channel ID.
 * 2. If the RSS has no entries (channel not live via RSS), fall back to the /live
 *    redirect URL and extract the videoId from the redirect destination.
 */
export function useLiveChannelResolver(youtubeChannelId: string | null) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    if (!youtubeChannelId) {
      setVideoId(null);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setIsError(false);
    setVideoId(null);

    const resolveLiveStream = async () => {
      try {
        // --- Strategy 1: YouTube RSS live-streams feed ---
        // UULV playlist = live streams only for this channel
        const uulvId = youtubeChannelId.replace(/^UC/, 'UULV');
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${uulvId}`;

        const rssResponse = await fetch(rssUrl, {
          headers: {
            Accept: 'application/xml, text/xml, */*',
          },
        });

        if (rssResponse.ok) {
          const xml = await rssResponse.text();

          // Extract the first <yt:videoId> from the feed
          const videoIdMatch = xml.match(/<yt:videoId>([^<]{11})<\/yt:videoId>/);
          if (videoIdMatch && videoIdMatch[1]) {
            if (isMounted) {
              setVideoId(videoIdMatch[1]);
              setIsLoading(false);
            }
            return;
          }
        }

        // --- Strategy 2: /live redirect fallback ---
        const liveUrl = `https://www.youtube.com/channel/${youtubeChannelId}/live`;
        const liveResponse = await fetch(liveUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
          },
        });

        if (liveResponse.ok) {
          const finalUrl = liveResponse.url;

          // Check if the redirect landed on a watch?v= URL
          const urlMatch = finalUrl.match(/(?:watch\?v=|live\/|embed\/)([^"&?\/ ]{11})/);
          if (urlMatch && urlMatch[1] && urlMatch[1].length === 11) {
            if (isMounted) {
              setVideoId(urlMatch[1]);
              setIsLoading(false);
            }
            return;
          }

          // Scan the HTML body for a videoId
          const html = await liveResponse.text();
          const jsonMatch = html.match(/"videoId"\s*:\s*"([^"]{11})"/);
          if (jsonMatch && jsonMatch[1]) {
            if (isMounted) {
              setVideoId(jsonMatch[1]);
              setIsLoading(false);
            }
            return;
          }
        }

        // Nothing found — channel is offline
        if (isMounted) {
          setVideoId(null);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('[LiveResolver] Error:', err);
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

  return { videoId, isLoading, isError };
}
