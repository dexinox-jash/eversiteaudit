import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@components/ThemeProvider';

/**
 * Root layout for EverSiteAudit.
 * Provides global providers: SafeArea, Theme, and Navigation stack.
 */
export default function RootLayout(): JSX.Element {
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
