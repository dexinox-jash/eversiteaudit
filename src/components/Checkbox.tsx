import React from 'react';
import { Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@components/ThemeProvider';

export interface CheckboxProps {
  checked: boolean;
  onPress?: () => void;
  size?: number;
  accessibilityLabel?: string;
}

export function Checkbox({
  checked,
  onPress,
  size = 24,
  accessibilityLabel,
}: CheckboxProps): JSX.Element {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !onPress }}
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: colors.border,
        backgroundColor: checked ? colors.primary : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && <Check size={size * 0.7} color={colors.primaryForeground} strokeWidth={3} />}
    </Pressable>
  );
}
