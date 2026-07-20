# Architecture of NewsHub TV App

This document outlines the codebase organization, data management, custom hooks, and screen architecture of the NewsHub TV app.

---

## 1. Project Directory Structure

We organize the project under `/src` to ensure clarity and split concerns cleanly:

```text
/src
  ├── components/          # Reusable UI components (TV focused)
  │     ├── ChannelTile.tsx      # Focusable video channel tile with offline state
  │     ├── LanguageTabs.tsx     # Focusable horizontal list of language filter pills
  │     ├── CountryTabs.tsx      # Focusable horizontal list of country filter pills
  │     └── PlayerOverlay.tsx    # Immersive top/bottom info overlay for player screen
  ├── data/                # Static configuration & schemas
  │     └── channels.json        # Channel registry (extendable to Firebase later)
  ├── hooks/               # Core React Hooks for TV control and APIs
  │     ├── useLiveChannelResolver.ts  # Fetches active YouTube video ID for a channel
  │     └── useIdleTimer.ts            # Manages player screen overlay inactivity timeout
  ├── navigation/          # Navigation types and container
  │     └── AppNavigator.tsx     # React Navigation root navigator configuration
  ├── screens/             # Screen components
  │     ├── HomeScreen.tsx       # Landing screen with grid and filter categories
  │     └── PlayerScreen.tsx     # Inline player screen with D-pad channel switching
  └── utils/               # Helper modules
        └── storage.ts           # Wrapper around AsyncStorage for last watched channel
```

---

## 2. Component Design & Interactions

### 2.1 Navigation Structure
We use `@react-navigation/native-stack` to switch between `HomeScreen` and `PlayerScreen`.
- **HomeScreen**: Default landing screen. Standard grid interface.
- **PlayerScreen**: Fullscreen. Receives `channelId`, `currentFilterList` (the array of channels in the active language filter), and `initialIndex` (index of the selected channel in the filtered list).

### 2.2 Focus Management (D-Pad Navigation)
- Target: Android TV / Google TV remote.
- Components leverage the `react-native-tvos` APIs:
  - `TouchableHighlight` or `Pressable` with custom styling on `focused` state.
  - Core layouts use `TVFocusGuideView` to define clear focus redirects (e.g. from the Country Tab row down to Language Tabs and into the Grid).
  - Explicit ordering: `hasTVPreferredFocus` on the first element of the default tab row to guarantee focus lands predictably when the app mounts.

---

## 3. Data Model (`channels.json`)

To support modular filtering by country first, then language, the schema expands the core model to include a `country` field:

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

This JSON sits isolated inside `src/data/channels.json` so that reading operations can eventually query Firestore or Firebase Remote Config without updating screen or component code.

---

## 4. Custom Hooks

### 4.1 Live Channel Video ID Resolver (`useLiveChannelResolver`)
This hook is responsible for fetching the current live stream `videoId` for a given `youtubeChannelId`.
- **Mechanism**:
  - Request: `fetch('https://www.youtube.com/channel/' + channelId + '/live')`
  - The fetch automatically follows redirects.
  - If redirect is successful, the `response.url` points to `watch?v=VIDEO_ID` or `/live/VIDEO_ID`. Extract the `VIDEO_ID` using a regex.
  - If the redirect URL doesn't match, parse the response text (HTML) for the substring `"videoId":"[A-Za-z0-9_-]{11}"` as a fallback.
  - If both fail, return `isError: true`.
- **States**: `isLoading`, `isError`, and `videoId`.

### 4.2 Inactivity Overlay Timer (`useIdleTimer`)
Ensures that visual player controls hide after a few seconds of user inactivity.
- **Mechanism**:
  - Listen to D-pad inputs using `TVEventHandler`.
  - On mount or any key press (Up, Down, Left, Right, Select, Back, Play/Pause), set `isVisible = true` and reset the inactivity timer (4–5 seconds).
  - When the timer elapses, set `isVisible = false`.
  - Exposes properties to trigger an overlay fade-out and animate the transition.
