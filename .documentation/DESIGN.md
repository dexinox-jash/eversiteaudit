# EverSiteAudit - UI/UX Design Specification

## Document Information
- **Version**: 1.0.0
- **Last Updated**: 2024
- **Platform**: iOS & Android (Cross-platform)
- **Target Users**: Construction site managers, safety inspectors, snagging specialists

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Design System Tokens](#2-design-system-tokens)
3. [Screen Specifications](#3-screen-specifications)
4. [Component Library](#4-component-library)
5. [Interaction Patterns](#5-interaction-patterns)
6. [Accessibility Guidelines](#6-accessibility-guidelines)
7. [Responsive Behavior](#7-responsive-behavior)

---

## 1. Design Principles

### 1.1 Core Philosophy: Rugged Reliability

EverSiteAudit embodies "construction-grade" design—professional, durable, and trustworthy.

### 1.2 UX Pillars

#### Offline-First Architecture
- Every interaction provides immediate local feedback
- No loading spinners for local operations
- Optimistic UI updates with rollback on failure

#### Sunlight-Optimized Contrast
- Dark mode as default (reduces glare in bright sunlight)
- Minimum 4.5:1 contrast ratio for all text
- High-contrast mode option for extreme conditions

#### Thumb-Friendly Operation
- Primary actions within thumb reach (bottom 40% of screen)
- Minimum 56dp touch targets (exceeds 48dp WCAG minimum)
- Bottom sheets for secondary actions

#### Fail-Safe Design
- Destructive actions show item counts in confirmation
- Undo available for 5 seconds after deletion
- Auto-save on all forms

### 1.3 Design Metaphors

**Construction Industry Visual Language:**
- Hard hats → Protection/Safety
- Blueprints → Planning/Structure  
- Tools → Actions/Operations
- Warning tape → Alerts/Severities

---

## 2. Design System Tokens

### 2.1 Color Palette

#### Primary Colors
| Token | Hex (Dark) | Hex (Light) | Usage |
|-------|------------|-------------|-------|
| `--color-primary` | `#4A9EFF` | `#0066CC` | Primary actions, links |
| `--color-primary-hover` | `#6BB3FF` | `#0052A3` | Primary hover state |
| `--color-primary-pressed` | `#3A8EEF` | `#004C99` | Primary pressed state |
| `--color-primary-subtle` | `#1A3A5C` | `#E6F2FF` | Primary backgrounds |

#### Severity Colors (Color-Blind Safe)
| Severity | Hex | Icon | Usage |
|----------|-----|------|-------|
| Critical | `#FF4757` | `alert-octagon` | Immediate action required |
| High | `#FF8C42` | `alert-triangle` | Urgent attention |
| Medium | `#FFD166` | `alert-circle` | Standard priority |
| Low | `#06D6A0` | `info-circle` | Informational |

#### Semantic Colors
| Token | Hex (Dark) | Hex (Light) | Usage |
|-------|------------|-------------|-------|
| `--color-success` | `#06D6A0` | `#059669` | Success states |
| `--color-warning` | `#FFD166` | `#D97706` | Warnings |
| `--color-error` | `#FF4757` | `#DC2626` | Errors |
| `--color-info` | `#4A9EFF` | `#0066CC` | Information |

#### Background Colors
| Token | Hex (Dark) | Hex (Light) | Usage |
|-------|------------|-------------|-------|
| `--color-bg-primary` | `#0D1117` | `#FFFFFF` | Main background |
| `--color-bg-secondary` | `#161B22` | `#F6F8FA` | Card backgrounds |
| `--color-bg-tertiary` | `#21262D` | `#E1E4E8` | Elevated surfaces |
| `--color-bg-elevated` | `#30363D` | `#FFFFFF` | Modals |
| `--color-bg-scrim` | `rgba(0,0,0,0.7)` | `rgba(0,0,0,0.5)` | Overlays |

#### Text Colors
| Token | Hex (Dark) | Hex (Light) | Usage |
|-------|------------|-------------|-------|
| `--color-text-primary` | `#F0F6FC` | `#1F2328` | Primary text |
| `--color-text-secondary` | `#8B949E` | `#656D76` | Secondary text |
| `--color-text-tertiary` | `#6E7681` | `#8C959F` | Tertiary text |
| `--color-text-disabled` | `#484F58` | `#B7BDC5` | Disabled text |

### 2.2 Typography

#### Font Family
- **Primary**: `Inter` (Google Fonts)
- **Fallback**: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Chinese Support**: `Noto Sans SC` loaded dynamically

#### Type Scale
| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-hero` | 32px | 700 | 40px | Splash title |
| `--text-h1` | 28px | 700 | 36px | Screen titles |
| `--text-h2` | 24px | 600 | 32px | Section headers |
| `--text-h3` | 20px | 600 | 28px | Card titles |
| `--text-h4` | 18px | 600 | 26px | Subsection titles |
| `--text-body-large` | 17px | 400 | 26px | Primary body |
| `--text-body` | 16px | 400 | 24px | Standard body |
| `--text-body-small` | 15px | 400 | 22px | Compact body |
| `--text-caption` | 13px | 400 | 18px | Labels |
| `--text-caption-small` | 12px | 500 | 16px | Badges |
| `--text-overline` | 11px | 600 | 16px | Section labels |

### 2.3 Spacing Scale

Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing |
| `--space-2` | 8px | Icon padding |
| `--space-3` | 12px | Small padding |
| `--space-4` | 16px | Standard padding |
| `--space-5` | 20px | Card padding |
| `--space-6` | 24px | Section padding |
| `--space-8` | 32px | Large gaps |
| `--space-10` | 40px | Screen padding |
| `--space-12` | 48px | Major breaks |
| `--space-16` | 64px | Hero spacing |

Touch Target Minimums:
- **Minimum**: 48dp × 48dp (WCAG AA)
- **Preferred**: 56dp × 56dp (field-optimized)

### 2.4 Shadows & Elevation

| Level | Shadow (Dark) | Usage |
|-------|---------------|-------|
| `--shadow-1` | `0 1px 2px rgba(0,0,0,0.3)` | Cards |
| `--shadow-2` | `0 4px 8px rgba(0,0,0,0.4)` | Elevated cards |
| `--shadow-3` | `0 8px 16px rgba(0,0,0,0.5)` | Modals |
| `--shadow-4` | `0 16px 32px rgba(0,0,0,0.6)` | Full-screen overlays |

### 2.5 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small buttons, tags |
| `--radius-md` | 8px | Cards, inputs |
| `--radius-lg` | 12px | Modals, sheets |
| `--radius-xl` | 16px | Large cards |
| `--radius-full` | 9999px | Pills, avatars |

### 2.6 Animation Timing

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `--duration-fast` | 150ms | `ease-out` | Micro-interactions |
| `--duration-normal` | 250ms | `ease-in-out` | Standard transitions |
| `--duration-slow` | 350ms | `ease-in-out` | Page transitions |
| `--duration-slower` | 500ms | `ease-in-out` | Complex animations |

Easing Functions:
- `--ease-default`: `cubic-bezier(0.4, 0, 0.2, 1)`
- `--ease-spring`: `cubic-bezier(0.34, 1.56, 0.64, 1)`

---

## 3. Screen Specifications

### 3.1 Onboarding Flow

#### Screen: Splash/Welcome

**Purpose**: Establish brand identity and prepare user for privacy-first experience.

**Layout**:
- Full-screen dark background (`--color-bg-primary`)
- Centered vertically and horizontally
- Logo/icon at 40% from top
- Tagline below logo

**Components**:
1. **App Icon** (centered)
   - Position: Center, 30% from top
   - Size: 120dp × 120dp
   - Content: Hard hat + blueprint stylized icon

2. **App Name**
   - Typography: `--text-hero`, `--color-text-primary`
   - Content: "EverSiteAudit"

3. **Tagline**
   - Typography: `--text-body-large`, `--color-text-secondary`
   - Content: "Professional Site Audits. Private by Design."

4. **Version Number**
   - Position: Center, 24dp from bottom
   - Typography: `--text-caption`, `--color-text-tertiary`

**States**:
- **Loading**: Show circular progress indicator
- **First Launch**: Fade to Welcome screen after 2 seconds
- **Returning User**: Fade to Project List after 1.5 seconds

---

#### Screen: Welcome

**Purpose**: Introduce key value propositions.

**Components**:
1. **Illustration Area** (top 40%)
2. **Value Propositions** (3 items):
   - "Works Offline" + globe-off icon
   - "Your Data Stays Yours" + shield-lock icon
   - "Professional Reports" + file-text icon
3. **Primary CTA**: "Get Started" (fixed bottom)
4. **Secondary Link**: "Restore from Backup"

---

#### Screen: Permission Request - Camera

**Purpose**: Request camera permission with context.

**Components**:
1. **Header**: Back button, "Camera Access" title
2. **Illustration**: Camera icon (100dp)
3. **Title**: "Capture Issues Instantly"
4. **Description**: "Take photos of site issues directly in the app. All photos are stored locally on your device only."
5. **Buttons**: "Allow Camera Access" (primary), "Don't Allow" (secondary)
6. **Footer**: "We never upload your photos. Your data stays on your device."

---

#### Screen: Data Promise Visualization

**Purpose**: Reinforce privacy-first commitment.

**Components**:
1. **Vault Illustration** (140dp, animated lock)
2. **Headline**: "Your Data, Your Control"
3. **Privacy Pillars**:
   - "Local Storage" + device icon
   - "No Cloud Required" + cloud-off icon
   - "Export Anytime" + download icon
4. **Continue Button**: "I Understand"

---

#### Screen: Template Selection

**Purpose**: Allow users to start with templates or blank project.

**Templates** (5 options):
- "Blank Project" - plus icon
- "Safety Inspection" - shield-check icon
- "Snagging List" - clipboard-check icon
- "Quality Control" - award icon
- "Custom Checklist" - list-checks icon

---

### 3.2 Project Management

#### Screen: Project List

**Purpose**: Main entry point - view and manage all audit projects.

**Components**:
1. **Header** (sticky): Menu, "Projects" title, Search icon
2. **Search Bar** (expandable)
3. **Filter Chips**: "All", "Active", "Completed", "Recent"
4. **Project Cards** (vertical scroll):
   - Height: 120dp
   - Thumbnail (80dp), Name, Location, Date, Issue count
   - Status indicator
5. **Empty State**: "No Projects Yet" illustration + CTA
6. **FAB**: Plus icon, bottom-right
7. **Tab Bar**: Projects, Issues, Gallery, Settings

---

#### Screen: Create New Project

**Purpose**: Create a new audit project.

**Form Fields**:
1. **Project Name*** (required) - max 100 chars
2. **Location** - with location picker
3. **Project Type** - dropdown
4. **Description** - multi-line
5. **Start Date** - date picker

**Advanced Section** (collapsible):
- Template selection
- Custom fields toggle
- Severity customization

---

#### Screen: Project Details/Overview

**Purpose**: Central hub for project.

**Components**:
1. **Collapsible Header**:
   - Project name, Location
   - Progress bar + completion %
   - Issue count summary (severity badges)

2. **Tab Navigation**: Overview, Issues, Photos, Reports

3. **Overview Tab**:
   - Quick Stats Cards (Total Issues, Photos, Completion %, Days Active)
   - Quick Actions Grid (Add Issue, Take Photo, Generate Report, Share)
   - Recent Activity list
   - Severity Breakdown chart

---

### 3.3 Camera/Capture Flow

#### Screen: Camera Interface

**Purpose**: Full-screen camera for capturing site issues.

**Components**:
1. **Camera Preview** (full-screen)
2. **Top Controls**: Close, Flash toggle, Camera switch
3. **Grid Overlay** (toggleable)
4. **Bottom Controls**:
   - Recent Captures Strip (horizontal scroll)
   - Capture Button (72dp ring, 56dp inner)
   - Mode Selector (Photo | Video)

---

#### Screen: Severity Selector (Bottom Sheet)

**Purpose**: Quickly assign severity to captured issue.

**Options**:
- Critical: "Immediate action required"
- High: "Urgent attention needed"
- Medium: "Standard priority"
- Low: "Informational only"

---

### 3.4 Issue Management

#### Screen: Issue List View

**Purpose**: Browse, search, and manage all project issues.

**Components**:
1. **Header**: Back, "Issues" with count, Search, Filter
2. **View Toggle**: List | Grid
3. **Filter Bar**: Severity, Status, Sort
4. **Issue Items**:
   - List: Severity icon, photo, title, location, status
   - Grid: Photo background, severity indicator, title overlay
5. **Empty State**: "No Issues Yet"
6. **FAB**: Add issue

---

#### Screen: Issue Detail View

**Purpose**: View complete issue information.

**Components**:
1. **Photo Gallery** (horizontal scroll)
2. **Issue Details**:
   - Title, Severity Badge, Status
   - Location, Description
   - Assigned To, Due Date, Created
3. **Activity Log**
4. **Action Buttons**: "Add Photo", "Edit Issue"

---

#### Screen: Create/Edit Issue

**Purpose**: Create or edit an issue.

**Form Sections**:
1. **Photos** - grid with drag reorder
2. **Basic Info**: Title*, Severity*, Status*
3. **Details**: Location, Description, Category
4. **Assignment**: Assigned to, Due date, Priority

---

### 3.5 Photo/Gallery Management

#### Screen: Gallery Grid View

**Purpose**: Browse all project photos.

**Components**:
1. **Header**: Back, "Photos" with count, Select, Filter
2. **Filter Bar**: Sort (Date, Name, Issue), Filter options
3. **Photo Grid**: 3-column uniform grid, 2dp gap
4. **Empty State**: "No Photos Yet"
5. **Bulk Actions Bar** (selection mode)

---

#### Screen: Photo Detail View

**Purpose**: View photo full-screen with annotations.

**Components**:
1. **Photo Display** (full-screen, pinch zoom)
2. **Overlay Controls**: Back, Share, More options
3. **Metadata Panel** (swipe up)
4. **Annotation Tools**: Pen, Arrow, Text, Shapes
5. **Navigation**: Swipe left/right for next/prev

---

#### Screen: Annotation Canvas

**Purpose**: Draw annotations on photos.

**Components**:
1. **Canvas Area** (photo + drawing layer)
2. **Tool Palette**: Pen, Arrow, Rectangle, Circle, Text, Eraser
3. **Color Picker** (preset + custom)
4. **Stroke Width** slider
5. **Actions**: Cancel, Undo, Redo, Save

---

### 3.6 Organization & Filtering

#### Screen: Filter/Sort Panel

**Purpose**: Filter and sort issues or photos.

**Filter Sections**:
- Severity (checkboxes)
- Status (checkboxes)
- Date Range (pickers + presets)
- Assigned To (user list)
- Category (chips)

**Sort Section**:
- Sort by dropdown
- Order toggle: Ascending | Descending

---

### 3.7 Export & Reports

#### Screen: Report Template Selector

**Purpose**: Choose report format (8 templates).

**Templates**:
1. **Executive Summary** - High-level overview
2. **Detailed Technical** - Complete issue details
3. **Photo-First** - Visual-focused
4. **Checklist** - Itemized list
5. **Timeline** - Chronological progression
6. **Severity Matrix** - Organized by severity
7. **Location-Based** - Grouped by area
8. **Custom** - Build your own

---

#### Screen: Export Progress

**Purpose**: Show export progress.

**States**:
- **Preparing**: 0-10%
- **Processing Photos**: 10-60%
- **Generating PDF**: 60-90%
- **Finalizing**: 90-100%
- **Complete**: 100%

---

#### Screen: Export Success

**Purpose**: Confirm successful export.

**Components**:
1. **Success Animation** (checkmark)
2. **File Details**: Name, Location, Size, Timestamp
3. **Actions**: "Open File", "Share", "Done"

---

### 3.8 Settings & Migration

#### Screen: Settings Main

**Settings Groups**:
- **Appearance**: Theme, High contrast, Text size
- **Camera & Photos**: Quality, Gallery save, Grid overlay
- **Notifications**: Reminders, Alerts, Backup reminders
- **Data & Privacy**: Backup, Export, Clear cache
- **Transfer & Migration**: Device transfer, Import/Export
- **Support**: Help, Contact, Report bug
- **About**: Version, Terms, Privacy, Licenses

---

#### Screen: Transfer to New Device - Wizard

**Steps**:
1. Introduction
2. Choose Role (Old/New Device)
3. Connection (QR code or manual entry)
4. Transfer Progress
5. Complete

---

## 4. Component Library

### 4.1 Navigation

#### Tab Bar
- Height: 64dp (including safe area)
- 4 tabs: Projects, Issues, Gallery, Settings
- Active: `--color-primary` icon + label

#### Header
- Height: 56dp
- Left: Back/Menu, Center: Title, Right: Actions

### 4.2 Buttons

#### Primary Button
- Height: 56dp, Padding: 0 24dp
- Border radius: 12dp
- Background: `--color-primary`
- Text: `--text-body-large`, semibold, white

#### Secondary Button
- Same dimensions
- Transparent bg, 2dp border
- Text: `--color-text-primary`

#### Destructive Button
- Background: `--color-error`
- Always with confirmation

#### FAB
- Size: 56dp × 56dp
- Background: `--color-primary`
- Elevation: `--shadow-3`

### 4.3 Form Components

#### Text Input
- Height: 56dp, Padding: 0 16dp
- Border radius: 8dp
- Border: 1dp solid `--color-border-default`
- Focus: 2dp `--color-primary` border

#### Toggle/Switch
- Width: 52dp, Height: 32dp
- Knob: 28dp diameter
- Animation: 200ms

### 4.4 Cards

#### Project Card
- Height: 120dp, Padding: 20dp
- Border radius: 12dp
- Layout: Thumbnail | Info | Status

#### Issue Card
- Height: 88dp
- Layout: Severity + Photo | Details | Status

### 4.5 Modals

#### Bottom Sheet
- Max height: 70% of screen
- Border radius: 12dp (top only)
- Drag handle at top

#### Toast
- Position: Bottom center, 88dp from bottom
- Duration: 3 seconds auto-dismiss
- Variants: Default, Success, Error, Warning

---

## 5. Interaction Patterns

### Touch Interactions
- **Tap**: < 100ms feedback, 48dp minimum hit area
- **Long Press**: 500ms, haptic feedback
- **Swipe**: 50dp threshold, 100dp/s velocity
- **Pinch**: 1x to 5x zoom range

### Haptic Feedback
| Action | iOS | Android |
|--------|-----|---------|
| Button tap | Light impact | CONTENT_CLICK |
| Success | Success | CONFIRM |
| Error | Error | REJECT |
| Long press | Medium | LONG_PRESS |

---

## 6. Accessibility Guidelines

### Screen Reader Support
- All interactive elements have `accessibilityLabel`
- Labels describe action, not element type
- Logical focus order (top-to-bottom, left-to-right)

### Dynamic Text Sizing
- Scale up to 200%
- Use relative font sizes
- Test at largest size

### Color Blindness Support
- Never rely on color alone
- Use icons + patterns + text labels
- Severity: Octagon, Triangle, Circle, Info icons

### Touch Targets
- WCAG minimum: 48dp × 48dp
- EverSiteAudit preferred: 56dp × 56dp

---

## 7. Responsive Behavior

### Phone (Portrait)
- Single column layout
- Bottom tab navigation
- Full-width cards

### Phone (Landscape)
- Side navigation
- Two-column grids

### Tablet
- Master-detail view
- Persistent sidebar
- Multi-column grids

### Safe Areas
- iOS: Status 44dp, Home indicator 34dp
- Android: Status 24dp, Nav 48-96dp

---

## Appendix A: Iconography

**Library**: Lucide React / Feather Icons
**Style**: Outlined, 2dp stroke
**Size**: 24dp default

### Key Icons
- Navigation: arrow-left, menu, search
- Actions: plus, edit-2, trash-2, download
- Issues: alert-octagon, alert-triangle, alert-circle, info
- Camera: camera, image, pen-tool
- Export: file-text, printer, mail

---

## Appendix B: Design Checklist

- [ ] All colors meet 4.5:1 contrast
- [ ] Touch targets minimum 48dp
- [ ] All elements have accessibility labels
- [ ] Empty states for all lists
- [ ] Error states for all operations
- [ ] Loading states for async operations
- [ ] Dark mode colors defined
- [ ] Test at 200% text size
- [ ] Test with screen reader

---

*End of Design Specification*
