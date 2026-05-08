---
type: screen
path: src/app/(tabs)/activity.tsx
---

# Activity Screen

Unified activity feed showing recent projects, issues, and photos.

## State

- `activityItems` — Computed array (max 50 items) merged from projects, issues, photos
- `filter` — `all` | `project` | `issue` | `photo` (session-only, defaults to `all`)
- `groupedItems` — Memoized sections grouped by calendar date label

## Behavior

- **Date grouping:** Items grouped into sections (Today, Yesterday, Monday 14 Apr, etc.)
- **Filter chips:** All | Projects | Issues | Photos at top of screen
- Filter state persists only for the session
- Sections render with date header (`Typography variant="overline"`) followed by `ListItem` rows
- Tapping an item navigates to its detail screen

## Components

- `Screen` with `ScreenHeader`
- `FlatList` with section headers
- `ListItem` for each activity
- `Divider` between items
- `EmptyState` when no activity

## Stores

- `useProjectStore`
- `useIssueStore`
- `usePhotoStore`

## Related

- [[Projects List Screen]]
- [[Issue Detail Screen]]
- [[Photo Viewer Screen]]
- [[App Navigation Index]]
