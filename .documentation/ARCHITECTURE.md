# EverSiteAudit — Architecture Document

**Version:** 1.0.0  
**Date:** April 2026  
**Status:** Production

---

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Native | 0.76 |
| Expo SDK | expo | 52.0.0 |
| Language | TypeScript | 5.6 |
| Navigation | expo-router | File-based (file-system routing) |
| Styling | Tailwind CSS v4 + Native StyleSheet | via Uniwind |
| Database | SQLite (expo-sqlite) | WAL mode, foreign keys |
| State | Zustand | 5.0 |
| Testing | Jest + React Native Testing Library | 83 suites, 640 tests |
| Lint | ESLint | 0 errors |
| Type Check | tsc | 0 errors |

---

## 2. Directory Structure

```
src/
├── app/                    # Expo Router screens (file-system routing)
│   ├── (tabs)/             # Tab navigator: index, projects, issues, settings, activity
│   ├── camera.tsx          # Full-screen camera capture
│   ├── onboarding.tsx      # First-launch onboarding
│   ├── export/index.tsx    # Export screen with format picker
│   ├── issues/             # Issue detail + edit screens
│   ├── photos/             # Photo viewer + annotation canvas
│   ├── projects/           # Project detail screen
│   ├── templates/          # Template management (CRUD)
│   └── migration/          # Device migration (backup/restore)
│
├── components/             # Shared UI primitives
│   ├── ThemeProvider.tsx   # Dark/light/high-contrast context
│   ├── Typography.tsx      # Text with theme-aware scaling
│   ├── Button.tsx          # Primary/secondary/ghost variants
│   ├── TextInput.tsx       # Themed input with focus states
│   ├── Card.tsx            # Elevated/surface card variants
│   ├── Screen.tsx          # SafeArea + ScrollView wrapper
│   ├── Header.tsx          # Nav header with back/close buttons
│   ├── FAB.tsx             # Floating action button
│   ├── Badge.tsx           # Severity/status/chip badges
│   ├── Checkbox.tsx        # Toggle checkboxes
│   ├── Switch.tsx          # Toggle switches
│   ├── Toast.tsx           # Ephemeral notification banner
│   ├── EmptyState.tsx      # Empty list illustrations
│   ├── ListItem.tsx        # Pressable row with chevron
│   ├── ActionRow.tsx       # Dual-action bottom bar
│   ├── ScreenHeader.tsx    # Title + subtitle header
│   ├── Section.tsx         # Grouped section with divider
│   ├── StatBadge.tsx       # Numeric stat display
│   └── ScreenPlaceholder.tsx # Loading skeleton
│
├── services/               # Business logic layer
│   ├── db/                 # Database: schema, migrations, repositories
│   ├── export/             # PDF, ZIP, JSON, CSV generation
│   ├── media/              # Camera, gallery picker, voice recorder
│   ├── backup/             # Full-database encrypted backup
│   ├── security/           # Field encryption, key storage, crypto utils
│   ├── auth/               # Biometric authentication
│   ├── integrity/          # Photo SHA-256 checksum verification
│   ├── deepLink/           # Deep link URL handling
│   ├── share/              # OS share extension integration
│   ├── storage/            # Preferences, cache management
│   ├── os/                 # Haptics, quick actions
│   ├── sync/               # Reserved for future sync infrastructure
│   ├── template/           # Template creation, project generation from template
│   └── duplication/        # Clone project + issues + photos
│
├── store/                  # Zustand state stores
│   ├── useProjectStore.ts
│   ├── useIssueStore.ts
│   ├── usePhotoStore.ts
│   ├── useAnnotationStore.ts
│   └── usePreferenceStore.ts
│
├── theme/                  # Design tokens
│   ├── colors.ts           # Dark-first palette (Linear-inspired)
│   ├── typography.ts       # Inter Variable scale (weights 510/590)
│   ├── spacing.ts          # 4px grid system
│   ├── radius.ts           # Border radius tokens
│   ├── shadows.ts          # Elevation shadows
│   └── animations.ts       # Timing / easing (CSS-only, no reanimated)
│
├── types/                  # Shared TypeScript types
│   ├── domain/             # Core entity types (Project, Issue, Photo, etc.)
│   └── dto/                # Data transfer / request types
│
├── hooks/                  # Shared React hooks
│   └── useDeepLink.ts      # Deep link navigation effect
│
├── constants/              # App-wide constants
│
└── utils/                  # Pure utility functions
    └── format.ts           # Date, number, string formatting
```

