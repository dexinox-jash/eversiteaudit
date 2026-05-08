---
type: screen
path: src/app/(tabs)/settings.tsx
---

# Settings Screen

Settings, exports, backup, and cache management.

## State

- `selectedProjectId` — Project to export
- `backupPassphrase`, `restorePath` — Backup/restore inputs
- `exportPassword` — Optional export password
- `toast` — Feedback messages
- `cacheSize` — Computed disk cache size

## Behavior

- **Restore backup:** Uses `expo-document-picker` (`DocumentPicker.getDocumentAsync`) to select backup file instead of manual text input
- Selected filename displayed below the picker button
- Restore requires both a selected file and passphrase before enabling the Import button

## Components

- `Screen` with `ScreenHeader`
- `Section` blocks: Export, Backup, Cache, Appearance, Security
- `ActionRow` for each setting
- `Card`, `Button`, `TextInput`, `Toast`

## Services

- Export: `exportProjectToJSON/CSV/ZIP/PDF`
- Backup: `createBackup`, `restoreBackup`
- Cache: `runFullCleanup`
- File picker: `expo-document-picker`

## Stores

- `usePreferenceStore`, `useProjectStore`, `useIssueStore`, `usePhotoStore`

## Related

- [[Export Screen]]
- [[Migration Screen]]
- [[App Navigation Index]]
- [[Services Index]]
