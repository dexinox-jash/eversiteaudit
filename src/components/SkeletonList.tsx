import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonCard } from './SkeletonCard';
import { spacing } from '@theme/index';

export interface SkeletonListProps {
  count?: number;
  lines?: number;
  showImage?: boolean;
  gap?: number;
}

export function SkeletonList({
  count = 3,
  lines = 2,
  showImage = false,
  gap = spacing['3'],
}: SkeletonListProps): JSX.Element {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={{ marginBottom: index < count - 1 ? gap : 0 }}>
          <SkeletonCard lines={lines} showImage={showImage} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
