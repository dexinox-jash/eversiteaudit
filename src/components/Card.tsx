import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useTheme } from '@components/ThemeProvider';
import { spacing, shadows, radius } from '@theme/index';

export type CardElevation = '1' | '2' | '3' | '4';

export interface CardProps extends ViewProps {
  elevation?: CardElevation;
  padding?: keyof typeof spacing;
  children: React.ReactNode;
}

export function Card({
  elevation = '1',
  padding = '5',
  children,
  style,
  ...rest
}: CardProps): JSX.Element {
  const { colors } = useTheme();
  const shadowStyle = shadows[elevation];

  return (
    <View
      testID="card"
      style={[
        {
          padding: spacing[padding],
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.lg,
          backgroundColor: colors.surfaceOverlay,
        },
        shadowStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
