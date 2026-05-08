# Design System: Linear (Adapted for EverSiteAudit)

> **Source:** awesome-design-md-main / linear.app  
> **Adapted for:** React Native 0.76 + Expo 52 mobile app  
> **App type:** Offline-first construction/site inspection tool  

---

## 1. Visual Theme & Atmosphere

Dark-mode-first product design — a near-black canvas (`#08090a`) where content emerges from darkness. Extreme precision engineering: every element exists in a carefully calibrated hierarchy of luminance, from barely-visible borders to soft, luminous text.

**Key Characteristics:**
- Dark-mode-native: `#08090a` marketing background, `#0f1011` panel background, `#191a1b` elevated surfaces
- Inter Variable with `"cv01", "ss03"` globally — geometric alternates for a cleaner aesthetic
- Signature weight 510 (between regular and medium) for most UI text
- Brand indigo-violet: `#5e6ad2` (bg) / `#7170ff` (accent) / `#828fff` (hover)
- Semi-transparent white borders throughout: `rgba(255,255,255,0.05)` to `rgba(255,255,255,0.08)`
- Button backgrounds at near-zero opacity: `rgba(255,255,255,0.02)` to `rgba(255,255,255,0.05)`

## 2. Color Palette & Roles

### Dark Theme (Primary)
| Token | Value | Role |
|-------|-------|------|
| background | `#08090a` | Deepest canvas |
| backgroundSecondary | `#0f1011` | Panels, sidebars |
| backgroundTertiary | `#191a1b` | Elevated surfaces, cards |
| backgroundElevated | `#28282c` | Hover states, highest elevation |
| textPrimary | `#f7f8f8` | Primary text (not pure white) |
| textSecondary | `#d0d6e0` | Body text, descriptions |
| textTertiary | `#8a8f98` | Placeholders, metadata |
| textDisabled | `#62666d` | Timestamps, disabled states |
| primary | `#5e6ad2` | Brand indigo — CTAs only |
| primaryHover | `#828fff` | Hover on primary elements |
| primaryPressed | `#7170ff` | Active/pressed state |
| primarySubtle | `rgba(94,106,210,0.15)` | Subtle primary tint |
| secondary | `rgba(255,255,255,0.04)` | Secondary button bg |
| secondaryForeground | `#d0d6e0` | Secondary button text |
| border | `rgba(255,255,255,0.08)` | Standard borders |
| borderSubtle | `rgba(255,255,255,0.05)` | Subtle borders |
| scrim | `rgba(0,0,0,0.85)` | Modal backdrop |
| success | `#10b981` | Success indicators |
| warning | `#d97706` | Warning (adapted for construction) |
| error | `#ef4444` | Error states |
| info | `#7170ff` | Info (uses accent violet) |

### Light Theme (Inverted)
| Token | Value | Role |
|-------|-------|------|
| background | `#f7f8f8` | Page background |
| backgroundSecondary | `#f3f4f5` | Subtle surfaces |
| backgroundTertiary | `#e8e8ea` | Elevated cards |
| backgroundElevated | `#ffffff` | Highest elevation |
| textPrimary | `#1a1a1a` | Primary text |
| textSecondary | `#4a4a4a` | Body text |
| textTertiary | `#6e6e6e` | Metadata |
| textDisabled | `#9e9e9e` | Disabled |
| primary | `#5e6ad2` | Brand indigo |
| primaryHover | `#4a55b8` | Darker hover for light bg |
| border | `#d0d6e0` | Visible borders |
| borderSubtle | `#e6e6e6` | Subtle borders |

## 3. Typography Rules

### Font Family
- **Primary:** `Inter` (system fallback chain)
- **Monospace:** `ui-monospace, SF Mono, Menlo, monospace`

### Hierarchy (Mobile-Adapted)
| Token | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| display | 32px | 510 | 1.00 | -0.5px |
| heading-lg | 24px | 510 | 1.10 | -0.3px |
| heading-md | 20px | 590 | 1.20 | -0.2px |
| heading-sm | 16px | 510 | 1.30 | normal |
| bodyLarge | 16px | 400 | 1.50 | normal |
| body | 15px | 400 | 1.60 | -0.165px |
| bodySmall | 14px | 400 | 1.50 | normal |
| caption | 13px | 510 | 1.50 | -0.13px |
| captionSmall | 12px | 510 | 1.40 | normal |
| overline | 11px | 510 | 1.40 | normal |

### Principles
- **510 is the signature weight:** Default emphasis weight — subtle bold without heaviness
- **Compression at scale:** Display/heading sizes use negative letter-spacing
- **Three-tier weight system:** 400 (reading), 510 (emphasis/UI), 590 (strong emphasis)

## 4. Component Stylings

### Buttons
**Ghost (Default)**
- bg: `rgba(255,255,255,0.02)`, border: `1px solid rgba(255,255,255,0.08)`, radius: 6px

**Subtle**
- bg: `rgba(255,255,255,0.04)`, text: `#d0d6e0`, radius: 6px

**Primary**
- bg: `#5e6ad2`, text: `#ffffff`, radius: 6px, hover: `#828fff`

**Pill**
- bg: transparent, border: `1px solid #23252a`, radius: 9999px

### Cards
- bg: `rgba(255,255,255,0.02)` to `rgba(255,255,255,0.05)` (translucent)
- border: `1px solid rgba(255,255,255,0.08)`
- radius: 8px (standard), 12px (featured)

### Inputs
- bg: `rgba(255,255,255,0.02)`, border: `1px solid rgba(255,255,255,0.08)`
- focus: border lightens to `rgba(255,255,255,0.15)`

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px

### Border Radius Scale
- 2px: badges, toolbar buttons
- 6px: buttons, inputs
- 8px: cards, dropdowns
- 12px: panels, featured cards
- 9999px: pills, chips

## 6. Depth & Elevation

| Level | Treatment |
|-------|-----------|
| Flat | No shadow, `#08090a` bg |
| Surface | `rgba(255,255,255,0.05)` bg + border |
| Elevated | `rgba(255,255,255,0.08)` bg + border |
| Dialog | Multi-layer shadow + `rgba(0,0,0,0.85)` scrim |

## 7. Do's and Don'ts

- ✅ Use weight 510 as default emphasis weight
- ✅ Build on near-black backgrounds in dark mode
- ✅ Use semi-transparent white borders instead of solid dark borders
- ✅ Keep button backgrounds nearly transparent
- ✅ Reserve brand indigo for primary CTAs only
- ✅ Use `#f7f8f8` for primary text — not pure `#ffffff`
- ❌ Don't use pure white as primary text
- ❌ Don't use solid colored backgrounds for buttons
- ❌ Don't apply brand indigo decoratively
- ❌ Don't introduce warm colors into UI chrome
- ❌ Don't use drop shadows for elevation on dark surfaces
