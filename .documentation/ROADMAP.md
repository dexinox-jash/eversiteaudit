# EverSiteAudit — Roadmap

**Version:** 1.0.0  
**Date:** April 2026  
**Status:** Production  
**Test Health:** 83 suites, 640 tests passing, 0 type errors, 0 lint errors

---

## 1. Completed (Shipped)

### Core Platform
- [x] React Native 0.76 + Expo SDK 52 + TypeScript 5.6
- [x] SQLite with WAL mode, foreign keys, parameterized queries
- [x] File-system routing via `expo-router`
- [x] Tailwind CSS v4 + native StyleSheet hybrid styling
- [x] Zustand 5.0 state management

### Design System
- [x] Linear-inspired dark-first UI (4 themes: dark, light, high-contrast dark, high-contrast light)
- [x] Inter Variable typography (weights 400/510/590/700)
- [x] 4px spacing grid, 6-tier border radius, luminance-based elevation
- [x] Accessibility: WCAG 2.1 AA, Dynamic Type, screen reader support, reduced motion

### Projects
- [x] Create / edit / archive / soft-delete
- [x] Dashboard with stats, issue lists, photo galleries
- [x] Search and filter by name / client
- [x] Priority levels (low, medium, high, critical)
- [x] Sort issues via up/down controls

### Issues
- [x] Full CRUD with title, description, category, severity, status
- [x] GPS coordinates with accuracy
- [x] Assignee, due date, resolution notes
- [x] Voice notes (record + playback)
- [x] Unlimited photos per issue
- [x] Bulk selection and operations
- [x] Drag-and-drop reordering (via controls, not gestures)

### Photos & Annotations
- [x] Camera: burst mode, flash toggle, grid overlay, severity tagging
- [x] Gallery import with EXIF extraction
- [x] 5 annotation tools (arrow, circle, rectangle, pen, text)
- [x] 7 preset colors + adjustable stroke width
- [x] Undo/redo history stack
- [x] Captions and GPS tagging

### Templates
- [x] 4 pre-loaded defaults (Blank, Safety Inspection, Snagging List, Quality Control)
- [x] Full custom template CRUD (create, edit, delete)
- [x] Template content encrypted at rest
- [x] Create project from template with pre-filled issues

### Exports
- [x] 8 PDF report templates with company branding
- [x] ZIP export (project.json + issues.csv + photos/)
- [x] JSON structured export
- [x] CSV tabular export
- [x] Optional password protection on all formats
- [x] OS share sheet integration
- [x] Export history tracking in SQLite

### Security & Privacy
- [x] Biometric lock (Face ID / Touch ID / Fingerprint)
- [x] Configurable auto-lock timeout
- [x] AES-256-GCM field encryption for templates
- [x] PBKDF2 + AES-256-GCM backup encryption
- [x] Secure key storage in device keychain/keystore
- [x] SHA-256 photo integrity verification
- [x] Soft-delete pattern (never hard-delete)
- [x] Excluded from OS cloud backups (`allowBackup: false`)

### Backup & Recovery
- [x] Full encrypted backup (database + all photos)
- [x] Key escrow for cross-device restoration
- [x] Auto-complete restore (database swap on restart)
- [x] Backup age monitoring with escalating reminders

### OS Integrations
- [x] Deep linking (`eversiteaudit://` + `https://eversiteaudit.app`)
- [x] Quick Actions (4 home-screen shortcuts)
- [x] Haptic feedback (6 patterns)
- [x] Safe area support (notches, dynamic islands)

### Testing
- [x] 83 test suites, 640 tests passing
- [x] 0 TypeScript errors, 0 ESLint errors
- [x] Component tests, service tests, repository tests, store tests

---

## 2. Known Gaps (Not Implemented)

### P2 — Nice to Have

| # | Feature | Blocker | Notes |
|---|---------|---------|-------|
| 1 | **iOS Siri Shortcuts** | Requires native Swift/Obj-C; not available in managed Expo | Quick Actions cover the same entry points |
| 2 | **Android Home Screen Widgets** | Requires native Java/Kotlin AppWidgetProvider; not available in managed Expo | Quick Actions are the alternative |
| 3 | **SQLCipher database-level encryption** | Requires native SQLCipher binary; field-level AES covers sensitive data | Current approach: AES-256-GCM on template fields + encrypted backups |

---

## 3. Future Considerations (No Commits)

These are speculative and have no committed timeline. They would require architectural evaluation before any work begins.

- **Team Collaboration** — Multi-user project sharing (would require server infrastructure; conflicts with offline-first philosophy)
- **Cloud Backup** — Optional encrypted sync to user-owned storage (iCloud, Google Drive) — still user-initiated
- **Desktop Companion** — macOS/Windows app for report generation — would use shared export formats (JSON/ZIP)
- **Barcode/QR Scanning** — Asset tagging for equipment inspections — `expo-camera` supports barcode scanning

---

## 4. Maintenance Mode

The app is feature-complete for its target use case. Ongoing work is limited to:

- Expo SDK version upgrades (annual)
- React Native version upgrades (semi-annual)
- Security patch application (as-needed)
- Dependency updates (quarterly audit)

---

*End of Roadmap*
