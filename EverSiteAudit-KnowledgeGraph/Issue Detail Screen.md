---
type: screen
path: src/app/issues/[id].tsx
---

# Issue Detail Screen

Issue detail with photo gallery, voice note playback, and bulk actions.

## State

- `issue`
- `reorderMode`, `selectionMode`, `selectedIds`
- `sound`, `isPlaying` — Audio playback state

## Components

- `Screen`, `Typography`, `Card`, `Badge`, `EmptyState`
- `Checkbox`, `Toast`

## Services

- `issueRepository`
- `duplicateIssue`, `shareIssue`
- `Audio` (expo-av)
- `hapticSuccess`

## Stores

- `useIssueStore`, `usePhotoStore`

## Related

- [[Edit Issue Screen]]
- [[Photo Viewer Screen]]
- [[Voice Recorder]]
- [[App Navigation Index]]
