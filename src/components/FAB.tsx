import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@components/ThemeProvider';
import { spacing, radius, shadows, touchTargets } from '@theme/index';
import type { LucideIcon } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface FABProps {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  haptic?: boolean;
}

export function FAB({
  icon: Icon,
  onPress,
  accessibilityLabel,
  disabled,
  haptic = true,
}: FABProps): JSX.Element {
  const { colors } = useTheme();
  const pressedValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressedValue.value }],
    opacity: withTiming(disabled ? 0.5 : 1, { duration: 150 }),
  }));

  const handlePressIn = (): void => {
    pressedValue.value = withTiming(0.92, { duration: 100 });
  };

  const handlePressOut = (): void => {
    pressedValue.value = withTiming(1, { duration: 100 });
  };

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
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: colors.primary,
        },
        shadows['3'],
        animatedStyle,
      ]}
    >
      <Icon size={28} color="#FFFFFF" />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing['5'],
    bottom: spacing['5'],
    width: touchTargets.preferred,
    height: touchTargets.preferred,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
