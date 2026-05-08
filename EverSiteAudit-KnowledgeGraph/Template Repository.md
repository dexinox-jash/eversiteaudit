---
type: repository
path: src/services/db/repositories/TemplateRepository.ts
---

# Template Repository

Template CRUD with legacy plaintext fallback.

## Operations

- `getAll()`, `getById(id)`, `getByType(type)`
- `create(payload)`
- `update(id, payload)`
- `delete(id)` — blocks deletion of built-in `tmpl-*` IDs

## safeDecrypt

Catches decryption errors and returns raw value (needed for migration v4 encrypting previously plaintext seeded templates).

## Related

- [[Template Service]]
- [[Templates Screen]]
- [[Data Layer Index]]
