---
type: architecture
analysis: coupling
---

# Coupling Hotspots

Tight coupling clusters identified across the codebase.

## 1. Store ↔ Repository Direct Coupling

Every Zustand store imports its repository singleton directly. No intermediate service or port/adapter boundary. Stores are not interchangeable with alternate data sources.

## 2. Two Competing Data Paths

Screens occasionally bypass stores and call repositories directly:
- `photos/[id].tsx` → `photoRepository`
- `issues/[id].tsx` → `issueRepository`
- `issues/edit/[id].tsx` → `issueRepository`
- `templates/index.tsx` → `templateRepository`

This leaves store state stale.

## 3. Repository Singleton Pattern

Every repository constructs `private db = getDatabase()`. No DI, no test DB injection, no transaction context passing.

## 4. Export Data Fetching Duplication

Each export format (PDF, ZIP, JSON, CSV) independently fetches project/issues/photos. No shared `ExportDataBuilder`.

## 5. Circular Dependency Fragility

`cacheManager.ts` leaves `clearOrphanedThumbnails()` as no-op to avoid importing repositories.

## Related

- [[Architecture Index]]
- [[Deep Module Candidates]]
- [[Untested Seams]]
