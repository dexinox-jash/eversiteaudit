---
type: governance
source: safety/
parent: [[EverSiteAudit Master Governance]]
---

# Safety and Security

> **Authority:** Child of `master.md`. Overrides nothing.

---

## Security Protocols

- [[Security Protocols]] — Biometric auth, key management, input sanitization, secure defaults
- [[OWASP Compliance]] — Mobile Top 10 (2024) coverage, SQL injection prevention, path traversal prevention
- [[Privacy Guarantees]] — You own your data, no telemetry, no cloud sync, data deletion policy

## Encryption Layers

| Layer | Algorithm | Implementation |
|-------|-----------|----------------|
| Field-level (at-rest DB) | AES-256-GCM (v5; legacy CBC read-compat) | [[Field Encryption]] · [[Crypto Migration v5]] |
| Backup encryption | PBKDF2-SHA256 (100k iter) → AES-256-GCM | [[Backup Crypto]] |
| Restore swap | Atomic state-machine on marker file | [[Restore Atomicity]] |
| Export password protection | Re-uses backup crypto | [[PDF Export]], [[ZIP Export]] |

> **Doc ↔ code reconciliation (RESOLVED):** Docs previously claimed AES-256-GCM while code was CBC+SHA256. Schema v5 migrated code to real AEAD. See [[AES Mode Discrepancy]] (resolved).

## Key Management

- [[Key Store]] — Device-bound 256-bit key in `expo-secure-store`
- Backup `keyEscrow` allows cross-device recovery

## Authentication

- [[Biometric Auth]] — Optional FaceID/TouchID with auto-lock

## Threat Model

| Threat | Likelihood | Impact | Mitigation |
|--------|------------|--------|------------|
| Device theft | High | High | Full-disk encryption + app-level encryption |
| App cloning | Medium | High | Device-bound encryption keys |
| Forensic recovery | Medium | High | Field-level AES + secure key storage |
| Shoulder surfing | High | Medium | Biometric auth + auto-lock |
| Malware/rooted device | Low | High | Hardware-backed keystore |
| Data leakage via backups | Medium | High | Exclude from cloud backups |

---

## Related

- [[EverSiteAudit Master Governance]]
- [[Security Index]]
- [[Security Protocols]]
- [[OWASP Compliance]]
- [[Privacy Guarantees]]
