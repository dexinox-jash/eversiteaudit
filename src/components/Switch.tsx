import React from 'react';
import { Switch as RNSwitch, type SwitchProps as RNSwitchProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@components/ThemeProvider';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  haptic?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: RNSwitchProps['style'];
}

export function Switch({
  value,
  onValueChange,
  disabled,
  haptic = true,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
}: SwitchProps): JSX.Element {
  const { reduceMotion } = useTheme();

  const handleValueChange = (newValue: boolean): void => {
    if (disabled) return;
    if (haptic && !reduceMotion) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        // Ignore haptic errors
      });
    }
    onValueChange(newValue);
  };

  return (
    <RNSwitch
      value={value}
      onValueChange={handleValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      testID={testID}
      style={style}
    />
  );
}
