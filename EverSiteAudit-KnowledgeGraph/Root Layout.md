---
type: screen
path: src/app/_layout.tsx
---

# Root Layout

Global root layout for EverSiteAudit. Wraps the entire app in providers and navigation gates.

## Providers (outer → inner)

1. `SafeAreaProvider`
2. `ThemeProvider` (default dark)
3. `DatabaseHealthGate`
4. `BiometricGate`
5. `Stack` navigator (`headerShown: false`)

## Global UI

- `ThemedStatusBar` — adapts `style` to current theme (`dark` for light themes, `light` for dark themes)
- `BackupReminderBanner` (floating top banner when backup >30 days old)
- `Toast` for deep-link errors

## Gates

| Gate | Condition | Behavior |
|------|-----------|----------|
| Onboarding | `!hasCompletedOnboarding` | `router.replace('/onboarding')` |
| Database Health | Missing expected tables | Loading screen + auto-migration |
| Biometric Lock | `biometricAuthEnabled && onboarding complete` | Locks screen, requires biometrics |
| Auto-Lock | Backgrounded > `autoLockTimeout` | Re-locks on foreground return |

## Theme-Aware Colors

- Backup reminder banner uses `colors.primaryForeground` / `colors.textPrimary` / `colors.textSecondary` instead of hardcoded hex values
- Biometric unlock button uses `colors.primaryForeground`

## Key Imports

- `usePhotoStore`, `usePreferenceStore`
- `getDatabase`, `runMigrations`, `applyPendingRestore`
- `setupQuickActions`, `subscribeToQuickActions`, `getInitialQuickAction`
- `authenticateWithBiometricsAsync`
- `useDeepLink`

## Related

- [[Tab Layout]]
- [[Onboarding Screen]]
- [[EverSiteAudit Index]]
- [[App Navigation Index]]
