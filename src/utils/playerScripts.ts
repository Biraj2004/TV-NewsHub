import { sanitizeUrl } from './sanitize';

/**
 * Build the HTML shell for direct HLS (.m3u8) video streams using Hls.js.
 * Configured for forced 1080p Max Bitrate Level and deep 60-second buffer.
 */
export const getHlsHtml = (rawStreamUrl: string): string => {
  const streamUrl = sanitizeUrl(rawStreamUrl);
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; background: #000 !important; }
      html, body { width: 100vw; height: 100vh; overflow: hidden; background: #000; display: flex; justify-content: center; align-items: center; }
      video { width: 100vw; height: 100vh; max-width: 100vw; max-height: 100vh; object-fit: contain; background: #000; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  </head>
  <body>
    <video id="video" autoplay playsinline webkit-playsinline></video>
    <script>
      var video = document.getElementById('video');
      var videoSrc = '${streamUrl}';
      if (Hls.isSupported()) {
        var hls = new Hls({
          maxBufferLength: 60,
          maxMaxBufferLength: 120,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          capLevelToPlayerSize: false,
          startLevel: -1
        });
        hls.loadSource(videoSrc);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          if (hls.levels && hls.levels.length > 0) {
            hls.currentLevel = hls.levels.length - 1; // Force 1080p Full HD max quality
            hls.autoLevelCapping = -1;
          }
          video.play().catch(function(){});
        });
        hls.on(Hls.Events.ERROR, function (event, data) {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'HLS_ERROR', details: data.type }));
                }
                break;
            }
          }
        });
        setTimeout(function() {
          if (video.paused || video.ended || video.readyState < 2) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'HLS_ERROR', details: 'timeout' }));
            }
          }
        }, 6000);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
        video.addEventListener('loadedmetadata', function() {
          video.play();
        });
      }
    </script>
  </body>
  </html>
`;
};

/**
 * Auto-click + autoplay injection script for Tier 2 embed WebViews.
 * Runs directly inside page context with full DOM access.
 */
export const EMBED_AUTOPLAY_SCRIPT = `
  (function() {
    var PLAY_SELECTORS = [
      '.vjs-big-play-button',
      '.vjs-play-control',
      '.jw-icon-playback',
      '.bc-play-button',
      '.ytp-large-play-button',
      '.ytp-play-button',
      '[data-role="play-button"]',
      '[aria-label*="Play" i]',
      '.play-btn',
      '.play-button',
      '.play_btn',
      '.play-icon',
      '.btn-play',
      '#playButton',
      'button[id*="play"]',
      '[class*="play"][class*="btn"]',
      '[class*="play"][class*="button"]'
    ];

    function tryPlay() {
      for (var s = 0; s < PLAY_SELECTORS.length; s++) {
        var btns = document.querySelectorAll(PLAY_SELECTORS[s]);
        for (var b = 0; b < btns.length; b++) {
          var btn = btns[b];
          if (btn && btn.offsetWidth > 0 && btn.offsetHeight > 0) {
            btn.click();
          }
        }
      }

      var videos = document.querySelectorAll('video');
      for (var v = 0; v < videos.length; v++) {
        var vid = videos[v];
        vid.muted = false;
        if (window.hls && window.hls.levels && window.hls.levels.length > 0) {
          window.hls.currentLevel = window.hls.levels.length - 1;
          window.hls.autoLevelCapping = -1;
        }
        if (vid.paused || vid.ended) {
          vid.play().catch(function() {});
        }
      }

      var consentSelectors = [
        'button[aria-label*="Accept" i]',
        'button[aria-label*="Agree" i]',
        'button[aria-label*="Got it" i]',
        '#onetrust-accept-btn-handler',
        '.accept-btn',
        '[class*="consent"] button',
        '[class*="cookie"] button[class*="accept"]'
      ];
      for (var c = 0; c < consentSelectors.length; c++) {
        var consent = document.querySelector(consentSelectors[c]);
        if (consent) { consent.click(); }
      }
    }

    tryPlay();

    var startTime = Date.now();
    var interval = setInterval(function() {
      if (Date.now() - startTime > 20000) {
        clearInterval(interval);
        return;
      }
      tryPlay();
    }, 500);

    if (window.MutationObserver) {
      var observer = new MutationObserver(function() { tryPlay(); });
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
      setTimeout(function() { observer.disconnect(); }, 20000);
    }

    true;
  })();
`;

/** Command injected on D-Pad OK press for Tier 2 embed channels */
export const EMBED_FORCE_PLAY_SCRIPT = `
  (function() {
    var videos = document.querySelectorAll('video');
    for (var i = 0; i < videos.length; i++) {
      videos[i].muted = false;
      videos[i].play().catch(function() {});
    }
    var playBtns = document.querySelectorAll(
      '.vjs-big-play-button, .ytp-large-play-button, .ytp-play-button, .vjs-play-control, [aria-label*="Play" i], .play-button, .play-btn, .btn-play'
    );
    for (var j = 0; j < playBtns.length; j++) {
      if (playBtns[j].offsetWidth > 0) { playBtns[j].click(); }
    }
    true;
  })();
