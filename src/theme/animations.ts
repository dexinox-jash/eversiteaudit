/**
 * Design tokens: Animation Timing
 * Source: .documentation/DESIGN.md — Animation Timing
 */

export const durations = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
} as const;

export const easings = {
  default: [0.4, 0, 0.2, 1] as const,
  spring: [0.34, 1.56, 0.64, 1] as const,
};

export type DurationToken = keyof typeof durations;
