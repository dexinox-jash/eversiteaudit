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
  accessibilityLabel?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionTitle,
  onAction,
  accessibilityLabel,
}: EmptyStateProps): JSX.Element {
  const { colors } = useTheme();

  return (
    <View style={styles.container} accessibilityLabel={accessibilityLabel ?? title}>
      <View style={[styles.iconContainer, { backgroundColor: colors.backgroundTertiary }]}>
        <Icon size={40} color={colors.primary} />
      </View>
      <Typography
        variant="headingMd"
        accessibilityRole="header"
        color="primary"
        style={styles.title}
      >
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body" color="secondary" align="center" style={styles.subtitle}>
          {subtitle}
        </Typography>
      ) : null}
      {actionTitle ? (
        <View style={styles.action}>
          <Button
            title={actionTitle}
            onPress={onAction}
            accessibilityLabel={actionTitle}
            accessibilityHint={`Double-tap to ${actionTitle.toLowerCase()}`}
          />
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
    width: 72,
    height: 72,
    borderRadius: 36,
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
