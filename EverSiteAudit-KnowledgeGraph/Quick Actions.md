---
type: service
path: src/services/os/shortcuts.ts
---

# Quick Actions

Home-screen shortcuts via `expo-quick-actions`.

## Actions

| Action ID | Title | Routes To |
|-----------|-------|-----------|
| `new-project` | New Project | `/(tabs)/projects/new` |
| `start-new-audit` | Start New Audit | `/(tabs)/projects/new` |
| `new-issue` | New Issue | `/(tabs)/issues/new` |
| `open-camera` | Open Camera | `/camera` |

## Lifecycle

- `setupQuickActions()` called in root layout `useEffect`
- `getInitialQuickAction()` handled once after onboarding complete
- `subscribeToQuickActions()` listens while app is running

## Related

- [[Root Layout]]
- [[App Navigation Index]]
