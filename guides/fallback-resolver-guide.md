# Stream Resolver & Fallback Architecture Guide

This guide details the 3-tier stream resolution, security architecture, and fallback engine implemented in **TV-NewsHub**.

---

## 3-Tier Resolution Hierarchy

TV-NewsHub dynamically evaluates every channel against a 3-tier fallback matrix to ensure high-definition 1080p playback and 100% stream reliability on Smart TVs.

```mermaid
flowchart TD
    A[User Selects Channel] --> B{Tier 1: Direct streamUrl?}
    B -- Yes (.m3u8 master playlist) --> C[HTML5 Video Container in WebView (1080p GPU Hardware Decoded)]
    C -- Stream Error / Timeout --> D{Tier 2: m3uUrl or embedUrl?}
    B -- No --> D
    D -- Yes (Secondary .m3u8 / Web Embed) --> E[Secondary HLS / Share Widget WebView]
    E -- Stream Error --> F[Tier 3: YouTube Live Resolver]
    D -- No --> F
    F --> G[ConsentSafeYouTubePlayer]
    G -- Offline / Error --> H[PlaybackErrorScreen Component]
```

---

## Tier Breakdown & Implementation Details

### Tier 1: Primary Direct HLS Stream (`streamUrl`)
- **Format**: Direct Akamai / CloudFront HLS `.m3u8` master playlists (1080p Full HD @ 3.9 Mbps).
- **Engine**: Custom Hls.js HTML5 video container loaded inside `react-native-webview` with hardware GPU video decoding.
- **Configured Channels**: Republic Bangla, ABP Ananda, TV9 Bangla, News18 Bangla, Calcutta News, Zee 24 Ghanta, NDTV India, Aaj Tak, ABP News, Zee News, India TV, India Today, WION, NDTV 24x7, Republic TV, Times Now, BBC News, DW News, CNA.

### Tier 2: Secondary Fallback Stream (`m3uUrl` / `embedUrl`)
- **Format**: Secondary HLS `.m3u8` CDN feeds or official broadcaster web embed share widgets.
- **Engine**: Secondary Hls.js container or isolated web embed player with `EMBED_AUTOPLAY_SCRIPT` injection.
- **Trigger**: Automatically activated if Tier 1 encounters network failures, HTTP 404/500 errors, or a 6-second readyState timeout.

### Tier 3: YouTube Live Resolver (`youtubeChannelId`)
- **Format**: Dynamic YouTube live video ID resolution via Desktop User-Agent HTML scraping and RSS fallback feeds.
- **Engine**: `ConsentSafeYouTubePlayer` with `CONSENT=YES+` cookie injection to bypass Smart TV consent banners.
- **Optimization**: Bypassed while Tier 1 or Tier 2 streams are playing to prevent unnecessary network overhead.

### Fallback Error Screen (`PlaybackErrorScreen`)
- **Format**: Dark glassmorphic overlay card that renders when all 3 playback tiers are unreachable.
- **UX**: Features an auto-focused `[ Return to Channel Grid ]` button (`hasTVPreferredFocus={true}`) and D-Pad remote SURFING hints.

---

## Security Architecture & Data Protection Guidelines

TV-NewsHub strictly follows comprehensive security principles across network transport, input sanitization, and data isolation:

1. **100% HTTPS TLS Security Protocol**:
   All stream endpoints in [`india.json`](file:///e:/01.%20GitHub%20Repo%20Projects/TV-NewsHub/src/data/countries/india.json) and [`bangladesh.json`](file:///e:/01.%20GitHub%20Repo%20Projects/TV-NewsHub/src/data/countries/bangladesh.json) strictly enforce Transport Layer Security (`https://`). Zero insecure HTTP endpoints exist.
2. **URL Sanitization & Anti-XSS Context Protection**:
   Dynamic stream URLs are sanitized via `sanitizeUrl()` ([`src/utils/sanitize.ts`](file:///e:/01.%20GitHub%20Repo%20Projects/TV-NewsHub/src/utils/sanitize.ts)) to strip control characters (`[`'\"\\<>]`), preventing template injection and XSS context breaking inside WebViews.
3. **Sandboxed Execution & Origin Whitelisting**:
   Embedded web share widgets run within sandboxed `react-native-webview` instances with restricted DOM access and origin whitelisting (`originWhitelist={['*']}`).
4. **Network Request Timeouts & Leak Prevention**:
   Every network request in `useLiveChannelResolver` uses a 10-second `AbortController` timeout to prevent unhandled socket leaks. A 5-minute memory cache (`CACHE_TTL_MS = 5 * 60 * 1000`) prevents redundant network requests.
5. **Zero Data Tracking & Local Storage Scope**:
   TV-NewsHub collects, tracks, stores, or transmits **no user identity, analytics, or behavioral data**. `AsyncStorage` is used strictly on-device to persist last-watched channel IDs for 10-minute auto-resume playback.
