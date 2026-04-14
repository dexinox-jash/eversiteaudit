# MASTER.md — Supreme Authority for AAA-Grade Development

> **CRITICAL PROTOCOL: Every agent invocation, every command, every file modification MUST begin by reading this file. This document is the root of all truth for this project.**

---

## 1. Project Identity & Vision

**Project Name:** EverSiteAudit Mobile  
**Classification:** AAA-Grade Mobile Application  
**Platform:** Cross-Platform Mobile (iOS & Android via React Native / Expo)  
**Quality Threshold:** Truth Score ≥ 0.95 (standard), ≥ 0.99 (security-critical paths)

### What "AAA Grade" Means Here
- **Architecture:** Deep modules, clean separation, DDD boundaries, testable interfaces.
- **Design:** Distinctive, production-grade UI/UX with zero generic "AI slop" aesthetics.
- **Security:** OWASP ASVS Level 3 compliance, agentic AI security (OWASP 2026), zero tolerance for vulnerabilities.
- **Quality:** Automated verification on every change, mandatory rollback on failures below threshold.
- **Process:** SPARC methodology for all complex features, swarm orchestration for cross-module work, pair-programming quality gates.

---

## 2. The Hierarchy of Truth

This `master.md` is the **parent** of all project guidance. No agent may act without ingesting it first.  
After reading `master.md`, agents **must** read the relevant child documents based on the task domain:

| Child Document | Purpose | Read When |
|----------------|---------|-----------|
| `rules.md` | Development rules, coding standards, SPARC enforcement, truth-score thresholds, git workflow | Any code change |
| `design.md` | Design system, UI/UX guidelines, brand standards, HeroUI Native patterns, asset philosophy | Any UI/UX or visual work |
| `database.md` | Data architecture, schema standards, local storage rules, sync/offline-first policies | Any data model or storage change |
| `safety.md` | Security standards (OWASP 2025 + ASVS 5.0 L3 + Agentic AI 2026), audit checklists, safety protocols | Any auth, API, input handling, or sensitive feature |
| `agents.md` | Agent army roster, swarm topology, delegation rules, trigger conditions | Before spawning or delegating to other agents |

**Command Protocol:**
1. Read `master.md`
2. Read the relevant child document(s) from the table above
3. Read `.claude/skills/[relevant-skill]/SKILL.md`
4. Only then proceed with analysis or execution

---

## 3. Installed Skills & Activation Rules

All skills are installed in `.claude/skills/`. Agents must reference the correct skill before acting.

### Core Development Skills
| Skill | Activate When |
|-------|---------------|
| `sparc-methodology` | New feature, complex implementation, architectural change, integration work |
| `swarm-orchestration` | 3+ files need changes, cross-module refactoring, API changes with tests, security-related changes, DB schema changes |
| `pair-programming` | Any implementation session requiring real-time review, TDD, debugging, or mentoring |
| `improve-codebase-architecture` | Refactoring, consolidating modules, making code more testable or AI-navigable |
| `verification-quality` | Before committing, after editing, when running CI/CD checks |

### Domain-Specific Skills
| Skill | Activate When |
|-------|---------------|
| `agent-spec-mobile-react-native` | Any React Native / mobile-specific development |
| `heroui-native` | Building UI with HeroUI Native components |
| `frontend-design` | Creating web dashboards, landing pages, or React components |
| `brand-guidelines` | Applying official brand colors and typography |
| `canvas-design` | Creating visual art, posters, PDFs, PNGs for the app or marketing |

### Security & Quality Skills
| Skill | Activate When |
|-------|---------------|
| `owasp-security` | Writing/reviewing auth, authorization, input handling, cryptography, API endpoints, agent systems |
| `security-audit` | Authentication, authorization, payment processing, user data handling, file upload, DB queries, external APIs |
| `performance-analysis` | Bottleneck detection, optimization recommendations |

### Agent & Coordination Skills
| Skill | Activate When |
|-------|---------------|
| `agent-coder` | General coding tasks |
| `agent-reviewer` | Code review tasks |
| `agent-tester` | Test generation and execution |
| `agent-planner` | Planning and specification tasks |
| `agent-architecture` | System design and architecture tasks |
| `agent-code-analyzer` | Static analysis and code quality checks |
| `swarm-advanced` | Advanced multi-agent workflows |
| `hive-mind` / `hive-mind-advanced` | Distributed coordination and consensus |
| `github-code-review` | GitHub PR reviews |
| `github-project-management` | Issue tracking, project boards |
| `github-workflow-automation` | CI/CD pipeline work |

