---
type: screen
path: src/app/migration/index.tsx
---

# Migration Screen

Device migration wizard for transferring data to a new device.

## State

- `step` — `intro` | `old-device` | `new-device` | `success` | `error`
- `role` — `source` | `target`
- `passphrase`
- `backupResult`, `restoreResult`
- `restorePath` — selected backup file URI from `expo-document-picker`

## Behavior

- Old device: creates backup, computes checksum, shares via `expo-sharing`
- New device: uses `expo-document-picker` to select backup file, then prompts for passphrase (min 8 chars), runs `restoreBackup()`
- **File picker:** Replaced manual `TextInput` path entry with `DocumentPicker.getDocumentAsync({ type: 'application/octet-stream' })`
- Selected filename displayed below the picker button

## Components

- `Screen`, `Typography`, `Card`, `Button`, `TextInput`

## Services

- `createBackup`, `restoreBackup`
- `expo-sharing`
- `expo-document-picker`
- `hapticSuccess`

## Stores

- `useProjectStore`, `useIssueStore`, `usePhotoStore`

## Related

- [[Backup Archiver]]
- [[Backup Extractor]]
- [[Backup Crypto]]
- [[App Navigation Index]]
