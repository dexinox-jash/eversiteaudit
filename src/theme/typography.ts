/**
 * Design tokens: Typography
 * Source: .documentation/DESIGN.md — Typography
 */

export const fontFamily = {
  primary: 'Inter',
  fallback:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
} as const;

export const fontSizes = {
  hero: 32,
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  bodyLarge: 17,
  body: 16,
  bodySmall: 15,
  caption: 13,
  captionSmall: 12,
  overline: 11,
} as const;

export const lineHeights = {
  hero: 40,
  h1: 36,
  h2: 32,
  h3: 28,
  h4: 26,
  bodyLarge: 26,
  body: 24,
  bodySmall: 22,
  caption: 18,
  captionSmall: 16,
  overline: 16,
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export type FontSizeToken = keyof typeof fontSizes;
export type FontWeightToken = keyof typeof fontWeights;
