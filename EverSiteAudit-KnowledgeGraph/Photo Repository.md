---
type: repository
path: src/services/db/repositories/PhotoRepository.ts
---

# Photo Repository

Photo CRUD + sort order.

## Operations

- `getAll()`, `getById(id)`, `getByProjectId(projectId)`, `getByIssueId(issueId)`
- `create(payload)`
- `update(id, payload)`
- `updateSortOrder(id, sortOrder)`
- `delete(id)` — soft delete

## Related

- [[usePhotoStore]]
- [[Camera Screen]]
- [[Data Layer Index]]
