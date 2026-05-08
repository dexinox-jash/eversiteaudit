# EverSiteAudit — Feature Inventory

> **Version:** 1.0.0  
> **Platform:** React Native 0.76 + Expo SDK 52  
> **Architecture:** Offline-first SQLite with field-level encryption

---

## 1. Projects
Site inspection projects are the top-level container for all audit data.

| Capability | Details |
|------------|---------|
| Create | New project with name, location, client, and notes |
| Templates | Auto-generate starter issues from reusable templates |
| View | Project dashboard with stats, issue lists, and photo galleries |
| Edit | Update metadata, status, and priority |
| Archive | Soft-delete with recovery capability |
| Search | Real-time filtering by name or client |
| Sort | Reorder issues within a project via up/down controls |

---

## 2. Issues
Log, track, and resolve construction or site inspection issues.

| Field | Purpose |
|-------|---------|
| Title / Description | Core issue documentation |
| Category | Structural, Electrical, Plumbing, Safety, etc. |
| Severity | Critical → High → Medium → Low |
| Status | Open → In Progress → Resolved |
| GPS Location | Latitude, longitude, and accuracy captured automatically |
| Assignee | Person responsible for resolution |
| Due Date | Deadline tracking |
| Voice Notes | Attach audio memos to issues |
| Resolution Notes | Post-fix documentation |
| Photos | Link unlimited photos to any issue |

---

## 3. Photos & Annotations
Capture visual evidence and mark it up directly in the app.

| Capability | Details |
|------------|---------|
| Camera | Native camera with grid overlay, flash, burst mode, and severity tagging |
| Gallery Import | Pick existing images from device library |
| Annotation Tools | Arrow, circle, rectangle, freehand pen, and text overlays |
| Color & Width | 7 preset colors + adjustable stroke width (1–8 px) |
| Undo/Redo | Full history stack for annotation sessions |
| Association | Photos linked to projects and/or issues |

---

## 4. Templates
Reusable issue templates ensure consistent audits across projects.

| Capability | Details |
|------------|---------|
| Pre-loaded Defaults | 4 standard construction inspection templates seeded on first launch |
| Encryption | Template content is encrypted at rest using AES-256-GCM |
| Project Generation | One-tap creation of a project + pre-filled issues from a template |
| Selection | Available during onboarding and new-project creation |

---

## 5. Exports
Generate professional deliverables for clients and stakeholders.

| Format | Contents | Security |
|--------|----------|----------|
| PDF | 8 branded report templates with project summary, issues, and photos | Optional password encryption |
| ZIP | `project.json` + `issues.csv` + `photos/` folder | Optional password |
| JSON | Full structured project data | Optional password |
| CSV | Tabular issue list with metadata | Optional password |
| Share | OS-native share sheet integration for any export | — |
| History | All exports tracked in an encrypted SQLite table | — |

---

## 6. Security & Privacy
Enterprise-grade controls for sensitive site data.

| Feature | Implementation |
|---------|----------------|
| Biometric Lock | Fingerprint / Face ID gate with configurable auto-lock timeout |
| Field Encryption | AES-256-GCM for template fields and backup archives |
| Secure Key Storage | Device-bound encryption key stored in `expo-secure-store` |
| Soft Deletes | No accidental data loss — deleted records are flagged, not destroyed |
| Backup Encryption | Full ZIP backups encrypted with PBKDF2 + AES-256-GCM |

---

## 7. Backup & Recovery
Complete data survivability strategy.

| Capability | Details |
|------------|---------|
| Full Backup | Encrypted archive of the entire database + all photos |
| Key Escrow | Encryption key is embedded in the backup (protected by the user's backup password) so restores work even on a new device |
| Auto-Complete Restore | Restored database is automatically swapped into place on the next app restart — no manual file manipulation |
| Age Monitoring | Persistent banner if backup is >30 days old |
| Project Exports | Self-contained ZIP/JSON exports can re-import individual projects |

See [`DATA_RECOVERY.md`](DATA_RECOVERY.md) for the complete disaster-recovery playbook.

---

## 8. OS Integrations

| Integration | Behavior |
|-------------|----------|
| Deep Linking | Open specific projects or issues via `eversiteaudit://` URLs |
| Quick Actions | Home-screen shortcuts for New Project, New Issue, and Open Camera |
| Haptics | Contextual vibration feedback on buttons and actions |
| Safe Area | Full support for notches, dynamic islands, and gesture areas |

---

## 9. Technical Architecture

| Layer | Stack |
|-------|-------|
| Framework | React Native 0.76 + Expo SDK 52 |
| Navigation | Expo Router (file-system based) |
| State | Zustand (client) + SQLite (persistent) |
| Database | `expo-sqlite` with WAL mode, foreign keys, and 4-version migration chain |
| Styling | Tailwind CSS v4 + native StyleSheet |
| Icons | Lucide React Native |
| Testing | Jest + React Native Testing Library (63 suites, 451 tests) |

---

## 10. What We Removed (And Why)

**Animations & Gesture Libraries**
- Removed `react-native-reanimated` and `react-native-gesture-handler`
- Replaced drag-to-reorder with deterministic up/down arrows and numeric sort-order inputs
- Replaced animated sheets with static boolean-driven panels
- Replaced press-scale FAB with static opacity feedback

**Rationale:** This is a professional tool, not a consumer app. Predictability, battery life, and accessibility (reduced-motion compliance) take precedence over visual flair.
