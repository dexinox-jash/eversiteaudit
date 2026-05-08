---
type: index
domain: security
---

# Security Index

Multi-layer encryption architecture with field-level at-rest encryption, backup passphrase encryption, biometric gating, and photo integrity verification.

> **Doc ↔ code reconciliation (RESOLVED):** Docs previously claimed AES-256-GCM while code implemented AES-256-CBC + SHA-256(plaintext). Schema v5 migrated code to real AEAD; docs and code now agree. See [[AES Mode Discrepancy]] (resolved) and [[Crypto Migration v5]].

---

## Encryption Layers

| Layer | Algorithm | Implementation |
|-------|-----------|----------------|
| Field-level (at-rest DB) | AES-256-GCM (v5; legacy CBC read-compat) | [[Field Encryption]] · [[Crypto Migration v5]] |
| Backup encryption | PBKDF2-SHA256 (100k iter) → AES-256-GCM | [[Backup Crypto]] · [[Crypto Migration v5]] |
| Restore swap | Atomic state-machine on marker file | [[Restore Atomicity]] |
| Export password protection | Re-uses backup crypto | [[PDF Export]], [[ZIP Export]], [[JSON Export]], [[CSV Export]] |

## Key Management

- [[Key Store]] — Device-bound 256-bit key stored in `expo-secure-store`
- Backup `keyEscrow` allows device key recovery on new devices using passphrase

## Authentication

- [[Biometric Auth]] — Optional FaceID/TouchID with auto-lock after background timeout

## Integrity

- [[Photo Integrity]] — SHA-256 checksums for photos via `expo-crypto`

## Compliance & Protocols

- [[Security Protocols]] — Biometric auth, key management, input sanitization, secure defaults
- [[OWASP Compliance]] — Mobile Top 10 (2024) coverage matrix
- [[Privacy Guarantees]] — Zero telemetry, zero cloud sync, data ownership policy

## Known Issues

- Three different SHA-256 implementations across codebase (Web Crypto, expo-crypto, crypto-js)
- Imperative field encryption in every repository (no central column mapper)
- Repository tests mock encryption with trivial `v2:` prefix — real crypto is covered in dedicated tests at `tests/services/security/fieldEncryption.test.ts` and `tests/services/backup/crypto.test.ts`

## Security Handoffs

- [[Phase C Security Handoff]] — Path traversal fix, GCM tag length hardening, 103 JSDoc comments
- Batch 1 (schema v5) — Crypto & Docs Truth Reconciliation, see [[Crypto Migration v5]] and [[Restore Atomicity]]

---

## Related

- [[EverSiteAudit Index]]
- [[Services Index]]
- [[Data Layer Index]]
- [[Safety and Security]]
- [[EverSiteAudit Master Governance]]
