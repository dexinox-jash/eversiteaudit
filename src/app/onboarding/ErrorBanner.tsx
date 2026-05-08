import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@components/ThemeProvider';
import { Typography } from '@components/index';
import { spacing } from '@theme/index';

type ErrorBannerProps = {
  error: string | null;
};

export default function ErrorBanner({ error }: ErrorBannerProps): JSX.Element | null {
  const { colors } = useTheme();

  if (!error) return null;

  return (
    <View
      style={[
        styles.errorBanner,
        { backgroundColor: colors.error + '20', borderColor: colors.error },
      ]}
    >
      <AlertTriangle size={20} color={colors.error} />
      <Typography variant="caption" color="error" style={styles.errorText}>
        {error}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginHorizontal: spacing['4'],
    marginBottom: spacing['4'],
    padding: spacing['3'],
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    flexWrap: 'wrap',
  },
});
