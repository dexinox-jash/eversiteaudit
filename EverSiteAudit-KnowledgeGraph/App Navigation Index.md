---
type: index
domain: navigation
---

# App Navigation Index

Expo Router file-based routing with stack + tab navigation. No `src/screens/` directory — screens are co-located with route definitions.

---

## Route Tree

| Route | File | Type |
|-------|------|------|
| `/` | [[Projects List Screen]] | Tab |
| `/activity` | [[Activity Screen]] | Tab |
| `/settings` | [[Settings Screen]] | Stack (from Projects header) |
| `/projects/new` | [[New Project Screen]] | Tab modal |
| `/projects/:id` | [[Project Detail Screen]] | Stack |
| `/issues/new` | [[New Issue Screen]] | Tab modal |
| `/issues/:id` | [[Issue Detail Screen]] | Stack |
| `/issues/edit/:id` | [[Edit Issue Screen]] | Stack |
| `/camera` | [[Camera Screen]] | Stack |
| `/photos/:id` | [[Photo Viewer Screen]] | Stack |
| `/photos/annotate/:id` | [[Photo Annotation Screen]] | Stack |
| `/export` | [[Export Screen]] | Stack |
| `/migration` | [[Migration Screen]] | Stack |
| `/templates` | [[Templates Screen]] | Stack |
| `/onboarding` | [[Onboarding Screen]] | Stack (gate) |

---

## Layouts & Gates

- [[Root Layout]] — Global providers, database health gate, biometric gate, backup banner
- [[Tab Layout]] — Two-tab bottom navigator (Projects, Activity)

---

## OS Integrations

- [[Quick Actions]] — Home-screen shortcuts (new project, new issue, open camera)
- [[Deep Link Handler]] — URL routing for `eversiteaudit://` and `https://eversiteaudit.app/`
- [[Haptics Service]] — Tactile feedback wrappers
- [[useDeepLink Hook]] — Runtime deep-link listener

---

## Recent Routing Changes

- **Project Detail → Camera:** Now passes `{ projectId: id }` query param so camera auto-associates photos with the correct project
- **Share Project Link removed:** Replaced by Share Export flow (offline app, no cloud sync)

## Related

- [[EverSiteAudit Index]]
- [[UI Components Index]]
- [[Services Index]]
