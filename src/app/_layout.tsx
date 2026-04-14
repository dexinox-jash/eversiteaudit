import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@components/ThemeProvider';
import { runMigrations } from '@services/db';

/**
 * Root layout for EverSiteAudit.
 * Provides global providers: SafeArea, Theme, and Navigation stack.
 * Initializes the local database on mount.
 */
export default function RootLayout(): JSX.Element {
  useEffect(() => {
    runMigrations();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider defaultTheme="dark">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
