import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { colors, type ColorTheme, type ColorTokens } from '@theme/colors';

interface ThemeContextValue {
  theme: ColorTheme;
  colors: ColorTokens;
  toggleTheme: () => void;
  setTheme: (theme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ColorTheme;
}

export function ThemeProvider({ children, defaultTheme = 'dark' }: ThemeProviderProps): JSX.Element {
  useColorScheme();
  const [theme, setThemeState] = useState<ColorTheme>(defaultTheme);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((newTheme: ColorTheme) => {
    setThemeState(newTheme);
  }, []);

  const value: ThemeContextValue = {
    theme,
    colors: colors[theme],
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
