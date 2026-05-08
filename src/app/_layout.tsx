import '../polyfills';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable, AppState, Linking } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Lora_400Regular, Lora_500Medium } from '@expo-google-fonts/lora';
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider, useTheme } from '@components/ThemeProvider';
import '../../global.css';
import { Toast } from '@components/Toast';
import { Typography } from '@components/Typography';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { OfflineBanner } from '@components/OfflineBanner';

import { getDatabase, applyPendingRestore, runMigrations } from '@services/db';
import {
  setupQuickActions,
  subscribeToQuickActions,
  getInitialQuickAction,
} from '@services/os/shortcuts';
import { useDeepLink } from '@hooks/useDeepLink';
import {
  shouldShowBackupReminder,
  recordBackupReminderShown,
} from '@services/backup/reminderService';
import { usePhotoStore } from '@store/usePhotoStore';
import { usePreferenceStore } from '@store/usePreferenceStore';
import { spacing } from '@theme/index';
import {
  authenticateWithBiometricsAsync,
  isBiometricAvailableAsync,
} from '@services/auth/biometricAuth';
import { loadPreferences } from '@services/storage/preferences';

interface BackupReminderBannerProps {
  forcedReminder?: { message: string; urgency: 'normal' | 'urgent' } | null;
  onForcedDismiss?: () => void;
}

