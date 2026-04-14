# agents.md — AI Agent Army Configuration & Protocols

> **CRITICAL:** This file serves as both the Kimi CLI entry point (`AGENTS.md`) and the agent army configuration (`agents.md`). On case-insensitive filesystems, these are unified into a single source of truth. The **supreme authority** for this project is **`master.md`**. Every agent must read `master.md` first before acting on any request.

---

## Hierarchy of Documents

1. **`master.md`** ← Start here. Always.
2. `rules.md` — Development rules, SPARC methodology, code standards
3. `design.md` — Design system, UI/UX guidelines, brand standards
4. `database.md` — Data architecture, storage, sync strategies
5. `safety.md` — Security protocols, OWASP standards, audit checklists
6. `agents.md` (this file) — Agent army configuration, swarm rules, delegation protocols

---

## 1. Agentic Operating Model

This project is developed by an **AI Agent Army** coordinated through hierarchical swarm topology.  
The goal is to parallelize expertise, enforce quality gates, and scale development complexity without losing coherence.

**Core Protocols:**
1. **Master First:** Every agent must read `master.md` before acting.
2. **Skill Activation:** Every agent must read the relevant `.claude/skills/` before executing.
3. **Verification Gate:** No swarm session ends without `verification-quality` checks.
4. **Hierarchical Command:** Complex tasks are orchestrated; simple tasks are delegated directly.

---

## 2. The Agent Roster

### 2.1 Core Development Agents
| Agent | Skill | Role | Trigger |
|-------|-------|------|---------|
| **Planner** | `agent-planner` | Breaks down requirements, creates specs, defines acceptance criteria | New feature, unclear requirements |
| **Architect** | `agent-architecture` | Designs system structure, interfaces, module boundaries | Architectural changes, new modules |
| **Coder** | `agent-coder` | Writes implementation code | Any coding task |
| **Reviewer** | `agent-reviewer` | Performs code review, enforces standards | Before merge, after significant PR |
| **Tester** | `agent-tester` | Writes and executes tests | After implementation, before release |
| **Mobile Specialist** | `agent-spec-mobile-react-native` | React Native / mobile-specific implementation | Mobile UI, native modules, platform code |

### 2.2 Quality & Security Agents
| Agent | Skill | Role | Trigger |
|-------|-------|------|---------|
| **Security Auditor** | `security-audit` | Scans for vulnerabilities, enforces OWASP | Auth, API, input handling, file upload |
| **Code Analyzer** | `agent-code-analyzer` | Static analysis, complexity checks, lint enforcement | Any code change |
| **Performance Optimizer** | `performance-analysis` | Identifies bottlenecks, proposes optimizations | Slow features, performance regressions |
| **Verifier** | `verification-quality` | Runs truth scoring, gates commits | Pre-commit, post-edit |

### 2.3 Coordination Agents
| Agent | Skill | Role | Trigger |
|-------|-------|------|---------|
| **Swarm Coordinator** | `swarm-orchestration` | Orchestrates multi-agent tasks | 3+ files, cross-module work |
| **SPARC Coordinator** | `sparc-methodology` | Guides SPARC phases | Complex feature implementation |
| **Hive Mind** | `hive-mind` / `hive-mind-advanced` | Distributed consensus, collective decision making | Major architectural decisions |
| **GitHub Manager** | `github-project-management` | Issue tracking, project boards, PR workflow | Sprint planning, release management |

### 2.4 Specialized Agents
| Agent | Skill | Role | Trigger |
|-------|-------|------|---------|
| **Pair Programmer** | `pair-programming` | Collaborative real-time coding | TDD sessions, debugging, mentoring |
| **Memory Manager** | `memory-management` | Stores patterns, semantic search | Learning from successful tasks |
| **Neural Trainer** | `neural-training` | Pattern learning, model optimization | Long-term agent improvement |
| **Workflow Automator** | `workflow-automation` | Automates multi-step processes | Repetitive CI/CD or release tasks |

---

## 3. Swarm Topology Rules

### 3.1 When to Swarm
**Mandatory swarm orchestration** for:
- Changes touching **3 or more files**
- **New feature** implementation
- **Cross-module** refactoring
- **API changes** requiring test updates
- **Security-related** changes
- **Performance optimization** across the codebase
- **Database schema** changes

**Direct delegation** (no swarm) for:
- Single-file edits
- Simple bug fixes (1-2 lines)
- Documentation updates
- Configuration tweaks

### 3.2 Hierarchical Topology
```
Swarm Coordinator (Queen)
├── Planner Agent
├── Architect Agent
├── Coder Agents (1..n)
├── Reviewer Agent
├── Tester Agent
└── Security Auditor (if applicable)
```

