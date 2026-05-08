---
type: tokens
path: src/theme/
---

# Design Tokens

All tokens co-exported from `src/theme/index.ts`.

## Colors

**File:** `src/theme/colors.ts`

| Token | Dark | Light | HighContrastDark | HighContrastLight |
|-------|------|-------|------------------|-------------------|
| `primary` | `#4A9EFF` | `#0066CC` | `#7AB8FF` | `#004499` |
| `background` | `#0D1117` | `#FFFFFF` | `#000000` | `#FFFFFF` |
| `backgroundSecondary` | `#111820` | `#F6F8FA` | `#0A0A0A` | `#F0F0F0` |
| `textPrimary` | `#F0F6FC` | `#1F2328` | `#FFFFFF` | `#000000` |
| `textSecondary` | `#8B949E` | `#656D76` | `#E0E0E0` | `#1A1A1A` |
| `border` | `#30363D` | `#D0D7DE` | `#FFFFFF` | `#000000` |
| `success` | `#06D6A0` | `#047857` | `#00E6A8` | `#006600` |
| `warning` | `#FFD166` | `#B35900` | `#FFE066` | `#92400E` |
| `error` | `#FF4757` | `#DC2626` | `#FF6B7A` | `#991B1B` |

## Typography

**File:** `src/theme/typography.ts`

| Token | Value |
|-------|-------|
| `fontFamily.primary` | `Inter` |
| `fontSizes.hero` | `32` |
| `fontSizes.h1` | `28` |
| `fontSizes.h2` | `24` |
| `fontSizes.body` | `16` |
| `fontSizes.caption` | `13` |
| `fontSizes.overline` | `11` |
| `fontWeights.semibold` | `'600'` |

## Spacing

**File:** `src/theme/spacing.ts`

4px base grid: `4`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `64`

Touch targets: minimum `48dp`, preferred `56dp`

## Shadows

**File:** `src/theme/shadows.ts`

| Level | shadowRadius | elevation |
|-------|--------------|-----------|
| `1` | `3` | `2` |
| `2` | `10` | `5` |
| `3` | `20` | `10` |
| `4` | `40` | `16` |

## Border Radius

**File:** `src/theme/radius.ts`

| Token | Value |
|-------|-------|
| `sm` | `4` |
| `md` | `12` |
| `lg` | `16` |
| `xl` | `20` |
| `full` | `9999` |

## Animation Timing

**File:** `src/theme/animations.ts`

| Token | Value |
|-------|-------|
| `durations.fast` | `150` |
| `durations.normal` | `250` |
| `durations.slow` | `350` |
| `durations.slower` | `500` |

## Related

- [[ThemeProvider]]
- [[UI Components Index]]
