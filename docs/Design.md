# Design Document: NewsHub TV App

This document details the visual style, design tokens, focus indicators, layout guidelines, and animation specs for the NewsHub TV app.

---

## 1. Visual Aesthetics & Design System

The application utilizes a rich dark-mode theme, optimized for TV screens (10-foot user experience) to minimize eye strain and maximize readability.

### 1.1 Color Tokens
- **Background (`--bg`)**: `#0b0b0d` (Deep charcoal/black)
- **Card/Tile Surface (`--tile`)**: `#1c1c20` (Dark gray)
- **Card Border (`--tile-border`)**: `#2e2e32` (Subtle gray separator)
- **Inactive Pill (`--pill`)**: `#2a2a2e` (Secondary dark gray)
- **Text Primary (`--text`)**: `#ffffff` (Pure white)
- **Text Secondary/Dim (`--text-dim`)**: `#c9c9cd` (Light gray)
- **Text Muted (`--text-mute`)**: `#8a8a8f` (Medium gray)
- **Text Faint (`--text-faint`)**: `#6b6b70` (Darker gray for metadata/labels)
- **Live Indicator (`--live`)**: `#e24848` (Vibrant warning red)
- **Focus Indicator (`--focus`)**: `#ffffff` (Bright white border)

---

## 2. 10-Foot UI Specifications

TV interfaces are viewed from 10 feet away. Standard phone-sized targets are unusable.

### 2.1 Typography (Scale)
- **App/Screen Titles**: 28sp / bold
- **Section Headers (e.g. Country label)**: 14sp / semi-bold / uppercase / letter spacing
- **Filter Tab Pills**: 16sp / medium
- **Channel Tile Names**: 15sp / semi-bold
- **Overlay Info text**: 18sp / bold (Channel name), 12sp (Subtext/hints)

### 2.2 Layout Grid (5 Columns)
- Grid container features a margin of `32dp` on all sides to respect TV safe zones.
- Channel Grid uses 5 columns with a row-gap of `20dp` and column-gap of `20dp`.
- Individual tiles have an aspect-ratio of `16/9` or square (e.g., `width: 160dp, height: 120dp`), featuring a rounded border radius of `12dp`.

---

## 3. Interactive States & Focus Transitions

### 3.1 D-Pad Focus Behavior
- **Inactive State**: Subtle border (`1dp` solid `#2e2e32`), standard scale (`1.0`).
- **Focus State**: Bold white border (`3dp` solid `#ffffff`), scaled up by `1.05` to provide clear physical location feedback. Text changes color to `#ffffff`.
- **Transitions**: Smooth layout animation using React Native's `Animated` library or layout transitions on focus and blur (duration `150ms`).

### 3.2 Pill Tabs
- **Selected Tab**: White background, black text.
- **Focused (but not Selected) Tab**: Transparent background, white border.
- **Muted Tab**: Dark background, gray text.

---

## 4. Player Overlay & Animations

### 4.1 Overlay Layout
- **Top Overlay**: Dark gradient overlay from top down. Contains Channel Logo (32dp), Channel Name, Live Badge (red dot + "Live"), and the current Language on the right.
- **Bottom Overlay**: Dark gradient overlay from bottom up. Displays control actions (Play/Pause, Previous/Next channel) and navigation tips (e.g., "Left/Right: change channel • Back: to grid").

### 4.2 Animation Timeline
- **Show Overlay (Fade In)**:
  - Duration: `200ms`
  - Trigger: Screen load, or any remote/D-pad key event.
  - Opacity: Animate from `0.0` to `1.0`.
- **Hide Overlay (Fade Out)**:
  - Duration: `300ms`
  - Trigger: Inactivity timer (4-5 seconds) expires.
  - Opacity: Animate from `1.0` to `0.0`.
- **Stream ended/offline Screen**:
  - Show message text: "This channel is currently offline. Returning to grid..."
  - Duration: Show for `5000ms`, then trigger programmatic back navigation to `HomeScreen`.
