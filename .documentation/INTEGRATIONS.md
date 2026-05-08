# EverSiteAudit — Integrations Document

**Version:** 1.0.0  
**Date:** April 2026  
**Status:** Production

---

## 1. Philosophy

EverSiteAudit is **intentionally offline-first**. There is no cloud sync, no remote API, and no automatic data transmission. All integrations are local to the device or user-initiated. The app functions identically with airplane mode enabled.

---

## 2. OS-Level Integrations

### 2.1 Deep Linking

**Scheme:** `eversiteaudit://`  
**Web fallback:** `https://eversiteaudit.app/*`

| Route | Handler | Screen |
|-------|---------|--------|
| `eversiteaudit://projects/[id]` | `parseDeepLink()` | Project detail |
| `eversiteaudit://issues/[id]` | `parseDeepLink()` | Issue detail |
| `eversiteaudit://photos/[id]` | `parseDeepLink()` | Photo viewer |
| `eversiteaudit://settings` | `parseDeepLink()` | Settings screen |
| `eversiteaudit://export` | `parseDeepLink()` | Export screen |

**Implementation:**
- `src/services/deepLink/deepLinkHandler.ts` — URL parsing + route mapping
- `src/hooks/useDeepLink.ts` — React hook subscribing to `Linking.addEventListener('url')`
- `app.json` — Android intent filters + iOS URL scheme registration

**Share extension integration:** Deep links are generated when sharing projects/issues/photos via the OS share sheet (`src/services/share/shareExtension.ts`).

### 2.2 Quick Actions (Home Screen Shortcuts)

**Library:** `expo-quick-actions`

| Action | ID | Icon | Target |
|--------|-----|------|--------|
| New Project | `new-project` | compose | Create project screen |
| New Issue | `new-issue` | compose | Create issue screen |
| Open Camera | `open-camera` | camera | Full-screen camera |
| Start New Audit | `start-new-audit` | compose | Create project screen |

**Implementation:** `src/services/os/shortcuts.ts`

**Limitations:** iOS Siri Shortcuts and Android home-screen widgets are **not implemented**. They require custom native modules (Swift/Obj-C for Siri Shortcuts, Java/Kotlin for AppWidgetProvider) which are not available in the Expo managed workflow without ejecting.

### 2.3 Haptics

**Library:** `expo-haptics`

| Function | Feedback Type | Usage |
|----------|---------------|-------|
| `hapticLight()` | Light impact | Subtle press feedback |
| `hapticMedium()` | Medium impact | Standard button press |
| `hapticHeavy()` | Heavy impact | Destructive actions |
| `hapticSuccess()` | Success notification | Save, export complete |
| `hapticError()` | Error notification | Validation failure |
| `hapticWarning()` | Warning notification | Cautionary action |

**Implementation:** `src/services/os/haptics.ts`

### 2.4 Biometric Authentication

**Library:** `expo-local-authentication`

- Face ID / Touch ID / Fingerprint
- Configurable auto-lock timeout (preferences stored in encrypted SQLite)
- BiometricGate intercepts app entry when lock is enabled

**Implementation:** `src/services/auth/biometricAuth.ts`

### 2.5 Secure Storage

**Library:** `expo-secure-store`

- AES encryption key stored in device keychain/keystore
- Never stored in AsyncStorage or plain files

**Implementation:** `src/services/security/keyStore.ts`

---

## 3. Media Integrations

### 3.1 Camera

**Library:** `expo-camera` (CameraView)

| Feature | Status |
|---------|--------|
| Burst mode capture | ✅ |
| Flash toggle (on/off/auto) | ✅ |
| Grid overlay | ✅ |
| Severity tagging at capture | ✅ |
| Real-time review strip | ✅ |

**Implementation:** `src/app/camera.tsx`

### 3.2 Photo Gallery Import

**Library:** `expo-image-picker`

- Select existing photos from device library
- Attach to projects or issues
- Auto-extract EXIF (GPS, camera metadata) where available

**Implementation:** `src/services/media/imagePicker.ts`

### 3.3 Voice Recording

**Library:** `expo-av`

