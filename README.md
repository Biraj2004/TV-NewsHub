# TV-NewsHub

<p align="center">
  <img src="public/antenna-icon.svg" width="120" height="120" alt="NewsHub TV Logo" />
</p>

<p align="center">
  <strong>A premium, open-source, dark-themed Android TV aggregator of live news channels. Built for the 10-foot viewing experience.</strong>
</p>

<p align="center">
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/Framework-React%20Native%20TVOS%20v0.83-blue.svg?style=flat-square&logo=react" alt="React Native TVOS" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/Language-TypeScript-blue.svg?style=flat-square&logo=typescript" alt="TypeScript" /></a>
  <img src="https://img.shields.io/badge/Version-0.0.5-brightgreen.svg?style=flat-square" alt="Version 0.0.5" />
  <a href="https://developer.android.com/tv"><img src="https://img.shields.io/badge/Platform-Android%20TV%20%7C%20Google%20TV%20%7C%20Fire%20TV-green.svg?style=flat-square&logo=android" alt="Target Platforms" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-orange.svg?style=flat-square" alt="License" /></a>
  <a href="SECURITY.md"><img src="https://img.shields.io/badge/Security-Policy%20Active-brightgreen.svg?style=flat-square" alt="Security Policy" /></a>
</p>

---

NewsHub is a dedicated smart TV application designed from the ground up for remote-controlled interfaces. It aggregates live news streams by country and language, resolving active 1080p direct HLS (`.m3u8`) master playlists, official web embed widgets, and YouTube live stream IDs dynamically via a 3-tier fallback engine — ensuring users enjoy a seamless, full-screen viewing experience without ever leaving the application.

This repository is **exclusively optimized for Android TV, Google TV, Fire TV, and other Android-based smart TVs**. All native iOS modules, configurations, and CocoaPods files have been completely stripped out to ensure a lean, lightweight, and focused codebase.

---

## Features & TV OS UI Highlights

*   **3-Tier Resilient Stream Resolver Architecture**:
    *   **Tier 1 (`streamUrl`)**: Direct Akamai / CloudFront HLS `.m3u8` master playlists (1080p Full HD GPU Hardware Decoded).
    *   **Tier 2 (`m3uUrl` / `embedUrl`)**: Secondary HLS `.m3u8` CDN feeds or official broadcaster web embed share widgets.
    *   **Tier 3 (`youtubeChannelId`)**: Desktop User-Agent YouTube Live Resolver fallback with real-time headline extraction.
*   **Dedicated TV PlaybackErrorScreen**:
    A clean, dark glassmorphic error screen (`PlaybackErrorScreen`) that appears when all 3 playback tiers are unreachable. Features an auto-focused `[ Return to Channel Grid ]` TV button (`hasTVPreferredFocus={true}`) and D-Pad remote navigation hints.
*   **Optimized 10-Foot Focus & Zoom**:
    Focusable items (channel cards, country pills, language tabs) scale up by `1.05x` and draw a bold white border on focus. Large type sizes and high-contrast layouts ensure readability from a distance of 10 feet.
*   **Country & Language Filtering**:
    Dynamically loads and groups channels based on country directories (India, Bangladesh) and provides language tabs (Bengali, Hindi, English, All).
*   **Live Clock & Status Badges**:
    Features an active digital clock on the home dashboard. Displays clean "LIVE" / "OFFLINE" status badges across channel tiles.
*   **Last-Watched Auto-Resume**:
    Persists your last-viewed channel and timestamp via AsyncStorage. If you reopen the app within **10 minutes**, it bypasses the dashboard and opens the live stream immediately.
*   **Immersive Player Overlay**:
    Smoothly fades out stream controls and channel details after **4 seconds** of inactivity (`300ms` fade-out) for distraction-free viewing. Pressing any remote D-pad key instantly fades the overlay back in (`200ms` fade-in).
*   **D-Pad Channel Hopping**:
    While in full-screen playback, press **Left/Right D-pad keys** to hop between adjacent channels within the active filter list instantly, without exiting to the dashboard.
*   **Cookie-Consent Auto-Dismiss**:
    `ConsentSafeYouTubePlayer` injects `CONSENT=YES+` cookies into domain contexts to automatically bypass YouTube's cookie-consent prompts on Smart TVs.

