import React from 'react';
import { Pressable, View, StyleSheet, Platform } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@components/ThemeProvider';
import { Typography } from './Typography';
import { Switch } from './Switch';
import { spacing, touchTargets } from '@theme/index';

export interface ActionRowProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  destructive?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function ActionRow({
  icon: Icon,
  label,
  value,
  onPress,
  trailing = 'chevron',
  switchValue,
  onSwitchChange,
  destructive,
  disabled,
  accessibilityLabel,
  accessibilityHint,
}: ActionRowProps): JSX.Element {
  const { colors } = useTheme();

  const isPressable = !!onPress && !disabled;
  const textColor = destructive ? colors.error : colors.textPrimary;
  const iconColor = destructive ? colors.error : colors.textSecondary;

  const content = (
    <View style={[styles.container, { opacity: disabled ? 0.5 : 1 }]}>
      <View style={styles.left}>
        <Icon size={20} color={iconColor} style={styles.icon} />
        <Typography variant="body" color={textColor}>
          {label}
        </Typography>
      </View>
      <View style={styles.right}>
        {value ? (
          <Typography variant="bodySmall" color="secondary" style={styles.value}>
            {value}
          </Typography>
        ) : null}
        {trailing === undefined && isPressable ? (
          <ChevronRight size={20} color={colors.textTertiary} />
        ) : trailing === 'switch' && onSwitchChange ? (
          <Switch
            value={switchValue ?? false}
            onValueChange={onSwitchChange}
            disabled={disabled ?? false}
            accessibilityLabel={label}
          />
        ) : trailing !== 'chevron' && trailing !== 'switch' ? (
          trailing
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
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [pressed && styles.pressed]}
        android_ripple={
          Platform.OS === 'android' ? { color: colors.surfaceOverlay, foreground: true } : undefined
        }
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTargets.minimum,
    paddingVertical: spacing['2'],
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: spacing['3'],
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    marginRight: spacing['2'],
  },
  pressed: {
    opacity: 0.85,
  },
});
