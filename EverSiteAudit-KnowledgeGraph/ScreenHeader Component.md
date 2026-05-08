---
type: component
path: src/components/ScreenHeader.tsx
---

# ScreenHeader Component

List-style header with title, optional search TextInput, filter chip buttons, and optional right-side action element.

## Props

- `title`
- `searchProps` — `TextInputProps` for search field
- `filterChips` — array of `{ label, active, onPress }`
- `filterAccessibilityLabel`
- `rightElement` — `React.ReactNode` rendered at the right end of the title row

## Changes

- **2026-04-17:** Added `rightElement` prop for placing action buttons (e.g., Settings gear icon) in the header title row.

## Related

- [[TextInput Component]]
- [[Button Component]]
- [[UI Components Index]]
