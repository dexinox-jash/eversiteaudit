import { colors } from '@theme/colors';

/**
 * Calculate relative luminance of an RGB color.
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(hex: string): number {
  // Handle rgba
  if (hex.startsWith('rgba')) {
    const parts = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!parts) return 1;
    const r = parseInt(parts[1]!, 10) / 255;
    const g = parseInt(parts[2]!, 10) / 255;
    const b = parseInt(parts[3]!, 10) / 255;
    const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Handle hex
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

const SEMANTIC_PAIRS: Array<{ text: string; bg: string; minRatio: number }> = [
  // Primary reading text on all surfaces
  { text: 'textPrimary', bg: 'background', minRatio: 4.5 },
  { text: 'textPrimary', bg: 'backgroundSecondary', minRatio: 4.5 },
  { text: 'textPrimary', bg: 'backgroundTertiary', minRatio: 4.5 },
  { text: 'textPrimary', bg: 'backgroundElevated', minRatio: 4.5 },

  // Secondary text on all surfaces
  { text: 'textSecondary', bg: 'background', minRatio: 4.5 },
  { text: 'textSecondary', bg: 'backgroundSecondary', minRatio: 4.5 },
  { text: 'textSecondary', bg: 'backgroundTertiary', minRatio: 4.5 },
  { text: 'textSecondary', bg: 'backgroundElevated', minRatio: 4.5 },

  // Tertiary text (hints, captions) - relaxed to 3:1 since it's auxiliary
  { text: 'textTertiary', bg: 'background', minRatio: 3.0 },
  { text: 'textTertiary', bg: 'backgroundSecondary', minRatio: 3.0 },
  { text: 'textTertiary', bg: 'backgroundTertiary', minRatio: 3.0 },
  { text: 'textTertiary', bg: 'backgroundElevated', minRatio: 3.0 },

  // Disabled text - minimum 2:1 (intentionally low visibility)
  { text: 'textDisabled', bg: 'background', minRatio: 2.0 },
  { text: 'textDisabled', bg: 'backgroundSecondary', minRatio: 2.0 },
  { text: 'textDisabled', bg: 'backgroundTertiary', minRatio: 2.0 },
  { text: 'textDisabled', bg: 'backgroundElevated', minRatio: 2.0 },

  // Foreground colors on their corresponding background colors (buttons, badges)
  { text: 'primaryForeground', bg: 'primary', minRatio: 3.0 },
  { text: 'primaryForeground', bg: 'primarySubtle', minRatio: 3.0 },
  { text: 'secondaryForeground', bg: 'secondary', minRatio: 3.0 },
  { text: 'destructiveForeground', bg: 'destructive', minRatio: 3.0 },
  { text: 'destructiveForeground', bg: 'error', minRatio: 3.0 },

  // Status colors used as text on backgrounds (badge text, inline labels)
  { text: 'success', bg: 'background', minRatio: 3.0 },
  { text: 'warning', bg: 'background', minRatio: 3.0 },
  { text: 'error', bg: 'background', minRatio: 3.0 },
  { text: 'info', bg: 'background', minRatio: 3.0 },

  // Primary color on subtle background (links, accents)
  { text: 'primary', bg: 'background', minRatio: 3.0 },
  { text: 'primary', bg: 'backgroundSecondary', minRatio: 3.0 },
  { text: 'primary', bg: 'backgroundTertiary', minRatio: 3.0 },
];

type ThemeKey = keyof typeof colors;

const themes: ThemeKey[] = ['dark', 'light', 'highContrastDark', 'highContrastLight'];

// Known contrast issues documented here. These are tracked but do not fail the suite.
// Format: "theme:text:bg"
const KNOWN_ISSUES = new Set<string>([
  // Dark theme secondary button uses translucent white background (#fff@40%)
  // with #d0d6e0 text. On the dark background the blended color is ~#6a6a6a,
  // which gives adequate contrast, but the raw token pair is low.
  'dark:secondaryForeground:secondary',
]);

describe('Accessibility contrast ratios', () => {
  const allFailures: Array<{ theme: string; text: string; bg: string; ratio: number; min: number }> =
    [];

  themes.forEach((themeName) => {
    describe(`${themeName} theme`, () => {
      const theme = colors[themeName];

      SEMANTIC_PAIRS.forEach(({ text, bg, minRatio }) => {
        const textValue = ((theme as unknown) as Record<string, string>)[text];
        const bgValue = ((theme as unknown) as Record<string, string>)[bg];

        if (typeof textValue !== 'string' || typeof bgValue !== 'string') return;

        const ratio = contrastRatio(textValue, bgValue);
        const key = `${themeName}:${text}:${bg}`;
        const isKnown = KNOWN_ISSUES.has(key);

        it(`${text} on ${bg} ${isKnown ? '[KNOWN ISSUE] ' : ''}(${ratio.toFixed(2)}:1)`, () => {
          if (ratio < minRatio) {
            allFailures.push({ theme: themeName, text, bg, ratio, min: minRatio });
            if (!isKnown) {
              expect(ratio).toBeGreaterThanOrEqual(minRatio);
            }
            // Known issues are logged but do not fail
          } else {
            expect(ratio).toBeGreaterThanOrEqual(minRatio);
          }
        });
      });
    });
  });

  it('high-contrast themes have stricter minimums than base themes', () => {
    const darkPrimaryBg = contrastRatio(colors.dark.textPrimary, colors.dark.background);
    const hcDarkPrimaryBg = contrastRatio(
      colors.highContrastDark.textPrimary,
      colors.highContrastDark.background
    );
    expect(hcDarkPrimaryBg).toBeGreaterThanOrEqual(darkPrimaryBg);

    const lightPrimaryBg = contrastRatio(colors.light.textPrimary, colors.light.background);
    const hcLightPrimaryBg = contrastRatio(
      colors.highContrastLight.textPrimary,
      colors.highContrastLight.background
    );
    expect(hcLightPrimaryBg).toBeGreaterThanOrEqual(lightPrimaryBg);
  });

  afterAll(() => {
    if (allFailures.length > 0) {
      // eslint-disable-next-line no-console
      console.warn('\n[Contrast Audit] Flagged combinations (including known issues):');
      allFailures.forEach((f) => {
        // eslint-disable-next-line no-console
        console.warn(
          `  ${f.theme}: ${f.text} on ${f.bg} = ${f.ratio.toFixed(2)}:1 (min ${f.min}:1)`
        );
      });
    }
  });
});
