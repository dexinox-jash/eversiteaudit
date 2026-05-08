---
type: documentation
source: .documentation/ROADMAP.md
---

# Implementation Roadmap

> **Source:** `.documentation/ROADMAP.md`

---

## Roadmap Philosophy

1. **Tackle Hardest Problems First** — Database encryption, camera integration, PDF generation addressed early
2. **Vertical Slice Development** — Each phase delivers working, testable functionality
3. **Continuous Integration** — Quality gates at every phase
4. **Parallel Workstreams** — UI/UX work proceeds in parallel with core backend
5. **Platform Parity** — iOS and Android implementations proceed simultaneously

## Phase Overview

| Phase | Name | Primary Focus | Duration | Risk Level |
|-------|------|---------------|----------|------------|
| 0 | Foundation | Setup & Architecture | 2 weeks | Low |
| 1 | Core Data Layer | Database & Encryption | 3 weeks | **Critical** |
| 2 | Camera & Media | Media Capture | 3 weeks | **Critical** |
| 3 | Issue Management | Core Functionality | 2 weeks | Medium |
| 4 | Organization | UX Enhancement | 2 weeks | Medium |
| 5 | Annotations | Rich Media | 3 weeks | **High** |
| 6 | Export Engine | Output Generation | 3 weeks | **Critical** |
| 7 | Migration & Backup | Data Portability | 2 weeks | Medium |
| 8 | Polish & Integration | Platform Features | 3 weeks | Medium |
| 9 | Testing & QA | Quality Assurance | 3 weeks | **High** |
| 10 | Launch Preparation | Release Readiness | 2 weeks | Low |

**Total Timeline:** 28 weeks (7 months)

## Parallel Workstreams

| Workstream | Parallel With | Description |
|------------|---------------|-------------|
| UI/UX Design | Phases 0-3 | Design system, mockups, component library |
| Documentation | All Phases | Technical docs, user guides, API documentation |
| Test Automation | Phases 1-8 | Continuous test development alongside features |
| Performance Benchmarking | Phases 2-8 | Establish and monitor performance metrics |

## Dependency Map

```
Phase 0 (Foundation)
    ↓
Phase 1 (Core Data Layer) ───┐
    ↓                        |
Phase 2 (Camera & Media)     |
    ↓                        |
Phase 3 (Issue Management)   |
    ↓                        ↓
Phase 4 (Organization)   Phase 5 (Annotations)
    ↓                        ↓
    └──────────┬─────────────┘
               ↓
         Phase 6 (Export Engine)
               ↓
         Phase 7 (Migration & Backup)
               ↓
         Phase 8 (Polish & Integration)
               ↓
         Phase 9 (Testing & QA)
               ↓
         Phase 10 (Launch Preparation)
```

## Current Status

As of the latest development cycle, the project has completed all phases through **Phase 10 (Launch Preparation)**. The codebase is functionally complete with 63 test suites passing.

Remaining gaps are tracked in [[Phase Plan]]:
- P0: Data layer completeness (SettingsRepository, ExportHistoryRepository, WAL mode)
- P1: Missing core UX (issue DnD, auto-lock timeout, export progress, template customization)
- P2: Advanced features (report template selector, iOS Shortcuts/Android Widgets, SQLCipher)
- P3: Quality & testing (component tests, screen tests, service tests)

---

## Related

- [[EverSiteAudit Master Governance]]
- [[Phase Plan]]
- [[Feature Inventory]]
