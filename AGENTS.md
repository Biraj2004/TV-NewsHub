# AGENTS.md — TV-NewsHub Development & Architecture Guidelines

> **Project Name**: TV-NewsHub  
> **Maintainer**: Biraj2004 ([GitHub Repository](https://github.com/Biraj2004/TV-NewsHub))  
> **Target OS**: Android TV | Google TV | Fire TV (React Native TVOS v0.83)  
> **License**: Apache 2.0  
> **Current Version**: `v0.0.2`  

---

## 📌 Critical Directives & Rules for AI Coding Agents

### 1. APK Export Naming Convention
Whenever building release APKs (`gradlew assembleRelease`), **ALWAYS** copy the generated APK files from `android/app/build/outputs/apk/release/` into the `APK Export/` folder using the exact proper app name and version format:

```text
APK Export/
├── TV-NewsHub-v0.0.2-universal.apk    (Recommended for all Smart TVs)
├── TV-NewsHub-v0.0.2-arm64-v8a.apk    (ARM64 Android Smart TVs)
├── TV-NewsHub-v0.0.2-armeabi-v7a.apk  (32-bit ARM Legacy TVs)
├── TV-NewsHub-v0.0.2-x86_64.apk       (64-bit Emulators/Intel TVs)
├── TV-NewsHub-v0.0.2-x86.apk          (32-bit Emulators/Intel TVs)
├── Cobalt-v2.0.2-arm64.apk             (TizenTube Cobalt Smart TV App ARM64)
└── Cobalt-v2.0.2-arm.apk               (TizenTube Cobalt Smart TV App ARM)
```

> ⚠️ **Rule**: Never leave generic filenames like `app-release.apk` or `app-universal-release.apk` in the root export folder. Always prepend `TV-NewsHub-v<Version>-<arch>.apk`.

### 2. Virtual Emulator Boot & ADB Commands (Windows CMD)
When starting or deploying onto a virtual Android TV emulator, **ALWAYS** use Command Prompt (`cmd`) `start` commands so the GUI window launches in the foreground:

```cmd
:: 1. List available virtual devices
emulator -list-avds

:: 2. Launch Emulator GUI (Standalone Foreground Window)
start emulator -avd TV_4K

:: 3. Cold Boot (Bypasses stale snapshots)
start emulator -avd TV_4K -no-snapshot-load

:: 4. Install TV-NewsHub v0.0.2
adb -s emulator-5554 install -r "APK Export/TV-NewsHub-v0.0.2-universal.apk"

:: 5. Install Cobalt Smart TV App
adb -s emulator-5554 install -r "APK Export/Cobalt-v2.0.2-arm.apk"

:: 6. Launch TV-NewsHub Package
adb -s emulator-5554 shell am start -n com.tempnewshub/.MainActivity

:: 7. Launch Cobalt Package
adb -s emulator-5554 shell monkey -p io.gh.reisxd.tizentube.cobalt 1
```

---

## 📺 Stream Provider & Fallback Architecture

TV-NewsHub implements a 3-tier stream resolution hierarchy in [`src/screens/PlayerScreen.tsx`](file:///e:/01.%20GitHub%20Repo%20Projects/TV-NewsHub/src/screens/PlayerScreen.tsx) and [`src/hooks/useLiveChannelResolver.ts`](file:///e:/01.%20GitHub%20Repo%20Projects/TV-NewsHub/src/hooks/useLiveChannelResolver.ts):

```mermaid
flowchart TD
    A[User Selects Channel] --> B{Tier 1: Direct streamUrl?}
    B -- Yes (.m3u8 master playlist) --> C[HTML5 Video Container in WebView (1080p GPU Hardware Decoded)]
    B -- No --> D{Tier 2: Official embedUrl?}
    D -- Yes (Official Share Widget) --> E[Isolated Web Share Widget WebView]
    D -- No --> F[Tier 3: YouTube Live Resolver (ConsentSafeYouTubePlayer)]
```

### Stream Tier Hierarchy Details:
1. **Tier 1 (`streamUrl`)**: Direct Akamai / CloudFront HLS `.m3u8` master playlists (1080p Full HD @ 3.9 Mbps). Rendered using an HTML5 `<video>` player container with `Hls.js` inside `react-native-webview` for GPU hardware decoding.
2. **Tier 2 (`embedUrl`)**: Official broadcaster web player share widgets (e.g. `bengali.abplive.com/sharewidget/live-tv.html`). Rendered in isolated WebView containers.
3. **Tier 3 (`youtubeChannelId`)**: Desktop User-Agent YouTube Live Canonical Resolver fallback with real-time news title extraction.

---

## 🇧🇩 Configured Bengali News Channels

All 5 primary Bengali news channels are configured in [`src/data/countries/india.json`](file:///e:/01.%20GitHub%20Repo%20Projects/TV-NewsHub/src/data/countries/india.json):

| Channel Name | Language | Stream Type | CDN / Endpoint Source | Resolution | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Republic Bangla** | Bengali | Direct HLS (`streamUrl`) | Akamai CDN Master Playlist | 1080p Full HD | Active |
| **ABP Ananda** | Bengali | Web Share (`embedUrl`) | `bengali.abplive.com/sharewidget/...` | 1080p Container | Active |
| **TV9 Bangla** | Bengali | Direct HLS (`streamUrl`) | CloudFront CDN Adaptive Stream | 1080p / 720p HD | Active |
| **News18 Bangla** | Bengali | Direct HLS (`streamUrl`) | Akamai Broadpeak Origin Packager | 1080p / 720p HD | Active |
| **Zee 24 Ghanta** | Bengali | Web Share (`embedUrl`) | `zeenews.india.com/bengali/...` | 1080p Container | Active |

---

## 🎮 Smart TV Remote & UI Conventions

1. **Focus & Zoom Engine**:
   * All channel tiles, country chips, and language filter tabs scale up by `1.05x` and display a bold `#ffffff` border on focus.
2. **D-Pad Zapping**:
   * Pressing **LEFT / RIGHT D-Pad** keys while playing a channel instantly hops to the previous/next channel in the active list.
3. **Overlay & Timeout**:
   * Translucent player overlay automatically fades out after 4 seconds of inactivity. Pressing any D-Pad key fades it back in.
4. **Cookie Consent Auto-Dismiss**:
   * `ConsentSafeYouTubePlayer` injects `CONSENT=YES+` cookies and auto-dismisses cookie overlays inside WebViews.
5. **D-Pad Focus Retention**:
   * Includes an invisible `FocusGrabber` pressable overlay to retain TV remote focus above WebViews.

---

## 🌐 Documentation & Interactive Replica

* **Interactive Showcase Web App**: [`public/screens.html`](file:///e:/01.%20GitHub%20Repo%20Projects/TV-NewsHub/public/screens.html)
* **Features**: Interactive Smart TV screen simulator, local logo asset rendering, theme-matched medium slim scrollbar, auto-hiding scroll-to-top button, security policy, privacy statement, and legal copyright disclaimers.
