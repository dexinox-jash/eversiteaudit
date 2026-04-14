import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@components/ThemeProvider';
import { Typography } from './Typography';
import { spacing, touchTargets } from '@theme/index';
import type { LucideIcon } from 'lucide-react-native';

export interface HeaderProps {
  title: string;
  leftIcon?: LucideIcon;
  onLeftPress?: () => void;
  rightIcon?: LucideIcon;
  onRightPress?: () => void;
  rightElement?: React.ReactNode;
}

export function Header({
  title,
  leftIcon: LeftIcon,
  onLeftPress,
  rightIcon: RightIcon,
  onRightPress,
  rightElement,
}: HeaderProps): JSX.Element {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.side}>
        {LeftIcon ? (
          <Pressable
            accessibilityRole="button"
            onPress={onLeftPress}
            style={styles.button}
            hitSlop={8}
          >
            <LeftIcon size={24} color={colors.textPrimary} />
          </Pressable>
        ) : null}
      </View>

      <Typography variant="h3" color="primary" style={styles.title} numberOfLines={1}>
        {title}
      </Typography>

      <View style={[styles.side, styles.rightSide]}>
        {rightElement}
        {RightIcon ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRightPress}
            style={styles.button}
            hitSlop={8}
          >
            <RightIcon size={24} color={colors.textPrimary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: touchTargets.preferred,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['4'],
    borderBottomWidth: 1,
  },
  side: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
});
