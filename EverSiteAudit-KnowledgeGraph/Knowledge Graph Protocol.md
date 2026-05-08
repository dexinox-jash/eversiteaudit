---
type: governance
source: master.md §V
authority: supreme
---

# Knowledge Graph Protocol

> **Source:** `master.md` §V
> **Authority:** Co-equal with the codebase itself

The EverSiteAudit Knowledge Graph (`EverSiteAudit-KnowledgeGraph/`) is a living, queryable map of the entire codebase, architecture, and governance. It is not optional documentation — it is a **co-equal authority with the code itself**. Out-of-date graph notes are treated as bugs.

---

## 1. Consult Before Changing

Before modifying any code, you MUST:

1. Open [[EverSiteAudit Index]]
2. Navigate to the relevant domain index(es):
   - [[App Navigation Index]] — for routes, screens, layouts
   - [[Services Index]] — for business logic, exports, backup, media
   - [[UI Components Index]] — for components, themes, design tokens
   - [[Data Layer Index]] — for stores, repositories, schema, migrations
   - [[Security Index]] — for encryption, auth, integrity
   - [[Architecture Index]] — for structural decisions, coupling, friction
   - [[Design Index]] — for brand, patterns, specifications
   - [[Rules Index]] — for standards, testing, review, deployment
3. Read all notes linked from those indexes that relate to the files you will modify.
4. Check for known friction points, documented discrepancies, and architectural decisions that constrain your change.
5. If the graph does not cover the area you are modifying, treat that as a signal that your change requires new documentation.

---

## 2. Update After Changing

After `npm run verify` passes, you MUST update the Knowledge Graph:

1. Modify any existing vault notes affected by your change.
2. Create new notes for new components, services, screens, routes, hooks, or architectural decisions.
3. Update domain index notes to link to new or modified notes.
4. Ensure every new note is linked from at least one index or cross-reference note (**zero orphans**).
5. Ensure every wikilink resolves to an existing note (**zero broken links**).
6. If your change introduces a new discrepancy between documentation and code, create an analysis note documenting it.

---

## 3. Scope Triggers

Knowledge Graph maintenance is mandatory for:

- **New features** — any new file, route, screen, component, service, or hook
- **Refactoring** — any moved, renamed, or deleted file
- **API changes** — any new or modified exported function, class, or interface
- **Security changes** — any crypto, auth, validation, or permission logic
- **Database changes** — schema alterations, migrations, new repositories, new stores
- **Configuration changes** — `app.json`, `eas.json`, build scripts, CI/CD workflows
- **Governance changes** — any modification to `master.md` or child documents

---

## 4. Health Standards

The graph must always satisfy:

- **Zero orphaned files** — every note must be reachable via wikilink from at least one other note
- **Zero broken links** — every wikilink must resolve to an existing `.md` file
- **Cross-domain linking** — notes should link across domains (e.g., a service note links to its store, repository, and screen notes)
- **Traceability** — every architectural claim must trace to actual code; no speculation

**Failure to maintain the graph is treated as an incomplete task. A code change is not "done" until the graph reflects it.**

---

## Related

- [[EverSiteAudit Master Governance]]
- [[EverSiteAudit Index]]
- [[Review Rules]]
