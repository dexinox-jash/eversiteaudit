---
type: store
path: src/store/useProjectStore.ts
---

# useProjectStore

Zustand store for projects with optimistic UI.

## State

- `projects: Project[]`
- `isLoading`, `error`
- `filter: ProjectFilter` — `all` | `active` | `completed` | `archived`

## Actions

- `loadProjects()`
- `createProject(payload)` — optimistic with temp ID
- `updateProject(id, payload)`
- `deleteProject(id)` — optimistic
- `setFilter(filter)`
- `clearError()`

## Persistence

Memory-only; hydrates from `ProjectRepository` on screen mount.

## Consumers

[[Projects List Screen]], [[New Project Screen]], [[Project Detail Screen]], [[Settings Screen]], [[Onboarding Screen]], [[Camera Screen]], [[Migration Screen]], [[Activity Screen]]

## Related

- [[Project Repository]]
- [[Data Layer Index]]
