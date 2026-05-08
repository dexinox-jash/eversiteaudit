---
type: governance
source: PHASE_PLAN.md
parent: [[EverSiteAudit Master Governance]]
---

# Phase Plan

> **Master Implementation Plan** for EverSiteAudit.

---

## Current State

- **Framework:** React Native 0.76 + Expo 52 + TypeScript 5.6
- **Test Status:** 63/63 suites passing, 452/452 tests passing
- **Typecheck:** 0 errors
- **Lint:** 0 errors (23 pre-existing warnings)

## What's Built (Solid Foundation)

- Full navigation with expo-router (tabs + stack + modals)
- SQLite data layer with migrations (schema v4), field-level encryption
- 7 tables, 7 repositories, 5 Zustand stores with optimistic updates
- 20+ reusable components, 17 screen routes
- Theme system: dark/light/high-contrast + reduce-motion
- Camera: burst mode, flash, grid, real-time review strip, severity tagging
- Photo annotation canvas: arrow, circle, rectangle, pen, text, undo/redo
- Export engine: PDF, ZIP, JSON, CSV with password protection
- Backup/restore: encrypted archives, migration wizard, checksum verification
- Bulk selection, drag-and-drop photo reordering, GPS capture, voice notes
- Biometric auth gate, backup reminders, deep linking, OS share

## Remaining Gaps (Prioritized)

### P0 — Data Layer Completeness
1. Add SettingsRepository — `settings` table exists but is unused
2. Add ExportHistoryRepository — `export_history` table has no write path
3. Cascade soft-delete — deleting project should soft-delete children
4. Remove duplicate crypto — `crypto.ts` duplicates `fieldEncryption.ts`
5. Enable WAL mode — `PRAGMA journal_mode = WAL`

### P1 — Missing Core UX
6. Issue drag-and-drop reordering — `updateSortOrder` exists but no DnD UI
7. Auto-lock timeout wiring — Settings UI has chips but not persisted/used
8. Real export progress — export screen fakes progress with `setInterval`
9. Template customization UI — templates are seed-only

### P2 — Advanced Features
10. Report template selector (8 templates) — PDF has single hardcoded layout
11. iOS Shortcuts / Android Widgets — only Quick Actions implemented
12. SQLCipher database-level encryption — PRD specifies SQLCipher

### P3 — Quality & Testing
13. UI component tests — 13 components have zero tests
14. Missing screen tests — migration, new issue, layouts
15. Missing service tests — BackupArchiver, BackupExtractor, keyStore, migrations
16. Hardcoded colors — Camera overlay uses literal hex instead of theme tokens

---

## Phase Handoffs

- [[Phase B Accessibility Handoff]] — Accessibility labels, Badge component, act() warnings
- [[Phase B Icons Handoff]] — App icons, splash screen, adaptive icon, favicon
- [[Phase B Performance Handoff]] — FlatList memoization, PDF export batching
- [[Phase B Platform Handoff]] — Camera edge-cases, iOS/Android compliance, share extension
- [[Phase C Security Handoff]] — Path traversal fix, GCM tag length, 103 JSDoc comments
- [[Phase D Launch Handoff]] — EAS build config, store metadata, screenshot templates

---

## Related

- [[EverSiteAudit Master Governance]]
- [[Implementation Roadmap]]
- [[Product Requirements Document]]
