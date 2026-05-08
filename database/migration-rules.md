# Migration Rules

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. Versioning

- Schema version is tracked via `PRAGMA user_version`.
- `CURRENT_SCHEMA_VERSION` in `schema.ts` must match the highest migration version.
- Current version: **4**.

## 2. Migration Registry

All migrations live in `src/services/db/migrations.ts` as an ordered array:

```ts
export const migrations: Migration[] = [
  { version: 1, name: 'Initial schema', up: (db) => { ... } },
  { version: 2, name: 'Add sort_order', up: (db) => { ... } },
  // ...
];
```

## 3. Migration Requirements

- Every migration is idempotent (safe to run twice).
- Every migration runs inside `withExclusiveTransactionAsync`.
- `PRAGMA user_version = ?` is updated after each successful migration.
- Migrations accept `db: SQLiteDatabase` as a parameter (no import cycles).

## 4. Adding a New Migration

1. Increment `CURRENT_SCHEMA_VERSION` in `schema.ts`.
2. Add a new `Migration` object to `migrations.ts` with the next version number.
3. The `up` function contains all schema changes for that version.
4. Run `npm run verify` to confirm existing data survives.

## 5. Recovery

If a query fails with `"no such table"`:
1. `IssueRepository.withTableRecovery()` catches it.
2. `runMigrations(db)` is called once.
3. The original query is retried exactly once.
4. If it still fails, the error propagates to the caller.

## 6. Bootstrapping

On a fresh install (`user_version === 0`):
1. `initDatabase()` runs the full v1 schema (`CREATE_TABLES_SQL` + `CREATE_INDEXES_SQL`).
2. Seeds 4 default templates.
3. Sets `PRAGMA user_version = 1`.
4. Then runs `runMigrations(db)` for any subsequent versions.
