---
type: screen
path: src/app/camera.tsx
---

# Camera Screen

Full-screen camera with burst mode, flash toggle, grid overlay, and severity tagging.

## State

- `facing` — front/back camera
- `flash` — on/off/auto
- `showGrid`
- `isCapturing`, `isBursting`, `burstCount`
- `capturedPhotos`
- `severitySheetOpen`, `pendingPhoto`
- `selectedProjectId` — derived from query param or first loaded project

## Behavior

- **Burst mode:** Long-press capture button, 3 photos/sec, max 20 photos
- **Photo processing:** Original + thumbnail (300×300) + compressed (1920px width)
- **Severity tagging:** Post-capture bottom sheet selects `IssueSeverity`
- **Project association:** `loadProjects()` called on mount so `selectedProjectId` doesn't fall back to null
- Camera permission request wrapped in 5s timeout guard

## Components

- Does **NOT** use `Screen` component — fully custom full-screen layout
- `CameraView` from `expo-camera`
- `Typography` for overlays

## Services

- `expo-image-manipulator`, `expo-file-system`
- `hapticSuccess`
- `backup/reminderService`

## Stores

- `usePhotoStore`, `useIssueStore`, `useProjectStore` (with `loadProjects`)

## Related

- [[Photo Viewer Screen]]
- [[Photo Annotation Screen]]
- [[App Navigation Index]]
