import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from './Screen';
import { Typography } from './Typography';

interface ScreenPlaceholderProps {
  title: string;
  subtitle?: string;
}

export function ScreenPlaceholder({ title, subtitle }: ScreenPlaceholderProps): JSX.Element {
  return (
    <Screen scrollable={false} pad>
      <View style={styles.content}>
        <Typography variant="h1" color="primary" align="center">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="bodyLarge" color="secondary" align="center" style={styles.subtitle}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 12,
  },
});