function ThemedStatusBar(): JSX.Element {
  const { theme } = useTheme();
  const isLight = theme === 'light' || theme === 'highContrastLight';
  return <StatusBar style={isLight ? 'dark' : 'light'} />;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function BackupReminderBanner({
  forcedReminder,
  onForcedDismiss,
}: BackupReminderBannerProps): JSX.Element | null {
  const { colors } = useTheme();
  const { photos, loadPhotos } = usePhotoStore();
  const [reminder, setReminder] = useState<{
    message: string;
    urgency: 'normal' | 'urgent';
  } | null>(forcedReminder ?? null);

  useEffect(() => {
    if (forcedReminder) {
      setReminder(forcedReminder);
      return;
    }

    let mounted = true;

    const checkReminder = async (): Promise<void> => {
      await loadPhotos();
      if (!mounted) return;
      const result = await shouldShowBackupReminder(photos.length);
      if (result.shouldShow && result.message) {
        setReminder({ message: result.message, urgency: result.urgency ?? 'normal' });
        await recordBackupReminderShown();
      }
    };

    const timer = setTimeout(() => {
      void checkReminder();
    }, 1500);

    return (): void => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [forcedReminder, loadPhotos, photos.length]);

  const handleDismiss = useCallback((): void => {
    onForcedDismiss?.();
    setReminder(null);
  }, [onForcedDismiss]);

  const handleBackupNow = useCallback((): void => {
    onForcedDismiss?.();
    setReminder(null);
    router.push('/migration');
  }, [onForcedDismiss]);

  if (!reminder) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: reminder.urgency === 'urgent' ? colors.error : colors.warning,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`Backup reminder: ${reminder.message}`}
      accessibilityLiveRegion="polite"
    >
      <Typography
        variant="body"
        color="primary"
        style={[
          styles.bannerText,
          { color: reminder.urgency === 'urgent' ? colors.primaryForeground : colors.textPrimary },
        ]}
      >
        {reminder.message}
      </Typography>
      <View style={styles.bannerActions}>
        <Pressable
          onPress={handleBackupNow}
          style={styles.bannerButton}
          accessibilityRole="button"
          accessibilityLabel="Backup now"
        >
          <Typography
            variant="body"
            weight="semibold"
            style={{
              color: reminder.urgency === 'urgent' ? colors.primaryForeground : colors.textPrimary,
            }}
          >
            Backup Now
          </Typography>
        </Pressable>
        <Pressable
          onPress={handleDismiss}
          style={styles.bannerButton}
          accessibilityRole="button"
          accessibilityLabel="Dismiss reminder"
        >
          <Typography
            variant="body"
            style={{
              color:
                reminder.urgency === 'urgent'
                  ? hexToRgba(colors.primaryForeground, 0.8)
                  : colors.textSecondary,
            }}
          >
            Dismiss
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}

function handleQuickActionRoute(actionId: string): void {
  switch (actionId) {
    case 'new-project':
    case 'start-new-audit':
      router.push('/projects/new');
      break;
    case 'new-issue':
      router.push('/issues/new');
      break;
    case 'open-camera':
      router.push('/camera');
      break;
    default:
      break;
  }
}

/**
 * Root layout for EverSiteAudit.
 * Provides global providers: SafeArea, Theme, and Navigation stack.
 * Initializes the local database on mount.
 * Configures deep linking and OS integrations.
 */

/**
 * Startup health gate that verifies all expected database tables exist before
 * rendering the app. If any are missing, it shows a full-screen indicator and
 * triggers migration recovery. Only renders children once the health check passes.
 */
function DatabaseHealthGate({ children }: { children: React.ReactNode }): JSX.Element {
  const { colors } = useTheme();
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const checkHealth = useCallback(async (): Promise<void> => {
    setDbError(null);
    try {
      await applyPendingRestore();
      const db = getDatabase();
      const tables = db.getAllSync<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type='table'`
      );
      const expectedTables = [
        'projects',
        'issues',
        'photos',
        'annotations',
        'templates',
        'settings',
        'export_history',
      ];
      const existingNames = new Set(tables.map((t: { name: string }) => t.name));
      const missing = expectedTables.filter((t) => !existingNames.has(t));

      if (missing.length > 0) {
        console.warn('[DatabaseHealthGate] Missing tables detected, triggering recovery:', missing);
        await runMigrations(db);
      }

      setDbReady(true);
    } catch (err) {
      console.error('[DatabaseHealthGate] Database health check failed:', err);
      setDbError(err instanceof Error ? err.message : 'Database initialization failed');
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  if (dbError) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing['6'],
          },
        ]}
      >
        <Typography
          variant="headingMd"
          accessibilityRole="header"
          color="primary"
          style={{ textAlign: 'center', marginBottom: spacing['3'] }}
        >
          Database Error
        </Typography>
        <Typography
          variant="body"
          color="secondary"
          style={{ textAlign: 'center', marginBottom: spacing['6'] }}
        >
          {dbError}
        </Typography>
        <Pressable
          onPress={() => {
            void checkHealth();
          }}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingVertical: spacing['3'],
            paddingHorizontal: spacing['6'],
            minHeight: 44,
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Retry database initialization"
        >
          <Typography variant="body" weight="semibold" style={{ color: colors.primaryForeground }}>
            Retry
          </Typography>
        </Pressable>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Typography variant="headingMd" accessibilityRole="header" color="primary">
          Initializing database...
        </Typography>
      </View>
    );
  }

  return <>{children}</>;
}

export function BiometricGate({ children }: { children: React.ReactNode }): JSX.Element {
  const { colors } = useTheme();
  const {
    biometricAuthEnabled,
    isLoaded,
    hasCompletedOnboarding,
    autoLockTimeout,
    setBiometricAuthEnabled,
  } = usePreferenceStore();
  const [authenticated, setAuthenticated] = useState(false);
  const [, setLocked] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(true);
  const appState = useRef(AppState.currentState);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoaded || !biometricAuthEnabled || !hasCompletedOnboarding) return;
    let mounted = true;
    const doAuth = async (): Promise<void> => {
      const available = await isBiometricAvailableAsync();
      if (!mounted) return;
      setBiometricAvailable(available);
      if (!available) {
        setLocked(true);
        return;
      }
      const success = await authenticateWithBiometricsAsync();
      if (mounted) {
        setAuthenticated(success);
        setLocked(!success);
      }
    };
    void doAuth();
    return (): void => {
      mounted = false;
    };
  }, [isLoaded, biometricAuthEnabled, hasCompletedOnboarding]);

  useEffect(() => {
    if (!isLoaded || !biometricAuthEnabled || !hasCompletedOnboarding) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const wasActive = appState.current === 'active';
      const isBackgroundOrInactive = nextAppState === 'background' || nextAppState === 'inactive';
      const isActive = nextAppState === 'active';

      if (wasActive && isBackgroundOrInactive) {
        backgroundedAt.current = Date.now();
      }

      if (isActive && backgroundedAt.current != null) {
        const elapsed = Date.now() - backgroundedAt.current;
        if (elapsed >= autoLockTimeout) {
          setLocked(true);
          setAuthenticated(false);
          void authenticateWithBiometricsAsync().then((success) => {
            setAuthenticated(success);
            setLocked(!success);
          });
        }
        backgroundedAt.current = null;
      }

      appState.current = nextAppState;
    });

    return (): void => {
      subscription.remove();
    };
  }, [isLoaded, biometricAuthEnabled, hasCompletedOnboarding, autoLockTimeout]);

  if (!isLoaded || !biometricAuthEnabled || !hasCompletedOnboarding || authenticated) {
    return <>{children}</>;
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing['6'],
        },
      ]}
    >
      <Typography
        variant="headingMd"
        accessibilityRole="header"
        color="primary"
        style={{ textAlign: 'center', marginBottom: spacing['2'] }}
      >
        {biometricAvailable ? 'Locked' : 'Biometrics Unavailable'}
      </Typography>
      <Typography
        variant="body"
        color="secondary"
        style={{ textAlign: 'center', marginBottom: spacing['6'] }}
      >
        {biometricAvailable
          ? 'Authentication is required to access EverSiteAudit.'
          : 'Biometric authentication is no longer available on this device. You can open Settings to re-enable it, or disable biometric lock to continue.'}
      </Typography>
      <View style={{ gap: spacing['3'] }}>
        {biometricAvailable ? (
          <Pressable
            onPress={() => {
              void authenticateWithBiometricsAsync().then((success) => {
                setAuthenticated(success);
                setLocked(!success);
              });
            }}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 8,
              paddingVertical: spacing['3'],
              paddingHorizontal: spacing['6'],
              minHeight: 44,
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Unlock with biometrics"
          >
            <Typography
              variant="body"
              weight="semibold"
              style={{ color: colors.primaryForeground }}
            >
              Unlock with Biometrics
            </Typography>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            void Linking.openSettings();
          }}
          style={{
            backgroundColor: colors.secondary,
            borderRadius: 8,
            paddingVertical: spacing['3'],
            paddingHorizontal: spacing['6'],
            minHeight: 44,
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Open device settings"
        >
          <Typography
            variant="body"
            weight="semibold"
            style={{ color: colors.secondaryForeground }}
          >
            Open Settings
          </Typography>
        </Pressable>
        <Pressable
          onPress={() => {
            void setBiometricAuthEnabled(false);
          }}
          style={{
            borderRadius: 8,
            paddingVertical: spacing['3'],
            paddingHorizontal: spacing['6'],
            minHeight: 44,
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Disable biometric lock"
        >
          <Typography variant="body" color="tertiary">
            Disable Biometric Lock
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout(): JSX.Element {
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'Lora-Regular': Lora_400Regular,
    'Lora-Medium': Lora_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const [deepLinkError, setDeepLinkError] = useState<string | null>(null);
  const [backupBanner, setBackupBanner] = useState<{
    message: string;
    urgency: 'normal' | 'urgent';
  } | null>(null);
  const { isLoaded, hasCompletedOnboarding } = usePreferenceStore();
  const quickActionHandled = useRef(false);

  useEffect(() => {
    const init = async (): Promise<void> => {
      await runMigrations(getDatabase());
      setupQuickActions();
    };
    void init();
  }, []);

  useEffect(() => {
    if (!isLoaded || !hasCompletedOnboarding) return;
    const checkBackupAge = async (): Promise<void> => {
      const prefs = await loadPreferences();
      if (prefs.backupReminderLastBackupDate) {
        const daysSince = Math.floor(
          (Date.now() - prefs.backupReminderLastBackupDate) / (24 * 60 * 60 * 1000)
        );
        if (daysSince > 30) {
          setBackupBanner({
            message: `It's been ${daysSince} days since your last backup. Protect your data.`,
            urgency: daysSince >= 60 ? 'urgent' : 'normal',
          });
        }
      }
    };
    void checkBackupAge();
  }, [isLoaded, hasCompletedOnboarding]);

  useEffect(() => {
    if (isLoaded && !hasCompletedOnboarding) {
      router.replace('/onboarding');
    }
  }, [isLoaded, hasCompletedOnboarding]);

  useEffect(() => {
    if (!isLoaded || !hasCompletedOnboarding || quickActionHandled.current) return;
    const initialAction = getInitialQuickAction();
    if (initialAction?.id) {
      quickActionHandled.current = true;
      handleQuickActionRoute(initialAction.id);
    }
  }, [isLoaded, hasCompletedOnboarding]);

  useEffect(() => {
    if (!isLoaded || !hasCompletedOnboarding) return;
    const unsubscribe = subscribeToQuickActions((action) => {
      if (action.id) {
        handleQuickActionRoute(action.id);
      }
    });
    return unsubscribe;
  }, [isLoaded, hasCompletedOnboarding]);

  useDeepLink({
    onError: (_url, reason) => {
      setDeepLinkError(reason);
    },
  });

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <ThemeProvider defaultTheme="dark">
          <DatabaseHealthGate>
            <BiometricGate>
              <ErrorBoundary>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="projects/[id]" />
                  <Stack.Screen name="issues/[id]" />
                  <Stack.Screen name="photos/[id]" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="templates/index" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="export/index" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="migration/index" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="import/index" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="camera" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="photos/annotate/[id]" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="issues/edit/[id]" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="projects/new" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="issues/new" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="trash/index" options={{ presentation: 'modal' }} />
                </Stack>
              </ErrorBoundary>
              {isLoaded && hasCompletedOnboarding && <OfflineBanner />}

              <ThemedStatusBar />

              <BackupReminderBanner
                forcedReminder={backupBanner}
                onForcedDismiss={() => setBackupBanner(null)}
              />

              {deepLinkError ? (
                <Toast
                  message={`Deep link error: ${deepLinkError}`}
                  variant="error"
                  onDismiss={() => setDeepLinkError(null)}
                />
              ) : null}
            </BiometricGate>
          </DatabaseHealthGate>
        </ThemeProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: spacing['10'],
    paddingHorizontal: spacing['4'],
    paddingBottom: spacing['3'],
    zIndex: 100,
  },
  bannerText: {
    textAlign: 'center',
    marginBottom: spacing['2'],
  },
  bannerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing['4'],
  },
  bannerButton: {
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['3'],
    minHeight: 44,
    justifyContent: 'center',
  },
});
