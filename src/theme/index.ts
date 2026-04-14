/**
 * Theme provider and token exports
 * Aggregates colors, spacing, typography, shadows, and radius for the app.
 */

export { colors, severityColors, type ColorTheme, type ColorTokens } from './colors';
export { spacing, touchTargets, type SpacingToken } from './spacing';
export {
  fontFamily,
  fontSizes,
  lineHeights,
  fontWeights,
  type FontSizeToken,
  type FontWeightToken,
} from './typography';
export { shadows, type ShadowToken } from './shadows';
export { radius, type RadiusToken } from './radius';
export { durations, easings, type DurationToken } from './animations';
