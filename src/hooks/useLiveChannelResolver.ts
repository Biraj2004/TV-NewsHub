import { useState, useEffect } from 'react';

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
        const url = `https://www.youtube.com/channel/${youtubeChannelId}/live`;
        
        // Make a fetch call. It automatically follows redirects.
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch channel page: ${response.status}`);
        }

        const finalUrl = response.url;
        
        // 1. Try to extract videoId from finalUrl (e.g. watch?v=ID or /live/ID)
        const urlMatch = finalUrl.match(/(?:watch\?v=|live\/|embed\/)([^"&?\/ ]{11})/);
        if (urlMatch && urlMatch[1] && urlMatch[1].length === 11) {
          if (isMounted) {
            setVideoId(urlMatch[1]);
            setIsLoading(false);
            return;
          }
        }

        // If the redirect URL doesn't contain the videoId directly, we search the HTML text
        const html = await response.text();
        
        // 2. Look for the "videoId":"..." pattern in JSON structures inside the HTML page
        const jsonMatch = html.match(/"videoId"\s*:\s*"([^"]{11})"/);
        if (jsonMatch && jsonMatch[1]) {
          if (isMounted) {
            setVideoId(jsonMatch[1]);
            setIsLoading(false);
            return;
          }
        }

        // 3. Look for the "canonical" link in the HTML
        const canonicalMatch = html.match(/<link rel="canonical" href="[^"]*watch\?v=([^"]*)"/);
        if (canonicalMatch && canonicalMatch[1] && canonicalMatch[1].length === 11) {
          if (isMounted) {
            setVideoId(canonicalMatch[1]);
            setIsLoading(false);
            return;
          }
        }

        // 4. Search for watch?v=XXXXXXXXXXX inside the HTML
        const watchMatch = html.match(/watch\?v=([^"\\&? ]{11})/);
        if (watchMatch && watchMatch[1]) {
          if (isMounted) {
            setVideoId(watchMatch[1]);
            setIsLoading(false);
            return;
          }
        }

        // If everything fails
        throw new Error('Could not parse live video ID from HTML');
      } catch (err) {
        console.warn('Live stream resolve error:', err);
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
