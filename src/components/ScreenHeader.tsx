import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { TextInput } from './TextInput';
import { Button } from './Button';
import { useTheme } from '@components/ThemeProvider';
import { spacing } from '@theme/index';
import type { TextInputProps } from './TextInput';

export interface ScreenHeaderFilterChip {
  label: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean };
}

export interface ScreenHeaderProps {
  title: string;
  searchProps?: TextInputProps;
  filterChips?: ScreenHeaderFilterChip[] | undefined;
  filterAccessibilityLabel?: string;
  rightElement?: React.ReactNode;
}

export function ScreenHeader({
  title,
  searchProps,
  filterChips,
  filterAccessibilityLabel,
  rightElement,
}: ScreenHeaderProps): JSX.Element {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.titleRow}>
        <Typography
          variant="headingMd"
          accessibilityRole="header"
          color="primary"
          style={styles.title}
        >
          {title}
        </Typography>
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>

      {searchProps ? (
        <View
          style={[
            styles.searchWrapper,
            { backgroundColor: colors.backgroundTertiary, borderRadius: 12 },
          ]}
        >
          <TextInput {...searchProps} style={styles.searchInput} />
        </View>
      ) : null}

      {filterChips && filterChips.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
          accessibilityRole="tablist"
          accessibilityLabel={filterAccessibilityLabel}
        >
          {filterChips.map((chip, index) => (
            <Button
              key={`${chip.label}-${index}`}
              title={chip.label}
              size="small"
              variant={chip.active ? 'primary' : 'secondary'}
              onPress={chip.onPress}
              style={styles.filterChip}
              {...(chip.accessibilityLabel ? { accessibilityLabel: chip.accessibilityLabel } : {})}
              {...(chip.accessibilityState ? { accessibilityState: chip.accessibilityState } : {})}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing['4'],
    paddingBottom: spacing['2'],
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['4'],
  },
  title: {
    flex: 1,
  },
  rightElement: {
    marginLeft: spacing['3'],
  },
  searchWrapper: {
    paddingHorizontal: spacing['4'],
    marginTop: spacing['3'],
  },
  searchInput: {
    width: '100%',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing['2'],
    paddingHorizontal: spacing['4'],
    paddingTop: spacing['3'],
    paddingBottom: spacing['2'],
  },
  filterChip: {
    alignSelf: 'center',
  },
});
