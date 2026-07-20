# Security Policy

We take the security of **NewsHub** seriously. This document outlines our supported versions, how to report vulnerabilities, and our secure engineering practices.

---

## Supported Versions

Only the latest active version receives security updates and patches. 

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |
| < 0.0.1 | :x:                |

---

## Reporting a Vulnerability

If you discover a security vulnerability, **please do not open a public issue.** Instead, report it privately:

1.  Send a detailed description of the vulnerability to **security@example.com** (or contact the maintainers privately).
2.  Include step-by-step instructions to reproduce the issue, along with any relevant proof-of-concept code or environment details.
3.  We will acknowledge your report within **48 hours** and provide a timeline for a resolution. We request that you follow coordinated disclosure practices and allow us time to release a patch before publicizing the vulnerability.

---

## Security Best Practices in NewsHub

To maintain a secure posture, the application implements the following security guidelines:

### 1. Secure Live Stream Resolution
*   The `useLiveChannelResolver` hook queries YouTube channels over secure HTTPS (`https://www.youtube.com/...`) only.
*   We do not perform raw stream extraction, scraping, or load unverified external payloads, mitigating middleman injection risks.

### 2. Sandbox Isolation
*   Our video player utilizes `react-native-webview` via the official `react-native-youtube-iframe` library. 
*   We restrict WebView execution and isolate local state, ensuring sandboxed execution of iframe elements.

### 3. Local Data Privacy
*   Persistent storage (`storage.ts` using `@react-native-async-storage/async-storage`) is limited exclusively to non-sensitive user preferences (the ID and timestamp of the last watched channel). 
*   No personal data, tracking cookies, or credentials are stored locally.

### 4. Code Shrinking & Obfuscation
*   Our release builds utilize **R8/ProGuard** code shrinking. 
*   This strips unused native modules, removes debug logs, and obfuscates class structures, making reverse-engineering much more difficult.
