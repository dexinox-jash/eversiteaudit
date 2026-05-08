---
type: governance
source: database/schema-principles.md
parent: [[Database Architecture]]
---

# Schema Principles

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. Tables

All domain tables follow this convention:

```sql
CREATE TABLE IF NOT EXISTS <entity> (
  id TEXT PRIMARY KEY,
  -- domain columns --
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_deleted INTEGER DEFAULT 0,
  deleted_at INTEGER
);
```

Every table has:
- `id`: UUID primary key
- `created_at` / `updated_at`: Unix timestamps in milliseconds
- `is_deleted`: Soft delete flag (0 = active, 1 = deleted)
- `deleted_at`: Timestamp of deletion, nullable

## 2. Foreign Keys

- All relationships use explicit `FOREIGN KEY` constraints.
- `ON DELETE CASCADE` where child records should not outlive parents.
- `PRAGMA foreign_keys = ON;` is set on every database connection.

## 3. Indexes

- Index all foreign key columns.
- Index columns used in `WHERE`, `ORDER BY`, and `JOIN` clauses.
- Index `is_deleted` on tables with frequent soft-delete filtering.

## 4. WAL Mode

- `PRAGMA journal_mode = WAL;` is set on every connection.
- Enables concurrent reads during writes.

## 5. Schema Files

- `schema.ts`: Contains all `CREATE TABLE` and `CREATE INDEX` statements.
- `migrations.ts`: Contains all schema-altering `ALTER TABLE` statements.
- No `DROP TABLE` statements anywhere in `src/`.

---

## Related

- [[Database Architecture]]
- [[Migration Rules]]
- [[Data Safety]]
- [[Database Schema]]
