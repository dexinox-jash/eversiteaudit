import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  Platform,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@components/ThemeProvider';
import { spacing, radius, fontWeights } from '@theme/index';
import type { LucideIcon } from 'lucide-react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
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
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({
  variant = 'primary',
  size = 'default',
  title,
  icon: Icon,
  loading,
  disabled,
  fullWidth,
  haptic = true,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  style,
  ...rest
}: ButtonProps): JSX.Element {
  const { reduceMotion, colors } = useTheme();
  const isDisabled = disabled ? true : loading === true;
  const isLoading = loading ?? false;

  const handlePress = (e: Parameters<NonNullable<PressableProps['onPress']>>[0]): void => {
    if (haptic && !disabled && !loading && !reduceMotion) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        // Ignore haptic errors on unsupported devices/simulators
      });
    }
    onPress?.(e);
  };

  const variantStyles: Record<
    ButtonVariant,
    { backgroundColor: string; color: string; borderColor: string }
  > = {
    primary: {
      backgroundColor: colors.primary,
      color: colors.primaryForeground,
      borderColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.secondary,
      color: colors.secondaryForeground,
      borderColor: colors.secondary,
    },
    destructive: {
      backgroundColor: colors.destructive,
      color: colors.destructiveForeground,
      borderColor: colors.destructive,
    },
    ghost: {
      backgroundColor: colors.surfaceOverlay,
      color: colors.textPrimary,
      borderColor: colors.border,
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.textPrimary,
      borderColor: colors.border,
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      style={({ pressed }) => [
        styles.base,
        size === 'default' && styles.sizeDefault,
        size === 'small' && styles.sizeSmall,
        size === 'icon' && styles.sizeIcon,
        {
          backgroundColor: currentVariant.backgroundColor,
          borderColor: currentVariant.borderColor,
          borderWidth: variant === 'ghost' || variant === 'outline' ? 1 : StyleSheet.hairlineWidth,
          borderRadius: radius.md,
        },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        !reduceMotion && !isDisabled && { transform: [{ scale: pressed ? 0.98 : 1 }] },
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
      android_ripple={
        Platform.OS === 'android' ? { color: colors.surfaceOverlay, foreground: true } : undefined
      }
      {...rest}
    >
      {size === 'icon' && Icon ? (
        <Icon size={20} color={currentVariant.color} />
      ) : (
        <View style={styles.content}>
          {Icon ? <Icon size={16} color={currentVariant.color} style={styles.icon} /> : null}
          <Text style={[styles.text, { color: currentVariant.color }]} numberOfLines={1}>
            {isLoading ? 'Loading...' : title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  sizeDefault: {
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['4'],
    minHeight: 44,
  },
  sizeSmall: {
    paddingVertical: spacing['1'],
    paddingHorizontal: spacing['3'],
    minHeight: 40,
  },
  sizeIcon: {
    width: 44,
    height: 44,
    padding: spacing['2'],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: spacing['2'],
  },
  text: {
    fontSize: 15,
    fontWeight: fontWeights.semibold as unknown as TextStyle['fontWeight'],
    letterSpacing: -0.13,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.4,
  },
});
