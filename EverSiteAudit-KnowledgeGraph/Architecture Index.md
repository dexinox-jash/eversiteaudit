---
type: index
domain: architecture
---

# Architecture Index

Structural overview and architectural friction points identified via `improve-codebase-architecture` heuristics.

---

## Analysis Notes

- [[Coupling Hotspots]] — Tight coupling clusters and competing data paths
- [[Deep Module Candidates]] — Opportunities to deepen shallow modules
- [[Untested Seams]] — Boundaries where real implementations are mocked away
- [[Security Architecture]] — Encryption layers, key management, discrepancies
- [[HeroUI Native Discrepancy]] — Design docs reference HeroUI, production code has zero usage
- [[AES Mode Discrepancy]] — RESOLVED in schema v5 ([[Crypto Migration v5]])
- [[Restore Atomicity]] — State-machine guard on backup restore (schema v5)
- [[Empty API Sync Directories]] — `src/services/api/` and `src/services/sync/` are empty
- [[DTO Layer Gap]] — `src/types/dto/` is empty despite documentation mandating DTOs

---

## High-Level Summary

### Strengths
- Clear domain separation (Project / Issue / Photo / Annotation / Template)
- Soft-delete pattern across all entities
- Optimistic UI in all stores
- Comprehensive export pipeline (PDF/ZIP/JSON/CSV)
- Field-level encryption at rest

### Friction Points
- **Store ↔ Repository blur:** Stores are thin wrappers; screens sometimes bypass stores
- **Repository singletons:** No DI, no test DB injection
- **Empty DTO layer:** `src/types/dto/` is empty despite `database.md` prescribing it
- **Export data fetching duplication:** Each format fetches independently
- **Repetitive optimistic UI boilerplate:** ~40-60 lines duplicated per store
- **Missing `sort_order` indexes:** Potential query degradation at scale
- **Empty service directories:** `src/services/api/` and `src/services/sync/` are unimplemented
- **HeroUI Native discrepancy:** Installed but unused dependency
- **AES mode discrepancy:** Documentation claims GCM, code uses CBC

---

## Related

- [[EverSiteAudit Index]]
- [[Data Layer Index]]
- [[Services Index]]
- [[Rules Index]]
- [[EverSiteAudit Master Governance]]
