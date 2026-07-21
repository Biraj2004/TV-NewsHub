# Design Document: NewsHub TV App

This document details the visual style, design tokens, focus indicators, layout guidelines, animation specs, branding, 4K/FHD rendering rules, safe zones, and edge-case states for the NewsHub TV app.

---

## 1. Branding

### 1.1 Logo mark
The mark (`antenna-icon.svg`) is a signal/antenna glyph — four ascending bars, a horizontal ground line, and a short stem — drawn in white stroke on a fixed black rounded-square backdrop.

- **Clearspace**: keep empty space around the mark equal to at least the width of one bar (~4px at the 24px export size) before any other element starts. The wordmark, a focus ring, or a card edge should never crowd it.
- **Minimum size**: 20px height in any UI context. Below that the bars merge visually.
- **Backdrop is fixed**: the mark always sits on its own black square, even on the app's already-black background — this is what makes it read as an icon rather than loose linework. Never strip the backdrop.
- **Do**: use it at consistent height next to the wordmark, keep white-on-black contrast, scale uniformly.
- **Don't**: recolor the stroke, drop the backdrop, stretch it non-uniformly, or place it on a busy background without the black square.

### 1.2 Wordmark lockup
- Header lockup: logo mark at text cap-height (≈24-28sp, see §2.1) immediately left of "NewsHub," 8-10px gap, both vertically centered on the same baseline.
- Name is always one word, one capital H mid-word: **NewsHub** — never "News Hub" or "newshub."
- Tagline (splash/about only, never the persistent header): *"Every channel, one remote."*

