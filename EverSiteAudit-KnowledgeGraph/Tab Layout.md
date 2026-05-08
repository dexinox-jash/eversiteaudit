---
type: layout
path: src/app/(tabs)/_layout.tsx
---

# Tab Layout

Two-tab bottom navigator using Expo Router `<Tabs>`.

## Tabs

| Tab | Route | Icon |
|-----|-------|------|
| Projects | `index` | `Folder` (lucide-react-native) |
| Activity | `activity` | `Activity` |

## Styling

- Height: 64px
- Background: `colors.backgroundSecondary`
- Border top: 1px `colors.border`
- Active tint: `colors.primary`
- Inactive tint: `colors.textSecondary`
- Label font size: 11px, weight 500

## Changes

- **2026-04-17:** Removed Settings tab. Settings is now accessed from the Projects screen header gear icon.

## Related

- [[Root Layout]]
- [[Projects List Screen]]
- [[Activity Screen]]
- [[Settings Screen]]
- [[App Navigation Index]]
