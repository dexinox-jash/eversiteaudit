import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text } from 'react-native';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useTheme } from './ThemeProvider';
import { usePreferenceStore } from '@store/usePreferenceStore';

const BANNER_HEIGHT = Platform.OS === 'ios' ? 36 : 32;

export function OfflineBanner(): JSX.Element | null {
  const { colors } = useTheme();
  const reduceMotion = usePreferenceStore((s) => s.reduceMotion);
  const [isOffline, setIsOffline] = useState(false);
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-BANNER_HEIGHT)).current;

  useEffect(() => {
    let mounted = true;

    const handleState = (state: NetInfoState): void => {
      if (!mounted) return;
      const offline = !state.isConnected;
      setIsOffline(offline);
      setVisible(offline);
    };

    const unsubscribe = NetInfo.addEventListener(handleState);
    void NetInfo.fetch().then(handleState);

    return (): void => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      translateY.setValue(visible ? 0 : -BANNER_HEIGHT);
      return;
    }

    Animated.timing(translateY, {
      toValue: visible ? 0 : -BANNER_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, reduceMotion, translateY]);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.warning,
          height: BANNER_HEIGHT,
          transform: [{ translateY }],
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel="No internet connection. You are working offline."
    >
      <Text style={[styles.text, { color: colors.background }]}>
        No internet connection. You&apos;re working offline.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
