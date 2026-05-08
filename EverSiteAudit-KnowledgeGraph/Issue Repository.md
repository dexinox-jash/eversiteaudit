---
type: repository
path: src/services/db/repositories/IssueRepository.ts
---

# Issue Repository

Issue CRUD with `withTableRecovery` defensive wrapper.

## Operations

- `getAll()`, `getById(id)`, `getByProjectId(projectId)`
- `create(payload)`
- `update(id, payload)`
- `updateSortOrder(id, sortOrder)`
- `delete(id)` — cascading soft-delete to photos/annotations

## withTableRecovery

Catches `"no such table"` errors, runs migrations, retries once. Compensates for race conditions during app initialization.

## Related

- [[useIssueStore]]
- [[Issue Duplication]]
- [[Data Layer Index]]
