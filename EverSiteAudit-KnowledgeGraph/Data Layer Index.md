---
type: index
domain: data
---

# Data Layer Index

Offline-first SQLite data layer with Zustand stores, repository pattern, field-level encryption, and optimistic UI.

---

## Zustand Stores

- [[useProjectStore]] — Projects list, filter, CRUD
- [[useIssueStore]] — Issues CRUD, bulk operations, sort order
- [[usePhotoStore]] — Photos CRUD, bulk operations, sort order
- [[useAnnotationStore]] — Photo annotations CRUD
- [[usePreferenceStore]] — App preferences (theme, biometric, company info)

---

## Repositories

- [[Project Repository]] — Project CRUD + cascading soft-delete + transaction batch create
- [[Issue Repository]] — Issue CRUD + `withTableRecovery` defensive wrapper
- [[Photo Repository]] — Photo CRUD + sort order
- [[Annotation Repository]] — Photo markup CRUD
- [[Template Repository]] — Template CRUD with legacy plaintext fallback
- [[Settings Repository]] — Key-value CRUD (preferences backing)
- [[Export History Repository]] — Export audit log

---

## Database Infrastructure

- [[Database Connection]] — Singleton SQLite lifecycle + restore swap
- [[Database Schema]] — DDL, indexes, seed data (schema v4)
- [[Database Migrations]] — Versioned migration runner (v1→v4)

---

## Types

- [[Domain Types]] — Project, Issue, Photo, Annotation, Template, Setting, ExportHistory

---

## Data Flow

```
Screen → Zustand Store → Repository → SQLite
```

Preferences bypass stores: `PreferenceStore → preferences.ts → SettingsRepository → SQLite`

---

## Related

- [[EverSiteAudit Index]]
- [[Services Index]]
- [[Security Index]]
