import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@components/ThemeProvider';

export interface DividerProps {
  spacing?: number;
}

export function Divider({ spacing: spacingAmount = 0 }: DividerProps): JSX.Element {
  const { colors } = useTheme();

  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacingAmount,
      }}
      accessibilityRole="none"
    />
  );
}
