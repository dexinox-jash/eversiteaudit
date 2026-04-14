/**
 * Design tokens: Spacing scale (4px base)
 * Source: .documentation/DESIGN.md — Spacing Scale
 */

export const spacing = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
} as const;

export const touchTargets = {
  minimum: 48,
  preferred: 56,
} as const;

export type SpacingToken = keyof typeof spacing;
