---
type: screen
path: src/app/projects/[id].tsx
---

# Project Detail Screen

Project overview with tabs for issues, photos, and timeline. Supports reordering, selection mode, and bulk operations.

## State

- `activeTab` — `overview` | `issues` | `photos` | `timeline`
- `searchQuery`
- `reorderMode`, `selectionMode`, `selectedIds`
- `showStatusPicker`

## Behavior

- **4 tabs:** Overview, Issues, Photos, Timeline
- **Timeline tab:** Merges issues + photos chronologically by `createdAt`, grouped by calendar date (Today, Yesterday, etc.)
- **Issues tab:** Sorted by `createdAt` desc; displays created date, assignee, and due date
- **Photo thumbnails:** `PhotoGridItem` renders actual `<Image source={{ uri: photo.thumbnailPath }} />` instead of generic icon
- **Quick Actions:** Add Issue, Take Photo, Export Report, Duplicate Project, Archive (Share Project Link removed — offline app has no cloud sync)
- **Camera routing:** `router.push({ pathname: '/camera', params: { projectId: id } })` passes project context

## Components

- `Screen`, `Typography`, `Card`, `Badge`, `EmptyState`
- `TextInput`, `Checkbox`, `Toast`, `Image`

## Services

- `shareProject` → replaced by Share Export flow
- `duplicateProject`
- `hapticSuccess`, `hapticError`

## Stores

- `useProjectStore`, `useIssueStore`, `usePhotoStore`, `usePreferenceStore`

## Related

- [[Projects List Screen]]
- [[New Issue Screen]]
- [[Issue Detail Screen]]
- [[Photo Viewer Screen]]
- [[App Navigation Index]]
- [[Camera Screen]]
