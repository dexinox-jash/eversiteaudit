/**
 * Design tokens: Typography
 * Source: docs/design/DESIGN.md — Precision Craft Design System
 */

export const fontFamily = {
  heading: 'Poppins-SemiBold',
  headingBold: 'Poppins-Bold',
  body: 'Lora-Regular',
  bodyMedium: 'Lora-Medium',
  ui: 'Poppins-Medium',
  fallback: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  monospace: 'ui-monospace, SF Mono, Menlo, monospace',
} as const;

export const fontSizes = {
  display: 32,
  headingLg: 24,
  headingMd: 20,
  headingSm: 16,
  bodyLarge: 16,
  body: 15,
  bodySmall: 14,
  caption: 13,
  captionSmall: 12,
  overline: 11,
} as const;

export const lineHeights = {
  display: 32,
  headingLg: 27,
  headingMd: 24,
  headingSm: 21,
  bodyLarge: 24,
  body: 24,
  bodySmall: 21,
  caption: 20,
  captionSmall: 17,
  overline: 15,
} as const;

// Standard weights for Poppins + Lora
export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// Linear uses aggressive negative letter-spacing at display sizes
export const letterSpacing = {
  display: -0.5,
  headingLg: -0.3,
  headingMd: -0.2,
  headingSm: 0,
  bodyLarge: 0,
  body: -0.165,
  bodySmall: 0,
  caption: -0.13,
  captionSmall: 0,
  overline: 0,
} as const;

export type FontSizeToken = keyof typeof fontSizes;
export type FontWeightToken = keyof typeof fontWeights;
export type LetterSpacingToken = keyof typeof letterSpacing;