---

## Stream Resolver & Architecture Data Flow

NewsHub uses a 3-tier stream resolution hierarchy to guarantee playback stability and zero-overhead performance.

```mermaid
flowchart TD
    A[User Selects Channel] --> B{Tier 1: Direct streamUrl?}
    B -- Yes (.m3u8 master playlist) --> C[HTML5 Video in WebView (1080p GPU Hardware Decoded)]
    C -- Stream Error / Timeout --> D{Tier 2: m3uUrl or embedUrl?}
    B -- No --> D
    D -- Yes (Secondary .m3u8 / Web Embed) --> E[Secondary HLS / Share Widget WebView]
    E -- Stream Error --> F[Tier 3: YouTube Live Resolver]
    D -- No --> F
    F --> G[ConsentSafeYouTubePlayer]
    G -- Offline / Error --> H[PlaybackErrorScreen]

    classDef t1 fill:#1e3a5f,stroke:#4d9de0,stroke-width:1.5px,color:#e8f1fb
    classDef t2 fill:#3d2a5c,stroke:#a685e2,stroke-width:1.5px,color:#f1eaff
    classDef t3 fill:#4a3a1e,stroke:#e0b34d,stroke-width:1.5px,color:#fdf3de
    classDef err fill:#5c1e1e,stroke:#e04d4d,stroke-width:1.5px,color:#fde3e3

    class B,C t1
    class D,E t2
    class F,G t3
    class H err
```

---

## Security Architecture & Data Protection

TV-NewsHub strictly adheres to modern security standards, data protection protocols, and input sanitization guidelines:

1. **100% Transport Layer Security (HTTPS Enforcement)**:
   All network requests, HLS `.m3u8` master playlists, web share widgets, and YouTube resolver endpoints strictly enforce TLS 1.2+ (`https://`). Zero unencrypted `http://` links exist in the dataset.
