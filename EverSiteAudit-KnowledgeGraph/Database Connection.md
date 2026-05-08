---
type: infrastructure
path: src/services/db/connection.ts
---

# Database Connection

Singleton SQLite lifecycle manager with restore swap.

## Functions

- `getDatabase()` — synchronous singleton
- `getDatabaseAsync()` — async variant
- `getDbInitPromise()`
- `closeDatabase()`
- `applyPendingRestore()` — swaps staged DB on launch

## Initialization

1. Opens DB synchronously
2. Checks `PRAGMA user_version`
3. If `0`, executes full v1 schema + seeds + sets `user_version = 1`
4. `runMigrations()` handles v2→v4

## Restore Swap

If `RESTORE_PENDING.json` marker exists:
1. Closes DB singleton
2. Copies staged DB over `SQLite/eversiteaudit.db`
3. Deletes staged file and marker

## Related

- [[Database Schema]]
- [[Database Migrations]]
- [[Backup Extractor]]
- [[Data Layer Index]]
