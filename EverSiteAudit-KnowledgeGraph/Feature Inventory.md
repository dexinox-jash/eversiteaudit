---
type: governance
source: FEATURES.md
parent: [[EverSiteAudit Master Governance]]
---

# Feature Inventory

> **Version:** 1.0.0 | **Platform:** React Native 0.76 + Expo SDK 52

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

## 3. Photos & Annotations

| Capability | Details |
|------------|---------|
| Camera | Native camera with grid overlay, flash, burst mode, severity tagging |
| Gallery Import | Pick existing images from device library |
| Annotation Tools | Arrow, circle, rectangle, freehand pen, text overlays |
| Color & Width | 7 preset colors + adjustable stroke width (1–8 px) |
| Undo/Redo | Full history stack for annotation sessions |
| Association | Photos linked to projects and/or issues |

## 4. Templates

| Capability | Details |
|------------|---------|
| Pre-loaded Defaults | 4 standard construction inspection templates seeded on first launch |
| Encryption | Template content encrypted at rest using AES-256-GCM |
| Project Generation | One-tap creation of project + pre-filled issues from template |
| Selection | Available during onboarding and new-project creation |

## 5. Exports

| Format | Contents | Security |
|--------|----------|----------|
| PDF | 8 branded report templates | Optional password encryption |
| ZIP | `project.json` + `issues.csv` + `photos/` | Optional password |
| JSON | Full structured project data | Optional password |
| CSV | Tabular issue list with metadata | Optional password |
| Share | OS-native share sheet | — |
| History | All exports tracked in SQLite | — |

## 6. Security & Privacy

| Feature | Implementation |
|---------|----------------|
| Biometric Lock | Fingerprint / Face ID with auto-lock timeout |
| Field Encryption | AES-256-GCM for template fields and backup archives |
| Secure Key Storage | Device-bound key in `expo-secure-store` |
| Soft Deletes | No accidental data loss |
| Backup Encryption | Full ZIP backups encrypted with PBKDF2 + AES-256-GCM |

## 7. Backup & Recovery

| Capability | Details |
|------------|---------|
| Full Backup | Encrypted archive of entire database + all photos |
| Key Escrow | Encryption key embedded in backup for cross-device restore |
| Auto-Complete Restore | Swapped into place on next app restart |
| Age Monitoring | Banner if backup >30 days old |
| Project Exports | Self-contained ZIP/JSON can re-import individual projects |

## 8. OS Integrations

| Integration | Behavior |
|-------------|----------|
| Deep Linking | Open projects/issues via `eversiteaudit://` URLs |
| Quick Actions | Home-screen shortcuts for New Project, New Issue, Open Camera |
| Haptics | Contextual vibration feedback |
| Safe Area | Full support for notches, dynamic islands, gesture areas |

## 9. What We Removed (And Why)

**Animations & Gesture Libraries**
- Removed `react-native-reanimated` and `react-native-gesture-handler`
- Replaced drag-to-reorder with deterministic up/down arrows
- Replaced animated sheets with static boolean-driven panels
- Replaced press-scale FAB with static opacity feedback

**Rationale:** Professional tool, not a consumer app. Predictability, battery life, and accessibility take precedence over visual flair.

---

## Related

- [[EverSiteAudit Master Governance]]
- [[Architecture Specification]]
- [[Product Requirements Document]]
