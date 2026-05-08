/**
 * Design tokens: Color palette
 * Source: docs/design/DESIGN.md — Linear Design System (Adapted)
 */

export const severityColors = {
  critical: '#FF4757',
  high: '#FF8C42',
  medium: '#FFD166',
  low: '#06D6A0',
} as const;

export const colors = {
  dark: {
    // Brand
    primary: '#5e6ad2',
    primaryForeground: '#ffffff',
    primaryHover: '#828fff',
    primaryPressed: '#7170ff',
    primarySubtle: 'rgba(94,106,210,0.15)',

    secondary: 'rgba(255,255,255,0.40)',
    secondaryForeground: '#d0d6e0',

    // Status
    success: '#10b981',
    warning: '#d97706',
    error: '#ef4444',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    info: '#7170ff',

    // Surfaces (Linear luminance stacking)
    background: '#08090a',
    backgroundSecondary: '#0f1011',
    backgroundTertiary: '#191a1b',
    backgroundElevated: '#28282c',
    scrim: 'rgba(0,0,0,0.85)',

    // Text (cool gray scale)
    textPrimary: '#f7f8f8',
    textSecondary: '#d0d6e0',
    textTertiary: '#8a8f98',
    textDisabled: '#62666d',

    // Borders (semi-transparent white)
    border: 'rgba(255,255,255,0.08)',
    borderSubtle: 'rgba(255,255,255,0.05)',

    severityBackground: {
      critical: 'rgba(255,71,87,0.12)',
      high: 'rgba(255,140,66,0.12)',
      medium: 'rgba(255,209,102,0.12)',
      low: 'rgba(6,214,160,0.12)',
    },
    surfaceOverlay: 'rgba(255,255,255,0.02)',

    severity: severityColors,
  },
  light: {
    // Brand
    primary: '#5e6ad2',
    primaryForeground: '#ffffff',
    primaryHover: '#4a55b8',
    primaryPressed: '#3d47a0',
    primarySubtle: 'rgba(94,106,210,0.10)',

    secondary: '#8a8a8a',
    secondaryForeground: '#1a1a1a',

    // Status
    success: '#059669',
    warning: '#b45309',
    error: '#dc2626',
    destructive: '#dc2626',
    destructiveForeground: '#ffffff',
    info: '#5e6ad2',

    // Surfaces
    background: '#f7f8f8',
    backgroundSecondary: '#f3f4f5',
    backgroundTertiary: '#e8e8ea',
    backgroundElevated: '#ffffff',
    scrim: 'rgba(0,0,0,0.5)',

    // Text
    textPrimary: '#1a1a1a',
    textSecondary: '#4a4a4a',
    textTertiary: '#6e6e6e',
    textDisabled: '#9e9e9e',

    // Borders
    border: '#d0d6e0',
    borderSubtle: '#e6e6e6',

    severityBackground: {
      critical: 'rgba(220,38,38,0.10)',
      high: 'rgba(194,65,12,0.10)',
      medium: 'rgba(161,98,7,0.08)',
      low: 'rgba(4,120,87,0.10)',
    },
    surfaceOverlay: 'rgba(0,0,0,0.02)',

    severity: {
      critical: '#DC2626',
      high: '#C2410C',
      medium: '#A16207',
      low: '#047857',
    },
  },
  highContrastDark: {
    // Brand
    primary: '#828fff',
    primaryForeground: '#000000',
    primaryHover: '#a0aaff',
    primaryPressed: '#6a75d9',
    primarySubtle: 'rgba(130,143,255,0.25)',

    secondary: '#ffffff',
    secondaryForeground: '#000000',

    // Status
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    destructive: '#f87171',
    destructiveForeground: '#000000',
    info: '#828fff',

    // Surfaces
    background: '#000000',
    backgroundSecondary: '#0a0a0a',
    backgroundTertiary: '#141414',
    backgroundElevated: '#1f1f1f',
    scrim: 'rgba(0,0,0,0.95)',

    // Text
    textPrimary: '#ffffff',
    textSecondary: '#e0e0e0',
    textTertiary: '#c0c0c0',
    textDisabled: '#808080',

    // Borders
    border: '#ffffff',
    borderSubtle: '#404040',

    severityBackground: {
      critical: 'rgba(255,107,122,0.20)',
      high: 'rgba(255,159,112,0.20)',
      medium: 'rgba(255,224,102,0.15)',
      low: 'rgba(0,230,168,0.20)',
    },
    surfaceOverlay: 'rgba(255,255,255,0.05)',

    severity: {
      critical: '#FF6B7A',
      high: '#FF9F70',
      medium: '#FFE066',
      low: '#00E6A8',
    },
  },
  highContrastLight: {
    // Brand
    primary: '#3d47a0',
    primaryForeground: '#ffffff',
    primaryHover: '#2d3580',
    primaryPressed: '#1e2459',
    primarySubtle: 'rgba(61,71,160,0.15)',

    secondary: '#1a1a1a',
    secondaryForeground: '#ffffff',

    // Status
    success: '#047857',
    warning: '#92400e',
    error: '#991b1b',
    destructive: '#991b1b',
    destructiveForeground: '#ffffff',
    info: '#3d47a0',

    // Surfaces
    background: '#ffffff',
    backgroundSecondary: '#f0f0f0',
    backgroundTertiary: '#e0e0e0',
    backgroundElevated: '#ffffff',
    scrim: 'rgba(0,0,0,0.7)',

    // Text
    textPrimary: '#000000',
    textSecondary: '#1a1a1a',
    textTertiary: '#333333',
    textDisabled: '#666666',

    // Borders
    border: '#000000',
    borderSubtle: '#cccccc',

    severityBackground: {
      critical: 'rgba(153,27,27,0.15)',
      high: 'rgba(124,45,18,0.15)',
      medium: 'rgba(113,63,18,0.10)',
      low: 'rgba(6,78,59,0.15)',
    },
    surfaceOverlay: 'rgba(0,0,0,0.04)',

    severity: {
      critical: '#991B1B',
      high: '#7C2D12',
      medium: '#713F12',
      low: '#064E3B',
    },
  },
} as const;

export type ColorTheme = keyof typeof colors;
export type ColorTokens = (typeof colors)[ColorTheme];
