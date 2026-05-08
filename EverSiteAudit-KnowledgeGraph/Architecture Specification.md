---
type: documentation
source: .documentation/ARCHITECTURE.md
---

# Architecture Specification

> **Version:** 1.0 | **Date:** January 2025
> **Source:** `.documentation/ARCHITECTURE.md`

---

## Executive Summary

EverSiteAudit is built on three foundational principles:
1. **Privacy-First by Design** — All data remains on-device. No backend, no cloud sync, no telemetry.
2. **100% Offline Functionality** — Full feature parity regardless of network connectivity.
3. **Enterprise-Grade Security** — Hardware-backed encryption with defense-in-depth strategy.

## Technology Stack

| Component | Choice |
|-----------|--------|
| Framework | React Native 0.76 + Expo SDK 52 |
| Language | TypeScript 5.6+ |
| Database | `expo-sqlite` with field-level AES-256-GCM encryption |
| State Management | Zustand |
| PDF Generation | `expo-print` HTML-to-PDF |
| Minimum iOS | 15.0 |
| Minimum Android | API 26 (Android 8.0) |

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo-sqlite` | SQLite database with migration support |
| `expo-secure-store` | Hardware-backed key storage |
| `expo-local-authentication` | Biometric authentication |
| `expo-image-picker` | Photo gallery access |
| `expo-camera` | Camera capture |
| `expo-print` | HTML-to-PDF generation |
| `jszip` | ZIP creation |
| `zustand` | State management |

## Architecture Evolution

The stack originally specified Flutter 3.24+ with SQLCipher in PRD v1.0. During implementation, the team pivoted to **React Native 0.76 + Expo 52** to leverage Expo's first-class camera, print, and SQLite ecosystem.

## Database Schema

7 tables with full DDL specifications in source document:
- `projects` — Top-level audit containers
- `issues` — Individual findings/defects
- `photos` — Image files with EXIF metadata
- `annotations` — Photo markup (arrow, circle, rectangle, text, highlight)
- `templates` — Reusable project structures
- `settings` — Key-value preferences
- `export_history` — Export audit log

## Security Architecture

### Defense in Depth

```
LAYER 1: OS PROTECTION
  • iOS Data Protection (NSFileProtectionComplete)
  • Android File-Based Encryption (FBE)
  • Device PIN/Biometric required

LAYER 2: APPLICATION ENCRYPTION
  • Field-level AES-256-GCM for sensitive columns
  • Hardware-backed key derivation
  • Passphrase-encrypted ZIP backups

LAYER 3: KEY MANAGEMENT
  • iOS: Secure Enclave / Keychain
  • Android: TEE / StrongBox Keystore
  • Key rotation on app reinstall
```

## File System Design

```
${APP_DOCUMENTS}/
├── database/
│   └── eversiteaudit.db
├── photos/
│   ├── original/${PROJECT_ID}/${PHOTO_ID}.jpg
│   ├── thumbnails/${PROJECT_ID}/${PHOTO_ID}.jpg
│   └── compressed/${PROJECT_ID}/${PHOTO_ID}.jpg
├── exports/
│   ├── pdf/${EXPORT_ID}.pdf
│   └── zip/${EXPORT_ID}.zip
└── cache/
    └── image_processing/
```

---

## Related

- [[EverSiteAudit Master Governance]]
- [[Database Architecture]]
- [[Safety and Security]]
- [[Data Layer Index]]
- [[Services Index]]
