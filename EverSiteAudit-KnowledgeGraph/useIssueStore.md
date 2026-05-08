---
type: store
path: src/store/useIssueStore.ts
---

# useIssueStore

Zustand store for issues with optimistic UI and bulk operations.

## State

- `issues: Issue[]`
- `isLoading`, `error`

## Actions

- `loadIssues()`, `loadIssuesByProject(projectId)`
- `createIssue(payload)` — optimistic with temp ID
- `updateIssue(id, payload)`
- `deleteIssue(id)` — optimistic
- `bulkDelete(ids)`
- `bulkUpdateStatus(ids, status)`
- `updateSortOrder(id, sortOrder)`
- `clearError()`

## Persistence

Memory-only; hydrates from `IssueRepository` on screen mount.

## Consumers

[[Project Detail Screen]], [[Issue Detail Screen]], [[Edit Issue Screen]], [[New Issue Screen]], [[Camera Screen]], [[Settings Screen]], [[Migration Screen]], [[Activity Screen]]

## Related

- [[Issue Repository]]
- [[Data Layer Index]]
