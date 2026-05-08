---
type: store
path: src/store/useAnnotationStore.ts
---

# useAnnotationStore

Zustand store for photo annotations.

## State

- `annotations: Annotation[]`
- `isLoading`, `error`

## Actions

- `loadAnnotations(photoId)`
- `addAnnotation(payload)`
- `updateAnnotation(id, payload)`
- `deleteAnnotation(id)`
- `clearAnnotations()`
- `clearError()`

## Persistence

Memory-only; hydrates from `AnnotationRepository`.

## Consumers

[[Photo Viewer Screen]], [[Photo Annotation Screen]]

## Related

- [[Annotation Repository]]
- [[Data Layer Index]]
