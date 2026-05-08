---
type: screen
path: src/app/photos/[id].tsx
---

# Photo Viewer Screen

Photo viewer with annotations overlay, caption editing, and share actions.

## State

- `isPanelOpen`
- `imageLayout`
- `caption`
- `contextPhotos`, `currentIndex`

## Components

- `Typography`, `Button`, `TextInput`, `Toast`

## Services

- `photoRepository`
- `verifyFileChecksum`
- `imagePicker`
- `sharePhoto`
- `hapticSuccess`

## Stores

- `usePhotoStore`, `useAnnotationStore`

## Related

- [[Photo Annotation Screen]]
- [[Camera Screen]]
- [[Image Picker]]
- [[Photo Integrity]]
- [[App Navigation Index]]
