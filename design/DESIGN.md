# Design System

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. Design Philosophy

EverSiteAudit is a **professional tool**, not a consumer app. The design prioritizes:

1. **Clarity** — Information density appropriate for field professionals.
2. **Speed** — No animations, no loading spinners where avoidable, instant feedback.
3. **Reliability** — Consistent layouts, predictable interactions, no surprises.
4. **Accessibility** — WCAG 2.1 AA compliance for color contrast, touch targets, and screen readers.

## 2. No Animations Policy

- All transitions are instant.
- Modals use `animationType="none"` or native `slide` only.
- No press-scale effects, no fade-ins, no slide-up panels.
- Press feedback is via opacity change (`pressed ? 0.85 : 1`) only.

## 3. Screen Structure

Every screen follows this template:

```tsx
<Screen>
  <ScreenHeader
    title="Screen Title"
    searchProps={{ value, onChangeText, placeholder }}
    filterChips={[...]}
  />
  {/* Content: FlatList, ScrollView, or form */}
</Screen>
```

- `Screen` handles safe area, flex, and background color.
- `ScreenHeader` handles title, search, and filter chips with consistent `spacing[4]` padding.
- List bottom padding is `152` (64px tab bar + 56px FAB + margin).

## 4. Typography Hierarchy

| Variant | Size | Weight | Usage |
|---------|------|--------|-------|
| h1 | 28px | 700 | Splash, onboarding hero |
| h2 | 24px | 600 | Screen titles, section headers |
| h3 | 20px | 600 | Card titles, sheet headers |
| body | 16px | 400 | Primary readable text |
| bodySmall | 14px | 400 | Secondary text, metadata |
| caption | 12px | 400 | Labels, timestamps |

## 5. Touch Targets

- Minimum: 44×44dp
- Preferred (FAB, primary buttons): 56×56dp
- All interactive elements must have `hitSlop` where visual size is smaller than 44dp.

## 6. New Components

The following components are available in `@components/index`:

- `ListItem` — Icon + title + subtitle + right element, with optional severity tint
- `Section` — Titled card wrapper for grouped settings/content
- `ActionRow` — Pressable row with icon, label, value, and trailing element (chevron/switch)
- `StatBadge` — Semantic badge that auto-maps severity/status/priority to colors
- `Divider` — Horizontal rule using `colors.border`

## 7. Theme Modes

- **Dark** (default): `#0D1117` background, `#F0F6FC` text
- **Light**: `#FFFFFF` background, `#1F2328` text
- **High Contrast Dark**: `#000000` background, `#FFFFFF` text
- **High Contrast Light**: `#FFFFFF` background, `#000000` text
- System setting respected on first launch; user can override in Settings.
