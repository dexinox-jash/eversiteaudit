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

Sensitive columns across every table — project/issue/photo/annotation/template
text fields, export history filenames, etc. — are encrypted at rest:

- Algorithm: **AES-256-GCM** via [`@noble/ciphers`](https://github.com/paulmillr/noble-ciphers) (pure JS, audited)
- IV: 12 random bytes per encryption
- Tag: 16 bytes, verified on every decrypt
- Key: Device-bound 256-bit, stored in `expo-secure-store`
- Encryption/decryption: `encryptField()` / `decryptField()` in `@services/security/fieldEncryption`
- Prior to schema v5, this layer was AES-256-CBC with a plain SHA-256(plaintext)
  integrity hash. The v5 migration re-encrypts every row with AES-256-GCM on
  first launch after upgrade; `decryptField` auto-detects legacy vs. v2 on read.

## 3. Backup Encryption

Full backups are encrypted with:

- Key derivation: **PBKDF2-SHA256**, 100,000 iterations, 256-bit output
- Cipher: **AES-256-GCM** (via `@noble/ciphers`)
- Format: `v2:` prefix + base64(salt16 || iv12 || ciphertext || tag16)
- Password: User-provided at backup time, minimum **12** characters enforced, strength surfaced via `<PassphraseStrengthMeter>`. Never stored.
- Manifest version: 2 (legacy v1 CBC backups remain restorable via dual-read path)

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

See `DATA_RECOVERY.md` in the project root for the user-facing disaster-recovery guide.
