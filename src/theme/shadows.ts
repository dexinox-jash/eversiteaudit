/**
 * Design tokens: Shadows & Elevation
 * Source: .documentation/DESIGN.md — Shadows & Elevation
 */

export const shadows = {
  '1': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  '2': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  '3': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  '4': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 16,
  },
} as const;

export type ShadowToken = keyof typeof shadows;
