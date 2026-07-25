import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, ActivityIndicator } from 'react-native';
import YoutubePlayer, { YoutubeIframeProps, YoutubeIframeRef } from 'react-native-youtube-iframe';
import CookieManager from '@react-native-cookies/cookies';
import { YOUTUBE_AUTOPLAY_SCRIPT, YOUTUBE_FORCE_PLAY_SCRIPT } from '../utils/playerScripts';

let isConsentCookieSet = false;

/** Methods exposed to parent via ref */
export interface ConsentSafeYouTubePlayerRef {
  /** Inject arbitrary JS into the YouTube WebView page context */
  injectWebViewJavaScript: (js: string) => void;
  /** Force the video to play immediately — clicks red play button + calls video.play() */
  forcePlay: () => void;
}

export const ConsentSafeYouTubePlayer = forwardRef<ConsentSafeYouTubePlayerRef, YoutubeIframeProps>(
  function ConsentSafeYouTubePlayer(props, ref) {
    const [cookiesReady, setCookiesReady] = useState(isConsentCookieSet);
    const playerRef = useRef<YoutubeIframeRef>(null);

    // Expose forcePlay() and injectWebViewJavaScript() to parent via ref
    useImperativeHandle(ref, () => ({
      injectWebViewJavaScript: (js: string) => {
        (playerRef.current as any)?.injectWebViewJavaScript(js);
      },
      forcePlay: () => {
        (playerRef.current as any)?.injectWebViewJavaScript(YOUTUBE_FORCE_PLAY_SCRIPT);
      },
    }));

    useEffect(() => {
      if (isConsentCookieSet) {
        setCookiesReady(true);
        return;
      }

      const setConsentCookies = async () => {
        try {
          if (__DEV__) { console.log('[ConsentSafeYouTubePlayer] Setting Layer 1 Consent Cookies...'); }

          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 5);
          const expiryStr = expiryDate.toISOString();

          await CookieManager.set('https://google.com', {
            name: 'CONSENT',
            value: 'YES+',
            domain: '.google.com',
            path: '/',
            expires: expiryStr,
          });

          await CookieManager.set('https://youtube.com', {
            name: 'CONSENT',
            value: 'YES+',
            domain: '.youtube.com',
            path: '/',
            expires: expiryStr,
          });

          if (__DEV__) { console.log('[ConsentSafeYouTubePlayer] Layer 1 Consent Cookies successfully set!'); }
          isConsentCookieSet = true;
          setCookiesReady(true);
        } catch (err) {
          console.warn('[ConsentSafeYouTubePlayer] Failed to set Layer 1 Consent Cookies:', err);
          isConsentCookieSet = true;
          setCookiesReady(true);
        }
      };

      setConsentCookies();
    }, []);

    if (!cookiesReady) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      );
    }

    const handleReady = () => {
      // Trigger immediate forcePlay on player ready callback
      (playerRef.current as any)?.injectWebViewJavaScript(YOUTUBE_FORCE_PLAY_SCRIPT);
      if (props.onReady) {
        props.onReady();
      }
    };

    const customWebViewProps = {
      ...(props.webViewProps || {}),
      mediaPlaybackRequiresUserAction: false,
      allowsInlineMediaPlayback: true,
      androidLayerType: 'hardware',
      // Layer 2: Runs inside YouTube WebView page — full DOM access, no cross-origin block
      injectedJavaScript: YOUTUBE_AUTOPLAY_SCRIPT,
      onNavigationStateChange: (navState: any) => {
        if (navState.url && navState.url.includes('consentsafe-layer2-fired')) {
          if (__DEV__) { console.log('[ConsentSafeYouTubePlayer] DEV ONLY: Layer 2 consent dismiss fired!'); }
        }
        if (props.webViewProps && props.webViewProps.onNavigationStateChange) {
          props.webViewProps.onNavigationStateChange(navState);
        }
      }
    };

    return (
      <YoutubePlayer
        ref={playerRef}
        {...props}
        onReady={handleReady}
        webViewProps={customWebViewProps as any}
      />
    );
  }
);

export default ConsentSafeYouTubePlayer;
