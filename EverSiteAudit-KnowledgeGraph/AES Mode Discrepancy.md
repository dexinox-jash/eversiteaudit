---
type: analysis
status: RESOLVED
severity: security
resolved_in: Batch 1 — Crypto & Docs Truth Reconciliation
---

# [RESOLVED] AES Mode Discrepancy

## Resolution Summary

The discrepancy between governance docs (claimed **AES-256-GCM**) and the actual
implementation (**AES-256-CBC + SHA-256(plaintext)**) has been resolved by
migrating the code to real AES-256-GCM via [`@noble/ciphers`](https://github.com/paulmillr/noble-ciphers).

The docs and code now agree: AES-256-GCM (authenticated encryption) is used for
both field-level encryption at rest and passphrase-based backup encryption.

See [[Crypto Migration v5]] for the full migration design, dual-read back-compat
path, and test strategy.

## Historical Context (pre-resolution)

Governance and design documents universally claimed **AES-256-GCM**:
- `master.md` §III: "AES-256-GCM for templates"
- `database/data-safety.md`: "AES-256-GCM for template fields"
- `safety/owasp-compliance.md`: "AES-256-GCM for backups"
- `agents.md`: "AES-256-GCM encrypted backups"
- `.documentation/ARCHITECTURE.md`: "Field-level AES-256-GCM encryption"

However, the code actually implemented **AES-256-CBC** with a **keyless
SHA-256(plaintext) integrity hash** (not HMAC, not AEAD):
- `src/services/security/fieldEncryption.ts` (pre-v5) — CBC + SHA-256
- `src/services/backup/crypto.ts` (pre-v5) — CBC + SHA-256

The integrity hash, being a function of plaintext without a keyed construction,
provided only weak tamper-detection (an attacker who knew or could guess the
plaintext could forge a valid hash after modifying the ciphertext).

## What Changed

- `fieldEncryption.ts` now uses `gcm` from `@noble/ciphers/aes.js`. Output format
  is `'v2:' + base64(iv12 || ciphertext || tag16)`. The `v2:` prefix
  distinguishes new GCM ciphertexts from legacy values. The legacy CBC+SHA path
  is preserved as an unexported read-only decryptor for back-compat.
- `backup/crypto.ts` now uses `gcm` with PBKDF2-SHA256 (100,000 iterations) for
  key derivation. Output format is `'v2:' + base64(salt16 || iv12 ||
  ciphertext || tag16)`. Manifests carry `cryptoVersion: 'v2-gcm'` so restore
  can dispatch unambiguously.
- Schema v5 migration (`src/services/db/migrations.ts`) walks every encrypted
  column in every table, decrypts via the auto-detecting path, and re-encrypts
  with GCM. After first launch post-upgrade, no legacy ciphertexts remain in
  the live DB.

## Related

- [[Security Architecture]]
- [[Crypto Migration v5]]
- [[Field Encryption]]
- [[Backup Crypto]]
- [[Security Index]]
- [[Safety and Security]]
