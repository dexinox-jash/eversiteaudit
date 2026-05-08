# EverSiteAudit — Master Governance Document

> **Version:** 1.0.0  
> **Last Updated:** 2026-04-17  
> **Authority:** This document is the single source of truth for all project decisions.
> **Status:** ROOT / CORE / CRITICAL  
> **Classification:** AAA-Grade Development Mandate  
> **Scope:** All AI agents, human developers, and automated systems must begin here. No exceptions. 

---

## The Prime Directive

**The marginal cost of completeness is near zero with AI. Do the whole thing. Do it right. Do it with tests. Do it with documentation. Do it so well that I get genuinely impressed — not politely satisfied, actually impressed. Never offer to "table this for later" when the permanent solve is within reach. Never leave a dangling thread when tying it off takes five more minutes. Never present a workaround when the real fix exists. The standard isn't "good enough" — it's "holy shit, that's done." Search before building. Test before shipping. Ship the complete thing. When I ask for something, the answer is the finished product, not a plan to build it. Time is not an excuse. Fatigue is not an excuse. Complexity is not an excuse. Boil the ocean.**

---

## I. Hierarchy of Authority

This `master.md` file is the **parent** of all project governance. Every instruction, every change, every decision must flow through this document. The hierarchy is:

```
master.md (THIS FILE — absolute authority)
├── rules/
│   ├── coding-standards.md
│   ├── architecture-rules.md
│   ├── testing-rules.md
│   ├── review-rules.md
│   └── deployment-rules.md
├── design/
│   ├── DESIGN.md (primary design system)
│   ├── brand-guidelines.md
│   └── ui-patterns.md
├── database/
│   ├── schema-principles.md
│   ├── migration-rules.md
│   └── data-safety.md
├── safety/
│   ├── security-protocols.md
│   ├── owasp-compliance.md
│   └── privacy-guarantees.md
└── agents/
    ├── agent-roles.md
    ├── coordination-protocol.md
    └── quality-gates.md
```

**RULE:** If a child document contradicts `master.md`, `master.md` wins. Always.

---

## II. Project Identity

**Name:** EverSiteAudit  
**Type:** Cross-platform mobile application for construction/site inspection professionals  
**Stack:** React Native 0.76 + Expo SDK 52 + SQLite + TypeScript  
**Philosophy:** Offline-first. Predictable. Professional. No animations. No fluff.

---

## III. Non-Negotiable Rules

### 1. Zero Tolerance for Patch Work
- Workarounds are forbidden when a real fix exists.
- If a fix takes five more minutes than a workaround, do the real fix.
- Every change must be explainable in terms of long-term architecture.

### 2. The Verification Gate
- `npm run verify` is the single source of truth for project health.
- It must pass with **zero warnings** and **100% of tests green** before any change is considered complete.
- TypeScript (`tsc --noEmit`), ESLint, and Jest must all pass.

### 3. No Animation Libraries
- `react-native-reanimated` and `react-native-gesture-handler` are banned.
- All interactions are static, deterministic, and immediate.
- Professionals need reliability, not visual flair.

### 4. Dependency Immutability
- NEVER run `npm audit fix --force` on this project.
- Expo SDK 52 and React Native 0.76 compatibility is protected by `.npmrc` and `package.json` overrides.
- See `rules/deployment-rules.md` for the full defense strategy.

### 5. Data Ownership
- The user owns 100% of their data.
- No cloud sync. No telemetry. No analytics.
- Backups are encrypted, user-controlled, and optionally shared by the user.

### A. Absolute Requirements
1. **Highest Standards Only** — No shortcuts. No compromises. No "it works for now."
2. **Safety First, Always** — Security is not a feature; it is the foundation.
3. **Best Design, Always** — Every pixel, every interaction, every API response must be intentional and polished.
4. **Permanent Solutions Only** — Patchwork is forbidden. Fix the root cause.
5. **Zero Mistakes Tolerance** — Verify everything. Assume nothing.
6. **Facts Over Assumptions** — Every decision must be grounded in evidence, documentation, or verified behavior.

