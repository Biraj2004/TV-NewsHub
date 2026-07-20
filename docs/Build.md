# Build Instructions for NewsHub TV App

This document provides setup and execution steps to run NewsHub on an Android TV / Google TV / Fire TV emulator or physical device.

## Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: v18.0.0 or higher (v22.13.0 recommended)
- **Java Development Kit (JDK)**: OpenJDK 17 or 21 (Temurin-21.0.10+7 recommended)
- **Android Studio & SDK**:
  - Android SDK Platform 34 or similar
  - Android TV emulator configured (preferably Android 11.0 / API 30 or higher, with Google TV or Android TV system image)
  - Environment variable `ANDROID_HOME` pointing to your Android SDK path (e.g., `C:\Users\<user>\AppData\Local\Android\Sdk`)

---

## 1. Project Initialization

If the workspace has not been initialized with the TV-focused React Native template:

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

Install the required routing, player, and storage packages:

```bash
# Core Navigation packages
npm install @react-navigation/native @react-navigation/native-stack

# Dependencies for react-navigation
npm install react-native-screens react-native-safe-area-context

# WebView and YouTube Player packages
npm install react-native-webview react-native-youtube-iframe

# Local persistence storage
npm install @react-native-async-storage/async-storage
```

---

## 3. Running the App

### Step 3.1: Start the Metro Bundler
In a separate terminal window, start the local React Native bundler:

```bash
npm start
```

### Step 3.2: Launch the Android TV Emulator
Make sure an Android TV virtual device is running:
1. Open Android Studio -> Device Manager.
2. Select or create an **Android TV (1080p)** emulator.
3. Start the virtual device.
4. Verify it is detected: `adb devices`.

### Step 3.3: Build & Install on the Device
Compile and install the debug version of the app on the running emulator:

```bash
npx react-native run-android
```

---

## Troubleshooting

### Android Build Fails due to Java Version
Ensure your system uses JDK 17 or 21. Check via `java -version`. Gradle configuration in `android/build.gradle` will match this JDK version.

### Metro Bundler Port Conflict
If port 8081 is occupied, start Metro on a different port:
```bash
npm start -- --port 8088
npx react-native run-android --port 8088
```

### Focusing Issues in Emulator
If the emulator does not respond to D-pad arrow keys, check if "Hardware keyboard present" is enabled in the emulator settings, or use `adb shell input keyevent` to send keys:
* **UP**: `adb shell input keyevent 19`
* **DOWN**: `adb shell input keyevent 20`
* **LEFT**: `adb shell input keyevent 21`
* **RIGHT**: `adb shell input keyevent 22`
* **CENTER (OK)**: `adb shell input keyevent 23`
* **BACK**: `adb shell input keyevent 4`
