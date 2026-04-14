/**
 * Design tokens: Border Radius
 * Source: .documentation/DESIGN.md — Border Radius
 */

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
