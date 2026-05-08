---
type: screen
path: src/app/issues/edit/[id].tsx
---

# Edit Issue Screen

Edit issue details, manage photo grid, record voice notes, and capture GPS.

## State

- `title`, `category`
- `gpsLatitude`, `gpsLongitude`, `gpsAccuracy`
- `voiceNoteUrl`, `isRecording`

## Components

- `Screen`, `TextInput`, `Button`, `Typography`
- `Checkbox`, `Toast`

## Services

- `issueRepository`
- `voiceRecorder`
- `imagePicker`
- `Location` (expo-location)
- `hapticSuccess`

## Stores

- `useIssueStore`, `usePhotoStore`

## Related

- [[Issue Detail Screen]]
- [[Voice Recorder]]
- [[Image Picker]]
- [[App Navigation Index]]
