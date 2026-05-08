---
type: governance
source: database/
parent: [[EverSiteAudit Master Governance]]
---

# Database Architecture

> **Authority:** Child of `master.md`. Overrides nothing.

---

## Schema Principles

- [[Schema Principles]] — Table conventions, foreign keys, indexes, WAL mode
- [[Migration Rules]] — Versioning, idempotent migrations, recovery bootstrapping
- [[Data Safety]] — Soft deletes, field encryption, backup encryption, key escrow

## Schema (v4)

7 tables: `projects`, `issues`, `photos`, `annotations`, `templates`, `settings`, `export_history`

- [[Database Schema]] — DDL, indexes, seed data
- [[Database Migrations]] — Versioned migration runner (v1→v4)
- [[Database Connection]] — Singleton SQLite lifecycle + restore swap

## Key Policies

- **Soft deletes** — `is_deleted = 1`, never `DELETE` statements in production.
- **Field encryption** — AES-256-GCM for template fields via `expo-secure-store` key.
- **Backup encryption** — PBKDF2 + AES-256-GCM with user-provided password.
- **WAL mode** — `PRAGMA journal_mode = WAL` for concurrent reads.
- **Foreign keys** — `PRAGMA foreign_keys = ON` on every connection.

## DTO Layer Gap

> `database.md` mandates typed DTOs with zod validation, but `src/types/dto/` is completely empty. See [[DTO Layer Gap]].

---

## Related

- [[EverSiteAudit Master Governance]]
- [[Data Layer Index]]
- [[Schema Principles]]
- [[Migration Rules]]
- [[Data Safety]]
