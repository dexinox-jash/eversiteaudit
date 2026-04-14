/**
 * Design tokens: Color palette
 * Source: design.md — Brand Foundation
 */

export const palette = {
  // Primary
  dark: '#141413',
  light: '#faf9f5',
  midGray: '#b0aea5',
  lightGray: '#e8e6dc',

  // Accents
  orange: '#d97757',
  blue: '#6a9bcc',
  green: '#788c5d',

  // Semantic extensions
  danger: '#d97757',
  success: '#788c5d',
  info: '#6a9bcc',
  warning: '#e4a010',
} as const;

export const colors = {
  light: {
    background: palette.light,
    foreground: palette.dark,
    muted: palette.midGray,
    mutedForeground: palette.midGray,
    border: palette.lightGray,
    primary: palette.orange,
    primaryForeground: palette.light,
    secondary: palette.blue,
    secondaryForeground: palette.light,
    danger: palette.danger,
    dangerForeground: palette.light,
    success: palette.success,
    successForeground: palette.light,
    info: palette.info,
    infoForeground: palette.light,
    card: '#ffffff',
    cardForeground: palette.dark,
  },
  dark: {
    background: palette.dark,
    foreground: palette.light,
    muted: '#2a2a28',
    mutedForeground: palette.midGray,
    border: '#2a2a28',
    primary: palette.orange,
    primaryForeground: palette.light,
    secondary: palette.blue,
    secondaryForeground: palette.light,
    danger: palette.danger,
    dangerForeground: palette.light,
    success: palette.success,
    successForeground: palette.light,
    info: palette.info,
    infoForeground: palette.light,
    card: '#1c1c1b',
    cardForeground: palette.light,
  },
} as const;

export type ColorTheme = keyof typeof colors;
export type ColorTokens = typeof colors.light;
