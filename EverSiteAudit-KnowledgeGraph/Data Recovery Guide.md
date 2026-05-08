---
type: governance
source: DATA_RECOVERY.md
parent: [[EverSiteAudit Master Governance]]
---

# Data Recovery Guide

> **Last Updated:** 2026-04-15 | **Applies to:** EverSiteAudit v1.0.0+

---

## Overview

EverSiteAudit is **offline-first**. All data lives locally on your device in an encrypted SQLite database. You are responsible for maintaining a current backup if you want to survive device loss, theft, damage, or accidental app deletion.

## What Gets Backed Up

A full backup is a single encrypted file (`.bin`) containing:
1. Raw SQLite database — all projects, issues, photos, annotations, templates, settings, export history
2. All photos — original and annotated versions
3. Manifest — SHA-256 checksums for integrity verification
4. Key Escrow — your field-encryption key, encrypted with your backup password

## Encryption

The entire backup archive is encrypted with **PBKDF2 + AES-256-GCM** using a password you provide at backup time.

> **Important:** We do not store your backup password. If you forget it, the backup cannot be decrypted.

## Restoring a Backup

1. Go to **Settings → Backup & Restore**
2. Tap **Restore from Backup**
3. Select your `.bin` file
4. Enter the backup password
5. The app validates, decrypts, and stages the restored database
6. **Close the app completely and reopen it** — restored data takes effect automatically

## Key Escrow

Your template data is encrypted with a key stored in device secure hardware. Key escrow embeds this key in the backup (protected by your backup password), enabling cross-device restores.

## Disaster Scenarios

| Scenario | Recovery |
|----------|----------|
| Phone lost/stolen | Restore `.bin` on new device |
| Phone damaged | Same as above |
| App accidentally deleted | Reinstall + restore from backup |
| Backup file corrupted | Use older backup file |
| Forgotten backup password | **No recovery.** Use a password manager. |

## Partial Recovery Without Full Backup

| Export Format | Can Re-import? | What You Lose |
|---------------|----------------|---------------|
| ZIP | Yes | Annotations, templates, settings, export history |
| JSON | Yes | Photos, annotations, templates |
| CSV | No | Photos, annotations, voice notes |
| PDF | No | Everything editable |

---

## Related

- [[EverSiteAudit Master Governance]]
- [[Data Safety]]
- [[Backup Archiver]]
- [[Backup Extractor]]
- [[Backup Crypto]]
