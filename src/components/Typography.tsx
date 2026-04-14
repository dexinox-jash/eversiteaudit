import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@components/ThemeProvider';
import { fontSizes, lineHeights, fontWeights, fontFamily } from '@theme/index';

export type TextVariant =
  | 'hero'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
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

const variantStyles: Record<TextVariant, TextStyle> = {
  hero: { fontSize: fontSizes.hero, lineHeight: lineHeights.hero, fontWeight: fontWeights.bold },
  h1: { fontSize: fontSizes.h1, lineHeight: lineHeights.h1, fontWeight: fontWeights.bold },
  h2: { fontSize: fontSizes.h2, lineHeight: lineHeights.h2, fontWeight: fontWeights.semibold },
  h3: { fontSize: fontSizes.h3, lineHeight: lineHeights.h3, fontWeight: fontWeights.semibold },
  h4: { fontSize: fontSizes.h4, lineHeight: lineHeights.h4, fontWeight: fontWeights.semibold },
  bodyLarge: { fontSize: fontSizes.bodyLarge, lineHeight: lineHeights.bodyLarge, fontWeight: fontWeights.regular },
  body: { fontSize: fontSizes.body, lineHeight: lineHeights.body, fontWeight: fontWeights.regular },
  bodySmall: { fontSize: fontSizes.bodySmall, lineHeight: lineHeights.bodySmall, fontWeight: fontWeights.regular },
  caption: { fontSize: fontSizes.caption, lineHeight: lineHeights.caption, fontWeight: fontWeights.regular },
  captionSmall: { fontSize: fontSizes.captionSmall, lineHeight: lineHeights.captionSmall, fontWeight: fontWeights.medium },
  overline: { fontSize: fontSizes.overline, lineHeight: lineHeights.overline, fontWeight: fontWeights.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
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
    fontFamily: fontFamily.primary,
    color: resolvedColor,
    textAlign: align,
    ...baseStyle,
    ...(weight ? { fontWeight: fontWeights[weight] } : undefined),
  };

  return (
    <Text style={[computedStyle, style]} {...rest}>
      {children}
    </Text>
  );
}