---

## 3. Data Architecture

### 3.1 Database Schema (SQLite, WAL mode)

```
projects          — id, name, description, siteAddress, clientName,
                    status, priority, completedAt, createdBy,
                    createdAt, updatedAt, isDeleted, deletedAt

issues            — id, projectId, title, description, category,
                    severity, status, locationDescription,
                    gpsLatitude, gpsLongitude, gpsAccuracy,
                    assignedTo, dueDate, resolutionNotes,
                    resolvedAt, resolvedBy, voiceNoteUrl, sortOrder,
                    createdAt, updatedAt, isDeleted, deletedAt

photos            — id, projectId, issueId, originalPath, thumbnailPath,
                    compressedPath, captureTimestamp, cameraMake, cameraModel,
                    gpsLatitude, gpsLongitude, gpsAltitude,
                    width, height, fileSizeBytes, caption, checksum, tags,
                    sortOrder, createdAt, updatedAt, isDeleted, deletedAt

annotations       — id, photoId, type, x, y, width, height, rotation,
                    color, strokeWidth, textContent, fontSize,
                    createdAt, updatedAt, isDeleted, deletedAt

templates         — id, name, description, type, content, isDefault,
                    usageCount, createdAt, updatedAt, isDeleted, deletedAt

settings          — key, value, valueType, updatedAt

export_history    — id, projectId, exportType, fileName, fileSizeBytes,
                    exportTimestamp, passwordProtected, success, errorMessage
```

### 3.2 Repositories (SQLite access layer)

Each repository wraps CRUD operations with:
- **Soft delete** — sets `isDeleted=1`, never hard-deletes
- **Field encryption** — Template name/description/content encrypted via AES-256-GCM
- **Parameterized queries** — all SQL uses `?` placeholders

| Repository | File |
|-----------|------|
| ProjectRepository | `src/services/db/repositories/ProjectRepository.ts` |
| IssueRepository | `src/services/db/repositories/IssueRepository.ts` |
| PhotoRepository | `src/services/db/repositories/PhotoRepository.ts` |
| AnnotationRepository | `src/services/db/repositories/AnnotationRepository.ts` |
| TemplateRepository | `src/services/db/repositories/TemplateRepository.ts` |
| SettingsRepository | `src/services/db/repositories/SettingsRepository.ts` |
| ExportHistoryRepository | `src/services/db/repositories/ExportHistoryRepository.ts` |

### 3.3 State Flow

```
Screen (React component)
    ↓
Zustand Store  — caches entity lists, triggers UI re-renders
    ↓
Repository  — SQL queries, soft-delete, field encryption
    ↓
expo-sqlite  — WAL mode, foreign keys enabled
```

---

## 4. Security Architecture

### 4.1 Encryption Layers

| Layer | Algorithm | Scope |
|-------|-----------|-------|
| Field encryption | AES-256-GCM (@noble/ciphers; v5 migration; legacy CBC read-compat) | Sensitive text columns across every table |
| Backup encryption | PBKDF2-SHA256 (100k) → AES-256-GCM | Full backup ZIP archives |
| Restore swap | Atomic state-machine on marker file | Prevents half-restored DB on crash |
| Key storage | expo-secure-store | Encryption key, never in AsyncStorage |
| Photo integrity | SHA-256 checksum | File-level photo tamper detection |

Prior to schema v5, the implementation was AES-256-CBC + SHA-256(plaintext) —
still encrypted but not authenticated encryption in the AEAD sense. The v5
migration walks every encrypted column, decrypts via the auto-detecting
legacy-or-v2 path, and re-encrypts with AES-256-GCM. New backups always use
v2-gcm; legacy v1 backups remain restorable via the dual-read path.

### 4.2 Authentication

- **BiometricGate** — intercepts app entry when biometric lock enabled
- **Auto-lock timer** — configurable timeout, applied on app background
- **Preferences stored via** `SettingsRepository` (not raw AsyncStorage)

### 4.3 Backup Security

