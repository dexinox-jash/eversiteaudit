---
type: architecture
analysis: security
---

# Security Architecture

Multi-layer AEAD encryption. Doc↔code reconciled in schema v5.

## Encryption Layers

| Layer | Algorithm | File |
|-------|-----------|------|
| Field-level (DB at-rest) | AES-256-GCM (v5; legacy CBC read-compat) | `fieldEncryption.ts` |
| Backup | PBKDF2-SHA256 (100k) → AES-256-GCM | `backup/crypto.ts` |
| Export password | Re-uses backup crypto | export services |
| Restore swap | Atomic state-machine on marker file | `db/connection.ts`, `backup/BackupExtractor.ts` |

## Discrepancy (RESOLVED)

Docs previously claimed **AES-256-GCM** while code implemented **AES-256-CBC** +
plain SHA-256(plaintext). Schema v5 migrated the code to real AEAD; docs and
code now agree. See [[AES Mode Discrepancy]] (resolved) and
[[Crypto Migration v5]].

## Key Management

- Device key: 256-bit random, hex 64-char, stored in `expo-secure-store`
- Backup recovery: `keyEscrow` encrypts device key with user passphrase

## SHA-256 Fragmentation

Three implementations:
1. `shareExport.ts` — Web Crypto `crypto.subtle`
2. `photoIntegrity.ts` — `expo-crypto`
3. `BackupArchiver.ts` — `crypto-js`

## Biometric Auth

- Optional FaceID/TouchID
- Auto-lock after background timeout
- Fallback to device passcode

## Related

- [[Security Index]]
- [[Architecture Index]]
- [[Field Encryption]]
- [[Key Store]]
- [[Backup Crypto]]
- [[Crypto Migration v5]]
- [[Restore Atomicity]]
- [[AES Mode Discrepancy]]
