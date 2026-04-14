import React from 'react';
import { ScrollView, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@components/ThemeProvider';
import { Header, type HeaderProps } from './Header';
import { spacing } from '@theme/index';

export interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  header?: HeaderProps;
  scrollable?: boolean;
  pad?: boolean;
  safeAreaEdges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}

export function Screen({
  children,
  header,
  scrollable = true,
  pad = true,
  safeAreaEdges = ['top', 'bottom', 'left', 'right'],
  style,
  ...rest
}: ScreenProps): JSX.Element {
  const { colors } = useTheme();

  const content = (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
          padding: pad ? spacing['4'] : 0,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={safeAreaEdges}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {header ? <Header {...header} /> : null}
      {scrollable ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
