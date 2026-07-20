# <p align="center">📺 NewsHub</p>

<p align="center">
  <img src="public/antenna-icon.svg" width="120" height="120" alt="NewsHub TV Logo" />
</p>

<p align="center">
  <strong>A premium, open-source, dark-themed Android TV aggregator of live news channels. Built for the 10-foot viewing experience.</strong>
</p>

<p align="center">
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/Framework-React%20Native%20TVOS%20v0.83-blue.svg?style=flat-square&logo=react" alt="React Native TVOS" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/Language-TypeScript-blue.svg?style=flat-square&logo=typescript" alt="TypeScript" /></a>
  <a href="https://jestjs.io/"><img src="https://img.shields.io/badge/Tests-Jest%20Passed-brightgreen.svg?style=flat-square&logo=jest" alt="Jest Tests" /></a>
  <a href="https://developer.android.com/tv"><img src="https://img.shields.io/badge/Platform-Android%20TV%20%7C%20Google%20TV%20%7C%20Fire%20TV-green.svg?style=flat-square&logo=android" alt="Target Platforms" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-orange.svg?style=flat-square" alt="License" /></a>
  <a href="SECURITY.md"><img src="https://img.shields.io/badge/Security-Policy%20Active-brightgreen.svg?style=flat-square" alt="Security Policy" /></a>
</p>

---

NewsHub is a dedicated smart TV application designed from the ground up for remote-controlled interfaces. It aggregates live news streams by country and language, resolving active YouTube live stream IDs dynamically and playing them inline using an embedded player — ensuring users enjoy a seamless, full-screen viewing experience without ever leaving the application.

This repository is **exclusively optimized for Android TV, Google TV, Fire TV, and other Android-based smart TVs**. All native iOS modules, configurations, and CocoaPods files have been completely stripped out to ensure a lean, lightweight, and focused codebase.

---

## ✨ Features & TV OS UI Highlights

*   **🔍 Optimized 10-Foot Focus & Zoom**:
    Focusable items (channel cards, country pills, language tabs) scale up by `1.05x` and draw a bold white border on focus. Large type sizes and high-contrast layouts ensure readability from a distance of 10 feet.
*   **🌐 Country & Language Filtering**:
    Dynamically loads and groups channels based on country directories (e.g., India 🇮🇳, Bangladesh 🇧🇩) and provides language tabs (e.g., Bengali, All) corresponding to active channels.
*   **⏰ Live Clock & Status Badges**:
    Features an active digital clock on the home dashboard. Displays clean "OFFLINE" badges on tiles if live streams fail to resolve or go offline.
*   **🕒 Last-Watched Auto-Resume**:
    Persists your last-viewed channel and timestamp via AsyncStorage. If you reopen the app within **10 minutes**, it bypasses the dashboard and opens the live stream immediately.
*   **🍿 Immersive Player Overlay**:
    Smoothly fades out stream controls and channel details after **4 seconds** of inactivity (`300ms` fade-out) for distraction-free viewing. Pressing any remote D-pad key instantly fades the overlay back in (`200ms` fade-in) and resets the timer.
*   **🔄 D-Pad Channel Hopping**:
    While in full-screen playback, press **Left/Right D-pad keys** to hop between adjacent channels within the active filter list instantly, without exiting to the dashboard.
*   **↩️ Back Button Focus Target**:
    Exiting the player returns the user to the home screen grid with focus landed directly on the tile of the channel they were just watching.

---

## 🏗 Architecture & Data Flow

NewsHub uses the **Repository Pattern** to separate the user interface from the data layer. This makes it easy to swap out the local JSON configurations for a remote database (like Firebase Firestore or Remote Config) in the future without changing any component logic.

```mermaid
graph TD
    subgraph Data Layer
        A[india.json] --> C[channels.ts Repository Loader]
        B[bangladesh.json] --> C
    end

    subgraph Logic & Hooks
        C --> D[useLiveChannelResolver]
        C --> G[HomeScreen State]
        E[AsyncStorage] --> F[storage.ts Utility]
        F --> G
        G --> F
    end

    subgraph UI & Navigation
        G -->|Play Stream| H[PlayerScreen]
        D -->|Resolves Video ID| H
        H -->|D-pad Switch| D
        H -->|Back Focus| G
    end
```

---

## 🛠 Tech Stack

*   **Framework**: [react-native-tvos](https://github.com/react-native-tvos/react-native-tvos) (TV-specific fork of React Native)
*   **Navigation**: `@react-navigation/native` with `@react-navigation/native-stack`
*   **Video Engine**: `react-native-youtube-iframe` (safely wraps YouTube IFrame Player API in `react-native-webview`)
*   **Data Layer**: Custom static JSON repository loader
*   **Testing**: Jest + `react-test-renderer` with fully mocked native dependencies
*   **Type System**: TypeScript

---

## 📂 Project Structure

```text
TV-NewsHub/
├── android/               # Native Android TV build configurations & resources
├── docs/                  # Technical documentation
│     ├── Build.md         # Setup, compiler guidelines, & run commands
│     ├── Architecture.md  # Repository patterns, hooks, and D-pad lifecycle
│     └── Design.md        # Typography scale, focus indicators, & animation tokens
├── public/                # Branding assets (TV banner, antenna-icon.svg)
├── src/                   # Application source files
│     ├── components/      # D-pad focusable components (ChannelTile, Pills, Overlays)
│     ├── data/            # Repository pattern loaders
│     │     ├── countries/ # Country-based channel lists (india.json, bangladesh.json)
│     │     └── channels.ts# Static registry and dynamic export mapper
│     ├── hooks/           # useLiveChannelResolver and useIdleTimer hooks
│     ├── navigation/      # Stack navigation configuration
│     ├── screens/         # HomeScreen (grid dashboard) & PlayerScreen (inline video)
│     └── utils/           # AsyncStorage persistence layer
└── __tests__/             # Unit tests (App.test.tsx)
```

---

## 🚀 Getting Started

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

### 3. Start the Metro Bundler
Start Metro in the terminal:
```bash
npm start
```

### 4. Compile & Launch (Android TV)
In a new terminal window, compile the app and deploy it onto your active TV emulator/device:
```bash
npm run android
```

---

## 🧪 Running Unit Tests

We use Jest for unit testing. Mocks for React Navigation, AsyncStorage, WebView, and the native video player are pre-configured inside `jest.setup.js`.

To run the tests:
```bash
npm test
```

---

## 📦 Building Production APKs

Compile the optimized release APK using the Gradle wrapper:
```bash
cd android
./gradlew assembleRelease
```
The compiled release package will be located at:
`android/app/build/outputs/apk/release/app-release.apk`

---

## 📄 License
This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
