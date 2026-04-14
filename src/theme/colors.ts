/**
 * Design tokens: Color palette
 * Source: .documentation/DESIGN.md — Design System Tokens
 */

export const severityColors = {
  critical: '#FF4757',
  high: '#FF8C42',
  medium: '#FFD166',
  low: '#06D6A0',
} as const;

export const colors = {
  dark: {
    primary: '#4A9EFF',
    primaryHover: '#6BB3FF',
    primaryPressed: '#3A8EEF',
    primarySubtle: '#1A3A5C',

    success: '#06D6A0',
    warning: '#FFD166',
    error: '#FF4757',
    info: '#4A9EFF',

    background: '#0D1117',
    backgroundSecondary: '#161B22',
    backgroundTertiary: '#21262D',
    backgroundElevated: '#30363D',
    scrim: 'rgba(0,0,0,0.7)',

    textPrimary: '#F0F6FC',
    textSecondary: '#8B949E',
    textTertiary: '#6E7681',
    textDisabled: '#484F58',

    border: '#30363D',
    borderSubtle: '#21262D',

    severity: severityColors,
  },
  light: {
    primary: '#0066CC',
    primaryHover: '#0052A3',
    primaryPressed: '#004C99',
    primarySubtle: '#E6F2FF',

    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#0066CC',

    background: '#FFFFFF',
    backgroundSecondary: '#F6F8FA',
    backgroundTertiary: '#E1E4E8',
    backgroundElevated: '#FFFFFF',
    scrim: 'rgba(0,0,0,0.5)',

    textPrimary: '#1F2328',
    textSecondary: '#656D76',
    textTertiary: '#8C959F',
    textDisabled: '#B7BDC5',

    border: '#D0D7DE',
    borderSubtle: '#E1E4E8',

    severity: severityColors,
  },
} as const;

export type ColorTheme = keyof typeof colors;
export type ColorTokens = (typeof colors)[ColorTheme];
