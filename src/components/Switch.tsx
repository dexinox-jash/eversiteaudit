import React from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@components/ThemeProvider';
import { radius } from '@theme/index';

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const KNOB_SIZE = 28;
const KNOB_PADDING = 2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface SwitchProps extends Omit<PressableProps, 'onPress'> {
  value: boolean;
  onValueChange: (value: boolean) => void;
  haptic?: boolean;
}

export function Switch({
  value,
  onValueChange,
  haptic = true,
  disabled,
  ...rest
}: SwitchProps): JSX.Element {
  const { colors } = useTheme();
  const toggleValue = useSharedValue(value ? 1 : 0);

  React.useEffect(() => {
    toggleValue.value = withTiming(value ? 1 : 0, { duration: 200 });
  }, [value, toggleValue]);

  const handlePress = (): void => {
    if (disabled) return;
    const newValue = !value;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        // Ignore haptic errors
      });
    }
    onValueChange(newValue);
  };

  const trackAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      toggleValue.value,
      [0, 1],
      [colors.backgroundElevated, colors.primary]
    ),
    opacity: disabled ? 0.5 : 1,
  }));

  const knobAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(
          value ? TRACK_WIDTH - KNOB_SIZE - KNOB_PADDING : KNOB_PADDING,
          { duration: 200 }
        ),
      },
    ],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: disabled ?? undefined }}
      disabled={disabled}
      onPress={handlePress}
      style={[styles.track, trackAnimatedStyle]}
      {...rest}
    >
      <Animated.View
        style={[
          styles.knob,
          { backgroundColor: colors.textPrimary },
          knobAnimatedStyle,
        ]}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radius.full,
    justifyContent: 'center',
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: radius.full,
    position: 'absolute',
    left: 0,
  },
});
