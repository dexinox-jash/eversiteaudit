---
type: screen
path: src/app/photos/annotate/[id].tsx
---

# Photo Annotation Screen

Annotation canvas with 5 drawing tools + undo/redo.

## State

- `tool` — `arrow` | `circle` | `rectangle` | `text` | `highlight`
- `color`, `strokeWidth`
- `workingAnnotations`
- `history`, `historyIndex`
- `textInputVisible`

## Components

- `Typography`
- SVG overlay for annotations (`react-native-svg`)

## Stores

- `usePhotoStore`, `useAnnotationStore`

## Related

- [[Photo Viewer Screen]]
- [[Annotation Repository]]
- [[App Navigation Index]]
