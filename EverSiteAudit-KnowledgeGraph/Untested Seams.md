---
type: architecture
analysis: testing
---

# Untested Seams

Boundaries where real implementations are mocked away, creating regression risk.

## 1. Repository ↔ Encryption Layer

Repository tests mock `encryptField`/`decryptField` with a trivial `v2:` prefix. Real `fieldEncryption.ts` (AES-256-GCM, v5) is exercised in dedicated unit tests (`tests/services/security/fieldEncryption.test.ts`) but not end-to-end through the SQLite layer.

## 2. Backup Crypto Round-Trip

No integration test verifies that `BackupArchiver` → `BackupExtractor` preserves data integrity with real encryption.

## 3. Photo Integrity at Scale

`verifyPhotosIntegrity` loads entire images into JS heap. No performance or memory tests exist for large photo sets.

## 4. Migration v4 Data Migration

Template encryption migration (v4) modifies existing rows. No test verifies data integrity after this migration on seeded databases.

## 5. Database Restore Swap

`applyPendingRestore()` closes and replaces the live DB. No test verifies this works during active queries.

## Related

- [[Architecture Index]]
- [[Field Encryption]]
- [[Backup Crypto]]
