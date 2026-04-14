# EverSiteAudit - Product Requirements Document (PRD)

**Version**: 1.0  
**Date**: January 2025  
**Status**: Draft for Review  
**Classification**: Internal - Product Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Glossary of Terms](#2-glossary-of-terms)
3. [User Personas](#3-user-personas)
4. [Feature Specifications](#4-feature-specifications)
5. [Competitive Analysis](#5-competitive-analysis)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Constraints & Assumptions](#7-constraints--assumptions)
8. [Success Metrics](#8-success-metrics)

---

## 1. Executive Summary

### 1.1 Product Vision

EverSiteAudit is a fortress-like, privacy-first mobile application for construction site managers, safety inspectors, and facility auditors who demand absolute control over their data. Built on the principle that user data is sacred, EverSiteAudit operates entirely offline with military-grade local encryption, ensuring sensitive corporate information never leaves the device without explicit user consent.

### 1.2 Key Differentiators

| Competitor Approach | EverSiteAudit Approach |
|---------------------|------------------------|
| Cloud-first with forced sync | Offline-first with zero auto-transmission |
| Subscription fatigue | One-time purchase ($14.99 USD) |
| Platform feature disparity | Identical feature parity across iOS and Android |
| Unclear data practices | Verifiable, auditable data handling |
| Data loss on device migration | Seamless encrypted backup and restore |
| Limited photo per issue | Unlimited photo attachments |
| Destructive annotation | Non-destructive metadata layer |

### 1.3 Target Market

- **Primary**: Construction site managers and safety inspectors in North America and Europe
- **Secondary**: Facility management auditors, insurance adjusters, snagging specialists
- **Tertiary**: Government compliance officers, environmental auditors

### 1.4 Business Model

- **Pricing**: $14.99 USD one-time purchase
- **Revenue**: Lifetime access with no recurring fees
- **Monetization**: Zero in-app purchases, zero advertisements, zero subscriptions
- **Distribution**: Apple App Store, Google Play Store

### 1.5 Core Value Proposition

> "Your data. Your device. Your control. Always."

EverSiteAudit treats every byte of user data as confidential corporate information that requires explicit authorization to leave the device. No hidden uploads. No background sync. No data harvesting. Period.

---

## 2. Glossary of Terms

### 2.1 Core Domain Terms

| Term | Definition |
|------|------------|
| **Project** | The top-level container representing a complete audit, inspection, or site visit. Contains metadata (name, location, dates) and a collection of Issues. |
| **Issue** | A specific finding, defect, hazard, or observation within a Project. Contains metadata (title, description, status, severity) and a collection of Photos. |
| **Photo** | An image file captured or imported into the application. Photos exist within Issues and may have annotations and metadata. |
| **Annotation** | A visual markup applied to a Photo (arrow, circle, rectangle, freehand, text) stored as a metadata layer separate from the original image. |
| **Template** | A pre-configured Project structure with predefined Issue categories and checklists for common audit types. |
| **Severity** | A classification indicating the criticality of an Issue: Critical, High, Medium, or Low. |
| **Status** | The workflow state of an Issue: Open, In Progress, Resolved, or Verified. |
| **Export** | The process of extracting data from the application into external formats (PDF, ZIP) for sharing or archiving. |
| **Backup** | An encrypted archive of all application data created for device migration or disaster recovery. |

### 2.2 Technical Terms

| Term | Definition |
|------|------------|
| **AES-256-GCM** | Advanced Encryption Standard with 256-bit key in Galois/Counter Mode. The encryption algorithm used for local data storage. |
| **Keychain (iOS)** | Apple's secure storage system for cryptographic keys and sensitive data. |
| **Keystore (Android)** | Android's secure storage system for cryptographic keys and sensitive data. |
| **SQLCipher** | SQLite extension providing transparent 256-bit AES encryption for database files. |
| **Checksum** | A cryptographic hash (SHA-256) used to verify file integrity. |
| **Metadata Layer** | Annotation data stored separately from the original photo, allowing non-destructive editing. |
| **Masonry Grid** | A grid layout where items have varying heights and fit together like bricks in a wall. |
| **Burst Mode** | Rapid sequential photo capture triggered by holding the shutter button. |
| **Bottom Sheet** | A UI component that slides up from the bottom of the screen to present options or actions. |

### 2.3 User Action Terms

| Term | Definition |
|------|------------|
| **Rapid-Fire Capture** | A mode enabling quick sequential photo capture with minimal UI interaction. |
| **Walkthrough Mode** | A streamlined workflow optimized for capturing Issues during site inspections. |
| **Drag-and-Drop** | A gesture-based interaction for reordering items by dragging them to new positions. |
| **Bulk Selection** | The ability to select multiple items simultaneously for batch operations. |
| **Quick Filter** | A one-tap filter to show only items matching specific criteria (e.g., Critical severity). |

### 2.4 Abbreviations

| Abbreviation | Full Term |
|--------------|-----------|
| **PPE** | Personal Protective Equipment |
| **HVAC** | Heating, Ventilation, and Air Conditioning |
| **GPS** | Global Positioning System |
| **PDF** | Portable Document Format |
| **ZIP** | ZIP Archive Format |
| **JSON** | JavaScript Object Notation |
| **TOC** | Table of Contents |
| **IAP** | In-App Purchase |
| **fps** | Frames Per Second |
| **ms** | Milliseconds |

---

## 3. User Personas

### 3.1 Primary Persona: Marcus Chen - Site Safety Manager

**Demographics**:
- Age: 42
- Location: Seattle, WA
- Experience: 18 years in construction safety
- Company: Mid-sized commercial construction firm (150 employees)

**Goals**:
- Conduct daily safety inspections across multiple active sites
- Document hazards with photographic evidence for compliance
- Generate professional reports for OSHA and insurance requirements
- Maintain audit trail for legal protection

**Pain Points**:
- Previous app lost 3 months of inspection data during phone upgrade
- Slow cloud sync delays report generation in areas with poor cellular coverage
- Concerned about competitor apps uploading sensitive site photos to unknown servers
- Frustrated by 5-photo limit per issue in current tool

**Technical Profile**:
- iPhone 13 Pro (company-issued)
- Uses app 4-6 hours daily
- Prefers voice notes over typing on-site
- Needs to export 20-30 page reports weekly

**Quote**: *"I need to trust that my inspection data stays on my device until I explicitly decide to share it. My company's liability depends on it."*

### 3.2 Secondary Persona: Sarah O'Brien - Snagging Specialist

**Demographics**:
- Age: 35
- Location: Dublin, Ireland
- Experience: 8 years in residential snagging
- Company: Independent contractor serving 15-20 developers annually

**Goals**:
- Document construction defects in new builds before handover
- Create professional snagging reports for homebuyers
- Organize defects by room and severity
- Deliver reports within 48 hours of inspection

**Pain Points**:
- Current Android app lacks features available on iOS version
- Spends 2+ hours manually organizing photos after each inspection
- No way to reorder issues to match physical walkthrough sequence
- Export format doesn't match her branding requirements

**Technical Profile**:
- Samsung Galaxy S23 (personal device)
- Inspects 2-3 properties per week
- Takes 150-300 photos per property
- Shares reports via email and cloud storage

**Quote**: *"I need the same powerful features whether I'm on Android or iOS. My clients don't care what phone I use—they care about thorough, professional reports."*

### 3.3 Tertiary Persona: David Okonkwo - Facility Compliance Auditor

**Demographics**:
- Age: 51
- Location: Lagos, Nigeria
- Experience: 22 years in facility management
- Company: Large manufacturing conglomerate

**Goals**:
- Conduct quarterly compliance audits across 12 facilities
- Track remediation of identified issues over time
- Maintain historical audit records for regulatory review
- Ensure data sovereignty (no cross-border data transfer)

**Pain Points**:
- Corporate policy prohibits cloud storage of facility photos
- Previous app required internet connection to function
- No way to verify what data leaves the device
- Concerned about foreign government data access

**Technical Profile**:
- iPhone 11 (corporate device with MDM)
- Travels to facilities with limited connectivity
- Needs offline access to previous audit history
- Requires encrypted backup for device replacement

**Quote**: *"Our corporate data must remain under our control. I need an app that respects data sovereignty and works completely offline."*

---

## 4. Feature Specifications

### 4.1 Data Sovereignty & Privacy

#### 4.1.1 Offline-First Architecture

**Description**: The application must function identically with or without network connectivity. No feature degradation occurs in offline mode.

**User Stories**:
- As a site inspector, I want to capture photos and create issues without internet connectivity so that I can work in remote construction sites.
- As a safety manager, I want all app features to work identically offline so that I don't experience functionality loss in areas with poor coverage.
- As a compliance auditor, I want the app to never require internet for core operations so that I can meet corporate data policies.

**Acceptance Criteria**:
```gherkin
Given the device has no network connectivity
When I open the application
Then all features function identically to online mode

Given I am in airplane mode
When I capture a photo and create an issue
Then the photo and issue data are stored locally without any network transmission

Given I have completed an inspection offline
When I attempt to generate a PDF report
Then the report is generated locally without requiring network access
```

**Edge Cases & Error Handling**:
- **EC-1.1.1**: If the user attempts to use a cloud-dependent OS feature (e.g., iCloud backup), display a clear message explaining the action requires connectivity
- **EC-1.1.2**: If the device transitions from offline to online, the app must not automatically initiate any data transmission
- **EC-1.1.3**: If the user manually triggers a cloud backup, require explicit confirmation with a summary of what data will leave the device

**Why not cloud-first with offline cache**: Cloud-first architectures inevitably create data transmission that users cannot fully control. Offline-first ensures zero accidental data leakage.

---

#### 4.1.2 Local Encrypted Storage

**Description**: All user data is encrypted at rest using AES-256-GCM encryption with keys stored in the platform secure enclave (iOS Keychain / Android Keystore).

**User Stories**:
- As a corporate user, I want my inspection data encrypted on-device so that unauthorized access is prevented if my device is lost or stolen.
- As a compliance officer, I want encryption that meets enterprise security standards so that my organization can approve the app for use.
- As a privacy-conscious user, I want transparent encryption without performance impact so that my workflow isn't slowed.

**Acceptance Criteria**:
```gherkin
Given the application has stored user data
When an unauthorized party attempts to access the database files directly
Then the data is unreadable without the encryption key

Given the application is running
When data is written to persistent storage
Then it is encrypted using AES-256-GCM before storage

Given the encryption key is required
When the app requests the key from the secure enclave
Then the key is retrieved without exposure to application memory beyond operational necessity
```

**Edge Cases & Error Handling**:
- **EC-1.2.1**: If the secure enclave becomes unavailable (rare hardware failure), display a critical error and prompt the user to contact support
- **EC-1.2.2**: If database corruption is detected, attempt recovery from internal integrity checkpoints and notify the user
- **EC-1.2.3**: If the user restores from a device backup to a different device, require re-authentication to decrypt data

**Why not optional encryption**: Optional encryption creates a false sense of security and complicates the user experience. Mandatory encryption ensures consistent protection.

---

#### 4.1.3 Zero Auto-Transmission

**Description**: The application must never automatically sync, backup, or upload any user data under any circumstances. All data transmission requires explicit user action.

**User Stories**:
- As a corporate auditor, I want guaranteed assurance that no data leaves my device without my explicit action so that I can comply with data sovereignty policies.
- As a privacy-conscious user, I want to verify exactly what data is being transmitted so that I can make informed decisions about sharing.
- As a site manager, I want no background data usage so that I don't incur unexpected data charges or bandwidth usage.

**Acceptance Criteria**:
```gherkin
Given the application is running
When any period of time passes
Then no data is transmitted from the device without explicit user action

Given the user has enabled automatic OS-level backups (iCloud/Google)
When the OS attempts to backup app data
Then the app data is excluded from automatic backups by default

Given the user initiates a manual export
When the export process begins
Then a summary screen displays exactly what data will leave the device
```

**Edge Cases & Error Handling**:
- **EC-1.3.1**: If the OS attempts to force backup inclusion, document the technical limitation in privacy policy and provide instructions for users to disable
- **EC-1.3.2**: If analytics libraries are included for crash reporting, they must be opt-in and transmit zero user content (only anonymized crash logs)
- **EC-1.3.3**: If the app detects it was restored from a backup containing app data, notify the user and require explicit acknowledgment

**Why not opt-out auto-sync**: Opt-out designs rely on users discovering and disabling features. Zero auto-transmission by default is the only approach that guarantees privacy.

---

#### 4.1.4 Verifiable Data Export

**Description**: When data export is initiated, the user sees a complete summary of what data will leave the device before transmission occurs.

**User Stories**:
- As a compliance auditor, I want to see exactly what files and metadata will be exported so that I can verify no unexpected data is included.
- As a corporate user, I want granular control over what gets exported so that I can share only what's necessary.
- As a privacy-conscious user, I want confirmation of successful export with file details so that I have an audit trail.

**Acceptance Criteria**:
```gherkin
Given the user initiates an export
When the export options are presented
Then a summary shows: number of projects, issues, photos, and total file size

Given the user selects specific items for export
When the export summary is displayed
Then each item is listed with its name, type, and size

Given the user confirms the export
When the export completes successfully
Then a confirmation shows the destination path and checksum of the exported file
```

**Edge Cases & Error Handling**:
- **EC-1.4.1**: If the export destination becomes unavailable mid-export, preserve partial progress and allow resume
- **EC-1.4.2**: If the export file exceeds available destination space, warn the user before starting and suggest alternatives
- **EC-1.4.3**: If the user cancels an in-progress export, clean up partial files and return to the export options screen

---

#### 4.1.5 Device-to-Device Migration

**Description**: Users can create an encrypted backup of all application data, transfer it to a new device, and restore without data loss.

**User Stories**:
- As a user upgrading my phone, I want to transfer all my audit data to my new device so that I don't lose any inspection history.
- As a corporate user, I want encrypted migration so that my data remains protected during transfer.
- As a user with multiple devices, I want to verify migration success so that I can confirm all data transferred correctly.

**Acceptance Criteria**:
```gherkin
Given the user initiates device migration
When the backup is created
Then an encrypted archive is generated with all projects, issues, photos, and settings

Given the backup archive exists
When the user transfers it to a new device
Then the archive can be imported and decrypted on the new device

Given the migration is complete
When verification runs
Then checksums confirm all photos and data match the source device
```

**Edge Cases & Error Handling**:
- **EC-1.5.1**: If the backup archive is corrupted during transfer, detect corruption via checksum and prompt for re-transfer
- **EC-1.5.2**: If the new device has insufficient storage for the backup, calculate required space and warn before import begins
- **EC-1.5.3**: If the backup was created with a newer app version, prompt to update the app before import

---

### 4.2 Media Management

#### 4.2.1 Unlimited Photo Attachments

**Description**: Each Issue can contain an unlimited number of photo attachments with no artificial limits.

**User Stories**:
- As a safety inspector, I want to attach as many photos as needed to document a complex hazard so that I can provide complete evidence.
- As a snagging specialist, I want to capture multiple angles of each defect so that the full scope is documented.
- As an auditor, I want to attach reference photos and documentation to issues so that all related information is centralized.

**Acceptance Criteria**:
```gherkin
Given an Issue exists
When I add photos to it
Then there is no limit to the number of photos I can add

Given an Issue has 100+ photos attached
When I view the Issue
Then all photos are accessible without performance degradation

Given I am creating a new Issue
When I select multiple photos from the camera roll
Then all selected photos are attached without truncation
```

**Edge Cases & Error Handling**:
- **EC-2.1.1**: If device storage becomes critically low during photo capture, warn the user and offer to free space
- **EC-2.1.2**: If a photo file becomes corrupted or inaccessible, mark it with an error state and allow deletion
- **EC-2.1.3**: If the user attempts to import extremely large photos (>50MB), offer compression options

**Why not tiered limits**: Artificial limits frustrate users and force workarounds (multiple issues for one finding). Unlimited attachments reflect real-world documentation needs.

---

#### 4.2.2 Drag-and-Drop Photo Reordering

**Description**: Users can reorder photos within an Issue using drag-and-drop gestures to organize visual narratives.

**User Stories**:
- As an inspector, I want to arrange photos in logical sequence so that my report tells a clear story.
- As a snagging specialist, I want to group related photos together so that defects and their context are visually connected.
- As a report creator, I want the photo order in the app to match the order in exported PDFs so that organization is preserved.

**Acceptance Criteria**:
```gherkin
Given I am viewing photos within an Issue
When I long-press and drag a photo
Then I can drop it at a new position in the sequence

Given I have reordered photos
When I export the Issue to PDF
Then the photos appear in the same order as in the app

Given I am in drag mode
When I drag a photo to the edge of the screen
Then the view scrolls to reveal more drop positions
```

**Edge Cases & Error Handling**:
- **EC-2.2.1**: If the user accidentally drops a photo in the wrong position, provide an undo action
- **EC-2.2.2**: If the user attempts to drag while in selection mode, clearly indicate mode conflict
- **EC-2.2.3**: If gesture recognition conflicts with system gestures, prioritize app gesture with visual feedback

---

#### 4.2.3 Drag-and-Drop Issue Reordering

**Description**: Users can reorder Issues within a Project to match physical site walkthrough sequence or priority.

**User Stories**:
- As a site manager, I want to order issues by location so that my report follows the physical site layout.
- As a safety inspector, I want to prioritize critical issues at the top so that urgent items get immediate attention.
- As a report reviewer, I want the issue order to be customizable so that reports match my organization's standards.

**Acceptance Criteria**:
```gherkin
Given I am viewing the Issue list for a Project
When I long-press and drag an Issue
Then I can drop it at a new position in the list

Given I have reordered Issues
When I export the Project to PDF
Then the Issues appear in the same order as in the app

Given I apply a sort filter (e.g., by severity)
When the Issues are reordered by the filter
Then manual drag-and-drop ordering is preserved when the filter is cleared
```

**Edge Cases & Error Handling**:
- **EC-2.3.1**: If the user has active filters applied, disable drag-and-drop and show an explanatory message
- **EC-2.3.2**: If the Issue list contains 500+ items, maintain 60fps during drag operations
- **EC-2.3.3**: If the user accidentally reorders Issues, provide an undo action and a "Reset to default order" option

---

#### 4.2.4 Bulk Selection Operations

**Description**: Users can select multiple items (photos, Issues) simultaneously and perform batch operations.

**User Stories**:
- As an inspector, I want to delete multiple outdated photos at once so that I can clean up Issues efficiently.
- As a project manager, I want to change the status of multiple Issues simultaneously so that I can update workflow state quickly.
- As a user, I want to share multiple photos at once so that I can send evidence without repetitive actions.

**Acceptance Criteria**:
```gherkin
Given I am viewing a list of items
When I tap the "Select" button
Then multi-selection mode is activated with checkboxes

Given I have selected multiple items
When I choose a bulk action (delete, share, status change)
Then the action applies to all selected items

Given I have selected items across different Issues
When I perform a bulk action
Then the action correctly targets each item in its respective context
```

**Edge Cases & Error Handling**:
- **EC-2.4.1**: If a bulk delete operation fails partway through, preserve successfully deleted items and show which items failed
- **EC-2.4.2**: If the user attempts to bulk delete all photos from an Issue, warn that this will remove the Issue's visual evidence
- **EC-2.4.3**: If the user selects 100+ items, show a progress indicator for bulk operations

---

#### 4.2.5 Rapid-Fire Capture Mode (Burst Photos)

**Description**: Users can capture multiple photos in quick succession by holding the shutter button, enabling efficient documentation of dynamic situations.

**User Stories**:
- As a safety inspector, I want to capture a sequence of photos quickly so that I can document time-sensitive hazards.
- As a snagging specialist, I want to take multiple shots of the same area so that I can select the best photo later.
- As an auditor, I want burst capture for moving equipment inspections so that I don't miss critical moments.

**Acceptance Criteria**:
```gherkin
Given I am in camera mode
When I hold the shutter button
Then photos are captured continuously at 3 photos per second

Given I am capturing in burst mode
When I release the shutter button
Then burst capture stops and I see a summary of captured photos

Given burst photos have been captured
When I review them
Then I can select which photos to keep and which to discard
```

**Edge Cases & Error Handling**:
- **EC-2.5.1**: If device storage becomes low during burst capture, warn the user and offer to stop
- **EC-2.5.2**: If the device overheats during extended burst capture, automatically pause and allow cooling
- **EC-2.5.3**: If burst capture produces blurry photos due to motion, offer to enable stabilization for next burst

---

#### 4.2.6 Real-Time Photo Review

**Description**: After capturing photos, users see thumbnails of the last 3 captures for immediate review and quality verification.

**User Stories**:
- As an inspector, I want to quickly verify photo quality so that I can retake if needed while still on-site.
- As a safety manager, I want to see recent captures without leaving camera mode so that my workflow isn't interrupted.
- As a user, I want immediate feedback on capture success so that I can be confident in my documentation.

**Acceptance Criteria**:
```gherkin
Given I have captured photos
When I am still in camera mode
Then thumbnails of the last 3 photos appear at the bottom of the screen

Given I tap a thumbnail
When the photo viewer opens
Then I can review the full photo and choose to keep or delete it

Given I delete a photo from the thumbnail review
When I return to camera mode
Then the thumbnail strip updates to show remaining recent photos
```

**Edge Cases & Error Handling**:
- **EC-2.6.1**: If a captured photo fails to save, show an error thumbnail and allow retry
- **EC-2.6.2**: If the user captures photos faster than thumbnails can load, prioritize showing the most recent
- **EC-2.6.3**: If the user rotates the device, maintain thumbnail visibility and positioning

---

#### 4.2.7 Immediate Severity Tagging

**Description**: During or immediately after photo capture, users can assign a severity level (Critical, High, Medium, Low) via a bottom sheet interface.

**User Stories**:
- As a safety inspector, I want to tag severity immediately so that I don't forget the urgency context later.
- As a site manager, I want critical issues flagged during capture so that they can be prioritized in reports.
- As an auditor, I want severity tied to the capture moment so that my initial assessment is preserved.

**Acceptance Criteria**:
```gherkin
Given I have captured a photo
When the capture completes
Then a bottom sheet slides up with severity options (Critical, High, Medium, Low)

Given the severity selector is displayed
When I tap a severity level
Then the photo is tagged and the bottom sheet dismisses

Given I tagged a photo with severity
When I view the photo in the Issue
Then the severity tag is visible and color-coded
```

**Edge Cases & Error Handling**:
- **EC-2.7.1**: If the user dismisses the severity selector without choosing, default to "Medium" and allow later edit
- **EC-2.7.2**: If the user captures multiple photos in succession, batch-apply the same severity to all recent captures
- **EC-2.7.3**: If the user changes their mind about severity, allow one-tap change from the thumbnail review

**Severity Color Coding**:
- Critical: Red (#DC2626)
- High: Orange (#EA580C)
- Medium: Yellow (#CA8A04)
- Low: Blue (#2563EB)

---

#### 4.2.8 Non-Destructive Photo Annotation

**Description**: Users can annotate photos with arrows, circles, rectangles, freehand drawing, and text. Annotations are stored as metadata layers, preserving the original photo unchanged.

**User Stories**:
- As an inspector, I want to highlight specific areas of concern so that report readers know exactly what to look at.
- As a safety manager, I want to annotate photos without destroying the original evidence so that I maintain audit integrity.
- As a report creator, I want professional annotation tools so that my reports are clear and authoritative.

**Acceptance Criteria**:
```gherkin
Given I am viewing a photo
When I enter annotation mode
Then annotation tools appear: arrow, circle, rectangle, freehand, text

Given I add an annotation
When I save the annotated photo
Then the original photo remains unchanged and annotations are stored as metadata

Given I have annotated a photo
When I view it in the Issue
Then annotations are rendered over the original photo
```

**Annotation Tools Specification**:
| Tool | Behavior | Default Color |
|------|----------|---------------|
| Arrow | Two-point creation: tap start, drag to end | Matches severity |
| Circle | Two-point creation: tap center, drag for radius | Matches severity |
| Rectangle | Two-point creation: tap corner, drag to opposite corner | Matches severity |
| Freehand | Continuous drawing while finger is down | Matches severity |
| Text | Tap to place, keyboard appears for input | White with black outline |

**Edge Cases & Error Handling**:
- **EC-2.8.1**: If the user creates an extremely small annotation, enforce minimum size for visibility
- **EC-2.8.2**: If the user places text annotation at screen edge, auto-adjust position to ensure readability
- **EC-2.8.3**: If annotation rendering fails, fall back to showing original photo with error indicator

**Why not destructive annotation**: Destructive editing permanently alters evidence photos, creating legal and audit risks. Non-destructive annotation preserves the original while enabling professional markup.

---

#### 4.2.9 Undo/Redo History

**Description**: Annotation mode maintains a history of at least 10 actions, allowing users to undo and redo changes.

**User Stories**:
- As an annotator, I want to undo mistakes so that I don't have to start over.
- As a user, I want to experiment with annotations knowing I can revert so that I can be creative.
- As an inspector, I want multiple undo levels so that I can correct a series of errors.

**Acceptance Criteria**:
```gherkin
Given I have made an annotation
When I tap the undo button
Then the last annotation action is reversed

Given I have undone an action
When I tap the redo button
Then the undone action is reapplied

Given I have made 10+ annotation actions
When I continue undoing
Then at least the last 10 actions can be undone
```

**Edge Cases & Error Handling**:
- **EC-2.9.1**: If the user exits annotation mode, preserve undo history for the session
- **EC-2.9.2**: If memory constraints limit history, prioritize preserving recent actions
- **EC-2.9.3**: If the user performs an action after undoing, clear the redo stack (standard behavior)

---

### 4.3 Project Structure

#### 4.3.1 Hierarchy: Projects → Issues → Photos

**Description**: Data is organized in a three-level hierarchy: Projects contain Issues, and Issues contain Photos.

**User Stories**:
- As a site manager, I want to organize inspections by project so that I can separate different sites or phases.
- As an inspector, I want to group related findings into issues so that context is preserved.
- As a report user, I want a clear hierarchy so that I can navigate complex inspections easily.

**Acceptance Criteria**:
```gherkin
Given I create a new Project
When I add Issues to it
Then the Issues are stored within the Project

Given an Issue exists in a Project
When I add Photos to the Issue
Then the Photos are stored within the Issue

Given I view a Project
When I navigate to an Issue
Then I see all Photos associated with that Issue
```

**Edge Cases & Error Handling**:
- **EC-3.1.1**: If a Project is deleted, cascade delete all child Issues and Photos with confirmation
- **EC-3.1.2**: If an Issue is moved between Projects, preserve all Photos and metadata
- **EC-3.1.3**: If a Photo is deleted from an Issue, maintain Issue integrity with remaining Photos

---

#### 4.3.2 Smart Templates

**Description**: Pre-configured Project templates with predefined Issue categories for common audit types.

**Available Templates**:

| Template | Predefined Categories |
|----------|----------------------|
| Safety Inspection | PPE, Scaffolding, Electrical, Fire Safety, First Aid |
| Snagging List | Kitchen, Living Room, Bedroom, Bathroom, Exterior |
| Punch List | Plumbing, HVAC, Electrical, Drywall, Flooring |
| Environmental Audit | Waste, Emissions, Noise, Hazardous Materials |

**User Stories**:
- As a safety inspector, I want a template with common safety categories so that I don't have to create them manually.
- As a snagging specialist, I want room-based categories so that my inspection follows a logical structure.
- As a new user, I want templates to guide my first audit so that I don't start from a blank page.

**Acceptance Criteria**:
```gherkin
Given I create a new Project
When I select a template
Then the Project is created with predefined Issue categories

Given a template-based Project exists
When I view the Issue list
Then the template categories are displayed as empty Issues

Given I am using a template
When I add custom Issues
Then they coexist with template Issues
```

**Edge Cases & Error Handling**:
- **EC-3.2.1**: If the user deletes a template category, allow restoration from template defaults
- **EC-3.2.2**: If the user modifies a template Issue, preserve changes while allowing reset to default
- **EC-3.2.3**: If the user wants to create a custom template, allow saving current Project structure as new template

---

#### 4.3.3 Issue Metadata

**Description**: Each Issue contains comprehensive metadata fields for tracking and organization.

**Metadata Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Title | Text | Yes | Brief issue identifier (max 100 chars) |
| Description | Text | No | Detailed issue description (max 2000 chars) |
| Status | Enum | Yes | Open, In Progress, Resolved, Verified |
| Severity | Enum | Yes | Critical, High, Medium, Low |
| Assignee | Text | No | Person responsible for resolution |
| Due Date | Date | No | Target resolution date |
| Location | GPS/Manual | No | Geographic coordinates or text location |
| Created Date | Auto | Yes | Timestamp of Issue creation |
| Modified Date | Auto | Yes | Timestamp of last modification |

**User Stories**:
- As a project manager, I want to assign Issues to team members so that responsibility is clear.
- As an inspector, I want to set due dates so that remediation is tracked.
- As a site manager, I want GPS location so that I can find Issues on large sites.

**Acceptance Criteria**:
```gherkin
Given I create a new Issue
When I enter metadata
Then all fields are saved and displayed in the Issue detail view

Given I modify Issue metadata
When I save the changes
Then the Modified Date is updated automatically

Given I filter Issues by metadata
When I apply a filter
Then only Issues matching the criteria are displayed
```

**Edge Cases & Error Handling**:
- **EC-3.3.1**: If GPS is unavailable, allow manual location entry and indicate GPS was not captured
- **EC-3.3.2**: If the user enters a due date in the past, warn but allow (for backdated entries)
- **EC-3.3.3**: If the assignee field contains an email, offer to format as mailto link in exports

---

### 4.4 Export & Sharing

#### 4.4.1 Granular Export Options

**Description**: Users can export at three levels of granularity: single photo, single Issue, or entire Project.

**User Stories**:
- As an inspector, I want to share a single photo quickly so that I can send immediate evidence.
- As a project manager, I want to export a single Issue so that I can share specific findings.
- As a site manager, I want to export an entire Project so that I can deliver complete reports.

**Acceptance Criteria**:
```gherkin
Given I am viewing a photo
When I select export
Then I can export just that photo

Given I am viewing an Issue
When I select export
Then I can export the Issue with all its photos and metadata

Given I am viewing a Project
When I select export
Then I can export the entire Project with all Issues and photos
```

**Edge Cases & Error Handling**:
- **EC-4.1.1**: If the user selects a large Project for export, estimate time and size before starting
- **EC-4.1.2**: If export is interrupted, preserve partial progress and allow resume
- **EC-4.1.3**: If the export destination is read-only, inform the user and suggest alternatives

---

#### 4.4.2 Export Formats

**Description**: Three export formats are supported: PDF Report, ZIP Archive, and Native Share.

**PDF Report Specification**:
- Professional layout with cover page
- Table of contents with Issue list
- Photo galleries with annotations
- Issue metadata tables
- Signature page (optional)
- Company branding placeholder

**ZIP Archive Specification**:
- Original photos (unannotated)
- Annotated photo copies
- JSON file with all metadata
- CSV summary for spreadsheet import

**Native Share**:
- Uses OS share sheet
- Supports all installed apps with share extensions
- Maintains format selection (share as PDF or individual photos)

**User Stories**:
- As a compliance officer, I want PDF reports so that I can submit professional documentation.
- As a data analyst, I want ZIP archives with JSON so that I can import into other systems.
- As a field user, I want native share so that I can quickly send photos via my preferred app.

**Acceptance Criteria**:
```gherkin
Given I select PDF export
When the export completes
Then a professionally formatted PDF is generated

Given I select ZIP export
When the export completes
Then a ZIP file contains photos and metadata files

Given I select native share
When the share sheet opens
Then I can choose from installed apps (email, messaging, cloud storage)
```

**Edge Cases & Error Handling**:
- **EC-4.2.1**: If PDF generation fails due to memory constraints, process in chunks with progress indicator
- **EC-4.2.2**: If ZIP creation encounters a corrupted photo, skip the photo and include a placeholder note
- **EC-4.2.3**: If native share destination rejects the file type, inform the user and suggest alternative format

---

#### 4.4.3 Cloud Agnostic Export

**Description**: Export destinations include all major cloud storage providers and local file system via native pickers.

**Supported Destinations**:
- iCloud Drive (iOS)
- Google Drive
- Dropbox
- Microsoft OneDrive
- Local Files app / Documents folder
- Email attachments
- Messaging apps

**User Stories**:
- As a corporate user, I want to export to my company's approved cloud storage so that I comply with IT policies.
- As a user with multiple cloud accounts, I want to choose which service to use for each export.
- As a privacy-conscious user, I want to save locally first so that I control when and how data enters the cloud.

**Acceptance Criteria**:
```gherkin
Given I initiate an export
When I select the destination
Then all installed cloud storage apps appear in the picker

Given I choose a cloud destination
When the export completes
Then the file is saved to the selected cloud storage

Given I choose local Files
When the export completes
Then the file is saved to the local file system
```

**Edge Cases & Error Handling**:
- **EC-4.3.1**: If the selected cloud app is not installed, offer to open the App Store / Play Store
- **EC-4.3.2**: If cloud authentication has expired, prompt for re-authentication
- **EC-4.3.3**: If the cloud destination has insufficient quota, inform the user of required space

---

#### 4.4.4 Optional Password Protection

**Description**: Users can optionally password-protect PDF and ZIP exports for additional security.

**User Stories**:
- As a corporate auditor, I want password protection so that sensitive reports remain confidential in transit.
- As a consultant, I want to protect client data so that only authorized recipients can access reports.
- As a user, I want to set my own password so that I control access to exported files.

**Acceptance Criteria**:
```gherkin
Given I am configuring export options
When I enable password protection
Then I can set a password for the exported file

Given I set a password
When the export completes
Then the file requires the password to open

Given I export with password protection
When I share the file
Then the recipient must enter the password to access contents
```

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Optional special characters

**Edge Cases & Error Handling**:
- **EC-4.4.1**: If the user forgets the password, clearly state that recovery is impossible (no backdoor)
- **EC-4.4.2**: If the password is weak, warn the user but allow override
- **EC-4.4.3**: If password-protected export fails, do not create an unprotected fallback file

---

### 4.5 Data Safety & Migration

#### 4.5.1 Backup Reminders

**Description**: The application proactively reminds users to create backups at strategic intervals and events.

**Reminder Triggers**:
- After 50 photos captured
- Before app updates (when update is available)
- Every 30 days
- When device storage is low
- When user hasn't backed up in 60+ days

**User Stories**:
- As a user, I want backup reminders so that I don't forget to protect my data.
- As a site manager, I want reminders tied to activity level so that frequent users back up more often.
- As a user, I want to dismiss reminders so that I'm not annoyed by excessive notifications.

**Acceptance Criteria**:
```gherkin
Given I have captured 50 photos
When I complete the 50th photo capture
Then a backup reminder notification appears

Given an app update is available
When I view the update prompt
Then a backup reminder is included before the update confirmation

Given 30 days have passed since last backup
When I open the app
Then a backup reminder appears (non-blocking)
```

**Edge Cases & Error Handling**:
- **EC-5.1.1**: If the user dismisses a reminder, schedule the next reminder with exponential backoff
- **EC-5.1.2**: If the user has auto-backup enabled (future feature), suppress manual reminders
- **EC-5.1.3**: If reminders are disabled in settings, respect the user's preference

---

#### 4.5.2 Integrity Verification

**Description**: All photos are stored with SHA-256 checksums to verify data integrity.

**User Stories**:
- As a compliance officer, I want data integrity verification so that I can prove evidence hasn't been tampered with.
- As a user, I want corruption detection so that I know if my data is at risk.
- As a user migrating devices, I want verification so that I can confirm successful transfer.

**Acceptance Criteria**:
```gherkin
Given a photo is saved
When it is stored
Then a SHA-256 checksum is calculated and stored with the photo

Given a photo exists in the database
When integrity verification runs
Then the stored checksum is compared to the current file checksum

Given a checksum mismatch is detected
When verification completes
Then the user is notified with options to delete or re-import the corrupted file
```

**Edge Cases & Error Handling**:
- **EC-5.2.1**: If checksum calculation fails, retry once; if persistent, flag for manual review
- **EC-5.2.2**: If multiple photos fail verification, batch-report to avoid notification spam
- **EC-5.2.3**: If a photo fails verification during export, warn the user and offer to exclude it

---

#### 4.5.3 Recovery Mode

**Description**: Users can import previously exported projects to recover data or migrate between devices.

**User Stories**:
- As a user who lost their device, I want to recover from a previous export so that I can restore my work.
- As a user with a new phone, I want to import my data so that I can continue where I left off.
- As a user, I want to merge imported data with existing projects so that I can consolidate information.

**Acceptance Criteria**:
```gherkin
Given I have an exported Project file
When I initiate import
Then the Project is restored with all Issues and Photos

Given I import a Project that already exists
When the import completes
Then I am prompted to merge, replace, or rename

Given an import is in progress
When it completes
Then a summary shows what was imported with integrity verification
```

**Edge Cases & Error Handling**:
- **EC-5.3.1**: If the import file is corrupted, attempt partial recovery and report what succeeded
- **EC-5.3.2**: If the import file is from a newer app version, prompt to update the app first
- **EC-5.3.3**: If device storage is insufficient for import, calculate required space and warn before starting

---

## 5. Competitive Analysis

### 5.1 Site Audit Pro: What Went Wrong

| Issue | Impact | Root Cause |
|-------|--------|------------|
| Data loss during device migration | Critical | No local backup mechanism; relied on undocumented iTunes backup |
| Missing cloud functionality on Android | High | Platform-specific development with no feature parity commitment |
| 3+ years without Android updates | Critical | Development abandonment or resource constraints |
| Unclear data privacy | High | No transparency about data handling; potential corporate data harvesting |
| Limited photo per issue | Medium | Arbitrary limits not aligned with real-world needs |
| No reordering functionality | Medium | UX not prioritized for professional workflows |
| Destructive annotation | Medium | Technical implementation prioritized over user needs |

### 5.2 EverSiteAudit: How We Fix It

| Site Audit Pro Problem | EverSiteAudit Solution |
|------------------------|------------------------|
| Data loss on migration | Encrypted backup/restore wizard with integrity verification |
| Platform disparity | Identical feature set on iOS and Android; shared design system |
| Unclear privacy | Zero auto-transmission; verifiable export summaries; auditable code |
| Photo limits | Unlimited attachments per Issue |
| No reordering | Drag-and-drop for both photos and Issues |
| Destructive annotation | Non-destructive metadata layer preserving originals |
| No backup reminders | Proactive reminders tied to activity and time |

### 5.3 Competitive Positioning

```
                    High Privacy
                         |
                         |    EverSiteAudit
                         |         ★
                         |
    Low Functionality ----+---- High Functionality
                         |
    Basic Camera App     |    Site Audit Pro
         ★               |         ★
                         |
                    Low Privacy
```

EverSiteAudit occupies the high-privacy, high-functionality quadrant that competitors fail to reach.

---

## 6. Non-Functional Requirements

### 6.1 Performance Requirements

| Metric | Requirement | Test Device |
|--------|-------------|-------------|
| Cold start to camera ready | < 2 seconds | iPhone 11 / Pixel 5 |
| Gallery scrolling | 60 fps with 1000+ photos | iPhone 11 / Pixel 5 |
| Search/Filter response | < 100 ms across 5000+ Issues | iPhone 11 / Pixel 5 |
| PDF export (50 pages, 200 photos) | < 5 seconds | iPhone 13 / Pixel 7 |
| Photo capture latency | < 100 ms shutter-to-save | iPhone 11 / Pixel 5 |
| Memory handling | 100+ photos in single session | iPhone 11 / Pixel 5 |
| App size | < 100 MB download | All supported devices |

### 6.2 Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Data at rest encryption | AES-256-GCM |
| Key storage | Platform secure enclave (Keychain/Keystore) |
| Database encryption | SQLCipher with 256-bit AES |
| Export encryption | Optional password protection (AES-256) |
| Backup encryption | AES-256-GCM with device-bound keys |
| Network transmission | N/A (no auto-transmission) |
| Authentication | Biometric (Face ID / Touch ID / Fingerprint) optional |

### 6.3 Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Screen reader support | Full VoiceOver (iOS) and TalkBack (Android) compatibility |
| Dynamic text sizing | Support for system text size preferences |
| Color contrast | WCAG 2.1 AA compliance (4.5:1 minimum) |
| Reduce motion | Respect system reduce motion settings |
| Alternative input | Full keyboard navigation support |
| Alt text for photos | Optional description field for each photo |

### 6.4 Compatibility Requirements

| Platform | Minimum Version |
|----------|-----------------|
| iOS | iOS 15.0+ |
| Android | Android 8.0 (API 26)+ |
| iPad | iPadOS 15.0+ |
| Device types | Phone and tablet support on both platforms |

### 6.5 Localization Requirements

| Requirement | Implementation |
|-------------|----------------|
| Initial languages | English (US), English (UK) |
| Future languages | Spanish, French, German, Portuguese, Japanese |
| Date formats | Locale-aware formatting |
| Number formats | Locale-aware formatting |
| Measurement units | Metric and Imperial support |
| RTL support | Architecture prepared for future RTL languages |

---

## 7. Constraints & Assumptions

### 7.1 Technical Constraints

| Constraint | Rationale |
|------------|-----------|
| No background processing for sync | Privacy requirement: zero auto-transmission |
| Limited by device storage | Local-only storage bounded by physical device capacity |
| Platform-specific secure enclaves | Encryption keys must use platform-native security |
| No server-side components | Privacy requirement: no data leaves device without consent |
| Single-device active session | Simplifies conflict resolution for local-first architecture |

### 7.2 Business Constraints

| Constraint | Rationale |
|------------|-----------|
| One-time purchase only | Value proposition: no subscription fatigue |
| No in-app purchases | Simplicity: complete feature set at purchase |
| No advertisements | User experience: no distractions |
| App store distribution only | Platform policies require for consumer apps |
| 30% platform fee accepted | Standard industry practice |

### 7.3 Assumptions

| Assumption | Validation |
|------------|------------|
| Users prioritize privacy over cloud convenience | Market research; competitor complaints |
| Users will pay $14.99 for quality | Price testing; competitor pricing analysis |
| Offline functionality is essential | User interviews; construction site connectivity studies |
| Device storage is sufficient for typical use | Analysis of photo counts in competitor apps |
| Users want non-destructive annotation | User interviews; legal/audit requirements research |

### 7.4 "Why Not X" Explanations

**Why not cloud sync with opt-out?**
Opt-out designs place burden on users to discover and disable features. Zero auto-transmission by default is the only approach that guarantees privacy without user expertise.

**Why not freemium model?**
Freemium creates feature fragmentation and incentivizes dark patterns to drive upgrades. One-time purchase aligns with user expectation of complete ownership.

**Why not subscription model?**
Subscription fatigue is a documented market pain point. One-time purchase differentiates from competitors and aligns with "buy once, own forever" value proposition.

**Why not server-side backup?**
Server-side backup creates data sovereignty issues and requires trust in third-party infrastructure. Local encrypted backup keeps control with the user.

**Why not AI-powered features?**
AI features typically require cloud processing, violating privacy principles. Future on-device AI may be considered if it operates entirely locally.

---

## 8. Success Metrics

### 8.1 User Adoption Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| App Store conversion rate | > 15% | Views to purchase ratio |
| First-week retention | > 60% | Users active 7 days after install |
| 30-day retention | > 40% | Users active 30 days after install |
| Average projects per user | > 5 | Projects created per active user |
| Average photos per project | > 50 | Photos captured per project |

### 8.2 User Satisfaction Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| App Store rating | > 4.5 stars | Average rating across platforms |
| NPS score | > 50 | Net Promoter Score from in-app survey |
| Support ticket volume | < 2% of users | Support requests per active user |
| Feature request alignment | > 80% | Requested features matching roadmap |

### 8.3 Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cold start time | < 2 seconds | Median time to camera ready |
| Crash rate | < 0.1% | Crashes per session |
| ANR rate (Android) | < 0.1% | Application Not Responding events |
| Export success rate | > 99% | Successful exports / total attempts |
| Backup completion rate | > 95% | Completed backups / initiated backups |

### 8.4 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Break-even timeline | < 12 months | Time to recover development costs |
| Customer acquisition cost | < $5.00 | Marketing spend / new customers |
| Lifetime value | > $14.99 | Average revenue per customer |
| Refund rate | < 3% | Refunds / total purchases |
| Word-of-mouth referrals | > 30% | New users from referral codes |

### 8.5 Privacy & Trust Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Privacy policy comprehension | > 80% | Users who understand data handling |
| Data export usage | > 50% of users | Users who export data within 30 days |
| Backup creation rate | > 40% of users | Users who create at least one backup |
| Support tickets (data loss) | 0 | Incidents of reported data loss |
| Security audit acceptance | Pass | Third-party security audit results |

---

## Appendix A: Report Templates

### A.1 Professional Report Template Options

| Template | Use Case | Key Features |
|----------|----------|--------------|
| Executive Summary | C-level reporting | High-level metrics, critical issues only, charts |
| Detailed Technical | Engineering review | All issues, full metadata, technical annotations |
| Compliance | Regulatory submission | Standardized format, signatures, audit trail |
| Photo Gallery | Visual documentation | Photo-focused, minimal text, grid layout |
| Issue Tracker | Project management | Status-focused, assignee list, due dates |
| Safety Audit | OSHA/insurance | Safety-specific categories, severity matrix |
| Snagging Report | Handover documentation | Room-by-room, defect list, resolution tracking |
| Environmental | Compliance audit | Environmental categories, measurement data |

### A.2 Report Customization

All templates support:
- Company logo upload
- Custom header/footer text
- Color scheme selection
- Signature capture
- Date format preference
- Page numbering options
- Confidentiality markings

---

## Appendix B: Data Model Summary

### B.1 Entity Relationships

```
Project (1)
  ├── Issues (N)
  │     ├── Photos (N)
  │     │     ├── Annotations (N)
  │     │     └── Metadata
  │     └── Issue Metadata
  └── Project Metadata
```

### B.2 Storage Estimates

| Data Type | Size Estimate |
|-----------|---------------|
| Project metadata | ~5 KB |
| Issue metadata | ~2 KB |
| Photo (average) | ~3 MB |
| Annotation metadata | ~1 KB per annotation |
| Typical Project (100 photos) | ~300 MB |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2025 | Product Team | Initial release |

---

*End of Product Requirements Document*
