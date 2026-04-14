# rules.md — Development Rules & Coding Standards

> **Parent:** `master.md`  
> **Read this for:** Any code change, feature implementation, refactor, or architecture decision.

---

## 1. Methodology: SPARC

For any task that is **not** a trivial bug fix (≤2 lines) or documentation update, the **SPARC methodology** is mandatory.

| Phase | Action | Output |
|-------|--------|--------|
| **S**pecification | Define requirements, acceptance criteria, constraints | Spec document in `docs/decisions/` |
| **P**seudocode | Write high-level algorithmic flow | Pseudocode block in spec or PR description |
| **A**rchitecture | Design interfaces, module boundaries, dependency strategy | Architecture notes or ADR |
| **R**efinement | Iterate based on feedback and safety review | Updated design with review comments addressed |
| **C**ompletion | Implement, test, verify, document | Merged code with truth score ≥ 0.95 |

**Reference Skill:** `sparc-methodology`

---

## 2. Code Quality & Verification

### 2.1 Truth Score Thresholds
| Code Type | Minimum Truth Score | Auto-Rollback |
|-----------|---------------------|---------------|
| Standard feature code | 0.95 | Enabled |
| Security-critical (auth, crypto, payments) | 0.99 | Enabled |
| UI/Design components | 0.95 | Enabled |
| Tests | 0.90 | Enabled |
| Documentation | 0.85 | Disabled |

### 2.2 Pre-Commit Checklist
- [ ] All tests pass (`npm test` or equivalent)
- [ ] Linting passes with zero errors
- [ ] Type checking passes (`tsc --noEmit` for TS projects)
- [ ] No hardcoded secrets (run secret scan)
- [ ] Truth score verified at or above threshold
- [ ] Relevant child docs and skills were read

### 2.3 Architecture Rules
1. **Deep Modules Preferred:** Small interfaces hiding large implementations.
2. **Ports & Adapters:** External dependencies (APIs, DB, storage) must go through an adapter layer.
3. **No Leaky Abstractions:** Implementation details of one module must not leak into another.
4. **Single Responsibility:** One reason to change per module/function.
5. **Immutability by Default:** Prefer pure functions and immutable data structures.

**Reference Skill:** `improve-codebase-architecture`

---

## 3. Language & Framework Standards

### 3.1 TypeScript (Primary Language)
- **Strict mode enabled.** No `any` without explicit justification.
- Use `interface` for object shapes, `type` for unions/aliases.
- Explicit return types on all exported functions.
- Null safety: use optional chaining (`?.`) and nullish coalescing (`??`).

### 3.2 React Native / Expo
- Functional components with hooks only. No class components.
- Custom hooks extracted for reusable logic.
- Platform-specific code isolated in `*.ios.ts` / `*.android.ts` or `Platform.select()`.
- Use React Navigation v6+ for routing.

### 3.3 State Management
- Prefer Zustand or Jotai for global state.
- Use React Context only for theme/auth providers or dependency injection.
- Keep state as close to where it is used as possible.

---

## 4. Testing Requirements

### 4.1 Coverage Minimums
| Layer | Minimum Coverage |
|-------|------------------|
| Utilities / Services | 90% |
| Hooks | 80% |
| Components | 70% |
| Screens | 60% |
| E2E Critical Paths | 100% |

### 4.2 Test Pyramid
1. **Unit Tests** (Jest) — Fast, isolated, mock external dependencies.
2. **Integration Tests** (React Native Testing Library) — Test component interactions and service integrations.
3. **E2E Tests** (Maestro / Detox) — Test complete user flows on real devices or simulators.

### 4.3 TDD for Critical Paths
Security, authentication, and payment flows **must** be developed with Test-Driven Development (TDD).

**Reference Skill:** `pair-programming` (TDD mode)

---

## 5. Git Workflow

### 5.1 Branch Naming
- `feature/description`
- `fix/description`
- `security/description`
- `refactor/description`
- `docs/description`

### 5.2 Commit Message Format
```
<type>(<scope>): <short summary>

<body>

Refs: #issue-number
```
Types: `feat`, `fix`, `security`, `refactor`, `test`, `docs`, `perf`, `chore`

### 5.3 PR Requirements
- PR description must reference the spec/pseudocode from SPARC Specification phase.
- All CI checks must pass.
- At least one code review approval.
- Security review required for `security/*` branches.

---

## 6. Documentation Rules

1. **JSDoc / TSDoc** on all exported functions and components.
2. **README updates** when adding new scripts or changing setup steps.
3. **ADRs (Architecture Decision Records)** for any decision with >1 viable alternative.
4. **CHANGELOG updates** for user-facing changes.

---

## 7. Performance Rules

1. **Images:** Optimize all assets before committing. Use WebP where supported.
2. **Lists:** Use `FlatList` or `FlashList` for long lists. No inline `map` on large datasets.
3. **Re-renders:** Memoize expensive components (`React.memo`, `useMemo`, `useCallback` where measurable).
4. **Bundle Size:** Audit bundle size monthly. No unused dependencies.
5. **Startup Time:** Keep initial bundle lean; defer non-critical imports.

**Reference Skill:** `performance-analysis`

---

## 8. Agentic Development Rules

1. **Swarm First:** If a task touches 3+ files or crosses module boundaries, use `swarm-orchestration`.
2. **Skill Check:** Before writing code, confirm which `.claude/skills/` skill applies and read it.
3. **Plan Mode:** For new features and architectural changes, use `EnterPlanMode` and get approval.
4. **Verification:** Run `verification-quality` checks before declaring any task complete.
5. **No Silent Failures:** If a tool call fails, report it and either retry or escalate to the user.

---

**End of rules.md**
