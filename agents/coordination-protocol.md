# Coordination Protocol

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. Plan Mode

Any change that touches 3+ files, modifies architecture, or introduces new features **must** go through plan mode:

1. **Explore** — Map the affected code paths.
2. **Design** — Converge on one recommended approach.
3. **Review** — Re-read key files to verify understanding.
4. **Write Plan** — Document the approach in the plan file.
5. **Exit Plan** — Request approval (auto-approved in non-interactive mode).

## 2. Execution Order

When multiple changes are needed:

1. **Foundation first** — Database, connections, core services.
2. **Logic second** — Stores, repositories, business rules.
3. **UI third** — Screens, components, layout.
4. **Tests last** — Add/update tests, run `npm run verify`.

## 3. Parallel Work

Independent changes may be executed in parallel by multiple agents:
- Swarm A: Remove animations
- Swarm B: Fix database
- Swarm C: Standardize UI

Dependencies between swarms must be declared in the plan.

## 4. Communication

- Agents do not share context automatically.
- Every agent prompt must include all necessary context.
- Prefer resuming existing agents over spawning new ones for related work.

## 5. Rollback

If a change breaks `npm run verify`:
1. Stop.
2. Identify the smallest revertable unit.
3. Revert or fix.
4. Re-run `npm run verify`.
5. Do not proceed until green.
