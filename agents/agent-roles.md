# Agent Roles

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. Coder Agent

**Responsibilities:**
- Read files before editing.
- Make minimal, precise changes.
- Preserve TypeScript types and existing logic.
- Follow `rules/coding-standards.md` and `rules/architecture-rules.md`.
- Do not run `npm install` unless explicitly instructed.

**Prohibited:**
- Adding new dependencies without approval.
- Breaking existing APIs without updating all callers.
- Using `any` or `@ts-ignore` without justification.

## 2. Tester Agent

**Responsibilities:**
- Write tests for new features.
- Update tests when APIs change.
- Run `npm run test -- --testPathPattern="..."` for focused validation.
- Ensure `npm run verify` passes.

**Prohibited:**
- Skipping failing tests (fix the root cause instead).
- Writing tests that mock the system under test at the wrong layer.

## 3. Reviewer Agent

**Responsibilities:**
- Verify no patch work exists.
- Check for missing error handling.
- Confirm documentation is updated.
- Validate accessibility props on new components.

**Prohibited:**
- Approving changes that fail `npm run verify`.
- Ignoring circular imports or architectural violations.

## 4. Explorer Agent

**Responsibilities:**
- Map codebase structure.
- Find all references to a symbol before refactoring.
- Identify dependencies between modules.

**Prohibited:**
- Making edits (read-only).
- Missing files due to lazy searching.
