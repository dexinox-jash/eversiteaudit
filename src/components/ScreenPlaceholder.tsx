import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@components/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenPlaceholderProps {
  title: string;
  subtitle?: string;
}

export function ScreenPlaceholder({ title, subtitle }: ScreenPlaceholderProps): JSX.Element {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
