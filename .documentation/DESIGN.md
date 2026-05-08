# EverSiteAudit — Design System

**Version:** 1.0.0  
**Date:** April 2026  
**Status:** Production  
**Inspiration:** Linear.app — precision tool aesthetic

---

## 1. Design Philosophy

The EverSiteAudit interface follows a **precision tool** aesthetic inspired by Linear: dark-first, information-dense, and relentlessly functional. Every element exists to serve the task of site auditing — no decorative flourishes, no gratuitious motion.

### Core Principles

1. **Dark-first** — The default theme is dark. Light and high-contrast variants are opt-in.
2. **Luminance stacking** — Elevation is communicated through background brightness steps, not drop shadows.
3. **Typography is the UI** — Content hierarchy comes from weight and size, not color or borders.
4. **Borders are structural** — Used to separate, not to decorate. Always semi-transparent.
5. **No animation libraries** — All motion uses CSS transitions or React Native `Animated`. No `react-native-reanimated`.

---

## 2. Color System

### 2.1 Dark Theme (Default)

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#08090a` | App canvas |
| `backgroundSecondary` | `#0f1011` | Cards, list rows |
| `backgroundTertiary` | `#191a1b` | Inputs, buttons, elevated surfaces |
| `backgroundElevated` | `#28282c` | Modals, dialogs, floating panels |
| `textPrimary` | `#f7f8f8` | Headlines, primary content |
| `textSecondary` | `#d0d6e0` | Body text, descriptions |
| `textTertiary` | `#8a8f98` | Metadata, timestamps, placeholders |
| `textDisabled` | `#62666d` | Inactive states |
| `border` | `rgba(255,255,255,0.08)` | Section dividers, card borders |
| `borderSubtle` | `rgba(255,255,255,0.05)` | Hairline separators |
| `primary` | `#5e6ad2` | Indigo accent — CTAs, active states |
| `primaryHover` | `#828fff` | Hover/tap feedback |
| `primaryPressed` | `#7170ff` | Active press state |
| `primarySubtle` | `rgba(94,106,210,0.15)` | Subtle highlights, chips |
| `secondary` | `rgba(255,255,255,0.04)` | Secondary buttons, tags |
| `success` | `#10b981` | Resolved, completed, positive |
| `warning` | `#d97706` | Medium severity, caution |
| `error` | `#ef4444` | Critical, destructive, validation errors |
| `scrim` | `rgba(0,0,0,0.85)` | Modal backdrop |

### 2.2 Severity Color System

| Severity | Color | Background Tint |
|----------|-------|-----------------|
| Critical | `#ef4444` | `rgba(239,68,68,0.12)` |
| High | `#f59e0b` | `rgba(245,158,11,0.12)` |
| Medium | `#d97706` | `rgba(217,119,6,0.12)` |
| Low | `#10b981` | `rgba(16,185,129,0.12)` |

### 2.3 Theme Variants

Four themes are implemented in `src/theme/colors.ts`:

1. **Dark** (default) — Deep blacks with cool grays and indigo accent
2. **Light** — Warm grays with inverted luminance; accent stays indigo
3. **High Contrast Dark** — Pure black canvas, white borders, amplified colors
4. **High Contrast Light** — Pure white canvas, black borders, amplified colors

---

## 3. Typography

### 3.1 Font

- **Family:** Inter Variable (weights 400, 510, 590, 700)
- **Source:** `expo-google-fonts/inter` loaded at app startup
- **Fallback:** System sans-serif

### 3.2 Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `hero` | 32px | 590 | Splash, empty states |
| `h1` | 28px | 590 | Screen titles |
| `h2` | 24px | 590 | Section headers |
| `h3` | 20px | 590 | Card titles, modal headers |
| `h4` | 18px | 590 | Subsection headers |
| `bodyLarge` | 17px | 400 | Primary body text |
| `body` | 16px | 400 | Standard content |
| `bodySmall` | 15px | 400 | Descriptions, labels |
| `caption` | 13px | 400 | Timestamps, metadata |
| `captionSmall` | 12px | 400 | Badges, micro-labels |
| `overline` | 11px | 590 | Section labels, uppercase |

### 3.3 Line Heights

- Headings: 1.2
- Body: 1.5
- Captions: 1.4

### 3.4 Dynamic Type

All text supports iOS Dynamic Type and Android font scaling up to 200%.

---

## 4. Spacing

### 4.1 Scale (4px Base)

| Token | Value |
|-------|-------|
| `0` | 0px |
| `1` | 4px |
| `2` | 8px |
| `3` | 12px |
| `4` | 16px |
| `5` | 20px |
| `6` | 24px |
| `8` | 32px |
| `10` | 40px |
| `12` | 48px |
| `16` | 64px |

