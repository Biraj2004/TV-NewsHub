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
        console.log('[ConsentSafeYouTubePlayer] Setting Layer 1 Consent Cookies...');
        
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 5); // 5 years expiry
        const expiryStr = expiryDate.toISOString();

        // Set consent cookie YES+ for .google.com
        await CookieManager.set('https://google.com', {
          name: 'CONSENT',
          value: 'YES+',
          domain: '.google.com',
          path: '/',
          expires: expiryStr,
        });

        // Set consent cookie YES+ for .youtube.com
        await CookieManager.set('https://youtube.com', {
          name: 'CONSENT',
          value: 'YES+',
          domain: '.youtube.com',
          path: '/',
          expires: expiryStr,
        });

        console.log('[ConsentSafeYouTubePlayer] Layer 1 Consent Cookies successfully set!');
        isConsentCookieSet = true;
        setCookiesReady(true);
      } catch (err) {
        console.warn('[ConsentSafeYouTubePlayer] Failed to set Layer 1 Consent Cookies:', err);
        // Continue loading player anyway as fallback
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
        if (Date.now() - startTime > 5000) {
          clearInterval(interval);
          return;
        }
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
            clearInterval(interval);
            return;
          }
        }
        
        // Dynamic search by text content
        var buttons = document.querySelectorAll('button');
        for (var j = 0; j < buttons.length; j++) {
          var text = buttons[j].textContent || buttons[j].innerText || '';
          if (/accept|agree|consent|allow/i.test(text)) {
            buttons[j].click();
            window.location.hash = 'consentsafe-layer2-fired';
            clearInterval(interval);
            return;
          }
        }
      }, 250);
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
    injectedJavaScript: layer2Script,
    onNavigationStateChange: (navState: any) => {
      if (navState.url && navState.url.includes('consentsafe-layer2-fired')) {
        console.log('[ConsentSafeYouTubePlayer] DEV ONLY: Layer 2 (fallback) consent dialog dismiss fired!');
      }
      if (props.webViewProps && props.webViewProps.onNavigationStateChange) {
        props.webViewProps.onNavigationStateChange(navState);
      }
    }
  };

  return (
    <YoutubePlayer
      {...props}
      webViewProps={customWebViewProps}
    />
  );
}
export default ConsentSafeYouTubePlayer;
