---
type: schema
path: src/services/db/schema.ts
---

# Database Schema

Current schema version: **4**

## Tables

| Table | PK | Soft Delete | FK |
|-------|----|-------------|-----|
| `projects` | `id TEXT` | Yes | — |
| `issues` | `id TEXT` | Yes | `project_id → projects(id) ON DELETE CASCADE` |
| `photos` | `id TEXT` | Yes | `project_id → projects(id)`, `issue_id → issues(id) ON DELETE SET NULL` |
| `annotations` | `id TEXT` | Yes | `photo_id → photos(id) ON DELETE CASCADE` |
| `templates` | `id TEXT` | Yes | — |
| `settings` | `key TEXT` | No | — |
| `export_history` | `id TEXT` | No | `project_id → projects(id) ON DELETE CASCADE` |

## Indexes

- `projects`: `status`, `updated_at DESC`, `created_at DESC`, `is_deleted`
- `issues`: `project_id`, `status`, `severity`, `category`, `updated_at DESC`, `is_deleted`
- `photos`: `project_id`, `issue_id` (partial), `created_at DESC`, `is_deleted`
- `annotations`: `photo_id`, `is_deleted`
- `templates`: `type`, `is_default`
- `export_history`: `project_id`, `export_timestamp DESC`

## Engine

- `expo-sqlite` with `STRICT` tables
- WAL mode
- Foreign keys enabled

## Related

- [[Database Connection]]
- [[Database Migrations]]
- [[Data Layer Index]]
