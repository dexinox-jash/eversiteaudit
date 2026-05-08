# Review Rules

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. Patch Work Is Forbidden

- **Never** present a workaround when the real fix exists.
- **Never** leave a dangling thread when tying it off takes five more minutes.
- **Never** "table this for later" when the permanent solve is within reach.

## 2. Standard of Completeness

The standard is not "good enough." The standard is:

> "Holy shit, that's done."

This means:
- The code works.
- The tests pass.
- The edge cases are handled.
- The documentation is updated.
- The next developer can understand it without asking.

## 3. Search Before Building

Before writing new code:
1. Check if the functionality already exists elsewhere in the codebase.
2. Check if a shared component or utility can be reused.
3. Check if the pattern already exists and should be followed.

## 4. Test Before Shipping

Every change — no matter how small — must pass `npm run verify`.

## 5. Documentation Before Finishing

If a change affects:
- Architecture → update `rules/architecture-rules.md`
- Design → update `design/DESIGN.md` or `design/ui-patterns.md`
- Security → update `safety/security-protocols.md`
- Data handling → update `database/schema-principles.md` or `database/data-safety.md`

**Additionally, per `master.md` §V (Knowledge Graph Protocol), you MUST update the EverSiteAudit Knowledge Graph (`EverSiteAudit-KnowledgeGraph/`) after every change.** This includes:
- Modifying existing notes affected by the change
- Creating new notes for new components, services, screens, or architectural decisions
- Updating domain index notes with new or modified links
- Verifying zero broken wikilinks and zero orphaned files

## 6. Marginal Cost of Completeness

With AI, the marginal cost of completeness is near zero. Do the whole thing. Do it right. Do it with tests. Do it with documentation. Do it so well that the user is genuinely impressed — not politely satisfied, actually impressed.
