import React from 'react';
import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@components/ThemeProvider';
import { fontSizes } from '@theme/index';

export type BadgeVariant = 'critical' | 'high' | 'medium' | 'low' | 'default' | 'info' | 'success';
export type BadgeSize = 'default' | 'small';

export interface BadgeProps {
  title: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: LucideIcon;
}

export function Badge({
  title,
  variant = 'default',
  size = 'default',
  icon: Icon,
}: BadgeProps): JSX.Element {
  const { colors } = useTheme();

  function getContrastText(hexColor: string): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#000000' : '#FFFFFF';
  }

  const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
    critical: { bg: colors.error, text: getContrastText(colors.error) },
    high: { bg: colors.warning, text: getContrastText(colors.warning) },
    medium: { bg: colors.warning, text: getContrastText(colors.warning) },
    low: { bg: colors.success, text: getContrastText(colors.success) },
    default: { bg: colors.backgroundSecondary, text: colors.textPrimary },
    info: { bg: colors.info, text: getContrastText(colors.info) },
    success: { bg: colors.success, text: getContrastText(colors.success) },
  };

  const { bg, text } = variantStyles[variant];

  const paddingVertical = size === 'small' ? 2 : 4;
  const paddingHorizontal = size === 'small' ? 6 : 8;
  const fontSize = size === 'small' ? fontSizes.overline : fontSizes.captionSmall;
  const iconSize = size === 'small' ? 12 : 14;

  return (
    <View
      accessibilityLabel={Icon ? `${title} with icon` : title}
      accessibilityRole="text"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: bg,
        paddingVertical,
        paddingHorizontal,
        borderRadius: 9999,
        gap: 4,
      }}
    >
      {Icon ? <Icon size={iconSize} color={text} accessibilityElementsHidden /> : null}
      <Text style={{ color: text, fontSize, fontWeight: '500' }}>{title}</Text>
    </View>
  );
}
