import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@components/ThemeProvider';
import { Typography } from './Typography';
import { spacing, radius, shadows } from '@theme/index';
import type { LucideIcon } from 'lucide-react-native';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  icon?: LucideIcon;
  duration?: number;
  onDismiss?: () => void;
}

export function Toast({
  message,
  variant = 'default',
  icon: Icon,
  duration = 3000,
  onDismiss,
}: ToastProps): JSX.Element {
  const { colors } = useTheme();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 250 });
    opacity.value = withTiming(1, { duration: 250 });

    const hideTimeout = setTimeout((): void => {
      translateY.value = withTiming(100, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      if (onDismiss) {
        setTimeout(onDismiss, 200);
      }
    }, duration);

    return (): void => clearTimeout(hideTimeout);
  }, [duration, onDismiss, translateY, opacity]);

  const variantMap: Record<ToastVariant, { bg: string; border: string; iconColor: string }> = {
    default: { bg: colors.backgroundElevated, border: colors.border, iconColor: colors.textPrimary },
    success: { bg: `${colors.success}15`, border: colors.success, iconColor: colors.success },
    error: { bg: `${colors.error}15`, border: colors.error, iconColor: colors.error },
    warning: { bg: `${colors.warning}15`, border: colors.warning, iconColor: colors.warning },
  };

  const { bg, border, iconColor } = variantMap[variant];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const ResolvedIcon = Icon;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          borderColor: border,
        },
        shadows['2'],
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      {ResolvedIcon ? (
        <ResolvedIcon size={20} color={iconColor} style={styles.icon} />
      ) : null}
      <Typography variant="bodySmall" color="primary">
        {message}
      </Typography>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 88,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing['3'],
    paddingHorizontal: spacing['5'],
    borderRadius: radius.lg,
    borderWidth: 1,
    minWidth: 200,
    maxWidth: '80%',
  },
  icon: {
    marginRight: spacing['2'],
  },
});
