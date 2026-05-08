# Quality Gates

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. The Gate

```bash
npm run verify
```

This runs:
```bash
npm run typecheck && npm run lint && npm run test
```

**Result must be:**
- TypeScript: `0 errors`
- ESLint: `0 errors, 0 warnings`
- Jest: `All test suites passed` / `All tests passed`

## 2. Pre-Commit Gate

Every commit should run `npm run verify` before committing. The `precommit` script in `package.json` enforces this:

```json
"precommit": "npm run verify"
```

## 3. Post-Change Gate

After any edit:
1. Run `npm run verify`.
2. If it fails, fix before proceeding.
3. If it passes, the change is eligible for completion.

## 4. Test Coverage Gate

- New features require new tests.
- Bug fixes require regression tests.
- Refactors require verification that existing tests still pass.

## 5. Documentation Gate

Architecture-affecting changes require updating the relevant child document:

| Change Affects | Update |
|----------------|--------|
| Code style | `rules/coding-standards.md` |
| Architecture | `rules/architecture-rules.md` |
| Component pattern | `design/ui-patterns.md` |
| Database schema | `database/schema-principles.md` |
| Migration | `database/migration-rules.md` |
| Security | `safety/security-protocols.md` |
| Backup/recovery | `database/data-safety.md` |

## 6. Final Gate

Before declaring any task complete, confirm:
- [ ] `npm run verify` passes with 0 warnings
- [ ] No patch work remains
- [ ] No dangling threads
- [ ] Documentation is updated
- [ ] The solution would impress, not just satisfy
