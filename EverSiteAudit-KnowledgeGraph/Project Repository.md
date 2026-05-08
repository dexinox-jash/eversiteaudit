---
type: repository
path: src/services/db/repositories/ProjectRepository.ts
---

# Project Repository

Project CRUD + cascading soft-delete + transaction batch create.

## Operations

- `getAll()`
- `getById(id)`
- `getByStatus(status)`
- `create(payload)`
- `createProjectWithIssues(projectPayload, issuesPayload[])` — transaction
- `update(id, payload)`
- `delete(id)` — soft delete (`is_deleted = 1`)

## Characteristics

- Uses `getDatabase()` singleton
- Field-level encryption on sensitive columns
- Soft-delete with `is_deleted` + `deleted_at`

## Related

- [[useProjectStore]]
- [[Project Duplication]]
- [[Template Service]]
- [[Data Layer Index]]
