import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import { spacing, radius } from '@theme/index';
import { useTheme } from '@components/ThemeProvider';
import type { LucideIcon } from 'lucide-react-native';

function extractTextFromNode(node: React.ReactNode): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromNode).join('');
  if (React.isValidElement(node)) {
    return extractTextFromNode(
      (
        (node as React.ReactElement<{ children?: React.ReactNode }>).props as {
          children?: React.ReactNode;
        }
      ).children
    );
  }
  return '';
}

export interface TextInputProps extends Omit<RNTextInputProps, 'placeholderTextColor'> {
  label?: React.ReactNode;
  error?: string | undefined;
  icon?: LucideIcon;
  accessibilityHint?: string;
}

export function TextInput({
  label,
  error,
  icon: Icon,
  style,
  accessibilityHint,
  accessibilityLabel,
  maxLength,
  onFocus,
  onBlur,
  ...rest
}: TextInputProps): JSX.Element {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style as never]}>
      {label ? <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputRow,
          {
            borderColor: error ? colors.error : isFocused ? colors.primary : colors.border,
            backgroundColor: colors.backgroundSecondary,
          },
        ]}
      >
        {Icon ? (
          <View style={styles.iconContainer}>
            <Icon size={20} color={colors.textSecondary} />
          </View>
        ) : null}
        <RNTextInput
          accessibilityLabel={
            accessibilityLabel ?? (label ? extractTextFromNode(label) : undefined)
          }
          accessibilityHint={accessibilityHint}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.textPrimary }]}
          maxLength={maxLength ?? 500}
          onFocus={(e): void => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e): void => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: spacing['1'],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['2'],
    minHeight: 44,
  },
  iconContainer: {
    marginRight: spacing['2'],
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  error: {
    fontSize: 14,
    marginTop: spacing['1'],
  },
});
