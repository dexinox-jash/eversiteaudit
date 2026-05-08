import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@components/ThemeProvider';
import { fontSizes, lineHeights, fontWeights, fontFamily, letterSpacing } from '@theme/index';

export type TextVariant =
  | 'display'
  | 'headingLg'
  | 'headingMd'
  | 'headingSm'
  | 'bodyLarge'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'captionSmall'
  | 'overline';

export interface TypographyProps extends TextProps {
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'disabled' | (string & {});
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  weight?: keyof typeof fontWeights;
  children: React.ReactNode;
}

function fw(w: string): TextStyle['fontWeight'] {
  return w as unknown as TextStyle['fontWeight'];
}

function getFontFamily(variant: TextVariant, weight?: keyof typeof fontWeights): string {
  const isHeading =
    variant === 'display' ||
    variant === 'headingLg' ||
    variant === 'headingMd' ||
    variant === 'headingSm';
  if (isHeading) {
    if (weight === 'bold') return fontFamily.headingBold;
    return fontFamily.heading;
  }
  if (weight === 'medium' || weight === 'semibold' || weight === 'bold') {
    return fontFamily.bodyMedium;
  }
  return fontFamily.body;
}

const variantStyles: Record<TextVariant, TextStyle> = {
  display: {
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
    fontWeight: fw(fontWeights.medium),
    letterSpacing: letterSpacing.display,
  },
  headingLg: {
    fontSize: fontSizes.headingLg,
    lineHeight: lineHeights.headingLg,
    fontWeight: fw(fontWeights.medium),
    letterSpacing: letterSpacing.headingLg,
  },
  headingMd: {
    fontSize: fontSizes.headingMd,
    lineHeight: lineHeights.headingMd,
    fontWeight: fw(fontWeights.semibold),
    letterSpacing: letterSpacing.headingMd,
  },
  headingSm: {
    fontSize: fontSizes.headingSm,
    lineHeight: lineHeights.headingSm,
    fontWeight: fw(fontWeights.medium),
    letterSpacing: letterSpacing.headingSm,
  },
  bodyLarge: {
    fontSize: fontSizes.bodyLarge,
    lineHeight: lineHeights.bodyLarge,
    fontWeight: fw(fontWeights.regular),
    letterSpacing: letterSpacing.bodyLarge,
  },
  body: {
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    fontWeight: fw(fontWeights.regular),
    letterSpacing: letterSpacing.body,
  },
  bodySmall: {
    fontSize: fontSizes.bodySmall,
    lineHeight: lineHeights.bodySmall,
    fontWeight: fw(fontWeights.regular),
    letterSpacing: letterSpacing.bodySmall,
  },
  caption: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
    fontWeight: fw(fontWeights.medium),
    letterSpacing: letterSpacing.caption,
  },
  captionSmall: {
    fontSize: fontSizes.captionSmall,
    lineHeight: lineHeights.captionSmall,
    fontWeight: fw(fontWeights.medium),
    letterSpacing: letterSpacing.captionSmall,
  },
  overline: {
    fontSize: fontSizes.overline,
    lineHeight: lineHeights.overline,
    fontWeight: fw(fontWeights.medium),
    letterSpacing: letterSpacing.overline,
    textTransform: 'uppercase',
  },
};

export function Typography({
  variant = 'body',
  color = 'primary',
  align,
  weight,
  style,
  children,
  ...rest
}: TypographyProps): JSX.Element {
  const { colors } = useTheme();

  const colorMap: Record<string, string> = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    disabled: colors.textDisabled,
  };

  const resolvedColor = colorMap[color] ?? color;
  const baseStyle = variantStyles[variant];

  const computedStyle: TextStyle = {
    fontFamily: getFontFamily(variant, weight),
    color: resolvedColor,
    textAlign: align,
    ...baseStyle,
    ...(weight ? { fontWeight: fw(fontWeights[weight]) } : undefined),
  };

  return (
    <Text style={[computedStyle, style]} {...rest}>
      {children}
    </Text>
  );
}
