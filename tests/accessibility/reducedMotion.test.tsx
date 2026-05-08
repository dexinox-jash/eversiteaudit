import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { Button } from '@components/Button';
import { Toast } from '@components/Toast';
import { useTheme } from '@components/ThemeProvider';
import * as Haptics from 'expo-haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

function mockTheme(overrides: { reduceMotion?: boolean } = {}): void {
  (useTheme as jest.Mock).mockReturnValue({
    theme: 'dark',
    themeSetting: 'dark',
    colors: {
      primary: '#4A9EFF',
      primaryHover: '#6BB3FF',
      primaryPressed: '#3A8EEF',
      primarySubtle: '#1A3A5C',
      success: '#06D6A0',
      warning: '#FFD166',
      error: '#FF4757',
      info: '#4A9EFF',
      background: '#0D1117',
      backgroundSecondary: '#161B22',
      backgroundTertiary: '#21262D',
      backgroundElevated: '#30363D',
      scrim: 'rgba(0,0,0,0.7)',
      textPrimary: '#F0F6FC',
      textSecondary: '#8B949E',
      textTertiary: '#6E7681',
      textDisabled: '#484F58',
      border: '#30363D',
      borderSubtle: '#21262D',
      severity: {
        critical: '#FF4757',
        high: '#FF8C42',
        medium: '#FFD166',
        low: '#06D6A0',
      },
      severityBackground: {
        critical: '#FF475720',
        high: '#FF8C4220',
        medium: '#FFD16620',
        low: '#06D6A020',
      },
      surfaceOverlay: 'rgba(255,255,255,0.03)',
    },
    reduceMotion: overrides.reduceMotion ?? false,
    highContrast: false,
    toggleTheme: jest.fn(),
    setTheme: jest.fn(),
  });
}

describe('Reduced Motion accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Toast component', () => {
    it('skips entrance animation when reduceMotion is true', () => {
      mockTheme({ reduceMotion: true });
      const timingSpy = jest.spyOn(Animated, 'timing');
      render(<Toast message="Test toast" />);
      expect(timingSpy).not.toHaveBeenCalled();
      timingSpy.mockRestore();
    });

    it('uses Animated.timing for entrance when reduceMotion is false', () => {
      mockTheme({ reduceMotion: false });
      const timingSpy = jest.spyOn(Animated, 'timing');
      render(<Toast message="Test toast" />);
      expect(timingSpy).toHaveBeenCalled();
      timingSpy.mockRestore();
    });

    it('has accessibility role alert', () => {
      mockTheme({ reduceMotion: false });
      const { UNSAFE_queryAllByProps } = render(<Toast message="Test toast" />);
      const alerts = UNSAFE_queryAllByProps({ accessibilityRole: 'alert' });
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe('Button component', () => {
    it('does not trigger haptic feedback when reduceMotion is true', () => {
      mockTheme({ reduceMotion: true });
      render(<Button title="Press me" testID="btn" />);
      const btn = screen.getByTestId('btn');
      fireEvent.press(btn);
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });

    it('triggers haptic feedback when reduceMotion is false', () => {
      mockTheme({ reduceMotion: false });
      render(<Button title="Press me" testID="btn" />);
      const btn = screen.getByTestId('btn');
      fireEvent.press(btn);
      expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    });

    it('applies transform scale when reduceMotion is false', () => {
      mockTheme({ reduceMotion: false });
      const { getByTestId } = render(<Button title="Press me" testID="btn" />);
      const btn = getByTestId('btn');
      const style = btn.props.style;
      const stylesArray = Array.isArray(style) ? style : [style];
      const hasTransform = stylesArray.some(
        (s: unknown) =>
          s &&
          typeof s === 'object' &&
          'transform' in (s as Record<string, unknown>)
      );
      expect(hasTransform).toBe(true);
    });

    it('does not apply transform scale when reduceMotion is true', () => {
      mockTheme({ reduceMotion: true });
      const { getByTestId } = render(<Button title="Press me" testID="btn" />);
      const btn = getByTestId('btn');
      const style = btn.props.style;
      const stylesArray = Array.isArray(style) ? style : [style];
      const hasTransform = stylesArray.some(
        (s: unknown) =>
          s &&
          typeof s === 'object' &&
          'transform' in (s as Record<string, unknown>)
      );
      expect(hasTransform).toBe(false);
    });

    it('still calls onPress regardless of reduceMotion', () => {
      mockTheme({ reduceMotion: true });
      const onPress = jest.fn();
      render(<Button title="Press me" testID="btn" onPress={onPress} />);
      const btn = screen.getByTestId('btn');
      fireEvent.press(btn);
      expect(onPress).toHaveBeenCalled();
    });
  });
});
