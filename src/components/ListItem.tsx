import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@components/ThemeProvider';
import { Typography } from './Typography';
import { spacing, touchTargets, radius } from '@theme/index';

export interface ListItemProps {
  icon?: LucideIcon;
  iconColor?: string;
  iconBackground?: string;
  title: string;
  subtitle?: string | undefined;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  selected?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function ListItem({
  icon: Icon,
  iconColor,
  iconBackground,
  title,
  subtitle,
  rightElement,
  onPress,
  severity,
  selected,
  disabled,
  accessibilityLabel,
  accessibilityHint,
}: ListItemProps): JSX.Element {
  const { colors } = useTheme();

  const isPressable = !!onPress && !disabled;

  const severityBorderColor = severity ? colors.severity[severity] : undefined;
  const backgroundColor = selected
    ? colors.primarySubtle
    : severity
      ? colors.severityBackground[severity]
      : colors.backgroundSecondary;

  const resolvedIconColor = iconColor ?? colors.primary;
  const resolvedIconBg = iconBackground ?? colors.primarySubtle;

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderLeftWidth: severity ? 4 : 0,
          borderLeftColor: severityBorderColor,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {Icon ? (
        <View style={[styles.iconCircle, { backgroundColor: resolvedIconBg }]}>
          <Icon size={22} color={resolvedIconColor} />
        </View>
      ) : null}

      <View style={styles.content}>
        <Typography variant="body" color="primary" numberOfLines={1}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color="secondary" numberOfLines={1}>
            {subtitle}
          </Typography>
        ) : null}
      </View>

      <View style={styles.right}>
        {rightElement}
        {isPressable && !rightElement ? (
          <ChevronRight size={18} color={colors.textTertiary} />
        ) : null}
      </View>
    </View>
  );

  if (isPressable) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ selected, disabled }}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ selected, disabled }}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargets.minimum,
    paddingVertical: spacing['3'],
    paddingHorizontal: spacing['4'],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing['3'],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing['2'],
  },
  pressed: {
    opacity: 0.85,
  },
});
