import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from './ThemeProvider';
import { Typography } from './Typography';
import { spacing } from '@theme/index';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}): JSX.Element {
  const { colors } = useTheme();

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing['6'],
        },
      ]}
    >
      <Typography
        variant="headingMd"
        accessibilityRole="header"
        color="primary"
        style={{ textAlign: 'center', marginBottom: spacing['3'] }}
      >
        Something went wrong
      </Typography>
      <Typography
        variant="body"
        color="secondary"
        style={{ textAlign: 'center', marginBottom: spacing['6'] }}
      >
        The app encountered an unexpected error. You can try reloading to recover.
      </Typography>
      {error ? (
        <View
          style={{
            backgroundColor: colors.backgroundTertiary,
            borderRadius: 8,
            padding: spacing['4'],
            marginBottom: spacing['6'],
            maxWidth: '100%',
          }}
        >
          <Typography variant="caption" color="tertiary" style={{ textAlign: 'center' }}>
            {error.message}
          </Typography>
        </View>
      ) : null}
      <Pressable
        onPress={onReset}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 8,
          paddingVertical: spacing['3'],
          paddingHorizontal: spacing['6'],
          minHeight: 44,
          justifyContent: 'center',
        }}
        accessibilityRole="button"
        accessibilityLabel="Reload app"
      >
        <Typography variant="body" weight="semibold" style={{ color: colors.primaryForeground }}>
          Reload App
        </Typography>
      </Pressable>
    </View>
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}
