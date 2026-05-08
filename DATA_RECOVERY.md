# EverSiteAudit — Data Recovery Guide

> **Last Updated:** 2026-04-15  
> **Applies to:** EverSiteAudit v1.0.0+

---

## Overview

EverSiteAudit is **offline-first**. All data lives locally on your device in an encrypted SQLite database. This gives you full control, but it also means **you are responsible for maintaining a current backup** if you want to survive device loss, theft, damage, or accidental app deletion.

This document explains exactly how backup, restore, and disaster recovery work.

---

## 1. How Backup Works

### What Gets Backed Up
A full backup is a single encrypted file (`.bin`) containing:
1. **Raw SQLite database** — all projects, issues, photos, annotations, templates, settings, and export history
2. **All photos** — original and annotated versions
3. **Manifest** — SHA-256 checksums for integrity verification
4. **Key Escrow** — your field-encryption key, encrypted with your backup password

### Where Backups Are Stored
- **Local device** (`Documents/esa_backup_*.bin`)
- **Any destination you share to** — email, cloud drive, messaging app, etc.

### Encryption
The entire backup archive is encrypted with **PBKDF2 + AES-256-GCM** using a password **you provide at backup time**.

> **Important:** We do not store your backup password. If you forget it, the backup cannot be decrypted — not by us, not by anyone.

---

## 2. Creating a Backup

1. Go to **Settings → Backup & Restore**
2. Tap **Create Full Backup**
3. Enter a strong backup password
4. Choose where to save or share the `.bin` file

**Best Practice:** Share the backup file to a cloud location (Google Drive, iCloud, Dropbox, or company file server) immediately after creation.

---

## 3. Restoring a Backup

### On the Same Device
1. Go to **Settings → Backup & Restore**
2. Tap **Restore from Backup**
3. Select your `.bin` file
4. Enter the backup password
5. The app will validate the archive, decrypt it, and stage the restored database
6. **Close the app completely and reopen it** — the restored data will automatically take effect

### On a New Device (or After Reinstall)
1. Install EverSiteAudit
2. Transfer your `.bin` backup file to the new device (email, cloud drive, USB, etc.)
3. Complete onboarding (you can pick any template; it will be replaced by your backup)
4. Go to **Settings → Backup & Restore**
5. Tap **Restore from Backup** and select the `.bin` file
6. Enter the backup password
7. **Close the app completely and reopen it**

### Why Do I Need to Restart?
The restore process stages the database safely in the background. On the next cold start, the app automatically swaps the staged database into the live data path before any screen can access it. This prevents corruption and guarantees a clean switch.

---

## 4. Key Escrow — Restoring on a New Device

Your template data is encrypted with a key stored in the device's secure hardware (`expo-secure-store`). Normally, moving the database to a new device would make that encrypted data unreadable.

EverSiteAudit solves this with **key escrow**:
- When a backup is created, your encryption key is extracted, encrypted with your backup password, and embedded in the backup manifest.
- During restore, the key is decrypted and written back to secure storage on the new device.
- **Result:** your templates are fully readable after restore, even on a brand-new phone.

---

## 5. Disaster Scenarios

### Scenario A: Phone Is Lost or Stolen
**Recovery:** Install the app on a replacement device and restore from your most recent `.bin` backup.

**Prevention:** Keep backups in a cloud location, not just on the device.

### Scenario B: Phone Is Damaged (won't turn on)
**Recovery:** Same as Scenario A — the backup file is independent of the physical device.

### Scenario C: App Is Accidentally Deleted
**Recovery:** Reinstall the app from the app store and restore from backup.

**Warning:** If you never created a backup, the data is gone. There is no cloud sync and no server-side copy.

### Scenario D: Backup File Is Corrupted
**Detection:** The restore process validates SHA-256 checksums for every file in the archive. If corruption is detected, the restore is aborted with an error message.

**Mitigation:** Maintain multiple backup files over time (e.g., monthly). Do not overwrite your only backup.

### Scenario E: Forgotten Backup Password
**Recovery:** None. The encryption is genuine; we have no backdoor.

**Prevention:** Store your backup password in a password manager.

---

## 6. Partial Recovery Without a Full Backup

If you don't have a full backup but you previously exported projects:

| Export Format | Can Re-import? | What You Lose |
|---------------|----------------|---------------|
| ZIP | Yes — contains `project.json` + `issues.csv` + photos | Annotations, templates, settings, export history |
| JSON | Yes — structured project data | Photos (unless transferred separately), annotations, templates |
| CSV | No — read-only summary | Photos, annotations, voice notes |
| PDF | No — read-only report | Everything editable |

**Recommendation:** Treat exports as client deliverables, not disaster-recovery tools. Use **full backups** for data protection.

---

## 7. Backup Reminders

The app monitors the age of your last backup:
- **30–59 days old:** A normal-priority reminder banner appears
- **60+ days old:** An urgent-priority reminder banner appears

You can dismiss the banner, but it will reappear on the next app launch until a new backup is created.

---

## 8. FAQ

**Q: Does EverSiteAudit sync to the cloud automatically?**  
A: No. It is intentionally offline-first. You control when and where backups are stored.

**Q: Can I set up automatic scheduled backups?**  
A: Not yet. The app reminds you when backups are stale, but you must initiate the backup manually.

**Q: How large are backup files?**  
A: Approximately the size of your database (~1–5 MB) plus the size of all photos. A typical project with 50 photos might produce a 150–300 MB backup.

**Q: Is the backup password the same as my app lock / biometrics?**  
A: No. The backup password is separate. You choose it each time you create a backup.

---

## 9. Support

If you encounter a restore error:
1. Confirm the backup password is correct (case-sensitive)
2. Verify the `.bin` file was transferred completely (not truncated)
3. Ensure you are using the same major app version that created the backup

For technical issues with the backup engine, check the in-app error message or the Metro / device logs for details.
