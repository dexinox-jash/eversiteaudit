---
type: infrastructure
path: src/services/db/migrations.ts
---

# Database Migrations

Versioned migration runner with exclusive transactions.

## Registry

| Version | Name | Operations |
|---------|------|------------|
| 1 | Initial schema | Creates all tables, indexes, seeds default templates |
| 2 | Add sort_order | `ALTER TABLE issues ADD COLUMN sort_order INTEGER DEFAULT 0`<br>`ALTER TABLE photos ADD COLUMN sort_order INTEGER DEFAULT 0` |
| 3 | Add voice_note_url & checksum | `ALTER TABLE issues ADD COLUMN voice_note_url TEXT`<br>`ALTER TABLE photos ADD COLUMN checksum TEXT` |
| 4 | Encrypt template fields | Reads all templates, encrypts `name`, `description`, `content`, writes back |

## Mechanism

1. Iterates `migrations` array inside exclusive transaction
2. Skips migrations where `version <= currentVersion`
3. Updates `PRAGMA user_version` after each
4. Concurrent callers deduplicate via shared `migrationPromise`
5. `__resetMigrationPromiseForTests` for test isolation

## Related

- [[Database Connection]]
- [[Database Schema]]
- [[Data Layer Index]]
