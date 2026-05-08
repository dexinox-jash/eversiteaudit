import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text, useColorScheme } from 'react-native';
import { ThemeProvider, useTheme } from '@components/ThemeProvider';
import { usePreferenceStore } from '@store/usePreferenceStore';
import { colors } from '@theme/colors';

jest.unmock('@components/ThemeProvider');
jest.mock('@store/usePreferenceStore');

function TestComponent(): JSX.Element {
  const { theme, colors: themeColors } = useTheme();
  return (
    <>
      <Text testID="theme">{theme}</Text>
      <Text testID="bg">{themeColors.background}</Text>
    </>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides dark theme by default', () => {
    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      theme: 'dark',
      reduceMotion: false,
      highContrast: false,
      isLoaded: true,
      load: jest.fn(),
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').props.children).toBe('dark');
    expect(screen.getByTestId('bg').props.children).toBe(colors.dark.background);
  });

  it('provides light theme when set', () => {
    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      theme: 'light',
      reduceMotion: false,
      highContrast: false,
      isLoaded: true,
      load: jest.fn(),
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').props.children).toBe('light');
    expect(screen.getByTestId('bg').props.children).toBe(colors.light.background);
  });

  it('provides high contrast dark theme when highContrast is true and base is dark', () => {
    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      theme: 'dark',
      reduceMotion: false,
      highContrast: true,
      isLoaded: true,
      load: jest.fn(),
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').props.children).toBe('highContrastDark');
    expect(screen.getByTestId('bg').props.children).toBe(colors.highContrastDark.background);
  });

  it('provides high contrast light theme when highContrast is true and base is light', () => {
    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      theme: 'light',
      reduceMotion: false,
      highContrast: true,
      isLoaded: true,
      load: jest.fn(),
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').props.children).toBe('highContrastLight');
    expect(screen.getByTestId('bg').props.children).toBe(colors.highContrastLight.background);
  });

  it('resolves system theme to light when system scheme is light', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');
    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      theme: 'system',
      reduceMotion: false,
      highContrast: false,
      isLoaded: true,
      load: jest.fn(),
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').props.children).toBe('light');
  });

  it('resolves system theme to dark when system scheme is dark', () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');
    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      theme: 'system',
      reduceMotion: false,
      highContrast: false,
      isLoaded: true,
      load: jest.fn(),
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').props.children).toBe('dark');
  });

  it('uses defaultTheme prop before mount', () => {
    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      theme: 'light',
      reduceMotion: false,
      highContrast: false,
      isLoaded: false,
      load: jest.fn(),
    });

    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').props.children).toBe('dark');
  });

  it('toggles theme from dark to light', () => {
    const setTheme = jest.fn();
    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      theme: 'dark',
      reduceMotion: false,
      highContrast: false,
      isLoaded: true,
      load: jest.fn(),
    });
    (usePreferenceStore.getState as jest.Mock).mockReturnValue({ setTheme });

    function ToggleComponent(): JSX.Element {
      const { toggleTheme } = useTheme();
      return <Text testID="toggle" onPress={toggleTheme} />;
    }

    render(
      <ThemeProvider>
        <ToggleComponent />
      </ThemeProvider>
    );

    screen.getByTestId('toggle').props.onPress();
    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('toggles theme from light to dark', () => {
    const setTheme = jest.fn();
    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      theme: 'light',
      reduceMotion: false,
      highContrast: false,
      isLoaded: true,
      load: jest.fn(),
    });
    (usePreferenceStore.getState as jest.Mock).mockReturnValue({ setTheme });

    function ToggleComponent(): JSX.Element {
      const { toggleTheme } = useTheme();
      return <Text testID="toggle" onPress={toggleTheme} />;
    }

    render(
      <ThemeProvider>
        <ToggleComponent />
      </ThemeProvider>
    );

    screen.getByTestId('toggle').props.onPress();
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('sets theme directly', () => {
    const setTheme = jest.fn();
    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      theme: 'dark',
      reduceMotion: false,
      highContrast: false,
      isLoaded: true,
      load: jest.fn(),
    });
    (usePreferenceStore.getState as jest.Mock).mockReturnValue({ setTheme });

    function SetThemeComponent(): JSX.Element {
      const { setTheme: setThemeFn } = useTheme();
      return <Text testID="setter" onPress={() => setThemeFn('system')} />;
    }

    render(
      <ThemeProvider>
        <SetThemeComponent />
      </ThemeProvider>
    );

    screen.getByTestId('setter').props.onPress();
    expect(setTheme).toHaveBeenCalledWith('system');
  });

  it('throws when useTheme is called outside ThemeProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow('useTheme must be used within a ThemeProvider');

    consoleError.mockRestore();
  });
});
