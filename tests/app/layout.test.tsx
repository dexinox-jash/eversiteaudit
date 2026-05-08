import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
jest.mock('../../global.css', () => ({}));

import RootLayout from '@app/_layout';
import { OfflineBanner } from '@components/OfflineBanner';
import { usePreferenceStore } from '@store/usePreferenceStore';
import { usePhotoStore } from '@store/usePhotoStore';
import { runMigrations } from '@services/db';
import {
  setupQuickActions,
  subscribeToQuickActions,
  getInitialQuickAction,
} from '@services/os/shortcuts';
import {
  shouldShowBackupReminder,
  recordBackupReminderShown,
} from '@services/backup/reminderService';
import { useDeepLink } from '@hooks/useDeepLink';

jest.mock('@store/usePreferenceStore');
jest.mock('@store/usePhotoStore');
jest.mock('@services/db', () => ({
  runMigrations: jest.fn().mockResolvedValue(undefined),
  applyPendingRestore: jest.fn().mockResolvedValue(undefined),
  getDatabase: jest.fn(() => ({
    getAllSync: jest.fn(() => [
      { name: 'projects' },
      { name: 'issues' },
      { name: 'photos' },
      { name: 'annotations' },
      { name: 'templates' },
      { name: 'settings' },
      { name: 'export_history' },
    ]),
  })),
  getDatabaseAsync: jest.fn().mockResolvedValue({}),
  getDbInitPromise: jest.fn().mockReturnValue(null),
  getCurrentSchemaVersion: jest.fn().mockResolvedValue(4),
  closeDatabase: jest.fn(),
}));
jest.mock('@services/os/shortcuts');
jest.mock('@services/backup/reminderService');
jest.mock('@hooks/useDeepLink');
jest.mock('@services/auth/biometricAuth');
jest.mock('@components/OfflineBanner', () => ({
  OfflineBanner: jest.fn(() => null),
}));
jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));
jest.mock('@expo-google-fonts/poppins', () => ({
  Poppins_400Regular: 0,
  Poppins_500Medium: 0,
  Poppins_600SemiBold: 0,
  Poppins_700Bold: 0,
}));
jest.mock('@expo-google-fonts/lora', () => ({
  Lora_400Regular: 0,
  Lora_500Medium: 0,
}));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    Stack: Object.assign(
      jest.fn(({ children }: { children?: React.ReactNode }) =>
        React.createElement(View, null, children)
      ),
      { Screen: jest.fn(() => null) }
    ),
    router: {
      replace: jest.fn(),
      push: jest.fn(),
    },
    useSegments: jest.fn(() => []),
  };
});

describe('RootLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();

    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      isLoaded: true,
      hasCompletedOnboarding: true,
      biometricAuthEnabled: false,
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotos: jest.fn().mockResolvedValue(undefined),
    });

    (runMigrations as jest.Mock).mockResolvedValue(undefined);
    (setupQuickActions as jest.Mock).mockReturnValue(undefined);
    (subscribeToQuickActions as jest.Mock).mockReturnValue(jest.fn());
    (getInitialQuickAction as jest.Mock).mockReturnValue(null);

    (shouldShowBackupReminder as unknown as jest.Mock).mockResolvedValue({
      shouldShow: false,
      urgency: null,
      message: '',
    });
    (recordBackupReminderShown as jest.Mock).mockResolvedValue(undefined);

    (useDeepLink as jest.Mock).mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs migrations and sets up quick actions on mount', async () => {
    render(<RootLayout />);
    await waitFor(() => {
      expect(runMigrations).toHaveBeenCalled();
      expect(setupQuickActions).toHaveBeenCalled();
    });
  });

  it('redirects to onboarding when not completed', async () => {
    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      isLoaded: true,
      hasCompletedOnboarding: false,
      biometricAuthEnabled: false,
    });

    render(<RootLayout />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('does not redirect when onboarding is completed', async () => {
    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      isLoaded: true,
      hasCompletedOnboarding: true,
      biometricAuthEnabled: false,
    });

    render(<RootLayout />);

    await waitFor(() => {
      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  it('handles initial quick action when available', async () => {
    (getInitialQuickAction as jest.Mock).mockReturnValue({ id: 'new-issue' });

    render(<RootLayout />);

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/issues/new');
    });
  });

  it('subscribes to quick actions', async () => {
    render(<RootLayout />);
    await waitFor(() => {
      expect(subscribeToQuickActions).toHaveBeenCalled();
    });
  });

  it('renders OfflineBanner when onboarding is completed', async () => {
    render(<RootLayout />);
    await waitFor(() => {
      expect(OfflineBanner).toHaveBeenCalled();
    });
  });

  it('does not render OfflineBanner when onboarding is not completed', async () => {
    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      isLoaded: true,
      hasCompletedOnboarding: false,
      biometricAuthEnabled: false,
    });

    render(<RootLayout />);
    await waitFor(() => {
      expect(OfflineBanner).not.toHaveBeenCalled();
    });
  });
});
