import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '@components/Typography';
import { useTheme } from '@components/ThemeProvider';
import type { PassphraseStrength } from '@services/security/passphraseStrength';
import { spacing, radius } from '@theme/index';

export interface PassphraseStrengthMeterProps {
  strength: PassphraseStrength;
}

const FILLED_BARS: Record<PassphraseStrength['tier'], number> = {
  'too-short': 0,
  weak: 1,
  fair: 2,
  strong: 3,
  excellent: 4,
};

export function PassphraseStrengthMeter({ strength }: PassphraseStrengthMeterProps): JSX.Element {
  const { colors } = useTheme();

  const barColor: Record<PassphraseStrength['tier'], string> = {
    'too-short': colors.error,
    weak: colors.error,
    fair: colors.warning,
    strong: colors.success,
    excellent: colors.success,
  };

  const activeColor = barColor[strength.tier];
  const filled = FILLED_BARS[strength.tier];

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={`Passphrase strength: ${strength.label}`}
      accessibilityValue={{ now: strength.score, min: 0, max: 4 }}
    >
      <View style={styles.barsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                backgroundColor: i < filled ? activeColor : colors.border,
              },
            ]}
          />
        ))}
      </View>
      <Typography
        variant="captionSmall"
        color={strength.tier === 'too-short' || strength.tier === 'weak' ? 'secondary' : 'primary'}
        style={styles.label}
      >
        {strength.label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing['1'],
  },
  barsRow: {
    flexDirection: 'row',
    gap: spacing['1'],
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
  },
  label: {
    marginTop: 2,
  },
});
