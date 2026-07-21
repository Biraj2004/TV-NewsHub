# Build Instructions for NewsHub TV App

Setup and execution steps to run NewsHub on an Android TV / Google TV / Fire TV emulator or physical device.

## Prerequisites

- **Node.js**: v18.0.0 or higher (v22.13.0 recommended)
- **Java Development Kit (JDK)**: OpenJDK 17 or 21 (Temurin-21.0.10+7 recommended)
- **Android Studio & SDK**:
  - Android SDK Platform 34 or similar
  - Two Android TV emulator profiles configured — see §3.1, needed for FHD/4K verification
  - Environment variable `ANDROID_HOME` pointing to your Android SDK path (e.g. `C:\Users\<user>\AppData\Local\Android\Sdk`)

---

## 1. Project Initialization

```bash
# Clean initialization into a subfolder
npx @react-native-community/cli@latest init TempNewsHub --template @react-native-tvos/template-tv --skip-install

# Move folders/files to workspace root
mv TempNewsHub/* .
mv TempNewsHub/.* .
rm -rf TempNewsHub
```

---

## 2. Dependency Installation

```bash
# Core Navigation packages
npm install @react-navigation/native @react-navigation/native-stack

# Dependencies for react-navigation
npm install react-native-screens react-native-safe-area-context

# WebView and YouTube Player packages
npm install react-native-webview react-native-youtube-iframe

# Local persistence storage
npm install @react-native-async-storage/async-storage

# Network status (drives NoInternetScreen — see Architecture.md §4.3)
npm install @react-native-community/netinfo
```

---

## 3. Running the App

### 3.1 Set up TWO Android TV emulator profiles
Design.md §3 requires verifying every screen on both an FHD and a 4K panel — emulator defaults alone can hide density bugs that only appear on real hardware, so treat these as the minimum check before a build is considered done:
1. Open Android Studio → Device Manager.
2. Create **Android TV (1080p)** — standard FHD profile.
3. Create a second profile using a **4K-resolution TV device definition** (or a custom hardware profile at 3840×2160) with the same Android TV / Google TV system image (API 30+).
4. Keep both available and spot-check new screens on each before merging.

### 3.2 Start the Metro Bundler
```bash
npm start
```

### 3.3 Launch an Android TV Emulator
1. Start whichever virtual device (FHD or 4K) you're testing.
2. Verify it is detected: `adb devices`.

### 3.4 Build & Install on the Device
```bash
npx react-native run-android
```

---

## 4. App Icon & Banner Assets

Export the logo mark (`antenna-icon.svg`) per Design.md §1.3 before a release build:

```text
android/app/src/main/res/
  mipmap-mdpi/ic_launcher.png       48×48
  mipmap-hdpi/ic_launcher.png       72×72
  mipmap-xhdpi/ic_launcher.png      96×96
  mipmap-xxhdpi/ic_launcher.png     144×144
  mipmap-xxxhdpi/ic_launcher.png    192×192
  drawable/banner_tv.png            320×180   # required separately — Android TV launcher row won't accept a plain icon
```

For the adaptive icon, split into two layers rather than one flat PNG:
- Foreground: the glyph only, transparent background
- Background: solid `#0b0b0d` (`--bg`)

This keeps the black backdrop from being clipped unpredictably by Android's own adaptive-icon masking.

---

## Troubleshooting

### Android Build Fails due to Java Version
Ensure your system uses JDK 17 or 21. Check via `java -version`. Gradle configuration in `android/build.gradle` will match this JDK version.

### Metro Bundler Port Conflict
```bash
npm start -- --port 8088
npx react-native run-android --port 8088
```

### Focusing Issues in Emulator
If the emulator doesn't respond to D-pad arrow keys, check "Hardware keyboard present" in emulator settings, or send keys directly:
* **UP**: `adb shell input keyevent 19`
* **DOWN**: `adb shell input keyevent 20`
* **LEFT**: `adb shell input keyevent 21`
* **RIGHT**: `adb shell input keyevent 22`
* **CENTER (OK)**: `adb shell input keyevent 23`
* **BACK**: `adb shell input keyevent 4`

### Every channel shows "Offline"
This is the known bug covered in Architecture.md §2.3 — check `useLiveChannelResolver`'s `isError` handling first. If a failed/quota-exceeded API call is being mapped to "no live stream found" instead of a distinct error state, every tile will incorrectly show Offline at once. Confirm the YouTube Data API key is valid and not over quota before assuming the channel IDs themselves are wrong.

### Testing offline mode
Toggle the emulator's network off (Extended Controls → Cellular/Network, or `adb shell svc wifi disable`) to verify `NoInternetScreen` appears and that it auto-dismisses on re-enabling network, without requiring a manual retry press.