### 4.2 Touch Targets

- **Minimum:** 48 × 48 dp (WCAG 2.1 AA)
- **Preferred:** 56 × 56 dp (primary actions)

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `micro` | 2px | Badges, toolbar buttons |
| `sm` | 4px | List items, small containers |
| `md` | 6px | Buttons, inputs, functional elements |
| `lg` | 8px | Cards, dropdowns |
| `xl` | 12px | Panels, section containers |
| `2xl` | 22px | Large panel elements |
| `full` | 9999px | Pills, chips, filter pills |

---

## 6. Shadows & Elevation

On dark surfaces, traditional drop shadows are nearly invisible. Elevation is primarily communicated through **luminance stacking** (brighter backgrounds for higher layers). Shadows are used sparingly as secondary cues.

| Level | Shadow | Elevation | Usage |
|-------|--------|-----------|-------|
| `1` | 0, 1.2, 0.03 | 1dp | Toolbar buttons |
| `2` | 0, 0, 0.2 | 2dp | Cards, input fields |
| `3` | 0, 2, 0.4 | 4dp | Dropdowns, floating elements |
| `4` | 0, 8, 0.5 | 12dp | Dialogs, modals |

---

## 7. Components

### 7.1 Button

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| **Primary** | `primary` | `primaryForeground` | none |
| **Secondary** | `secondary` | `secondaryForeground` | none |
| **Ghost** | transparent | `textSecondary` | none |
| **Destructive** | `destructive` | `destructiveForeground` | none |

- Height: 44px (compact), 48px (standard), 56px (emphasized)
- Border radius: `md` (6px)
- Press: opacity 0.8, scale 0.98

### 7.2 TextInput

- Background: `backgroundTertiary`
- Border: 1px `borderSubtle`
- Focus: border transitions to `primary`
- Border radius: `md` (6px)
- Height: 48px (single-line), auto (multi-line)

### 7.3 Card

- Background: `backgroundSecondary`
- Border: 1px `border`
- Border radius: `lg` (8px)
- Padding: 16px
- No shadow by default; luminance provides depth

### 7.4 Badge

| Type | Background | Text |
|------|------------|------|
| Severity | `severityBackground.*` | `severity.*` |
| Status | `secondary` | `textSecondary` |
| Chip | `primarySubtle` | `primary` |

- Border radius: `micro` (2px) for severity, `full` for chips
- Padding: 4px 10px

### 7.5 Toast

- Position: bottom, 16px from safe area
- Background: `backgroundElevated` with subtle shadow
- Border radius: `lg`
- Auto-dismiss: 3 seconds
- Types: info, success, warning, error

---

## 8. Animation

### 8.1 Timing

| Token | Duration | Usage |
|-------|----------|-------|
| `fast` | 150ms | Micro-interactions (button press) |
| `normal` | 250ms | State transitions (modal open) |
| `slow` | 350ms | Content changes (screen transitions) |
| `slower` | 500ms | Major layout shifts |

### 8.2 Easing

- **Default:** `cubic-bezier(0.4, 0, 0.2, 1)` — Material standard
- **Spring:** `cubic-bezier(0.34, 1.56, 0.64, 1)` — Playful overshoot

### 8.3 Motion Constraints

- All animations respect `prefers-reduced-motion`
- No `react-native-reanimated` — pure React Native `Animated` + CSS transitions
- Gestures use built-in `ScrollView`, `Pressable`, `TouchableOpacity`

---

## 9. Accessibility

### 9.1 Conformance

- WCAG 2.1 Level AA minimum
- All interactive elements have `accessibilityLabel`
- All images have `accessibilityLabel` or `accessibilityIgnoresInvertColors`
- Focus states visible on all interactive elements

### 9.2 Dynamic Type

- Full support for iOS Dynamic Type (up to 310%)
- Android font scaling up to 200%
- Layouts reflow gracefully; no text truncation at max size

### 9.3 Screen Readers

- VoiceOver (iOS) and TalkBack (Android) supported
- Semantic headings (`accessibilityRole="header"`)
- Live regions for toasts and alerts

---

## 10. Icons

- **Library:** Lucide React Native (`lucide-react-native`)
- **Size scale:** 16px (micro), 20px (standard), 24px (large), 32px (hero)
- **Color:** Inherits `textSecondary` by default; `primary` for active states
- **Stroke width:** 1.5px (consistent with Linear's thin-line aesthetic)

---

*End of Design Document*