`;

/**
 * Auto-click + max quality injection script for Tier 3 YouTube WebViews.
 */
export const YOUTUBE_AUTOPLAY_SCRIPT = `
  (function() {
    var startTime = Date.now();
    var TIMEOUT_MS = 30000;
    var qualityForced = false;

    function forceMaxQuality() {
      if (qualityForced) return;
      try {
        var players = document.querySelectorAll('.html5-video-player');
        for (var p = 0; p < players.length; p++) {
          var pl = players[p];
          if (typeof pl.setPlaybackQuality === 'function') {
            pl.setPlaybackQuality('hd1080');
            qualityForced = true;
          }
          if (typeof pl.setPlaybackQualityRange === 'function') {
            pl.setPlaybackQualityRange('hd1080', 'highres');
            qualityForced = true;
          }
        }
      } catch(e) {}

      try {
        if (window.ytplayer && window.ytplayer.config && window.ytplayer.config.args) {
          window.ytplayer.config.args.vq = 'hd1080';
          qualityForced = true;
        }
      } catch(e) {}
    }

    function tryAutoPlay() {
      var CONSENT_SELECTORS = [
        'button[aria-label*="Accept" i]',
        'button[aria-label*="Agree" i]',
        'button[aria-label*="Consent" i]',
        '.eom-buttonrow button',
        'form[action*="consent"] button',
        'form[action*="consent"] input[type="submit"]',
        '#introAgreeButton',
        '#accept-choices',
        'button[jsname="b3VHJd"]',
        'button[jsname="tHlp8d"]'
      ];
      for (var c = 0; c < CONSENT_SELECTORS.length; c++) {
        var consentBtn = document.querySelector(CONSENT_SELECTORS[c]);
        if (consentBtn && consentBtn.offsetWidth > 0) {
          consentBtn.click();
          break;
        }
      }

      var PLAY_SELECTORS = [
        '.ytp-large-play-button',
        '.ytp-play-button',
        'button.ytp-large-play-button',
        '.ytp-cued-thumbnail-overlay-image',
        '.ytp-cued-thumbnail-overlay',
        '[data-layer="4"] .ytp-large-play-button',
        '.html5-video-player .ytp-large-play-button',
        'svg[height="100%"]',
        'button[aria-label*="Play" i]'
      ];
      for (var s = 0; s < PLAY_SELECTORS.length; s++) {
        try {
          var playBtns = document.querySelectorAll(PLAY_SELECTORS[s]);
          for (var b = 0; b < playBtns.length; b++) {
            var btn = playBtns[b];
            if (btn) {
              btn.click();
              try {
                var clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
                btn.dispatchEvent(clickEvt);
              } catch(evtErr) {}
            }
          }
        } catch(e) {}
      }

      var videos = document.querySelectorAll('video');
      for (var v = 0; v < videos.length; v++) {
        var vid = videos[v];
        vid.muted = false;
        if (vid.paused || vid.ended || vid.readyState >= 2) {
          vid.play().catch(function() {});
        }
      }

      forceMaxQuality();
    }

    tryAutoPlay();

    var interval = setInterval(function() {
      if (Date.now() - startTime > TIMEOUT_MS) {
        clearInterval(interval);
        return;
      }
      tryAutoPlay();
    }, 400);

    if (window.MutationObserver) {
      var observer = new MutationObserver(function(mutations) {
        for (var m = 0; m < mutations.length; m++) {
          if (mutations[m].addedNodes.length > 0) {
            tryAutoPlay();
            break;
          }
        }
      });
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
      setTimeout(function() { observer.disconnect(); }, TIMEOUT_MS);
    }

    true;
  })();
`;

/** Command injected on D-Pad OK press for Tier 3 YouTube channels */
export const YOUTUBE_FORCE_PLAY_SCRIPT = `
  (function() {
    try {
      if (window.player && typeof window.player.playVideo === 'function') {
        window.player.playVideo();
      }
    } catch(e) {}

    var playBtns = document.querySelectorAll(
      '.ytp-large-play-button, button.ytp-large-play-button, .ytp-play-button, .ytp-cued-thumbnail-overlay, [aria-label*="Play" i], .ytp-button'
    );
    for (var i = 0; i < playBtns.length; i++) {
      var btn = playBtns[i];
      if (btn && (btn.offsetWidth > 0 || btn.offsetHeight > 0)) {
        btn.click();
      }
    }

    var videos = document.querySelectorAll('video');
    for (var v = 0; v < videos.length; v++) {
      videos[v].muted = false;
      videos[v].play().catch(function() {});
    }

    try {
      var players = document.querySelectorAll('.html5-video-player');
      for (var p = 0; p < players.length; p++) {
        if (typeof players[p].playVideo === 'function') {
          players[p].playVideo();
        }
        if (typeof players[p].setPlaybackQuality === 'function') {
          players[p].setPlaybackQuality('hd1080');
        }
        if (typeof players[p].setPlaybackQualityRange === 'function') {
          players[p].setPlaybackQualityRange('hd1080', 'highres');
        }
      }
    } catch(e) {}

    true;
  })();
`;
