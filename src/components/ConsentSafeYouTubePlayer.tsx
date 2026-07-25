import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import YoutubePlayer, { YoutubeIframeProps } from 'react-native-youtube-iframe';
import CookieManager from '@react-native-cookies/cookies';

let isConsentCookieSet = false;

export function ConsentSafeYouTubePlayer(props: YoutubeIframeProps) {
  const [cookiesReady, setCookiesReady] = useState(isConsentCookieSet);

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

  const layer2Script = `
    (function() {
      var startTime = Date.now();
      var interval = setInterval(function() {
        if (Date.now() - startTime > 10000) {
          clearInterval(interval);
          return;
        }

        // 1. Auto dismiss consent popups
        var selectors = [
          'button[aria-label*="Accept" i]',
          'button[aria-label*="Agree" i]',
          'button[aria-label*="Consent" i]',
          '.eom-buttonrow button',
          'form[action*="consent"] button',
          'form[action*="consent"] input[type="submit"]',
          '#introAgreeButton',
          '#accept-choices'
        ];
        for (var i = 0; i < selectors.length; i++) {
          var btn = document.querySelector(selectors[i]);
          if (btn) {
            btn.click();
            window.location.hash = 'consentsafe-layer2-fired';
            break;
          }
        }

        // 2. Auto click YouTube big red play button if present
        var playBtn = document.querySelector('.ytp-large-play-button, .ytp-play-button');
        if (playBtn && playBtn.offsetWidth > 0 && playBtn.offsetHeight > 0) {
          playBtn.click();
        }

        // 3. Ensure HTML5 video element is playing
        var v = document.querySelector('video');
        if (v && v.paused) {
          v.play().catch(function(){});
        }
      }, 300);
    })();
    true;
  `;

  if (!cookiesReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  const customWebViewProps = {
    ...(props.webViewProps || {}),
    mediaPlaybackRequiresUserAction: false,
    allowsInlineMediaPlayback: true,
    androidLayerType: 'hardware',
    injectedJavaScript: layer2Script,
    onNavigationStateChange: (navState: any) => {
      if (navState.url && navState.url.includes('consentsafe-layer2-fired')) {
        if (__DEV__) { console.log('[ConsentSafeYouTubePlayer] DEV ONLY: Layer 2 (fallback) consent dialog dismiss fired!'); }
      }
      if (props.webViewProps && props.webViewProps.onNavigationStateChange) {
        props.webViewProps.onNavigationStateChange(navState);
      }
    }
  };

  return (
    <YoutubePlayer
      {...props}
      webViewProps={customWebViewProps as any}
    />
  );
}

export default ConsentSafeYouTubePlayer;
