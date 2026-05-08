---
type: service
path: src/services/backup/BackupExtractor.ts
---

# Backup Extractor

Decrypts backup, validates checksums, stages restore.

## Function

- `restoreBackup(backupUri, passphrase)` → `RestoreResult`

## Flow

1. Decrypt → load ZIP
2. Validate manifest version
3. Verify SHA-256 checksums of every file
4. Restore encryption key from `keyEscrow`
5. Stage DB to `cacheDirectory/restore_db_${timestamp}.sqlite`
6. Extract photos to `documentDirectory/photos/`
7. Write `RESTORE_PENDING.json` marker
8. On next launch, `applyPendingRestore()` swaps the DB

## Related

- [[Backup Archiver]]
- [[Backup Crypto]]
- [[Database Connection]]
- [[Migration Screen]]
- [[Services Index]]
