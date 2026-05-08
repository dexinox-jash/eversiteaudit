---
type: screen
path: src/app/(tabs)/index.tsx
---

# Projects List Screen

Default tab screen showing all projects with search and filter.

## State

- `searchQuery` — Filters projects by name/address/client
- `filter` — `all` | `active` | `completed` | `archived`

## Components

- `Screen` with `ScreenHeader` (search + filter chips + settings gear icon), `scrollable={false}`
- `ListItem` for each project
- `EmptyState` when no projects match
- `FAB` (floating action button) to create new project

## Header Actions

- **Settings gear icon** in `ScreenHeader.rightElement` → navigates to `/settings`
- Accessibility label: "Open settings"

## Stores

- `useProjectStore` — loads projects, filter, create

## Related

- [[New Project Screen]]
- [[Project Detail Screen]]
- [[useProjectStore]]
- [[App Navigation Index]]
- [[ScreenHeader Component]]
- [[Settings Screen]]
