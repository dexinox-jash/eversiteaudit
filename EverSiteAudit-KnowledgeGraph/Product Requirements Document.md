---
type: documentation
source: .documentation/PRD.md
---

# Product Requirements Document

> **Version:** 1.0 | **Date:** January 2025
> **Source:** `.documentation/PRD.md`

---

## Executive Summary

EverSiteAudit is a fortress-like, privacy-first mobile application for construction site managers, safety inspectors, and facility auditors who demand absolute control over their data.

## Key Differentiators

| Competitor Approach | EverSiteAudit Approach |
|---------------------|------------------------|
| Cloud-first with forced sync | Offline-first with zero auto-transmission |
| Subscription fatigue | One-time purchase ($14.99 USD) |
| Platform feature disparity | Identical feature parity across iOS and Android |
| Unclear data practices | Verifiable, auditable data handling |
| Data loss on device migration | Seamless encrypted backup and restore |
| Limited photo per issue | Unlimited photo attachments |
| Destructive annotation | Non-destructive metadata layer |

## Target Market

- **Primary:** Construction site managers and safety inspectors (North America, Europe)
- **Secondary:** Facility management auditors, insurance adjusters, snagging specialists
- **Tertiary:** Government compliance officers, environmental auditors

## Business Model

- **Pricing:** $14.99 USD one-time purchase
- **Revenue:** Lifetime access, no recurring fees
- **Monetization:** Zero IAPs, zero ads, zero subscriptions
- **Distribution:** Apple App Store, Google Play Store

## Core Value Proposition

> "Your data. Your device. Your control. Always."

## User Personas

### Marcus Chen — Site Safety Manager (Primary)
- iPhone 13 Pro, 4-6 hours daily usage
- Needs voice notes, 20-30 page weekly reports
- Pain point: Lost 3 months of data during phone upgrade

### Sarah O'Brien — Snagging Specialist (Secondary)
- Samsung Galaxy S23, 150-300 photos per property
- Pain point: iOS/Android feature disparity, manual photo organizing

### David Okonkwo — Facility Compliance Auditor (Tertiary)
- iPhone 11 with MDM, limited connectivity
- Pain point: Corporate policy prohibits cloud storage

## Feature Specifications

### Data Sovereignty & Privacy
- Offline-first architecture (100% functionality offline)
- Local encrypted storage (AES-256-GCM)
- Zero auto-transmission (no background sync)
- Verifiable data export (summary before transmission)
- Device-to-device migration (encrypted backup)

### Media Management
- Unlimited photo attachments per issue
- Drag-and-drop photo reordering
- Drag-and-drop issue reordering
- Bulk selection operations
- Rapid-fire capture mode (burst photos)
- Real-time photo review (last 3 thumbnails)
- Immediate severity tagging (bottom sheet)
- Non-destructive photo annotation (5 tools)
- Undo/redo history (10+ actions)

### Project Structure
- Hierarchy: Projects → Issues → Photos
- Smart templates (Safety Inspection, Snagging List, Punch List, Environmental Audit)
- Issue metadata (title, description, status, severity, assignee, due date, GPS)

### Export & Sharing
- Granular export (photo / issue / project)
- Formats: PDF, ZIP, JSON, CSV
- Cloud-agnostic export (any installed share target)
- Optional password protection (min 8 chars, upper, lower, number)

### Data Safety & Migration
- Backup reminders (50 photos, 30 days, app updates)
- Integrity verification (SHA-256 checksums)

---

## Related

- [[EverSiteAudit Master Governance]]
- [[Feature Inventory]]
- [[Architecture Specification]]
- [[Design Specification]]
