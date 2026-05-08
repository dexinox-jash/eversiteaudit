# Testing Rules

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. The Verification Gate

```bash
npm run verify   # typecheck + lint + test
```

This command is the **only** accepted measure of project health. It must pass with:
- **0 TypeScript errors**
- **0 ESLint warnings**
- **100% of tests green**

## 2. Test Framework

- **Jest** with `jest-expo` preset
- **React Native Testing Library** for component tests
- Tests live in `tests/` mirroring `src/` structure, or co-located in `__tests__/` folders

## 3. Mock Strategy

- Native modules (`expo-sqlite`, `expo-file-system`, `expo-crypto`, etc.) are mocked in `tests/setup.ts`.
- Router is mocked with `jest.mock('expo-router')`.
- Theme provider is mocked to avoid async preference loading in unit tests.
- Field encryption is mocked to pass-through (no actual crypto in tests).

## 4. What to Test

| Layer | Coverage Requirement |
|-------|---------------------|
| Repositories | All CRUD methods, soft delete logic, recovery paths |
| Stores | State transitions, optimistic updates, error states |
| Services | Backup/restore round-trip, export generation, crypto helpers |
| Components | Render paths, accessibility props, user interactions |
| Screens | Navigation effects, form submission, error toasts |

## 5. Test Naming

- `describe` the module or component.
- `it` describes behavior: `it('creates a project with the given name')`.
- Group related assertions under a single `it` when they test one behavior.

## 6. No Test Left Behind

- If you change code, update or add tests.
- If you remove a feature, remove its tests.
- If a test is flaky, fix the underlying race condition — do not skip the test.