- Record voice notes attached to issues
- Playback within issue detail screen

**Implementation:** `src/services/media/voiceRecorder.ts`

### 3.4 Photo Annotation

**Library:** `react-native-svg`

- Non-destructive SVG overlay rendering
- 5 tools: arrow, circle, rectangle, freehand pen, text
- 7 preset colors + adjustable stroke width
- Undo/redo history stack

**Implementation:** `src/app/photos/annotate/[id].tsx`

---

## 4. Export Integrations

### 4.1 PDF Generation

**Library:** `expo-print`

- 8 branded report templates (HTML → PDF)
- A4 page size, 15mm margins
- Company branding (name, header, footer text)
- Optional password protection

**Implementation:** `src/services/export/pdfExport.ts`, `src/services/export/reportTemplates.ts`

### 4.2 ZIP Export

**Library:** `jszip`

- project.json + issues.csv + photos/ folder
- Optional AES password protection

**Implementation:** `src/services/export/zipExport.ts`

### 4.3 JSON Export

- Full structured project data export
- Optional password protection

**Implementation:** `src/services/export/jsonExport.ts`

### 4.4 CSV Export

**Library:** `papaparse`

- Tabular issue list with all metadata columns
- Optional password protection

**Implementation:** `src/services/export/csvExport.ts`

### 4.5 OS Share Sheet

**Library:** `expo-sharing`

- Share any export file to email, messages, cloud storage, etc.
- Automatic MIME type and UTI detection

**Implementation:** `src/services/export/shareExport.ts`

---

## 5. Backup & Migration

### 5.1 Encrypted Backup

- Full database + all photos → encrypted ZIP (`.bin`)
- PBKDF2 key derivation + AES-256-GCM encryption
- Encryption key embedded in backup (encrypted with user's passphrase)
- Key escrow allows restoration on new devices

### 5.2 Restore Flow

1. User selects backup file + enters passphrase
2. `BackupExtractor` decrypts and stages new database
3. `applyPendingRestore()` in `_layout.tsx` swaps staged DB on next app restart
4. App reloads with restored data

### 5.3 Backup Reminders

- Monitors backup age (>30 days triggers reminder)
- Persistent banner in app UI
- Urgency escalates at 60 and 90 days

**Implementation:** `src/services/backup/BackupArchiver.ts`, `BackupExtractor.ts`, `reminderService.ts`

---

## 6. Storage Integrations

### 6.1 SQLite Database

**Library:** `expo-sqlite`

- WAL mode enabled (`PRAGMA journal_mode = WAL`)
- Foreign keys enforced (`PRAGMA foreign_keys = ON`)
- Field-level AES-256-GCM encryption for sensitive template data
- Soft-delete pattern (all tables have `isDeleted`, `deletedAt`)

### 6.2 File System

**Library:** `expo-file-system`

- Photos stored in `FileSystem.documentDirectory`
- Thumbnails auto-generated alongside originals
- SHA-256 checksums for integrity verification
- Backup files stored with `esa_backup_[timestamp].bin` naming

### 6.3 Preferences

**Library:** `expo-secure-store` (encryption key) + SQLite `settings` table (app preferences)

- Not using AsyncStorage for sensitive data
- All preferences routed through `SettingsRepository`

---

## 7. Not Implemented

| Integration | Reason | Workaround |
|-------------|--------|------------|
| iOS Siri Shortcuts | Requires native Swift/Obj-C; not available in managed Expo | Quick Actions (`expo-quick-actions`) |
| Android Home Screen Widgets | Requires native Java/Kotlin AppWidgetProvider; not available in managed Expo | Quick Actions (`expo-quick-actions`) |
| Cloud Sync / iCloud / Google Drive | Privacy-first design — no automatic cloud transmission | Manual export + share to user's cloud app |
| SQLCipher database encryption | Requires native SQLCipher binary; field-level AES used instead | `fieldEncryption.ts` encrypts template fields |
| Push Notifications | No server infrastructure; no remote events to notify about | In-app backup reminders |
| Analytics / Crash Reporting | Privacy-first — zero telemetry | N/A |

---

*End of Integrations Document*
