---
type: store
path: src/store/usePhotoStore.ts
---

# usePhotoStore

Zustand store for photos with optimistic UI.

## State

- `photos: Photo[]`
- `isLoading`, `error`

## Actions

- `loadPhotos()`, `loadPhotosByProject(projectId)`, `loadPhotosByIssue(issueId)`
- `createPhoto(payload)` — optimistic with temp ID
- `updatePhoto(id, payload)`
- `deletePhoto(id)` — optimistic
- `bulkDelete(ids)`
- `updateSortOrder(id, sortOrder)`
- `clearError()`

## Persistence

Memory-only; hydrates from `PhotoRepository` on screen mount.

## Consumers

[[Root Layout]], [[Camera Screen]], [[Photo Viewer Screen]], [[Photo Annotation Screen]], [[Issue Detail Screen]], [[Edit Issue Screen]], [[Settings Screen]], [[Migration Screen]], [[Activity Screen]]

## Related

- [[Photo Repository]]
- [[Data Layer Index]]
