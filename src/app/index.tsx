import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Root entry point for the EverSiteAudit mobile application.
 * This will evolve into the main router/layout as navigation is implemented.
 */
export default function RootLayout(): JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>EverSiteAudit</Text>
        <Text style={styles.subtitle}>AAA-Grade Mobile App</Text>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9f5',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#141413',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#b0aea5',
  },
});
