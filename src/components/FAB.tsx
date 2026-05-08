import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@components/ThemeProvider';
import { spacing, radius, shadows, touchTargets } from '@theme/index';
import type { LucideIcon } from 'lucide-react-native';

export interface FABProps {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  disabled?: boolean;
  haptic?: boolean;
}

export function FAB({
  icon: Icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  disabled,
  haptic = true,
}: FABProps): JSX.Element {
  const { colors } = useTheme();

  const handlePress = (): void => {
    if (disabled) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
        // Ignore haptic errors
      });
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.primary,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        shadows['4'],
      ]}
    >
      <Icon size={32} color={colors.primaryForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing['5'],
    bottom: 80,
    width: touchTargets.preferred,
    height: 56,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
