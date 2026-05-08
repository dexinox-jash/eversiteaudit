---
type: handoff
phase: B
domain: platform
date: 2026-04-14
---

# Phase B — Platform Integrations Handoff

## Changes Implemented

### 1. Camera Edge-Cases (`src/app/camera.tsx`)

- **Permission denied flow**: When `PermissionStatus.DENIED`, shows message directing user to Settings and an "Open Settings" button calling `Linking.openSettings()`
- **Storage full guard**: `processAndSavePhoto` checks `FileSystem.getFreeDiskStorageAsync()` before writing. If < 50 MB, shows alert: "Storage full — free space to save photos."

### 2. iOS Compliance (`app.json`)

- Added `NSCameraUsageDescription` with business-justified string for site inspection photos
- Added `NSPhotoLibraryUsageDescription` for attaching existing images to issues
- Added `ITSAppUsesNonExemptEncryption: false` to `infoPlist`

### 3. Android Compliance (`app.json`)

- Added `android.permissions`: `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`
- Added `android.media.action.IMAGE_CAPTURE` intent filter

### 4. Share Extension Setup (`app.json`)

- Added `"expo-sharing"` to the `plugins` array

### 5. Test Infrastructure

- Added `getFreeDiskStorageAsync` mock to `tests/setup.ts`

## Verification

- `npm run verify` (typecheck + lint + test) passes with **63/63 suites** and **452/452 tests** green.

---

## Related

- [[Phase Plan]]
- [[Camera Screen]]
- [[Share Extension]]
