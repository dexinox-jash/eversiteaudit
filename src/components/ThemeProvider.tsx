import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { colors, type ColorTheme, type ColorTokens } from '@theme/colors';
import { usePreferenceStore } from '@store/usePreferenceStore';
import type { ThemePreference } from '@services/storage/preferences';

export type ResolvedColorTheme = Exclude<ColorTheme, 'system'>;
export type ThemeSetting = ColorTheme | 'system';

interface ThemeContextValue {
  theme: ColorTheme;
  themeSetting: ThemeSetting;
  colors: ColorTokens;
  reduceMotion: boolean;
  highContrast: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ColorTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
}: ThemeProviderProps): JSX.Element {
  const systemColorScheme = useColorScheme();
  const { theme: themeSetting, reduceMotion, highContrast, isLoaded, load } = usePreferenceStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (isLoaded) {
      setMounted(true);
    }
  }, [isLoaded]);

  const baseTheme: ResolvedColorTheme =
    themeSetting === 'system' ? (systemColorScheme === 'light' ? 'light' : 'dark') : themeSetting;

  const resolvedTheme: ColorTheme = highContrast
    ? baseTheme === 'light'
      ? 'highContrastLight'
      : 'highContrastDark'
    : baseTheme;

  const toggleTheme = useCallback((): void => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    void usePreferenceStore.getState().setTheme(next);
  }, [resolvedTheme]);

  const setTheme = useCallback((newTheme: ThemePreference): void => {
    void usePreferenceStore.getState().setTheme(newTheme);
  }, []);

  const effectiveTheme = mounted ? resolvedTheme : defaultTheme;

  const value: ThemeContextValue = {
    theme: effectiveTheme,
    themeSetting,
    colors: colors[effectiveTheme],
    reduceMotion,
    highContrast,
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
