import React from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@components/ThemeProvider';
import { Typography } from './Typography';
import { spacing, radius, touchTargets } from '@theme/index';
import type { LucideIcon } from 'lucide-react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize = 'default' | 'small' | 'icon';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  title: string;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  variant = 'primary',
  size = 'default',
  title,
  icon: Icon,
  loading,
  disabled,
  fullWidth,
  haptic = true,
  onPressIn,
  onPressOut,
  onPress,
  style,
  ...rest
}: ButtonProps): JSX.Element {
  const { colors } = useTheme();
  const pressedValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressedValue.value }],
    opacity: withTiming(disabled || loading ? 0.5 : 1, { duration: 150 }),
  }));

  const handlePressIn = (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]): void => {
    pressedValue.value = withTiming(0.97, { duration: 100 });
    onPressIn?.(e);
  };

  const handlePressOut = (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]): void => {
    pressedValue.value = withTiming(1, { duration: 100 });
    onPressOut?.(e);
  };

  const isDisabled = disabled ? true : loading === true;
  const isLoading = loading ?? false;

  const handlePress = (e: Parameters<NonNullable<PressableProps['onPress']>>[0]): void => {
    if (haptic && !disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        // Ignore haptic errors on unsupported devices/simulators
      });
    }
    onPress?.(e);
  };

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.border,
    },
    destructive: {
      backgroundColor: colors.error,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  };

  const textColor: Record<ButtonVariant, string> = {
    primary: '#FFFFFF',
    secondary: colors.textPrimary,
    destructive: '#FFFFFF',
    ghost: colors.primary,
  };

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    default: {
      height: touchTargets.preferred,
      paddingHorizontal: spacing['6'],
    },
    small: {
      height: touchTargets.minimum,
      paddingHorizontal: spacing['4'],
    },
    icon: {
      width: touchTargets.preferred,
      height: touchTargets.preferred,
      paddingHorizontal: 0,
    },
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        animatedStyle,
        style as ViewStyle,
      ]}
      {...rest}
    >
      {Icon && size === 'icon' ? (
        <Icon size={24} color={textColor[variant]} />
      ) : (
        <View style={styles.content}>
          {Icon ? <Icon size={20} color={textColor[variant]} style={styles.icon} /> : null}
          <Typography variant={size === 'small' ? 'bodySmall' : 'bodyLarge'} weight="semibold" color={textColor[variant]}>
            {title}
          </Typography>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing['2'],
  },
});
