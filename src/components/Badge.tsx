import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@components/ThemeProvider';
import { Typography } from './Typography';
import { spacing, radius } from '@theme/index';
import type { LucideIcon } from 'lucide-react-native';

export type BadgeVariant = 'critical' | 'high' | 'medium' | 'low' | 'default' | 'info' | 'success';
export type BadgeSize = 'default' | 'small';

export interface BadgeProps {
  title: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: LucideIcon;
}

export function Badge({ title, variant = 'default', size = 'default', icon: Icon }: BadgeProps): JSX.Element {
  const { colors } = useTheme();

  const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
    critical: { bg: `${colors.severity.critical}20`, text: colors.severity.critical },
    high: { bg: `${colors.severity.high}20`, text: colors.severity.high },
    medium: { bg: `${colors.severity.medium}30`, text: colors.severity.medium },
    low: { bg: `${colors.severity.low}20`, text: colors.severity.low },
    default: { bg: colors.backgroundElevated, text: colors.textSecondary },
    info: { bg: `${colors.info}20`, text: colors.info },
    success: { bg: `${colors.success}20`, text: colors.success },
  };

  const { bg, text } = variantMap[variant];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          paddingVertical: size === 'small' ? 2 : 4,
          paddingHorizontal: size === 'small' ? 6 : 10,
        },
      ]}
    >
      {Icon ? <Icon size={size === 'small' ? 12 : 14} color={text} style={styles.icon} /> : null}
      <Typography
        variant={size === 'small' ? 'captionSmall' : 'caption'}
        weight="semibold"
        color={text}
      >
        {title}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.md,
  },
  icon: {
    marginRight: spacing['1'],
  },
});