2. **Input Sanitization & Injection Prevention**:
   All dynamic stream URLs are sanitized via `sanitizeUrl()` ([`src/utils/sanitize.ts`](file:///e:/01.%20GitHub%20Repo%20Projects/TV-NewsHub/src/utils/sanitize.ts)) to strip control characters (`[`'\"\\<>]`), preventing template injection and XSS context breaking inside WebViews.
3. **Sandboxed WebView Execution**:
   Embedded web share widgets run within sandboxed `react-native-webview` instances with restricted DOM access and origin whitelisting (`originWhitelist={['*']}`).
4. **Network Request Timeouts & Leak Prevention**:
   Every network request in `useLiveChannelResolver` uses a 10-second `AbortController` timeout to prevent unhandled socket leaks. A 5-minute memory cache (`CACHE_TTL_MS = 5 * 60 * 1000`) prevents redundant network requests.
5. **Zero User Tracking & Privacy Commitment**:
   TV-NewsHub collects, tracks, stores, or transmits **no user identity, analytics, or behavioral data**. `AsyncStorage` is used strictly on-device to persist last-watched channel IDs for 10-minute auto-resume playback.

---

## Tech Stack

*   **Framework**: [react-native-tvos](https://github.com/react-native-tvos/react-native-tvos) (TV-specific fork of React Native v0.83)
*   **Navigation**: `@react-navigation/native` with `@react-navigation/native-stack`
*   **Video Engines**: Direct Hls.js HTML5 player, Web Share Widget WebView, and `ConsentSafeYouTubePlayer`
*   **Data Layer**: Custom static JSON repository loader ([`india.json`](file:///e:/01.%20GitHub%20Repo%20Projects/TV-NewsHub/src/data/countries/india.json), [`bangladesh.json`](file:///e:/01.%20GitHub%20Repo%20Projects/TV-NewsHub/src/data/countries/bangladesh.json))
*   **Testing & Security**: Jest + TypeScript (100% TLS/HTTPS enforced across all endpoints)
*   **Type System**: TypeScript 5.8

---

## Project Structure

```text
TV-NewsHub/
├── android/                   # Native Android TV build configurations & resources
├── APK Export/                # Pre-built release APKs (arm64, armeabi-v7a, universal)
├── docs/                      # Interactive showcase web app & documentation website
│     ├── index.html           # Full Smart TV showcase website & channel specs
│     ├── styles.css           # Theme-matched CSS tokens & TV simulator styles
│     └── app.js               # Interactive TV simulator logic
├── guides/                    # Architectural documentation guides
│     └── fallback-resolver-guide.md # 3-tier resolver & security architecture guide
├── public/                    # Branding assets (antenna-icon.svg, logos)
├── src/                       # Application source files
│     ├── components/          # D-pad focusable components (ChannelTile, PlayerOverlay, PlaybackErrorScreen)
│     ├── data/                # Repository pattern loaders
│     │     ├── countries/     # Country channel lists (india.json, bangladesh.json)
│     │     └── channels.ts    # Unified Channel interface & flat export mapper
│     ├── hooks/               # useLiveChannelResolver and useIdleTimer hooks
│     ├── navigation/          # Stack navigation configuration
│     ├── screens/             # HomeScreen (grid dashboard) & PlayerScreen (inline video)
│     └── utils/               # Storage, sanitize, & playerScripts helpers
└── __tests__/                 # Unit tests (App.test.tsx)
```

---

## Getting Started

### 1. Prerequisites
Ensure you have the Android SDK configured on your machine. Set up an Android TV or Google TV Emulator profile and verify it is running:
```bash
adb devices
```

### 2. Installation
Install the project dependencies:
```bash
npm install
```

### 3. Start Metro & Launch (Android TV)
```bash
# Terminal 1
npm start

# Terminal 2
npm run android
```

---

## Building Production APKs

Compile all release APK variants (`arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`, `universal`):

```cmd
:: Windows
cd android
gradlew.bat assembleRelease
```

Compiled APKs are located at `android/app/build/outputs/apk/release/`. Pre-built APKs are available in the [`APK Export/`](./APK%20Export/) folder following the mandatory version naming convention:

```text
APK Export/
├── TV-NewsHub-v0.0.5-universal.apk    (Recommended for all Smart TVs & Emulators)
├── TV-NewsHub-v0.0.5-arm64-v8a.apk    (ARM64 Android Smart TVs)
├── TV-NewsHub-v0.0.5-armeabi-v7a.apk  (32-bit ARM Legacy Smart TVs)
├── TV-NewsHub-v0.0.5-x86_64.apk       (64-bit Emulators)
├── TV-NewsHub-v0.0.5-x86.apk          (32-bit Emulators)
├── Cobalt-v2.0.2-arm64.apk             (TizenTube Cobalt Smart TV App ARM64)
└── Cobalt-v2.0.2-arm.apk               (TizenTube Cobalt Smart TV App ARM32)
```

---

## How to Boot Emulator & Install APKs via ADB

```cmd
:: 1. List Available Virtual Devices
emulator -list-avds

:: 2. Launch Emulator GUI (Standalone Foreground Window)
start emulator -avd TV_4K

:: 3. Cold Boot (Bypasses stale snapshots)
start emulator -avd TV_4K -no-snapshot-load

:: 4. Install TV-NewsHub v0.0.5
adb -s emulator-5554 install -r "APK Export/TV-NewsHub-v0.0.5-universal.apk"

:: 5. Launch TV-NewsHub Package
adb -s emulator-5554 shell am start -n com.tvnewshub/.MainActivity
```

---

## Release History

| Version | Changes |
|---------|---------|
| **0.0.5** | Configured 3-tier fallback stream engine across all 26 channels in India & Bangladesh. Integrated `PlaybackErrorScreen` component for unreachable channels. Enforced 100% HTTPS TLS security compliance across all endpoints. Unified `Channel` types. Updated documentation website (`docs/index.html`). |
| **0.0.3** | Configured multi-tier stream engine (Direct HLS 1080p master playlists, official web share widgets, and YouTube resolver). Added full Smart TV showcase web app (`docs/index.html`), custom theme-matched scrollbar, and auto-hiding scroll button. Established proper APK Export naming convention. |
| **0.0.2** | Fixed channel IDs. Rewrote live stream resolver. Fixed overlay zIndex & auto-hide timer. Cookie-consent auto-dismiss. |
| **0.0.1** | Initial release. Core grid UI, player screen, country/language filtering, D-pad navigation. |

---

## License
This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
