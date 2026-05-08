---
type: component
path: src/components/Screen.tsx
---

# Screen Component

Root screen wrapper with SafeAreaView, optional ScrollView, header injection, and padding control.

## Props

- `header` — `Header` or `ScreenHeader` config object
- `scrollable` — default `true`
- `pad` — default `true` (16px padding)
- `safeAreaEdges` — e.g., `['top', 'bottom', 'left', 'right']`

## Structure

```
SafeAreaView
├── Header (if provided)
├── ScrollView (if scrollable)
│   └── View (content)
└── (footer actions typically placed inside content)
```

## Related

- [[Header Component]]
- [[ScreenHeader Component]]
- [[UI Components Index]]
