/**
 * Design tokens: Border Radius
 * Source: docs/design/DESIGN.md — Border Radius Scale
 */

export const radius = {
  micro: 2, // badges, toolbar buttons, subtle tags
  sm: 4, // small containers, list items
  md: 6, // buttons, inputs, functional elements
  lg: 8, // cards, dropdowns, popovers
  xl: 12, // panels, featured cards, section containers
  '2xl': 22, // large panel elements
  full: 9999, // pills, chips, filter pills
} as const;

export type RadiusToken = keyof typeof radius;
