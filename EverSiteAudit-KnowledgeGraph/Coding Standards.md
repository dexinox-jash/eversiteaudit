---
type: governance
source: rules/coding-standards.md
parent: [[Rules Index]]
---

# Coding Standards

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. TypeScript Strictness

- `strict: true` in `tsconfig.json` is non-negotiable.
- No `any` types unless absolutely unavoidable (and then only with a `// eslint-disable-next-line` comment explaining why).
- Explicit return types on all functions, including arrow functions in `useEffect` cleanup.
- Use `??` (nullish coalescing) instead of `||` for default values.

## 2. Naming Conventions

| Construct | Convention | Example |
|-----------|------------|---------|
| Components | PascalCase | `ProjectListScreen` |
| Hooks | camelCase, prefixed with `use` | `useProjectStore` |
| Utility functions | camelCase | `computeImageBounds` |
| Constants | UPPER_SNAKE_CASE | `CURRENT_SCHEMA_VERSION` |
| Types/Interfaces | PascalCase | `CreateIssuePayload` |
| Files | kebab-case for screens, PascalCase for components | `issue-detail.tsx`, `Button.tsx` |

## 3. Import Order

1. React / React Native imports
2. Third-party library imports
3. Absolute project imports (`@components/`, `@services/`, etc.)
4. Relative imports (siblings only when necessary)
5. Type-only imports last

## 4. Accessibility

- Every interactive element must have `accessibilityRole`.
- Every icon-only button must have `accessibilityLabel`.
- Dynamic state changes must use `accessibilityState`.
- Support `reduceMotion` preference (but since animations are banned, this means no implicit motion).

## 5. Error Handling

- No silent `catch` blocks. Every `catch` must either:
  - Log with `console.error`
  - Set user-facing error state
  - Rethrow after cleanup
- Async operations in event handlers must be wrapped: `onPress={() => void handleSubmit()}`.

## 6. Comments

- JSDoc for all exported functions and components.
- Inline comments only when the code's purpose is non-obvious.
- No commented-out code in committed files.

---

## Related

- [[Rules Index]]
- [[Architecture Rules]]
- [[Testing Rules]]
