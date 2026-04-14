# design.md — Design System & UI/UX Guidelines

> **Parent:** `master.md`  
> **Read this for:** Any UI component, screen, visual asset, branding, or user-experience work.

---

## 1. Design Philosophy: "Precision Craft"

This mobile application rejects generic "AI slop" aesthetics. Every pixel, animation, and interaction must feel **intentional, distinctive, and meticulously crafted** — as if labored over by a master designer.

**Core Tenets:**
- **Bold Intentionality:** Choose an aesthetic direction and execute it with precision.
- **Spatial Communication:** Ideas communicate through form, color, and composition — not walls of text.
- **Motion with Purpose:** Animations guide attention and reward interaction.
- **Platform Respect:** iOS and Android each get native-feeling details where it matters.

**Reference Skills:** `frontend-design`, `canvas-design`, `brand-guidelines`, `heroui-native`

---

## 2. Brand Foundation

### 2.1 Color Palette
**Primary Colors:**
- Dark: `#141413` — Primary text, dark backgrounds
- Light: `#faf9f5` — Light backgrounds, text on dark
- Mid Gray: `#b0aea5` — Secondary elements, hints
- Light Gray: `#e8e6dc` — Subtle backgrounds, dividers

**Accent Colors:**
- Orange: `#d97757` — Primary call-to-action, energy
- Blue: `#6a9bcc` — Information, links, secondary actions
- Green: `#788c5d` — Success, confirmation, tertiary accents

**Usage Rules:**
- Dominant colors with **sharp accents** outperform timid, evenly-distributed palettes.
- Use CSS variables / theme tokens for all colors. No hardcoded hex values in components.
- Dark mode is a first-class citizen; test all screens in both themes.

### 2.2 Typography
- **Headings:** Poppins (fallback: Arial)
- **Body Text:** Lora (fallback: Georgia)
- **UI Labels / Buttons:** A clean sans-serif that pairs well with Poppins (use system font only as final fallback)

**Type Scale (Mobile):**
| Token | Size | Usage |
|-------|------|-------|
| `display` | 32px | Hero titles |
| `heading-lg` | 24px | Screen titles |
| `heading-md` | 20px | Section headers |
| `heading-sm` | 16px | Card titles |
| `body` | 14px | Primary reading text |
| `caption` | 12px | Labels, hints, timestamps |

### 2.3 Spacing Scale
Use an 8-point grid system:
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px

---

## 3. Mobile UI Patterns

### 3.1 Component Library: HeroUI Native
**HeroUI Native** is the default component system.

**Critical Rules:**
- Use **compound components** (`Card.Header`, `Card.Body`, `Card.Footer`).
- Use **semantic variants** (`primary`, `secondary`, `danger`, `ghost`) — never raw colors.
- Event handlers use `onPress`, **not** `onClick`.
- Wrap the app with `HeroUINativeProvider` + `GestureHandlerRootView`.
- Always fetch the Native component docs before implementing a new component.

**Reference Skill:** `heroui-native`

### 3.2 Screen Architecture
Every screen must follow this structural pattern:

```tsx
<SafeAreaView style={styles.container}>
  <Header /* back button, title, optional actions */ />
  <ScrollView contentContainerStyle={styles.content}>
    {/* Screen content */}
  </ScrollView>
  <FooterActions /* primary CTA, secondary actions */ />
</SafeAreaView>
```

### 3.3 Navigation Patterns
- Use **bottom tabs** for top-level destinations (3-5 items max).
- Use **stack navigation** for deeper flows.
- Always provide a clear back affordance.
- Keep navigation state in sync with app state (deep linking support).

---

## 4. Visual Asset Creation

### 4.1 Canvas Design Philosophy
When creating images, posters, splash screens, or marketing assets:
1. First, write a **Design Philosophy** (4-6 paragraphs) as a `.md` file in `docs/design/`.
2. Then express it visually as a `.png` or `.pdf` in `assets/images/`.
3. Emphasize expert craftsmanship — every element must look deliberately placed.
4. Text is minimal and integrated as a visual element, not explanatory blocks.

**Reference Skill:** `canvas-design`

### 4.2 Iconography
- Use a single, consistent icon set (e.g., Lucide, Phosphor, or Heroicons).
- Icons must have a 1.5px stroke weight on 24x24 viewbox.
- All icons are vectors (SVG or icon font). No raster icons.

### 4.3 Imagery
- Photography should feel cohesive (consistent color grading).
- Illustrations must follow the same design philosophy as the app.
- Optimize all images before commit (compress, resize to needed dimensions).

---

## 5. Motion & Interaction

### 5.1 Animation Principles
- **One well-orchestrated page load** with staggered reveals creates more delight than scattered micro-interactions.
- Use `react-native-reanimated` for performant animations.
- Prefer 60fps. Avoid layout thrashing.

### 5.2 Micro-interactions
- Buttons: Scale down to 0.97 on press, subtle shadow reduction.
- Cards: Elevation increase on press.
- Inputs: Border color transition to accent on focus.
- Toasts / Snackbars: Slide in from bottom, auto-dismiss with progress indicator.

### 5.3 Scroll & Gestures
- Use `react-native-gesture-handler` for all custom gestures.
- Pull-to-refresh must have a consistent indicator.
- Infinite scroll must show a loading skeleton, never a blank screen.

---

## 6. Accessibility (a11y)

### 6.1 Minimum Requirements
- All interactive elements must have accessible labels.
- Color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text.
- Support screen readers (VoiceOver / TalkBack) with meaningful labels and hints.
- Focus management: return focus to logical place after modals close.
- Support dynamic type scaling (text should not break layout at 200% size).

### 6.2 Reduced Motion
- Respect `AccessibilityInfo.reduceMotionEnabled`.
- Provide static fallbacks for all motion-heavy transitions.

---

## 7. Design File Organization

```
docs/design/
├── philosophy.md           # Overall design philosophy
├── tokens.md               # Color, type, spacing tokens
├── components.md           # Component usage guidelines
└── assets/
    ├── splash-philosophy.md
    └── onboarding-philosophy.md

src/theme/
├── colors.ts               # Color token definitions
├── typography.ts           # Type scale and font families
├── spacing.ts              # Spacing tokens
├── shadows.ts              # Elevation / shadow tokens
├── borders.ts              # Radius and border tokens
└── index.ts                # Theme provider export
```

---

## 8. Anti-Patterns (Never Do)

- ❌ Generic gradient backgrounds (especially purple on white).
- ❌ Overused fonts like Inter, Roboto, or Arial as primary choices.
- ❌ Cookie-cutter card shadows and border radii without thought.
- ❌ No-accessibility labels or low-contrast text.
- ❌ Motion without purpose.
- ❌ Hardcoded colors or spacing values in components.

---

**End of design.md**
