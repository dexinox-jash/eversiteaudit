---
type: service
path: src/services/security/cryptoUtils.ts
---

# Crypto Utils

Shared CryptoJS utility functions used by both field encryption and backup crypto.

## Functions

- `uint8ToWordArray(u8)` — Convert Uint8Array to CryptoJS WordArray
- `wordArrayToUint8(wa)` — Convert CryptoJS WordArray to Uint8Array
- `base64ToUint8(base64)` — Parse base64 string into Uint8Array
- `uint8ToBase64(u8)` — Encode Uint8Array as base64 string
- `timingSafeEqual(a, b)` — Constant-time Uint8Array comparison

## Purpose

Eliminates duplicate helper code between `fieldEncryption.ts` and `backup/crypto.ts`. Both modules previously maintained identical copies of these 5 functions.

## Related

- [[Field Encryption]]
- [[Backup Crypto]]
- [[Security Index]]