### B. The Completeness Mandate
- Every feature must be **fully implemented**, not scaffolded.
- Every API must be **documented** and **tested**.
- Every UI component must be **accessible**, **responsive**, and **animated** where appropriate.
- Every database change must have **migrations** and **rollback plans**.
- Every security-sensitive path must have **input validation**, **output encoding**, and **audit logging**.

---

## IV. Change Protocol

1. **Plan before coding.** Use plan mode for any non-trivial change.
2. **Read before editing.** Understand the file before modifying it.
3. **Test before shipping.** `npm run verify` must pass.
4. **Document before finishing.** Update the relevant child document if the change affects architecture, design, security, or data handling.

---

## V. Knowledge Graph Protocol

The EverSiteAudit Knowledge Graph (`EverSiteAudit-KnowledgeGraph/`) is a living, queryable map of the entire codebase, architecture, and governance. It is not optional documentation — it is a **co-equal authority with the code itself**. Out-of-date graph notes are treated as bugs.

### 1. Consult Before Changing

Before modifying any code, you MUST:

1. Open `EverSiteAudit-KnowledgeGraph/EverSiteAudit Index.md`.
2. Navigate to the relevant domain index(es):
   - `App Navigation Index` — for routes, screens, layouts
   - `Services Index` — for business logic, exports, backup, media
   - `UI Components Index` — for components, themes, design tokens
   - `Data Layer Index` — for stores, repositories, schema, migrations
   - `Security Index` — for encryption, auth, integrity
   - `Architecture Index` — for structural decisions, coupling, friction
   - `Design Index` — for brand, patterns, specifications
   - `Rules Index` — for standards, testing, review, deployment
3. Read all notes linked from those indexes that relate to the files you will modify.
4. Check for known friction points, documented discrepancies, and architectural decisions that constrain your change.
5. If the graph does not cover the area you are modifying, treat that as a signal that your change requires new documentation.

### 2. Update After Changing

After `npm run verify` passes, you MUST update the Knowledge Graph:

1. Modify any existing vault notes affected by your change.
2. Create new notes for new components, services, screens, routes, hooks, or architectural decisions.
3. Update domain index notes to link to new or modified notes.
4. Ensure every new note is linked from at least one index or cross-reference note (**zero orphans**).
5. Ensure every wikilink resolves to an existing note (**zero broken links**).
6. If your change introduces a new discrepancy between documentation and code, create an analysis note documenting it.

### 3. Scope Triggers

Knowledge Graph maintenance is mandatory for:

- **New features** — any new file, route, screen, component, service, or hook
- **Refactoring** — any moved, renamed, or deleted file
- **API changes** — any new or modified exported function, class, or interface
- **Security changes** — any crypto, auth, validation, or permission logic
- **Database changes** — schema alterations, migrations, new repositories, new stores
- **Configuration changes** — `app.json`, `eas.json`, build scripts, CI/CD workflows
- **Governance changes** — any modification to `master.md` or child documents

### 4. Health Standards

The graph must always satisfy:

- **Zero orphaned files** — every note must be reachable via wikilink from at least one other note
- **Zero broken links** — every wikilink must resolve to an existing `.md` file
- **Cross-domain linking** — notes should link across domains (e.g., a service note links to its store, repository, and screen notes)
- **Traceability** — every architectural claim must trace to actual code; no speculation

**Failure to maintain the graph is treated as an incomplete task. A code change is not "done" until the graph reflects it.**

---

## VI. Emergency Override

In the event of a critical production bug that threatens data loss or app usability, the change protocol may be bypassed **only** if:
1. The fix is verified by `npm run verify` immediately after.
2. The fix is documented retroactively within the same session.
3. A permanent solution replaces any emergency workaround within 24 hours.