- `BackupArchiver`: Walks database + photos → encrypted ZIP
- `BackupExtractor`: Decrypts ZIP, stages new database, swaps on next launch via `applyPendingRestore()`
- Encryption key embedded in backup (encrypted with user's passphrase)

---

## 5. Export Architecture

### 5.1 Report Templates (PDF via `expo-print`)

8 built-in HTML templates generate A4 PDFs:
1. **Executive Summary** — metrics + top issues + 4-photo grid
2. **Detailed Technical** — full issue detail + all photos
3. **Photo-First** — full-width photos + linked issues
4. **Checklist** — compact table with severity/status
5. **Timeline** — chronological by creation date
6. **Severity Matrix** — color-coded quadrants
7. **Location-Based** — grouped by locationDescription
8. **Custom** — uses company branding settings

Branding: Company name, header text, footer text (configured per export).

### 5.2 Other Formats

| Format | Generator | Method |
|--------|-----------|--------|
| ZIP | `zipExport.ts` | JSZip compression, optional password |
| JSON | `jsonExport.ts` | JSON.stringify structured data |
| CSV | `csvExport.ts` | Tabular issue list with Papa.unparse |
| Share | `shareExport.ts` | OS share sheet via `expo-sharing` |

---

## 6. Navigation (Expo Router)

### 6.1 Route Map

```
/                         → Dashboard (tab)
/(tabs)/projects          → Project list (tab)
/(tabs)/issues            → Issue list (tab)
/(tabs)/settings          → Settings (tab)
/(tabs)/activity          → Activity log (tab)
/(tabs)/projects/new      → Create project
/(tabs)/issues/new        → Create issue
/projects/[id]            → Project detail
/issues/[id]              → Issue detail
/issues/edit/[id]         → Edit issue
/photos/[id]              → Photo viewer
/photos/annotate/[id]     → Annotation canvas
/camera                   → Full-screen camera
/export                   → Export screen
/templates                → Template management
/migration                → Backup/restore wizard
/onboarding               → First-launch onboarding
```

### 6.2 Deep Links

Scheme: `eversiteaudit://`

- `eversiteaudit://projects/[id]` — open project detail
- `eversiteaudit://issues/[id]` — open issue detail
- `eversiteaudit://camera` — open camera

---

## 7. Testing Architecture

### 7.1 Test Suite Breakdown

| Category | Suite Count | Key Areas |
|----------|-------------|-----------|
| Component | ~30 | Screens, components, modals |
| Service | ~35 | Repositories, export generators, backup, crypto |
| Store | ~8 | Zustand store logic |
| Integration | ~10 | End-to-end flows |

### 7.2 Test Infrastructure

- **Jest** with `react-native` preset
- **MSW** for API mocking (sync service tests)
- **`@testing-library/react-native`** for component tests
- **Coverage** tracked via `jest --coverage`

---

## 8. Key Design Decisions

### 8.1 No Animation Libraries

- `react-native-reanimated` and `react-native-gesture-handler` are banned
- Animations use CSS transitions (`Animated` from React Native) and native `LayoutAnimation`
- Gesture handling via built-in `Pressable`, `ScrollView`, `TouchableOpacity`

### 8.2 Offline-First Data

- SQLite is the single source of truth
- No remote API dependency; all data lives on-device
- Export files are user-initiated only

### 8.3 File Storage

- Photos stored in `FileSystem.documentDirectory` via `expo-file-system`
- Thumbnails auto-generated alongside originals
- SHA-256 checksums verify file integrity on read

---

## 9. Dependencies (Key)

| Package | Purpose |
|---------|---------|
| `expo` | Core SDK |
| `expo-router` | File-based navigation |
| `expo-sqlite` | SQLite database |
| `expo-camera` | Camera capture |
| `expo-image-picker` | Gallery import |
| `expo-print` | PDF generation |
| `expo-sharing` | OS share sheet |
| `expo-file-system` | File I/O |
| `expo-secure-store` | Key storage |
| `expo-local-authentication` | Biometric auth |
| `expo-av` | Voice recording |
| `expo-quick-actions` | Home screen shortcuts |
| `zustand` | State management |
| `lucide-react-native` | Icon library |
| `react-native-svg` | SVG rendering (annotations) |
| `jszip` | ZIP export |
| `papaparse` | CSV generation |
| `crypto-js` | AES encryption |

---

*End of Architecture Document*
