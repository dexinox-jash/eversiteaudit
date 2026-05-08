---
type: service
path: src/services/security/keyStore.ts
---

# Key Store

Device-bound 256-bit encryption key stored in `expo-secure-store`.

## Functions

- `getOrCreateEncryptionKey()` — generates if missing
- `storeEncryptionKey(key)`
- `clearEncryptionKey()`

## Key Details

- Alias: `'esa_db_encryption_key'`
- Generation: `expo-crypto.getRandomValues(new Uint8Array(32))` → hex 64-char string
- Storage: iOS Keychain / Android Keystore via `expo-secure-store`
- Backup recovery: encrypted into `keyEscrow` inside backup manifest

## Related

- [[Field Encryption]]
- [[Backup Extractor]]
- [[Security Index]]
