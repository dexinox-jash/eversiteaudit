---
type: component
path: src/components/Badge.tsx
---

# Badge Component

Pill-shaped status indicator with 7 severity variants and 2 sizes.

## Variants

Severity-based: `critical`, `high`, `medium`, `low`, `success`, `warning`, `info`

## Props

- `variant`
- `size` — `default` | `small`
- `icon` — optional lucide icon component

## Contrast Handling

Text color on colored backgrounds is computed via luminance-based contrast function (`getContrastText`) rather than fragile theme-name checks. This ensures readable text across all four themes (dark, light, highContrastDark, highContrastLight).

## Related

- [[StatBadge Component]]
- [[UI Components Index]]
