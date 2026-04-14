import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  View,
  StyleSheet,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import { useTheme } from '@components/ThemeProvider';
import { Typography } from './Typography';
import { spacing, radius, touchTargets } from '@theme/index';
import type { LucideIcon } from 'lucide-react-native';

export interface TextInputProps extends Omit<RNTextInputProps, 'placeholderTextColor'> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export function TextInput({
  label,
  error,
  icon: Icon,
  style,
  onFocus,
  onBlur,
  ...rest
}: TextInputProps): JSX.Element {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: Parameters<NonNullable<RNTextInputProps['onFocus']>>[0]): void => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: Parameters<NonNullable<RNTextInputProps['onBlur']>>[0]): void => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Typography variant="caption" color="secondary" style={styles.label}>
          {label}
        </Typography>
      ) : null}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.backgroundTertiary,
            borderColor: error ? colors.error : isFocused ? colors.primary : colors.border,
          },
        ]}
      >
        {Icon ? <Icon size={20} color={colors.textTertiary} style={styles.icon} /> : null}
        <RNTextInput
          accessibilityLabel={label}
          accessibilityState={{}}
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              minHeight: touchTargets.preferred,
            },
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
      </View>
      {error ? (
        <Typography variant="captionSmall" color={colors.error} style={styles.error}>
          {error}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: spacing['1'],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing['4'],
  },
  icon: {
    marginRight: spacing['2'],
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  error: {
    marginTop: spacing['1'],
  },
});
