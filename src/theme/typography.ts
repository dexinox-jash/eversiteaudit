/**
 * Design tokens: Typography scale
 * Source: design.md — Typography
 */

export const fonts = {
  heading: 'Poppins',
  body: 'Lora',
  ui: 'System',
  fallbackHeading: 'Arial',
  fallbackBody: 'Georgia',
} as const;

export const fontSizes = {
  display: 32,
  'heading-lg': 24,
  'heading-md': 20,
  'heading-sm': 16,
  body: 14,
  caption: 12,
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export type FontToken = keyof typeof fonts;
export type FontSizeToken = keyof typeof fontSizes;
export type FontWeightToken = keyof typeof fontWeights;
