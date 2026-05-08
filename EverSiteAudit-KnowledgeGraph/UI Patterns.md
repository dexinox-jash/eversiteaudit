---
type: governance
source: design/ui-patterns.md
parent: [[Design System]]
---

# UI Patterns

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. Screen Wrapper

Use `<Screen>` on every page. It provides:
- `flex: 1` container
- SafeArea insets
- Theme-aware background color
- Optional `header` prop for `ScreenHeader`

## 2. ScreenHeader

Standardized header for all tab screens with title, search, filter chips, and right actions.

Rules:
- Title, search, and filter chips all have `paddingHorizontal: spacing[4]`.
- Filter chips scroll horizontally inside a padded `ScrollView`.
- Search input has `spacing[4]` padding and `spacing[3]` vertical margin.

## 3. Floating Action Button (FAB)

- Position: `absolute`, `right: 20`, `bottom: 80`
- Size: 56×56dp
- Shape: Full circle
- Press feedback: Opacity `0.85` when pressed
- No scale animation
- Accessibility: `accessibilityRole="button"`, `accessibilityLabel` required

## 4. Lists

All `FlatList` and `ScrollView` instances must set:
```tsx
contentContainerStyle={{
  paddingBottom: 152, // 64 tab bar + 56 FAB + 32 margin
}}
```

## 5. Empty States

Use `<EmptyState>` when a list has no items:
- Icon (Lucide)
- Title text
- Optional description
- Optional action button

## 6. Error States

Every async operation must have an error path:
- Form submissions: Show error text below the submit button.
- Screen loads: Show `EmptyState` with an error icon and retry button.
- Background operations: Show `<Toast>` with `variant="error"`.

## 7. ListItem

Use `ListItem` for consistent rows in lists and cards:
- `severity` prop tints the left border and background using `severityBackground` tokens
- `onPress` makes the row pressable with chevron affordance
- Minimum height: 48dp (touch target)

## 8. Section

Use `Section` to group related settings or content:
- Use inside scrollable `Screen` containers
- Keep sections focused (3-6 items max)
- Use `Divider` between items where visual separation helps

## 9. ActionRow

Use `ActionRow` for settings and configuration rows:
- `trailing` can be `'chevron'`, `'switch'`, or a custom React node
- Chevron only appears when `onPress` is provided
- For destructive actions, use `destructive` prop

## 10. StatBadge

Use `StatBadge` for semantic status indicators:
- Automatically maps values to the correct color variant
- Prefer over raw `Badge` when the value has semantic meaning

## 11. Modals & Sheets

- Use React Native `<Modal>` with `animationType="slide"` or `"fade"`.
- No custom animated sheets (reanimated is banned).
- Modal content uses `Screen` or `View` with `paddingBottom` accounting for safe area.

## 12. Forms

- Labels above inputs, not placeholders.
- Required fields marked with `*`.
- Validation on blur + on submit.
- Submit button disabled while `isSubmitting`.
- Keyboard-aware scroll via `KeyboardAvoidingView` where needed.

---

## Related

- [[Design System]]
- [[Brand Guidelines]]
- [[UI Components Index]]
