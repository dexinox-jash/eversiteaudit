---
type: store
path: src/store/usePreferenceStore.ts
---

# usePreferenceStore

Zustand store for app preferences. **Only store that persists directly.**

## State

Extends `AppPreferences`:
- `theme`, `reduceMotion`, `highContrast`
- `biometricAuthEnabled`, `autoLockTimeout`
- `companyName`, `companyLogoPath`, `inspectorName`, `inspectorCompany`
- `reportHeaderText`, `reportFooterText`, `lastPdfReportTemplate`
- `backupRemindersEnabled`, `backupReminderLastBackupDate`, `backupReminderPhotoCountAtLastBackup`
- `hasCompletedOnboarding`
- `isLoading`, `isLoaded`

## Actions

- `load()`
- `setTheme`, `setReduceMotion`, `setHighContrast`
- `setBiometricAuthEnabled`, `setAutoLockTimeout`
- `setCompanyName`, `setCompanyLogoPath`, `setInspectorName`, `setInspectorCompany`
- `setReportHeaderText`, `setReportFooterText`, `setLastPdfReportTemplate`
- `setBackupRemindersEnabled`
- `setHasCompletedOnboarding`

## Persistence

Delegates to `src/services/storage/preferences.ts` → `SettingsRepository` → SQLite.

## Consumers

[[Root Layout]], [[ThemeProvider]], [[Settings Screen]], [[Onboarding Screen]], [[Export Screen]]

## Related

- [[Preferences Storage]]
- [[Settings Repository]]
- [[Data Layer Index]]
