---
type: index
domain: governance
---

# Rules Index

Development rules and coding standards. All children of [[EverSiteAudit Master Governance]].

---

## Rule Documents

- [[Architecture Rules]] — Offline-first design, state management layers, repository pattern, file organization
- [[Coding Standards]] — TypeScript strictness, naming conventions, import order, accessibility, error handling
- [[Testing Rules]] — Verification gate, test framework, mock strategy, coverage requirements
- [[Review Rules]] — Patch work forbidden, standard of completeness, search before building
- [[Deployment Rules]] — Expo SDK 52 lock, npm defense system, forbidden commands

---

## Key Principles

### SPARC Methodology
S-Specification, P-Pseudocode, A-Architecture, R-Refinement, C-Completion

### Truth Scores
| Code Type | Min Truth Score |
|-----------|-----------------|
| Standard feature | 0.95 |
| Security-critical | 0.99 |
| UI/Design | 0.95 |
| Tests | 0.90 |
| Documentation | 0.85 |

### Coverage Requirements
| Layer | Min Coverage |
|-------|-------------|
| Utilities/Services | 90% |
| Hooks | 80% |
| Components | 70% |
| Screens | 60% |
| E2E Critical Paths | 100% |

---

## Related

- [[EverSiteAudit Master Governance]]
- [[Architecture Index]]
- [[Security Index]]
