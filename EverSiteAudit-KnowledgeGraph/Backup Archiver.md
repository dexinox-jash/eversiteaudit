---
type: service
path: src/services/backup/BackupArchiver.ts
---

# Backup Archiver

Packages DB + photos into encrypted ZIP backup file.

## Function

- `createBackup(passphrase)` → `BackupResult`

## Output

- File: `esa_backup_${timestamp}.bin`
- Inner structure (after decryption): ZIP containing `db.sqlite`, `photos/`, `manifest.json`

## Dependencies

- `expo-file-system`
- `jszip`
- `crypto-js`

## Related

- [[Backup Extractor]]
- [[Backup Crypto]]
- [[Migration Screen]]
- [[Services Index]]
