---
type: governance
source: safety/owasp-compliance.md
parent: [[Safety and Security]]
---

# OWASP Compliance

> **Authority:** Child of `master.md`. Overrides nothing.

---

## Mobile Top 10 (2024) Coverage

| # | Risk | Status | Mitigation |
|---|------|--------|------------|
| M1 | Improper Credential Usage | N/A | No credentials stored. Biometric is OS-level. |
| M2 | Inadequate Supply Chain Security | ✅ | Exact version pins, `.npmrc` overrides, `legacy-peer-deps` |
| M3 | Insecure Authentication/Authorization | ✅ | Biometric via `expo-local-authentication` (hardware-backed) |
| M4 | Insufficient Input/Output Validation | ✅ | All SQL parameterized. File paths validated. |
| M5 | Insecure Communication | N/A | No network communication. |
| M6 | Inadequate Privacy Controls | ✅ | Offline-first. No analytics. No cloud sync. |
| M7 | Binary Protection Issues | N/A | Expo-managed build handles obfuscation. |
| M8 | Security Misconfiguration | ✅ | `NSFileProtectionComplete`, `allowBackup: false` |
| M9 | Insecure Data Storage | ✅ | AES-256-GCM for templates, secure store for keys |
| M10 | Insufficient Cryptography | ✅ | PBKDF2 + AES-256-GCM for backups. Crypto reviewed. |

## SQL Injection Prevention

- All repository methods use parameterized queries.
- No dynamic SQL string concatenation.
- Schema strings in `schema.ts` are static constants.

## Path Traversal Prevention

- All file operations use `expo-file-system` APIs.
- Photo paths are validated against `documentDirectory`.
- Backup restore validates manifest checksums before extraction.

---

## Related

- [[Safety and Security]]
- [[Security Protocols]]
- [[Privacy Guarantees]]
