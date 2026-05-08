---
type: service
path: src/services/backup/reminderService.ts
---

# Backup Reminder Service

Time- and count-based backup nudges.

## Triggers

- 30 days since backup → normal urgency
- 60 days since backup → urgent
- 50+ new photos since backup → normal

## Cooldown

3 days between reminders.

## Storage

Stored in preferences:
- `backupReminderLastBackupDate`
- `backupReminderPhotoCountAtLastBackup`

## Related

- [[Root Layout]] — displays `BackupReminderBanner`
- [[Preferences Storage]]
- [[Services Index]]
