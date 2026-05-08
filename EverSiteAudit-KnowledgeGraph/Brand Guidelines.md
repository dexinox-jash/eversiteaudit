---
type: governance
source: design/brand-guidelines.md
parent: [[Design System]]
---

# Brand Guidelines

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#4A9EFF` | Buttons, active states, accents |
| Primary Hover | `#6BB3FF` | Hover states (web only) |
| Primary Pressed | `#3A8EEF` | Pressed states |
| Success | `#06D6A0` | Completed actions, low severity |
| Warning | `#FFD166` | Caution banners, medium severity |
| Error | `#FF4757` | Errors, critical severity, urgent backups |
| Info | `#4A9EFF` | Informational badges |

### Severity Palette

| Level | Color | Hex |
|-------|-------|-----|
| Critical | Red | `#FF4757` |
| High | Orange | `#FF8C42` |
| Medium | Yellow | `#FFD166` |
| Low | Green | `#06D6A0` |

### Severity Background (tinted overlays)

| Level | Hex (Dark) | Hex (Light) | Hex (HC Dark) | Hex (HC Light) |
|-------|------------|-------------|---------------|----------------|
| Critical | `#FF475720` | `#DC262620` | `#FF6B7A20` | `#991B1B20` |
| High | `#FF8C4220` | `#C2410C20` | `#FF9F7020` | `#7C2D1220` |
| Medium | `#FFD16620` | `#A1620720` | `#FFE06620` | `#713F1220` |
| Low | `#06D6A020` | `#04785720` | `#00E6A820` | `#064E3B20` |

## 2. Background Colors (Dark Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#0D1117` | App background |
| Background Secondary | `#111820` | Cards, sheets, input fields |
| Background Tertiary | `#21262D` | Elevated cards, hover states |
| Background Elevated | `#30363D` | Modals, popovers |
| Scrim | `rgba(0,0,0,0.7)` | Modal overlays |
| Surface Overlay | `rgba(255,255,255,0.03)` | Alternating rows, empty state backgrounds |

## 3. Text Colors (Dark Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| Text Primary | `#F0F6FC` | Headings, body text |
| Text Secondary | `#8B949E` | Descriptions, metadata |
| Text Tertiary | `#6E7681` | Timestamps, hints |
| Text Disabled | `#484F58` | Disabled elements |

## 4. Border Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Border | `#30363D` | Dividers, card borders (1.5px) |
| Border Subtle | `#21262D` | Inner separators |

## 5. Shadows & Elevation

| Level | shadowOpacity | shadowRadius | elevation | Usage |
|-------|---------------|--------------|-----------|-------|
| 1 | 0.4 | 3 | 2 | Subtle cards |
| 2 | 0.5 | 10 | 5 | Elevated cards |
| 3 | 0.6 | 20 | 10 | FAB, floating elements |
| 4 | 0.7 | 40 | 16 | Modals, dialogs |

## 6. App Identity

- **Name:** EverSiteAudit
- **Slug:** `eversiteaudit-mobile`
- **Scheme:** `eversiteaudit://`
- **Bundle ID:** `com.eversiteaudit.mobile`
- **Icon:** `./assets/images/icon.png`
- **Splash:** `./assets/images/splash.png` on `#FAF9F5`

---

## Related

- [[Design System]]
- [[UI Patterns]]
- [[UI Components Index]]
