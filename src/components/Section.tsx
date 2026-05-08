import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { Card } from './Card';
import { spacing } from '@theme/index';

export interface SectionProps {
  title: string;
  children: React.ReactNode;
  action?: { label: string; onPress: () => void };
}

export function Section({ title, children, action }: SectionProps): JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography
          variant="headingSm"
          accessibilityRole="header"
          color="primary"
          style={styles.title}
        >
          {title}
        </Typography>
        {action ? (
          <Typography
            variant="bodySmall"
            color="primary"
            style={styles.action}
            onPress={action.onPress}
          >
            {action.label}
          </Typography>
        ) : null}
      </View>
      <Card padding="4">{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing['6'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['3'],
    paddingHorizontal: spacing['1'],
  },
  title: {
    flex: 1,
  },
  action: {
    marginLeft: spacing['2'],
  },
});
