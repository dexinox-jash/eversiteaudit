---
type: service
path: src/services/security/fieldEncryption.ts
---

# Field Encryption

AES-256-GCM field-level encryption for SQLite at-rest data. Migrated from
AES-256-CBC + plain SHA-256 in schema v5 ([[Crypto Migration v5]]).

## Functions

- `encryptField(plaintext)` → ciphertext — always emits `v2:`-prefixed AEAD output
- `decryptField(ciphertext)` → plaintext — auto-dispatches `v2:` (GCM) vs legacy
  (CBC + SHA-256) so apps upgrading from pre-v5 can still read their rows until
  the v5 migration completes

## Algorithm

- **Primitive**: `gcm(key, iv)` from [`@noble/ciphers`](https://github.com/paulmillr/noble-ciphers) — pure-JS, audited, no native rebuild
- **Format**: `'v2:' + base64(iv12 || ciphertext || tag16)`
- **IV**: 12 random bytes per encryption (`Crypto.getRandomValues`), the
  NIST SP 800-38D-recommended length for GCM
- **Tag**: 16 bytes (128 bits) — standard GCM authentication tag, verified on
  every decrypt

## Shared Utilities

Uses [[Crypto Utils]] for common CryptoJS helpers retained for the legacy
read path:
- `uint8ToWordArray` / `wordArrayToUint8`
- `base64ToUint8` / `uint8ToBase64`
- `timingSafeEqual`

## Randomness Source

- **IV generation:** `expo-crypto.getRandomValues()` — native-backed secure
  randomness in React Native environments.

## Usage

Every repository manually calls `encryptField` / `decryptField` on its
sensitive text columns. See [[Project Repository]], [[Issue Repository]],
[[Photo Repository]], [[Annotation Repository]], [[Template Repository]],
[[Export History Repository]].

## Tests

`tests/services/security/fieldEncryption.test.ts` covers round-trip, legacy
read-compat, tag-tamper rejection, short-ciphertext rejection, and unicode.

## Related

- [[Key Store]]
- [[Crypto Utils]]
- [[Crypto Migration v5]]
- [[AES Mode Discrepancy]] (RESOLVED)
- [[Project Repository]]
- [[Issue Repository]]
- [[Security Index]]
