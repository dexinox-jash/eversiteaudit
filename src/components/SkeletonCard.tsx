import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '@components/ThemeProvider';
import { spacing, radius } from '@theme/index';

export interface SkeletonCardProps {
  lines?: number;
  showImage?: boolean;
}

export function SkeletonCard({ lines = 2, showImage = false }: SkeletonCardProps): JSX.Element {
  const { colors, reduceMotion } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return (): void => {
      pulse.stop();
    };
  }, [opacityAnim, reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSecondary,
          opacity: reduceMotion ? 0.6 : opacityAnim,
        },
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <View style={styles.row}>
        {showImage && (
          <View style={[styles.image, { backgroundColor: colors.backgroundTertiary }]} />
        )}
        <View style={styles.textColumn}>
          <View style={[styles.title, { backgroundColor: colors.backgroundTertiary }]} />
          {Array.from({ length: lines }).map((_, i) => (
            <View key={i} style={[styles.line, { backgroundColor: colors.backgroundTertiary }]} />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing['4'],
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
  },
  textColumn: {
    flex: 1,
    gap: spacing['2'],
  },
  title: {
    height: 16,
    borderRadius: radius.sm,
    width: '60%',
  },
  line: {
    height: 12,
    borderRadius: radius.sm,
    width: '100%',
  },
});
