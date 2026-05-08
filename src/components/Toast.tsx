import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Animated } from 'react-native';
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
  accessibilityLabel?: string;
}

const EXIT_DURATION = 150;

export function Toast({
  message,
  variant = 'default',
  icon: Icon,
  duration = 3000,
  onDismiss,
  accessibilityLabel,
}: ToastProps): JSX.Element | null {
  const { colors, reduceMotion } = useTheme();
  const [dismissed, setDismissed] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      animValue.setValue(1);
    } else {
      Animated.timing(animValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }

    const visibleDuration = Math.max(duration - EXIT_DURATION, 0);

    const exitTimeout = setTimeout((): void => {
      if (!reduceMotion) {
        Animated.timing(animValue, {
          toValue: 0,
          duration: EXIT_DURATION,
          useNativeDriver: false,
        }).start();
      }
    }, visibleDuration);

    const dismissTimeout = setTimeout((): void => {
      setDismissed(true);
      onDismiss?.();
    }, duration);

    return (): void => {
      clearTimeout(exitTimeout);
      clearTimeout(dismissTimeout);
    };
  }, [duration, onDismiss, reduceMotion, animValue]);

  if (dismissed) {
    return null;
  }

  const variantMap: Record<ToastVariant, { bg: string; border: string; iconColor: string }> = {
    default: {
      bg: colors.backgroundElevated,
      border: colors.border,
      iconColor: colors.textPrimary,
    },
    success: { bg: `${colors.success}15`, border: colors.success, iconColor: colors.success },
    error: { bg: `${colors.error}15`, border: colors.error, iconColor: colors.error },
    warning: { bg: `${colors.warning}15`, border: colors.warning, iconColor: colors.warning },
  };

  const { bg, border, iconColor } = variantMap[variant];

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: animValue,
          transform: [{ translateY }],
        },
        shadows['2'],
      ]}
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel ?? message}
      accessibilityLiveRegion="polite"
    >
      {Icon ? <Icon size={20} color={iconColor} style={styles.icon} /> : null}
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
