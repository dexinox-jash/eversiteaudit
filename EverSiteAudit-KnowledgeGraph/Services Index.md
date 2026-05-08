---
type: index
domain: services
---

# Services Index

Business logic services organized by domain. The `src/services/` directory mixes true business-logic services with data-access repositories (architectural friction noted in [[Architecture Index]]).

---

## Authentication & Security

- [[Biometric Auth]] — FaceID/TouchID lock-screen gating
- [[Key Store]] — Device-bound 256-bit encryption key in secure storage
- [[Field Encryption]] — AES-256-GCM field-level encryption for SQLite (v5)

---

## Backup & Migration

- [[Backup Archiver]] — Packages DB + photos into encrypted ZIP
- [[Backup Extractor]] — Decrypts, validates checksums, stages restore
- [[Backup Crypto]] — PBKDF2-SHA256 → AES-256-GCM passphrase crypto (v5)
- [[Backup Reminder Service]] — Time- and count-based backup nudges

---

## Export Pipeline

- [[PDF Export]] — HTML-to-PDF via `expo-print` with 8 report templates
- [[ZIP Export]] — ZIP archive with JSON + CSV + photos
- [[JSON Export]] — Plain JSON dump
- [[CSV Export]] — CSV of issues
- [[Report Templates]] — 8 built-in HTML report generators

---

## Media

- [[Image Picker]] — Gallery import via `expo-image-picker`
- [[Voice Recorder]] — Audio notes via `expo-av`
- [[Photo Integrity]] — SHA-256 checksums for photos

---

## Data & Utilities

- [[Preferences Storage]] — Typed preference loader/saver over settings repo
- [[Cache Manager]] — Disk cache cleanup
- [[Template Service]] — Template-driven project creation
- [[Project Duplication]] — Copy project + issues + re-link photos
- [[Issue Duplication]] — Copy issue + re-link photos
- [[Share Extension]] — Native share sheet for projects, issues, photos

---

## Related

- [[EverSiteAudit Index]]
- [[Data Layer Index]]
- [[Security Index]]
