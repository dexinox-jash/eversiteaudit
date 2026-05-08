---
type: documentation
source: .documentation/DESIGN.md
---

# Design Specification

> **Version:** 1.0.0 | **Platform:** iOS & Android (Cross-platform)
> **Target Users:** Construction site managers, safety inspectors, snagging specialists
> **Source:** `.documentation/DESIGN.md`

---

## Design Principles

### Core Philosophy: Rugged Reliability

"Construction-grade" design — professional, durable, and trustworthy.

### UX Pillars

- **Offline-First Architecture** — Immediate local feedback, no loading spinners for local ops, optimistic UI with rollback
- **Sunlight-Optimized Contrast** — Dark mode default, minimum 4.5:1 contrast ratio, high-contrast mode option
- **Thumb-Friendly Operation** — Primary actions in bottom 40%, minimum 56dp touch targets, bottom sheets for secondary actions
- **Fail-Safe Design** — Destructive actions show item counts, undo available for 5 seconds, auto-save on all forms

## Design System Tokens

### Color Palette

See [[Brand Guidelines]] for complete color reference.

### Typography

- **Primary:** `Inter` (Google Fonts)
- **Fallback:** `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Chinese Support:** `Noto Sans SC` loaded dynamically

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-hero` | 32px | 700 | 40px | Splash title |
| `--text-h1` | 28px | 700 | 36px | Screen titles |
| `--text-h2` | 24px | 600 | 32px | Section headers |
| `--text-h3` | 20px | 600 | 28px | Card titles |
| `--text-body-large` | 17px | 400 | 26px | Primary body |
| `--text-body` | 16px | 400 | 24px | Standard body |
| `--text-caption` | 13px | 400 | 18px | Labels |

### Spacing Scale

Base unit: 4px. See [[Design Tokens]] for full scale.

### Shadows & Elevation

| Level | Shadow (Dark) | Usage |
|-------|---------------|-------|
| `--shadow-1` | `0 1px 2px rgba(0,0,0,0.3)` | Cards |
| `--shadow-2` | `0 4px 8px rgba(0,0,0,0.4)` | Elevated cards |
| `--shadow-3` | `0 8px 16px rgba(0,0,0,0.5)` | Modals |
| `--shadow-4` | `0 16px 32px rgba(0,0,0,0.6)` | Full-screen overlays |

## Screen Specifications

Covers 20+ screen specifications:
- Onboarding Flow (Splash, Welcome, Permission Request, Data Promise, Template Selection)
- Project Management (List, Create, Detail with tabs)
- Camera/Capture (Camera Interface, Severity Selector)
- Issue Management (List, Detail, Create/Edit)
- Photo/Gallery (Grid, Detail, Annotation Canvas)
- Export & Reports (Template Selector, Progress, Success)
- Settings & Migration (Settings Main, Transfer Wizard)

## Accessibility Guidelines

- All interactive elements have `accessibilityLabel`
- Labels describe action, not element type
- Logical focus order (top-to-bottom, left-to-right)
- Dynamic text sizing up to 200%
- Never rely on color alone — use icons + patterns + text labels
- Touch targets: WCAG minimum 48dp × 48dp, EverSiteAudit preferred 56dp × 56dp

## Responsive Behavior

| Form Factor | Layout |
|-------------|--------|
| Phone (Portrait) | Single column, bottom tabs, full-width cards |
| Phone (Landscape) | Side navigation, two-column grids |
| Tablet | Master-detail view, persistent sidebar, multi-column grids |

---

## Related

- [[EverSiteAudit Master Governance]]
- [[Design System]]
- [[Brand Guidelines]]
- [[UI Patterns]]
- [[UI Components Index]]