### 3.3 Swarm Lifecycle
1. **Init:** Spawn Swarm Coordinator with task context.
2. **Decompose:** Coordinator delegates sub-tasks to specialized agents.
3. **Execute:** Agents work in parallel where possible.
4. **Review:** Reviewer and Security Auditor inspect outputs.
5. **Verify:** Verifier runs truth-score checks.
6. **Integrate:** Coordinator merges approved outputs.
7. **Complete:** Final verification, documentation update, session close.

**Reference Skill:** `swarm-orchestration`

---

## 4. Agent Communication Protocol

### 4.1 Context Passing
Every spawned agent must receive:
- The full path to `master.md`
- The relevant child document(s) (`rules.md`, `design.md`, etc.)
- The specific skill file(s) to apply
- The task description with clear acceptance criteria

### 4.2 Handoff Format
When one agent delegates to another, use this structure:
```yaml
task_id: "uuid"
parent_agent: "agent-name"
child_agent: "agent-name"
objective: "Clear, concise description"
acceptance_criteria:
  - "Criterion 1"
  - "Criterion 2"
required_reading:
  - "master.md"
  - "rules.md"
  - ".claude/skills/[skill-name]/SKILL.md"
constraints:
  - "Constraint 1"
verification_required: true
truth_threshold: 0.95
```

### 4.3 Reporting
Agents must report:
- **Status:** `in_progress`, `completed`, `blocked`, `failed`
- **Files modified:** List with brief rationale
- **Truth score:** If verification was run
- **Blockers:** Any issue requiring escalation

---

## 5. Pair Programming Protocol

### 5.1 When to Pair
- **TDD sessions** for critical paths (auth, payments)
- **Debugging** complex issues
- **Refactoring** legacy or tightly-coupled code
- **Mentoring** on new patterns or technologies

### 5.2 Modes
| Mode | Use Case |
|------|----------|
| `driver` | You write, AI navigates (good for learning) |
| `navigator` | AI writes, you direct (good for rapid implementation) |
| `switch` | Alternating roles every 10 minutes (balanced collaboration) |
| `tdd` | Test-first development |
| `review` | Continuous code review |
| `debug` | Problem-solving session |

### 5.3 Pair Session Requirements
- Verification enabled (`--verify`)
- Truth threshold: 0.95 (0.98 for refactoring)
- Auto-rollback enabled
- Session saved if duration > 15 minutes

**Reference Skill:** `pair-programming`

---

## 6. Agent Memory & Learning

### 6.1 Pattern Storage
After every successful complex task:
- Store the pattern in memory via `memory-management`.
- Include: problem type, solution approach, files touched, truth score.

### 6.2 Semantic Retrieval
Before starting a new task:
- Search memory for similar past tasks.
- Reuse proven patterns where applicable.
- Cite the stored pattern when reusing it.

### 6.3 Neural Training
- Long-term agent behavior is refined through `neural-training` and `reasoningbank-intelligence`.
- Successful swarm topologies and interface designs are prime candidates for training.

**Reference Skills:** `memory-management`, `reasoningbank-intelligence`, `neural-training`

---

## 7. Governance & Ethics

### 7.1 Human-in-the-Loop
- **Security changes** require human approval before merge.
- **Architectural changes** require human review of the ADR.
- **Agent-generated code** that modifies auth, payments, or native modules must be human-reviewed.

### 7.2 Kill Switch
If an agent or swarm behaves unexpectedly:
1. Issue the kill command (`task stop` or swarm termination).
2. Run `verification-quality rollback --last-good`.
3. Investigate in `docs/security/incidents/`.

### 7.3 Transparency
- AI-generated files should include a header comment noting generation source.
- Agent decisions must be explainable upon request.

---

## 8. Quick Reference: Which Agent for Which Task?

| Task | Primary Agent | Supporting Agents |
|------|--------------|-------------------|
| New login screen | Mobile Specialist | Designer (skill), Reviewer |
| Add OAuth2 flow | Coder | Security Auditor, Tester |
| Refactor navigation | Swarm Coordinator | Architect, Coder, Reviewer |
| Fix single typo | Coder | — |
| Optimize list rendering | Performance Optimizer | Mobile Specialist, Tester |
| Design database schema | Architect | Security Auditor |
| Set up CI/CD | Workflow Automator | GitHub Manager |
| Investigate crash | Pair Programmer (debug mode) | Code Analyzer |
| Plan next sprint | Planner | GitHub Manager |
| Security review | Security Auditor | Reviewer, Verifier |

---

## 9. Installed Skills Reference

All project skills are located in `.claude/skills/`. Key skills include:
- `sparc-methodology`
- `swarm-orchestration`
- `pair-programming`
- `verification-quality`
- `owasp-security`
- `security-audit`
- `agent-spec-mobile-react-native`
- `heroui-native`
- `frontend-design`
- `canvas-design`
- `improve-codebase-architecture`
- `performance-analysis`
- `memory-management`
- `github-code-review`
- `github-project-management`
- `github-workflow-automation`

---

**End of agents.md**
