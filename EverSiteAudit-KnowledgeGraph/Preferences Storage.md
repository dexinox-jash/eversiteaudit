---
type: service
path: src/services/storage/preferences.ts
---

# Preferences Storage

Typed preference loader/saver over `SettingsRepository`.

## Functions

- `loadPreferences()` → `AppPreferences`
- `savePreferences(preferences)`

## Preference Keys (18 total)

- Theme: `theme`, `reduceMotion`, `highContrast`
- Security: `biometricAuthEnabled`, `autoLockTimeout`
- Identity: `companyName`, `companyLogoPath`, `inspectorName`, `inspectorCompany`
- Reports: `reportHeaderText`, `reportFooterText`, `lastPdfReportTemplate`
- Backup: `backupRemindersEnabled`, `backupReminderLastBackupDate`, `backupReminderPhotoCountAtLastBackup`
- Onboarding: `hasCompletedOnboarding`

## Related

- [[usePreferenceStore]]
- [[Settings Repository]]
- [[Services Index]]
