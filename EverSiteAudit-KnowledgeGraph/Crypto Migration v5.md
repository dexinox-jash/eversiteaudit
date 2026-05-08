---
type: migration
domain: security
schema_version: 5
---

# Crypto Migration v5 — AES-256-CBC+SHA256 → AES-256-GCM

## Purpose

Resolve the long-standing [[AES Mode Discrepancy]] by migrating both
field-level encryption (`src/services/security/fieldEncryption.ts`) and
passphrase-based backup encryption (`src/services/backup/crypto.ts`) from
AES-256-CBC with a keyless SHA-256(plaintext) integrity hash to real AEAD
(AES-256-GCM).

## Design

### Primitive

`gcm(key, iv)` from [`@noble/ciphers`](https://github.com/paulmillr/noble-ciphers)
v2.2+. Pure-JS, audited, no native rebuild. Safe for the Expo SDK 52 /
RN 0.76 lock that master.md §III.4 protects.

### Ciphertext format

Both field encryption and passphrase encryption use a common `v2:` prefix
scheme so callers can distinguish the GCM path from the legacy CBC path:

- **Field** (device key from `expo-secure-store`):
  `'v2:' + base64(iv12 || ciphertext || tag16)`
- **Passphrase** (PBKDF2-SHA256, 100,000 iterations):
  `'v2:' + base64(salt16 || iv12 || ciphertext || tag16)`

Tag length is the GCM standard 16 bytes (128 bits).

### Dual-read back-compat

On decrypt, the auto-detection dispatcher in both modules looks at the
prefix:

- Starts with `v2:` → new GCM path.
- No prefix → legacy `decryptLegacyCbcSha` path (CBC + SHA-256 integrity).

This means:

1. An app upgrading from pre-v5 can read its existing encrypted rows during
   the v5 migration window.
2. A user restoring a legacy (v1) backup on a v2 build still gets readable
   data. Backup manifests carry `version: 2` and `cryptoVersion: 'v2-gcm'`
   (new) or `version: 1` (legacy), and the restore path dispatches accordingly.
3. After the v5 schema migration completes on a device, no legacy ciphertexts
   remain in the live DB. New backups are always v2-gcm.

### Schema v5 migration

`src/services/db/migrations.ts` version 5 walks every encrypted column across
every table:

| Table | Columns |
|---|---|
| `projects` | `name`, `description`, `site_address`, `client_name` |
| `issues` | `title`, `description`, `location_description`, `assigned_to`, `resolution_notes` |
| `photos` | `caption`, `tags` |
| `annotations` | `text_content` |
| `templates` | `name`, `description`, `content` |
| `export_history` | `file_name`, `error_message` |

For each value: `decryptField(value)` (auto-detects v1/v2) → `encryptField`
(always emits v2-gcm) → UPDATE row. Wrapped in the existing
`withExclusiveTransactionAsync` from `runMigrations`. Idempotent: a row that is
already `v2:`-prefixed decrypts to plaintext, re-encrypts to a new `v2:`
ciphertext with a fresh IV, and round-trips cleanly.

## Passphrase Floor

The v5 work also raised the minimum backup passphrase length from 8 to **12**
chars (`src/services/security/passphraseStrength.ts`), with a 5-tier
rule-based strength meter surfaced via `<PassphraseStrengthMeter>`. The meter
is wired into both `src/app/migration/index.tsx` and the legacy backup flow in
`src/app/(tabs)/settings.tsx`.

See also [[Restore Atomicity]] for the companion state-machine guard on the
restore swap that shipped in the same batch.

## Tests

- `tests/services/security/fieldEncryption.test.ts` — GCM round-trip, legacy
  back-compat read, tag-tamper rejection, short-ciphertext rejection, unicode
  round-trip.
- `tests/services/backup/crypto.test.ts` — passphrase round-trip, wrong
  passphrase, `encryptKey`/`decryptKey` wrappers, tag-tamper rejection,
  legacy v1 ciphertext read (constructed from first-principles inside the
  test), unicode round-trip.
- `tests/services/db/migrations.test.ts` v5 case — every table re-encrypted;
  no-op when no rows.
- `tests/services/security/passphraseStrength.test.ts` — every tier boundary.
- `tests/components/PassphraseStrengthMeter.test.tsx` — a11y role, values,
  label surfacing for every tier.

## Related

- [[AES Mode Discrepancy]] — marked RESOLVED
- [[Restore Atomicity]]
- [[Field Encryption]]
- [[Backup Crypto]]
- [[Security Architecture]]
- [[Security Index]]
- [[Phase Plan]]
