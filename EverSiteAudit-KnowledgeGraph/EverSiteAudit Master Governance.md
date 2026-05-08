---
type: governance
source: master.md
authority: supreme
---

# EverSiteAudit Master Governance

> **Version:** 1.0.0 | **Status:** ROOT / CORE / CRITICAL
> **Source:** `master.md` (project root)

## The Prime Directive

> "The marginal cost of completeness is near zero with AI..."

Every change must be complete, tested, and documented. No patch work. No silent failures.

---

## I. Hierarchy of Authority

```
master.md (THIS FILE)
├── rules/
│   ├── coding-standards.md
│   ├── architecture-rules.md
│   ├── testing-rules.md
│   ├── review-rules.md
│   └── deployment-rules.md
├── design/
│   ├── DESIGN.md
│   ├── brand-guidelines.md
│   └── ui-patterns.md
├── database/
│   ├── schema-principles.md
│   ├── migration-rules.md
│   └── data-safety.md
└── safety/
    ├── security-protocols.md
    ├── owasp-compliance.md
    └── privacy-guarantees.md
```

---

## II. Project Identity

| Attribute | Value |
|-----------|-------|
| **Name** | EverSiteAudit |
| **Type** | Cross-platform mobile app for construction/site inspection |
| **Stack** | React Native 0.76 + Expo SDK 52 + SQLite + TypeScript |
| **Philosophy** | Offline-first. Predictable. Professional. No animations. No fluff. |

---

## III. Non-Negotiable Rules

1. **Zero Tolerance for Patch Work** — Do the real fix, not the workaround.
2. **The Verification Gate** — `npm run verify` = zero warnings, 100% tests green.
3. **No Animation Libraries** — `react-native-reanimated` is banned.
4. **Dependency Immutability** — Never `npm audit fix --force`.
5. **Data Ownership** — No cloud sync, no telemetry.

---

## IV. Change Protocol

1. Plan before coding
2. Read before editing
3. Test before shipping
4. Document before finishing

---

## V. Knowledge Graph Protocol

The EverSiteAudit Knowledge Graph (`EverSiteAudit-KnowledgeGraph/`) is a living, queryable map of the entire codebase, architecture, and governance. It is not optional documentation — it is a **co-equal authority with the code itself**. Out-of-date graph notes are treated as bugs.

### 1. Consult Before Changing

Before modifying any code:
1. Open [[EverSiteAudit Index]]
2. Navigate to the relevant domain index(es): [[App Navigation Index]], [[Services Index]], [[UI Components Index]], [[Data Layer Index]], [[Security Index]], [[Architecture Index]], [[Design Index]], [[Rules Index]]
3. Read all notes linked from those indexes that relate to the files being modified
4. Check for known friction points, documented discrepancies, and architectural decisions
5. If the graph does not cover the area being modified, treat that as a signal that new documentation is required

### 2. Update After Changing

After `npm run verify` passes:
1. Modify any existing vault notes affected by the change
2. Create new notes for new components, services, screens, routes, hooks, or architectural decisions
3. Update domain index notes to link to new or modified notes
4. Ensure zero orphaned files and zero broken wikilinks
5. If a change introduces a new discrepancy between documentation and code, create an analysis note documenting it

### 3. Scope Triggers

Knowledge Graph maintenance is mandatory for: new features, refactoring, API changes, security changes, database changes, configuration changes, and governance changes.

### 4. Health Standards

- Zero orphaned files — every note reachable via wikilink
- Zero broken links — every wikilink resolves to an existing file
- Cross-domain linking encouraged
- Traceability — every architectural claim must trace to actual code

**A code change is not "done" until the graph reflects it.**

---

## Vault Links

- [[Rules Index]] — All development rules and standards
- [[Design System]] — UI/UX guidelines and brand standards
- [[Database Architecture]] — Data architecture and schema
- [[Safety and Security]] — Security protocols and compliance
- [[Feature Inventory]] — Complete feature catalog
- [[Phase Plan]] — Implementation roadmap and remaining gaps
- [[Data Recovery Guide]] — User-facing disaster recovery
- [[Android Run Guide]] — Developer setup for Android
- [[Dependency Policy]] — npm and dependency rules
