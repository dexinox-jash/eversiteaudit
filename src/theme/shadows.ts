/**
 * Design tokens: Shadows & Elevation
 * Source: docs/design/DESIGN.md — Depth & Elevation
 *
 * Linear's philosophy: On dark surfaces, traditional shadows (dark on dark)
 * are nearly invisible. Elevation is communicated through background luminance
 * steps — each level slightly increases the white opacity of the surface
 * background. These shadows are used sparingly and complement the luminance model.
 */

export const shadows = {
  // Subtle micro-elevation for toolbar buttons
  '1': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.2 },
    shadowOpacity: 0.03,
    shadowRadius: 0,
    elevation: 1,
  },
  // Surface elevation for cards, input fields
  '2': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 2,
  },
  // Elevated floating elements, dropdowns
  '3': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  // Dialog-level: multi-layer shadow stack
  '4': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

export type ShadowToken = keyof typeof shadows;
