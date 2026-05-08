# Privacy Guarantees

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. You Own Your Data

EverSiteAudit stores 100% of your data locally on your device. We (the developers) cannot:
- See your projects
- See your issues
- See your photos
- See your annotations
- See your templates
- See your exports

We do not have a server. We do not have a database. We do not have access.

## 2. No Telemetry

The app sends zero data to external servers. No:
- Crash analytics
- Usage analytics
- Performance metrics
- A/B testing
- Advertising IDs

## 3. No Cloud Sync

There is no automatic cloud synchronization. Your data stays on your device unless **you** explicitly:
- Create an encrypted backup file
- Export a project to PDF/CSV/JSON/ZIP
- Share a file via the OS share sheet

## 4. Third-Party Dependencies

The only third-party code is open-source npm packages. None of them are analytics or tracking libraries. The full dependency tree is auditable in `package-lock.json`.

## 5. Government / Legal Requests

Because we have no server and store no data, we cannot comply with data requests. Your data is on your device, protected by your device's security (biometric lock, encryption, and OS-level sandboxing).

## 6. Data Deletion

Uninstalling the app deletes all local data. There are no remote copies to delete. If you want to keep your data, create a backup before uninstalling.
