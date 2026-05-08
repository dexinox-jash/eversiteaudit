---
type: index
domain: ui
---

# UI Components Index

EverSiteAudit uses a **fully custom component library** built on React Native primitives. Zero HeroUI Native imports exist in production `src/` code despite design documentation referencing it.

---

## Layout Primitives

- [[Screen Component]] — Root screen wrapper with SafeAreaView, ScrollView, header injection
- [[Header Component]] — Top nav bar with icon buttons and title
- [[ScreenHeader Component]] — List-style header with search and filter chips
- [[Section Component]] — Grouped content block with title and Card wrapper
- [[ScreenPlaceholder Component]] — Full-screen loading/empty placeholder

---

## Action & Input Components

- [[Button Component]] — 5 variants, 3 sizes, haptic feedback, loading/disabled states
- [[FAB Component]] — Floating action button (absolute bottom-right)
- [[TextInput Component]] — Labeled input with icon support and error state
- [[Switch Component]] — Wrapper around RNSwitch with haptic feedback
- [[Checkbox Component]] — Custom pressable checkbox
- [[ActionRow Component]] — Settings-style row with icon, label, trailing element

---

## Data Display Components

- [[Typography Component]] — Text primitive with 11 variants
- [[Card Component]] — Bordered container with 4 elevation shadow levels
- [[Badge Component]] — Pill-shaped status indicator with 7 severity variants
- [[StatBadge Component]] — Semantic wrapper over Badge
- [[EmptyState Component]] — Centered illustration with icon, title, subtitle
- [[ListItem Component]] — Row item with icon circle, severity border, selection state
- [[Divider Component]] — Horizontal 1px line
- [[Toast Component]] — Absolute-positioned bottom alert with 4 variants

---

## Theme Infrastructure

- [[ThemeProvider]] — Context provider resolving dark/light/high-contrast themes
- [[Design Tokens]] — Colors, typography, spacing, shadows, radius, animations

---

## Related

- [[EverSiteAudit Index]]
- [[App Navigation Index]]