### Knowledge & Memory Skills
| Skill | Activate When |
|-------|---------------|
| `memory-management` | Storing patterns, semantic search of past work, building knowledge base |
| `embeddings` | Semantic search, pattern matching, similarity queries |
| `reasoningbank-intelligence` / `reasoningbank-agentdb` | Adaptive learning, strategy optimization |
| `neural-training` | Pattern learning, model optimization |
| `workflow-automation` | Automating multi-step processes |
| `stream-chain` | Multi-agent pipeline data transformation |

---

## 4. Global Constraints (Non-Negotiable)

### 4.1 Verification Gate
- **No commit is valid without passing `verification-quality` checks.**
- Default truth threshold: **0.95**
- Security-critical code threshold: **0.99**
- Auto-rollback is **ENABLED** for all changes.

### 4.2 Security Gate
- **All auth, input handling, and API work must invoke `owasp-security` and `security-audit` skills.**
- ASVS Level 3 is the target for all sensitive paths.
- Fail-closed is the only acceptable error-handling pattern.

### 4.3 Design Gate
- **No generic AI aesthetics.** Every UI decision must be intentional, distinctive, and context-specific.
- HeroUI Native is the default component library for mobile screens.
- All visual assets must follow the `canvas-design` philosophy of expert craftsmanship.

### 4.4 Architecture Gate
- Prefer **deep modules** over shallow ones.
- Interfaces must hide complexity; implementation details must not leak.
- Cross-boundary dependencies should use ports & adapters pattern.

### 4.5 Agentic Gate
- Complex tasks (3+ files, security, performance) **must** use `swarm-orchestration`.
- Simple tasks (single file, 1-2 lines) may proceed directly.
- All spawned agents must receive the full context of `master.md` and relevant child docs.

---

## 5. Mobile Project Structure (Standard)

All code and assets must reside within this structure:

```
/
├── master.md                 # ← YOU ARE HERE
├── AGENTS.md                 # Kimi CLI entry point (references master.md)
├── rules.md
├── design.md
├── database.md
├── safety.md
├── agents.md
├── .claude/skills/           # Installed skills (DO NOT MODIFY)
├── src/
│   ├── app/                  # Entry point, providers, navigation root
│   ├── screens/              # Screen-level components (one per route)
│   ├── components/           # Reusable UI components
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API clients, auth, local storage, analytics
│   ├── store/                # State management (Zustand / Redux / Context)
│   ├── theme/                # Design tokens, colors, typography, spacing
│   ├── utils/                # Pure utility functions
│   ├── constants/            # App-wide constants
│   └── types/                # TypeScript types and interfaces
├── assets/
│   ├── images/               # PNGs, JPGs, SVGs
│   ├── fonts/                # Custom font files
│   └── icons/                # Icon sets
├── tests/
│   ├── unit/                 # Jest unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # Detox / Maestro E2E tests
├── docs/
│   ├── architecture/         # ADRs, diagrams
│   ├── api/                  # API documentation
│   └── decisions/            # Decision records
├── scripts/                  # Build, setup, and utility scripts
└── .github/workflows/        # CI/CD automation
```

---

## 6. How to Handle User Requests

When the user asks for anything, follow this exact order:

1. **Read `master.md`** (this file).
2. **Classify the request:** Is it about rules, design, database, safety, or agents?
3. **Read the relevant child document(s).**
4. **Read the relevant skill(s)** from `.claude/skills/`.
5. **Decide on execution mode:**
   - Simple / single-file → Proceed directly.
   - Complex / 3+ files / security / architecture → Enter plan mode or spawn swarm.
6. **Execute with verification.** Always run `verification-quality` checks before finishing.
7. **Report truth score** to the user.

---

## 7. AAA-Grade Definition Checklist

Before marking any task complete, verify:

- [ ] Code follows the project structure above
- [ ] Relevant child documents and skills were consulted
- [ ] SPARC methodology was applied if the task was complex
- [ ] Security audit passed (if applicable)
- [ ] Design follows distinctive, non-generic aesthetics
- [ ] Truth score ≥ 0.95 (≥ 0.99 for security-critical)
- [ ] Tests exist and pass
- [ ] Documentation is updated
- [ ] No secrets, no stack traces exposed, no fail-open patterns

---

**End of Master Document.**  
*Remember: This file is the root. Every change starts here.*
