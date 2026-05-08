---
type: analysis
severity: architectural-friction
---

# DTO Layer Gap

## Finding

`database.md` and `rules.md` mandate typed DTOs with validation for all data transfers. However, **`src/types/dto/` is completely empty**.

## Evidence

- `src/types/dto/` directory exists but contains no files
- All data flows use raw domain types from `src/types/` directly
- No zod, yup, or io-ts validation schemas exist for API boundaries
- Repository methods accept loose object shapes rather than validated DTOs

## Impact

- **Type safety gap:** No runtime validation at data boundaries
- **Repository coupling:** Screens and stores pass untyped objects directly to repositories
- **Future API risk:** If backend integration is ever added, there is no validation layer
- **Documentation drift:** `database.md` promises DTOs that don't exist

## Recommendation

1. Define DTO types for all CRUD operations (CreateProjectDTO, UpdateIssueDTO, etc.)
2. Add zod schemas for runtime validation
3. Update repositories to accept DTOs instead of raw objects
4. Update stores to construct DTOs before calling repositories

## Related

- [[Architecture Index]]
- [[Data Layer Index]]
- [[Database Architecture]]
- [[Schema Principles]]
