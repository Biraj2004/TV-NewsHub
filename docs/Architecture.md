# Architecture of NewsHub TV App

This document outlines the codebase organization, data management, custom hooks, and screen architecture of the NewsHub TV app.

---

## 1. Project Directory Structure

```text
/src
  ├── components/          # Reusable UI components (TV focused)
  │     ├── ChannelTile.tsx      # Focusable channel tile — renders live/offline/checking badge, dims when offline, falls back to initial-letter avatar if logo fails to load
  │     ├── LanguageTabs.tsx     # Focusable horizontal list of language filter pills
  │     ├── CountryTabs.tsx      # Focusable horizontal list of country filter pills
  │     ├── PlayerOverlay.tsx    # Immersive top/bottom info overlay for player screen
  │     ├── StatusBadge.tsx      # Small live/offline/checking badge — shared by ChannelTile and PlayerOverlay
  │     ├── EmptyState.tsx       # Shown when a country/language combination has zero channels
  │     ├── NoInternetScreen.tsx # Full-screen no-connectivity state with silent auto-retry
  │     └── DegradedStatusBanner.tsx  # App-level banner for live-check API failures — does NOT touch existing tile states
  ├── data/                # Static configuration & schemas
  │     └── channels.json        # Channel registry (extendable to Firebase later)
  ├── hooks/               # Core React Hooks for TV control and APIs
  │     ├── useLiveChannelResolver.ts  # Fetches active YouTube video ID for a channel — exposes isLoading / isError / videoId, kept distinct so "checking" never collapses into "offline"
  │     ├── useIdleTimer.ts            # Manages player screen overlay inactivity timeout
  │     └── useNetworkStatus.ts        # Wraps NetInfo — drives NoInternetScreen, silent retry on reconnect
  ├── navigation/          # Navigation types and container
  │     └── AppNavigator.tsx     # React Navigation root navigator configuration
  ├── screens/             # Screen components
  │     ├── HomeScreen.tsx       # Landing screen with grid and filter categories; renders EmptyState / DegradedStatusBanner as needed
  │     └── PlayerScreen.tsx     # Inline player screen with D-pad channel switching; shows offline/ended message before returning to Home
  └── utils/               # Helper modules
        └── storage.ts           # Wrapper around AsyncStorage for last watched channel
```

---

## 2. Component Design & Interactions

### 2.1 Navigation Structure
`@react-navigation/native-stack` between `HomeScreen` and `PlayerScreen`.
- **HomeScreen**: default landing screen, grid interface, first launch defaults to Country = India, Language = All, focus on the first tile.
- **PlayerScreen**: fullscreen. Receives `channelId`, `currentFilterList` (channels in the active language filter), `initialIndex`.

### 2.2 Focus Management (D-Pad Navigation)
- Target: Android TV / Google TV remote (and Fire TV — verify back-button behavior separately per platform, see Design.md §7).
- `react-native-tvos` APIs:
  - `TouchableHighlight` or `Pressable` with custom `focused`-state styling.
  - `TVFocusGuideView` for explicit focus redirects (Country row → Language row → Grid).
  - `hasTVPreferredFocus` on the first element of the default tab row so focus lands predictably on mount.
  - Grid navigation does not wrap at boundaries — pressing a direction past the last tile in that direction is a no-op (Design.md §4.1).

### 2.3 New: status-aware rendering
`ChannelTile` renders one of three states, sourced from `useLiveChannelResolver`:
- `isLoading === true` → **Checking** badge (gray, pulsing)
- `isLoading === false && isError === false && videoId present` → **Live** badge (green)
- `isLoading === false && videoId absent (confirmed no live stream)` → **Offline** badge (red), tile dims

Critically: `isError === true` (the resolver call itself failed — network/API/quota issue) is **not** the same as "confirmed offline" and must not render the Offline badge. Surface it instead via `DegradedStatusBanner` at the screen level while every tile keeps its last known status. This is the fix for the original "every channel shows offline" bug — it was `isError` being treated as "no stream found" instead of "couldn't check."

---

## 3. Data Model (`channels.json`)

```json
[
  {
    "id": "abp-ananda",
    "name": "ABP Ananda",
    "language": "Bengali",
    "country": "India",
    "logo": "https://raw.githubusercontent.com/Biraj2004/TV-NewsHub/main/assets/logos/abp_ananda.png",
    "youtubeChannelId": "UC1hk9t2lGZJ3bK3Z8B57yjw"
  },
  {
    "id": "zee-24-ghanta",
    "name": "Zee 24 Ghanta",
    "language": "Bengali",
    "country": "India",
    "logo": "https://raw.githubusercontent.com/Biraj2004/TV-NewsHub/main/assets/logos/zee_24_ghanta.png",
    "youtubeChannelId": "UC79_T7p9k1R3x3fO-8x7a7Q"
  }
]
```

Isolated inside `src/data/channels.json` so reads can later target Firestore/Remote Config without touching screen or component code.

---

## 4. Custom Hooks

### 4.1 Live Channel Video ID Resolver (`useLiveChannelResolver`)
Fetches the current live stream `videoId` for a given `youtubeChannelId`.
- **Mechanism**:
  - `fetch('https://www.youtube.com/channel/' + channelId + '/live')`, follows redirects.
  - Successful redirect → `response.url` points to `watch?v=VIDEO_ID` or `/live/VIDEO_ID`; extract `VIDEO_ID` via regex.
  - If the redirect URL doesn't match, fall back to parsing response HTML for `"videoId":"[A-Za-z0-9_-]{11}"`.
  - If both fail: this is a **resolver error**, not a confirmed-offline result — return `isError: true` and leave `videoId` untouched so the UI can distinguish "couldn't check" from "checked and it's down."
- **States**: `isLoading`, `isError`, `videoId`. See §2.3 for exactly how each maps to the tile badge.

### 4.2 Inactivity Overlay Timer (`useIdleTimer`)
Hides player controls after a few seconds of inactivity.
- **Mechanism**:
  - `TVEventHandler` for D-pad input.
  - On mount or any key press (Up/Down/Left/Right/Select/Back/Play-Pause): `isVisible = true`, reset timer (4-5s).
  - Timer elapses → `isVisible = false`.
  - Exposes props to drive the overlay fade in/out animation (200ms in, 300ms out — Design.md §6.2).

### 4.3 New: Network Status (`useNetworkStatus`)
Wraps `@react-native-community/netinfo`.
- **Mechanism**: subscribes to connectivity changes; when offline, `HomeScreen`/`PlayerScreen` render `NoInternetScreen` instead of their normal content.
- Retries silently in the background (poll or rely on NetInfo's own change events) — the moment connectivity returns, the app dismisses `NoInternetScreen` automatically, no user input required.
