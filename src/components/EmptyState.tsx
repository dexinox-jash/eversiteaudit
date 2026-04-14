import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@components/ThemeProvider';
import { Typography } from './Typography';
import { Button } from './Button';
import { spacing } from '@theme/index';
import type { LucideIcon } from 'lucide-react-native';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionTitle,
  onAction,
}: EmptyStateProps): JSX.Element {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.backgroundTertiary }]}>
        <Icon size={40} color={colors.primary} />
      </View>
      <Typography variant="h3" color="primary" style={styles.title}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body" color="secondary" align="center" style={styles.subtitle}>
          {subtitle}
        </Typography>
      ) : null}
      {actionTitle ? (
        <View style={styles.action}>
          <Button title={actionTitle} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['6'],
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['5'],
  },
  title: {
    marginBottom: spacing['2'],
  },
  subtitle: {
    marginBottom: spacing['6'],
  },
  action: {
    marginTop: spacing['2'],
  },
});
