---
type: component
path: src/components/ThemeProvider.tsx
---

# ThemeProvider

React Context provider resolving dark/light/high-contrast themes from preference store + system color scheme.

## Context Value

```ts
interface ThemeContextValue {
  theme: ColorTheme;           // 'dark' | 'light' | 'highContrastDark' | 'highContrastLight'
  themeSetting: ThemeSetting;  // 'dark' | 'light' | 'system'
  colors: ColorTokens;
  reduceMotion: boolean;
  highContrast: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemePreference) => void;
}
```

## Resolution Logic

1. Base theme = `themeSetting` (from `usePreferenceStore`) unless `'system'`, then follows `useColorScheme()`
2. High-contrast override: `light` → `highContrastLight`, `dark` → `highContrastDark`
3. Before preferences load, `defaultTheme="dark"` is used

## Theme Modes

| Mode | Key |
|------|-----|
| Dark | `dark` |
| Light | `light` |
| High Contrast Dark | `highContrastDark` |
| High Contrast Light | `highContrastLight` |

## Related

- [[usePreferenceStore]]
- [[Design Tokens]]
- [[UI Components Index]]
