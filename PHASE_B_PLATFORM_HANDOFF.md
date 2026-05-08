# Phase B — Platform Integrations Handoff

## Changes Implemented

### 1. Camera Edge-Cases (`src/app/camera.tsx`)
- **Permission denied flow**: When `PermissionStatus.DENIED`, the screen now shows a message directing the user to Settings and an "Open Settings" button that calls `Linking.openSettings()` (cross-platform via `react-native` Linking).
- **Storage full guard**: `processAndSavePhoto` checks `FileSystem.getFreeDiskStorageAsync()` before writing. If free space is < 50 MB, it shows an alert with the exact copy: "Storage full — free space to save photos." and aborts the save.

### 2. iOS Compliance (`app.json`)
- Added `NSCameraUsageDescription` with business-justified string for site inspection photos.
- Added `NSPhotoLibraryUsageDescription` with business-justified string for attaching existing images to issues.
- Added `ITSAppUsesNonExemptEncryption: false` to `infoPlist`.

### 3. Android Compliance (`app.json`)
- Added `android.permissions`: `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`.
- Added an `android.media.action.IMAGE_CAPTURE` intent filter under `android.intentFilters` to declare camera software capability.

### 4. Share Extension Setup (`app.json`)
- Added `"expo-sharing"` to the `plugins` array.

### 5. Test Infrastructure
- Added `getFreeDiskStorageAsync` mock to `tests/setup.ts` so camera tests continue to pass.

## Verification
- `npm run verify` (typecheck + lint + test) passes with **63/63 suites** and **452/452 tests** green.
