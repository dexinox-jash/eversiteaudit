---
type: screen
path: src/app/(tabs)/issues/new.tsx
---

# New Issue Screen

Create a new issue linked to a project.

## State

- `title`, `description`
- `severity` — `critical` | `high` | `medium` | `low`
- `status` — `open` | `in_progress` | `resolved` | `closed`
- `selectedProjectId`

## Components

- `Screen` with `Header`
- `TextInput`, `Button`, `Typography`

## Services

- `hapticSuccess`

## Stores

- `useIssueStore`, `useProjectStore`

## Related

- [[Project Detail Screen]]
- [[Issue Detail Screen]]
- [[Edit Issue Screen]]
- [[App Navigation Index]]