### 1.3 App icon export set (Android TV)
- `mipmap-mdpi` 48×48, `hdpi` 72×72, `xhdpi` 96×96, `xxhdpi` 144×144, `xxxhdpi` 192×192
- Adaptive icon: foreground = glyph only (transparent bg), background layer = solid `--bg` (`#0b0b0d`) — keeps the backdrop from clipping unpredictably under Android's own masking
- TV launcher banner: 320×180 (required separately by Android TV — the launcher row won't accept a plain icon), same lockup as the header, centered, larger
- Splash: mark at ~15% of the shorter screen dimension, centered, wordmark below at app-title scale

---

## 2. Visual Aesthetics & Design System

Rich dark-mode theme, optimized for TV screens (10-foot UX) to minimize eye strain and maximize readability.

### 2.1 Color Tokens
- **Background (`--bg`)**: `#0b0b0d`
- **Card/Tile Surface (`--tile`)**: `#1c1c20`
- **Card Border (`--tile-border`)**: `#2e2e32`
- **Inactive Pill (`--pill`)**: `#2a2a2e`
- **Text Primary (`--text`)**: `#ffffff`
- **Text Secondary/Dim (`--text-dim`)**: `#c9c9cd`
- **Text Muted (`--text-mute`)**: `#8a8a8f`
- **Text Faint (`--text-faint`)**: `#6b6b70`
- **Live Indicator (`--live`)**: `#e24848`
- **Offline Indicator**: `#e24848` at reduced opacity background, `#f09595` text
- **Checking Indicator**: `#8a8a8f` at reduced opacity, pulsing dot
- **Focus Indicator (`--focus`)**: `#ffffff`

---

## 3. 10-Foot UI Specifications, at FHD and 4K

TV interfaces are viewed from 10 feet away — standard phone-sized targets are unusable. FHD (1920×1080) and 4K (3840×2160) Android TVs are both common; designing in raw pixels for one breaks on the other.

### 3.1 Typography (Scale)
Spec in `sp`/`dp` — density-independent, not raw pixels. Trust Android TV's own density reporting to scale these consistently between FHD and 4K panels of the same physical size, rather than branching layout per resolution.
- **App/Screen Titles**: 28sp / bold
- **Section Headers (e.g. Country label)**: 14sp / semi-bold / uppercase / letter spacing
- **Filter Tab Pills**: 16sp / medium
- **Channel Tile Names**: 15sp / semi-bold
- **Overlay Info text**: 18sp / bold (channel name), 12sp (subtext/hints)

### 3.2 Layout Grid (5 Columns)
- Grid container margin `32dp` minimum on all sides — calculate as a percentage of screen height (not a fixed dp) so it holds proportionally on both FHD and 4K; see §5 Safe Zones.
- 5 columns, row-gap `20dp`, column-gap `20dp`.
- Tiles: aspect-ratio `16/9` or square (e.g. `160dp × 120dp`), border radius `12dp`.

### 3.3 Rendering rule
Never hardcode pixel dimensions for text, icons, or spacing — always go through dp-based style values. The only fixed-pixel exceptions are the exported icon/banner assets in §1.3, which follow the Android TV spec directly.

### 3.4 Channel logo images
Cache logos at a resolution matched to the largest tile size they'll render at on a 4K panel (~2x the FHD tile pixel size) so they don't look soft on 4K, without over-fetching full 4K-native res for 20+ small tiles. Always set explicit width/height (or aspect-ratio) so layout doesn't jump as each logo loads.

### 3.5 Verification
Test every screen on both an actual FHD Android TV/emulator profile and a 4K Google TV profile before marking it done — emulator defaults can hide density bugs that only show on real hardware.

---

## 4. Interactive States & Focus Transitions

### 4.1 D-Pad Focus Behavior
- **Inactive State**: subtle border (`1dp` solid `#2e2e32`), scale `1.0`.
- **Focus State**: bold white border (`3dp` solid `#ffffff`), scale `1.05`. Text turns `#ffffff`.
- **Transitions**: smooth `Animated`/layout animation on focus and blur, `150ms`.
- **Boundary behavior**: pressing a direction with nothing further that way does nothing — no wrap-around. Wrapping silently disorients users who don't expect the cursor to jump to the opposite edge.

### 4.2 Pill Tabs
- **Selected**: white background, black text.
- **Focused (not selected)**: transparent background, white border.
- **Muted**: dark background, gray text.

### 4.3 Live status badge (on every channel tile)
- **Live**: green dot + "Live" label, tile renders normally.
- **Offline**: red dot + "Offline" label, tile dims (logo + name fade) — tile stays focusable; selecting it shows "This channel isn't live right now" rather than doing nothing.
- **Checking**: gray pulsing dot + "Checking" label — shown while the live lookup is genuinely in flight. A tile must never sit with no badge, and must never show "Offline" while its check is still pending.

---

## 5. Safe Zones (Overscan)

Many TVs, especially older FHD sets, still overscan and crop a border of the image.

- **Title-safe margin**: all text and branding within the inner **90%** of the screen (5% margin per side).
- **Action-safe margin**: all interactive/focusable elements within the inner **95%** (2.5% margin per side) — nothing focusable may render in the outer band, since a cropped focus target is physically unreachable by remote.
- Treat the `32dp` grid margin in §3.2 as a minimum, calculated as a percentage of screen height so it holds on both FHD and 4K.

---

## 6. Player Overlay & Animations

### 6.1 Overlay Layout
- **Top overlay**: dark top-down gradient. Channel logo (32dp), channel name, live badge (red dot + "Live"), current language on the right.
- **Bottom overlay**: dark bottom-up gradient. Play/pause, previous/next channel, back-to-grid, plus a nav hint ("Left/Right: change channel · Back: to grid").

### 6.2 Animation Timeline
- **Show (fade in)**: `200ms`, triggered by screen load or any remote/D-pad key event, opacity `0.0 → 1.0`.
- **Hide (fade out)**: `300ms`, triggered by the inactivity timer (4-5s) elapsing, opacity `1.0 → 0.0`.
- **Stream ended/offline**: show "This channel is currently offline. Returning to grid..." for `5000ms`, then auto-navigate back to `HomeScreen`.

---

## 7. Edge Case States

Every state below needs an explicit screen — nothing in the app should render blank.

| Situation | Required behavior |
|---|---|
| No internet connection | Full-screen state (not a toast): mark + "No internet connection" + retry hint. Silent background retry; auto-dismiss the instant connectivity returns, no user action needed. |
| Live-check still loading | "Checking" badge — never blank, never defaults to Offline while a request is genuinely pending. |
| Channel confirmed offline | Tile dims, red "Offline" badge, stays focusable; selecting it shows a short in-context message instead of doing nothing. |
| Stream ends mid-watch | Per §6.2 — 5000ms message, then auto-return to Home. |
| Live-check API failure/quota exceeded | Never collapse every tile to Offline. Show an app-level banner ("Having trouble checking live status — showing last known info") and preserve each tile's last known state. |
| Country/language combo with zero channels | Empty-state illustration + explanatory text (e.g. "No Tamil channels yet for Bangladesh") — never a blank grid. |
| Missing/broken channel logo | Fallback to a colored square with the channel's first initial — never a blank box. |
| Very long channel name | Single-line truncate with ellipsis at the tile's fixed width; never wrap, never overflow. |
| First launch | No login/permission screen. Default Country = India, Language = All, focus on the first tile — fewest presses to playable content. |
| Buffering during playback | Centered spinner over the video; overlay stays in whatever show/hide state it was already in — a buffer stall alone shouldn't force controls to appear. |
| D-pad at grid boundary | No wrap-around — see §4.1. |
| Back button (Fire TV vs Android TV) | Always returns one level (Player → Home), never exits unexpectedly — verify explicitly on both platforms, since back-stack handling differs slightly. |
| Idle on Home screen | After a long idle period, dim the grid slightly (separate from — and more conservative than — the Player's idle-hide) to reduce static-image burn-in risk on OLED panels. |
| Accessibility / low vision | Respect system font-scale up to a reasonable cap without breaking tile layout; TalkBack reads channel name + live/offline status as one combined announcement, not two separate reads. |
