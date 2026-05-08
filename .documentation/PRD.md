# EverSiteAudit — Product Requirements Document

**Version:** 1.0.0  
**Date:** April 2026  
**Status:** Production  
**Platform:** iOS 15+ / Android API 26+  

---

## 1. Executive Summary

EverSiteAudit is a privacy-first, offline-native mobile application for construction site managers, safety inspectors, and facility auditors. All data remains on-device unless explicitly exported by the user.

### 1.1 Key Facts

| Attribute | Value |
|-----------|-------|
| Framework | React Native 0.76 + Expo SDK 52 |
| Database | SQLite (expo-sqlite) with field-level AES-256-GCM encryption |
| State Management | Zustand 5.0 |
| Styling | Tailwind CSS v4 + native StyleSheet |
| Test Coverage | 83 suites, 640 tests, 0 type errors, 0 lint errors |
| Data Transmission | Zero auto-transmission; all exports require explicit user action |

### 1.2 Core Value Proposition

> "Your data. Your device. Your control. Always."

- **Offline-first:** 100% functionality without network connectivity
- **Privacy-first:** No cloud sync, no telemetry, no analytics
- **Professional exports:** PDF reports with company branding, ZIP/JSON/CSV archives
- **Enterprise security:** AES-256-GCM field encryption, biometric auth, encrypted backups

---

## 2. Glossary

| Term | Definition |
|------|------------|
| **Project** | Top-level container for a site audit, inspection, or visit |
| **Issue** | A finding, defect, hazard, or observation within a Project |
| **Photo** | Image captured or imported, linked to Projects and/or Issues |
| **Annotation** | Non-destructive visual markup (arrow, circle, rectangle, pen, text) stored as metadata |
| **Template** | Reusable project structure with predefined issue categories |
| **Severity** | Critical → High → Medium → Low |
| **Status** | Open → In Progress → Resolved |
| **Export** | Extract data to PDF, ZIP, JSON, or CSV format |
| **Backup** | Encrypted archive of entire database + photos for device migration |

---

## 3. Features (Implemented)

### 3.1 Projects

| Capability | Status |
|------------|--------|
| Create project with name, location, client, notes | ✅ |
| Templates — auto-generate starter issues from reusable templates | ✅ |
| View — project dashboard with stats, issue lists, photo galleries | ✅ |
| Edit — update metadata, status, priority | ✅ |
| Archive — soft-delete with recovery | ✅ |
| Search — real-time filtering by name or client | ✅ |
| Sort — reorder issues via up/down controls | ✅ |

### 3.2 Issues

| Field | Status |
|-------|--------|
| Title / Description | ✅ |
| Category (Structural, Electrical, Plumbing, Safety, etc.) | ✅ |
| Severity (Critical/High/Medium/Low) | ✅ |
| Status (Open/In Progress/Resolved) | ✅ |
| GPS Location (lat, lon, accuracy) | ✅ |
| Assignee | ✅ |
| Due Date | ✅ |
| Voice Notes | ✅ |
| Resolution Notes | ✅ |
| Photos — unlimited per issue | ✅ |
| Bulk selection and operations | ✅ |
| Drag-and-drop reordering (via up/down arrows, not gestures) | ✅ |

### 3.3 Photos & Annotations

| Capability | Status |
|------------|--------|
| Camera — burst mode, flash toggle, grid overlay, severity tagging | ✅ |
| Gallery Import — pick existing images | ✅ |
| Annotation Tools — arrow, circle, rectangle, freehand pen, text | ✅ |
| Colors — 7 preset colors + adjustable stroke width | ✅ |
| Undo/Redo — full history stack | ✅ |
| Association — linked to projects and/or issues | ✅ |
| Captions and GPS tagging | ✅ |

### 3.4 Templates

| Capability | Status |
|------------|--------|
| 4 pre-loaded defaults (Blank, Safety Inspection, Snagging List, Quality Control) | ✅ |
| Create custom templates | ✅ |
| Edit custom templates | ✅ |
| Delete custom templates | ✅ |
| Template content encrypted at rest | ✅ |

### 3.5 Exports

| Format | Contents | Password Protection |
|--------|----------|---------------------|
| PDF | 8 branded report templates with project summary, issues, photos | ✅ Optional |
| ZIP | project.json + issues.csv + photos/ folder | ✅ Optional |
| JSON | Full structured project data | ✅ Optional |
| CSV | Tabular issue list with metadata | ✅ Optional |
| Share | OS-native share sheet integration | — |
| History | All exports tracked in encrypted SQLite table | — |

### 3.6 Security & Privacy

| Feature | Implementation |
|---------|----------------|
| Biometric Lock | Fingerprint / Face ID with configurable auto-lock timeout |
| Field Encryption | AES-256-GCM for template fields and backup archives |
| Secure Key Storage | Device-bound key in expo-secure-store |
| Soft Deletes | Deleted records flagged, not destroyed |
| Backup Encryption | ZIP backups encrypted with PBKDF2 + AES-256-GCM |

### 3.7 Backup & Recovery

| Capability | Status |
|------------|--------|
| Full Backup — encrypted archive of database + all photos | ✅ |
| Key Escrow — encryption key embedded in backup (password-protected) | ✅ |
| Auto-Complete Restore — database swapped on next app restart | ✅ |
| Age Monitoring — persistent banner if backup >30 days old | ✅ |
| Project Exports — self-contained ZIP/JSON can re-import individual projects | ✅ |

### 3.8 OS Integrations

| Integration | Status |
|-------------|--------|
| Deep Linking — `eversiteaudit://` URLs | ✅ |
| Quick Actions — home-screen shortcuts (New Project, New Issue, Open Camera) | ✅ |
| Haptics — contextual vibration feedback | ✅ |
| Safe Area — full support for notches, dynamic islands, gesture areas | ✅ |

---

## 4. Non-Functional Requirements

### 4.1 Performance

- App launch < 3 seconds
- Camera capture < 500ms
- Gallery scroll at 60fps with 1000+ photos (virtualized)
- Issue list performs with 500+ items
- Export time < 5 minutes for 100 photos

### 4.2 Accessibility

- All interactive elements have `accessibilityLabel`
- Color contrast ≥ 4.5:1 for normal text
- Screen reader support (VoiceOver / TalkBack)
- Dynamic type scaling up to 200%
- Reduced motion compliance

### 4.3 Security

- No data leaves device without explicit user action
- Excluded from OS cloud backups (`allowBackup: false`)
- Encryption keys never stored in AsyncStorage
- All SQLite queries use parameterized statements

---

## 5. Constraints

- **No animation libraries:** `react-native-reanimated` and `react-native-gesture-handler` are banned
- **No cloud dependency:** App functions identically offline
- **No telemetry:** Zero analytics, crash reporting is opt-in only
- **Dependency immutability:** Expo SDK 52 and React Native 0.76 compatibility protected

---

## 6. Known Gaps

| # | Gap | Priority |
|---|-----|----------|
| 1 | iOS Shortcuts / Android Widgets — only app-icon Quick Actions exist | P2 |
| 2 | SQLCipher database-level encryption — currently field-level only | P2 |

---

*End of PRD*
