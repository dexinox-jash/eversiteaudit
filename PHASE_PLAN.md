# EverSiteAudit - Master Implementation Plan

## Current State (As of Execution)
- **Framework**: React Native 0.76 + Expo 52 + TypeScript 5.6
- **Test Status**: 45/45 suites passing, 300/300 tests passing
- **Typecheck**: 0 errors
- **Lint**: 0 errors (verify gate clean)

## What's Built (Solid Foundation)
- Full navigation with expo-router (tabs + stack + modals)
- SQLite data layer with migrations (schema v4), field-level AES-256-GCM encryption
- 7 tables: projects, issues, photos, annotations, templates, settings, export_history
- 5 repositories: Project, Issue, Photo, Annotation, Template (read-only)
- 5 Zustand stores with optimistic updates and rollback
- 15 fully-built reusable components
- 17 screen routes (0 stubs)
- Theme system: dark/light/high-contrast + reduce-motion
- Camera: burst mode, flash, grid, real-time review strip, severity bottom sheet
- Photo annotation canvas: arrow, circle, rectangle, pen, text, undo/redo, color picker
- Export engine: PDF, ZIP, JSON, CSV with password protection and company branding
- Backup/restore: encrypted archives, migration wizard, checksum verification
- Bulk selection for issues and photos
- Drag-and-drop photo reordering in issue edit
- GPS capture, voice notes, gallery import
- Biometric auth gate, backup reminders, deep linking, OS share

## Critical Fixes Already Applied
- ✅ Database foreign keys now enabled (`PRAGMA foreign_keys = ON` in `connection.ts`)
- ✅ `cacheManager.test.ts` OOM fixed
- ✅ `usePreferenceStore.test.ts` mock fixed
- ✅ `screenLabels.test.tsx` and `settings.test.tsx` mocks fixed
- ✅ `lucide-react-native` added to `transformIgnorePatterns`

## Remaining Gaps (Prioritized)

### P0 — Data Layer Completeness
1. **Add SettingsRepository** — `settings` table exists but is unused; preference store writes to AsyncStorage
2. **Add ExportHistoryRepository** — `export_history` table exists but has no write path from export services
3. **Cascade soft-delete** — deleting a project should soft-delete child issues/photos/annotations
4. **Remove duplicate crypto** — `src/services/security/crypto.ts` duplicates `fieldEncryption.ts`
5. **Enable WAL mode** — `PRAGMA journal_mode = WAL` for better concurrent performance

### P1 — Missing Core UX
6. **Issue drag-and-drop reordering** — `useIssueStore` has `updateSortOrder`, but `src/app/(tabs)/issues.tsx` uses a plain FlatList with no DnD gestures
7. **Auto-lock timeout wiring** — Settings UI has `autoLockTimeout` chips, but value is not persisted to preference store and `BiometricGate` ignores it (locks immediately on background)
8. **Real export progress** — `src/app/export/index.tsx` fakes progress with `setInterval`; export services provide no progress callbacks
9. **Template customization UI** — Templates are seed-only; no UI to create, edit, or customize templates

### P2 — Advanced Features
10. **Report template selector (8 templates)** — PDF export has a single hardcoded layout; no selector UI
11. **iOS Shortcuts / Android Widgets** — `shortcuts.ts` only implements app-icon Quick Actions; no Siri Shortcuts or home screen widgets
12. **SQLCipher database-level encryption** — PRD specifies SQLCipher, but current implementation uses field-level encryption on plain expo-sqlite

### P3 — Quality & Testing
13. **UI component tests** — 13 components have zero tests
14. **Missing screen tests** — `migration/index.tsx`, `(tabs)/issues/new.tsx`, `_layout.tsx`, `(tabs)/_layout.tsx`
15. **Missing service tests** — `BackupArchiver.ts`, `BackupExtractor.ts`, `BackupService.ts` restore path, `keyStore.ts`, `crypto.ts`, `migrations.ts`, `schema.ts`
16. ~~**Accessibility gaps**~~ ✅ Resolved — Added missing `accessibilityLabel`/`accessibilityRole` to header buttons, camera controls, export/migration buttons, and photo grid items. Fixed RNTL `act()` warnings in export tests. Updated Badge component to combine icon + text for screen readers.
17. **Hardcoded colors** — Camera overlay uses literal hex colors instead of theme tokens

---

## Execution Strategy
1. Spawn specialized Ruflo agent swarms for each workstream.
2. Each agent reads this plan, the PRD, and relevant source files before coding.
3. Every change must include or update tests.
4. Run `npm run verify` (typecheck + lint + test) before declaring completion.
5. Agents document their changes in commit-ready summaries.
