---
type: service
path: src/services/backup/crypto.ts
---

# Backup Crypto

PBKDF2-SHA256 → AES-256-GCM passphrase cryptography. Migrated from
PBKDF2 → AES-256-CBC + plain SHA-256 in schema v5 ([[Crypto Migration v5]]).

## Functions

- `encryptWithPassphrase(plaintext, passphrase)` — always emits `v2:`-prefixed AEAD output
- `decryptWithPassphrase(ciphertext, passphrase)` — auto-dispatches `v2:` (GCM) vs legacy (CBC + SHA-256) so legacy backup files remain restorable
- `encryptKey(key, password)` — for keyEscrow (delegates to `encryptWithPassphrase`)
- `decryptKey(encryptedKey, password)` — delegates to `decryptWithPassphrase`

## Algorithm

- **KDF**: PBKDF2-SHA256, 100,000 iterations, 32-byte output key
- **Primitive**: `gcm(key, iv)` from [`@noble/ciphers`](https://github.com/paulmillr/noble-ciphers)
- **Format**: `'v2:' + base64(salt16 || iv12 || ciphertext || tag16)`
- **Salt**: 16 random bytes per encryption
- **IV**: 12 random bytes per encryption (NIST SP 800-38D recommended)
- **Tag**: 16 bytes (128 bits) — GCM authentication tag, verified on every decrypt

## Manifest Versioning

`BackupManifest.cryptoVersion: 'v1-cbc-sha256' | 'v2-gcm'` (optional). New
backups always set `'v2-gcm'`. Missing field implies v1 for backward compat.
`BACKUP_MANIFEST_VERSION` was bumped from 1 to 2 in Batch 1.

## Passphrase Floor

The minimum passphrase length is enforced at 12 characters via
`src/services/security/passphraseStrength.ts`. Both the
`src/app/migration/index.tsx` wizard and the legacy backup flow in
`src/app/(tabs)/settings.tsx` surface a `<PassphraseStrengthMeter>` and gate
the submit button on the tier being above `'too-short'`.

## Shared Utilities

Uses [[Crypto Utils]] for common CryptoJS helpers retained for the legacy
read path:
- `uint8ToWordArray` / `wordArrayToUint8`
- `base64ToUint8` / `uint8ToBase64`
- `timingSafeEqual`

Backup-specific helpers (kept local):
- `deriveKeyBytes(passphrase, salt)` — PBKDF2 → `Uint8Array` for the GCM path
- `deriveKeyWordArray(passphrase, salt)` — same KDF for the legacy CBC path

## Randomness Source

- **Salt and IV generation:** `expo-crypto.getRandomValues()` — native-backed secure randomness.

## Tests

`tests/services/backup/crypto.test.ts` covers round-trip, wrong passphrase,
`encryptKey`/`decryptKey` wrapper, tag-tamper rejection, legacy v1 read, and
unicode.

## Related

- [[Field Encryption]]
- [[Crypto Utils]]
- [[Crypto Migration v5]]
- [[AES Mode Discrepancy]] (RESOLVED)
- [[Restore Atomicity]]
- [[Backup Archiver]]
- [[Backup Extractor]]
- [[Security Index]]
