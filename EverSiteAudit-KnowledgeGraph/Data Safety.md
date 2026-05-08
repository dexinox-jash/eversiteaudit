---
type: governance
source: database/data-safety.md
parent: [[Database Architecture]]
---

# Data Safety

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. Soft Deletes

No data is permanently destroyed by user action. All delete operations set:

```sql
UPDATE <table> SET is_deleted = 1, deleted_at = ? WHERE id = ?;
```

All queries filter with `WHERE is_deleted = 0` unless explicitly querying for deleted records.

## 2. Field Encryption

Sensitive template fields (`name`, `description`, `content`) are encrypted at rest:

- Algorithm: **AES-256-GCM**
- Key: Device-bound, stored in `expo-secure-store`
- Encryption/decryption: `encryptField()` / `decryptField()` in `@services/security/fieldEncryption`

## 3. Backup Encryption

Full backups are encrypted with:

- Key derivation: **PBKDF2**
- Cipher: **AES-256-GCM**
- Password: User-provided at backup time (not stored anywhere)

## 4. Key Escrow

The field-encryption key is included in the backup manifest, encrypted with the user's backup password. This allows cross-device restores to decrypt template data.

## 5. Transaction Safety

Critical multi-step operations are wrapped in SQLite transactions:

- `ProjectRepository.createProjectWithIssues()` — project + issues atomically
- `BackupExtractor.restoreBackup()` — validate then stage
- `applyPendingRestore()` — swap DB files atomically on next launch

## 6. Data Recovery Scenarios

| Scenario | Recovery Path |
|----------|--------------|
| Phone lost/stolen | Restore `.bin` backup on new device |
| Phone damaged | Same as lost/stolen |
| App accidentally deleted | Reinstall + restore from backup |
| Backup file corrupted | Use older backup file (maintain multiple) |
| Forgot backup password | No recovery. Use a password manager. |

See [[Data Recovery Guide]] for the user-facing disaster-recovery guide.

---

## Related

- [[Database Architecture]]
- [[Schema Principles]]
- [[Migration Rules]]
- [[Data Recovery Guide]]
- [[Backup Archiver]]
- [[Backup Extractor]]
