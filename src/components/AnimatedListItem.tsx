import React, { useEffect, useRef } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';
import { usePreferenceStore } from '@store/usePreferenceStore';

export interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  style?: ViewStyle;
  animate?: boolean;
}

const ITEM_DURATION = 200;
const STAGGER_MS = 50;
const MAX_DELAY = 500;

export function AnimatedListItem({
  children,
  index,
  style,
  animate = true,
}: AnimatedListItemProps): JSX.Element {
  const reduceMotion = usePreferenceStore((s) => s.reduceMotion);
  const opacity = useRef(new Animated.Value(reduceMotion || !animate ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reduceMotion || !animate ? 0 : 20)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (reduceMotion || !animate || hasAnimated.current) {
      opacity.setValue(1);
      translateY.setValue(0);
      hasAnimated.current = true;
      return;
    }

    const delay = Math.min(index * STAGGER_MS, MAX_DELAY);

    Animated.timing(opacity, {
      toValue: 1,
      duration: ITEM_DURATION,
      delay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.timing(translateY, {
      toValue: 0,
      duration: ITEM_DURATION,
      delay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    hasAnimated.current = true;
  }, [reduceMotion, opacity, translateY, index, animate]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
