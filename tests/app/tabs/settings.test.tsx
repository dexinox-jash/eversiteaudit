import React from 'react';
import { Alert } from 'react-native';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import SettingsScreen from '@app/(tabs)/settings';
import { useProjectStore } from '@store/useProjectStore';
import { useIssueStore } from '@store/useIssueStore';
import { usePhotoStore } from '@store/usePhotoStore';
import { usePreferenceStore } from '@store/usePreferenceStore';
import { useTheme } from '@components/ThemeProvider';
import {
  exportProjectToJSON,
  exportProjectToCSV,
  exportProjectToZIP,
  shareFile,
  getExportHistory,
  clearExportHistory,
} from '@services/export';
import { createBackup, restoreBackup } from '@services/backup';
import { calculateCacheSize, runFullCleanup } from '@services/storage/cacheManager';

jest.mock('@store/useProjectStore');
jest.mock('@store/useIssueStore');
jest.mock('@store/usePhotoStore');
jest.mock('@store/usePreferenceStore');

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'file:///tmp/backup.esa' }],
    })
  ),
}));

jest.mock('@components/ThemeProvider', () => ({
  useTheme: jest.fn(() => ({
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
    },
    reduceMotion: true,
    highContrast: false,
    toggleTheme: jest.fn(),
    setTheme: jest.fn(),
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@services/export', () => ({
  __esModule: true,
  exportProjectToJSON: jest.fn(),
  exportProjectToCSV: jest.fn(),
  exportProjectToZIP: jest.fn(),
  shareFile: jest.fn(),
  getExportHistory: jest.fn(async () => []),
  clearExportHistory: jest.fn(),
}));
jest.mock('@services/backup', () => ({
  createBackup: jest.fn(),
  restoreBackup: jest.fn(),
}));
jest.mock('@services/backup/reminderService', () => ({
  recordBackupCreated: jest.fn(),
}));

jest.mock('@services/storage/cacheManager', () => ({
  __esModule: true,
  calculateCacheSize: jest.fn(async () => 0),
  runFullCleanup: jest.fn(),
}));

jest.mock('lucide-react-native', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const createIcon = (name: string) => {
    const Icon = (props: object) => React.createElement(View, { ...props, testID: name });
    Icon.displayName = name;
    return Icon;
  };
  return {
    Download: createIcon('Download'),
    Upload: createIcon('Upload'),
    FileJson: createIcon('FileJson'),
    FileSpreadsheet: createIcon('FileSpreadsheet'),
    FileArchive: createIcon('FileArchive'),
    Moon: createIcon('Moon'),
    Sun: createIcon('Sun'),
    Smartphone: createIcon('Smartphone'),
    Accessibility: createIcon('Accessibility'),
    AlertTriangle: createIcon('AlertTriangle'),
    ChevronRight: createIcon('ChevronRight'),
    Database: createIcon('Database'),
    Bell: createIcon('Bell'),
    Clock: createIcon('Clock'),
    Lock: createIcon('Lock'),
    History: createIcon('History'),
    Trash2: createIcon('Trash2'),
    HardDrive: createIcon('HardDrive'),
    Globe: createIcon('Globe'),
    Timer: createIcon('Timer'),
    FileText: createIcon('FileText'),
    Import: createIcon('Import'),
  };
});

describe('SettingsScreen', () => {
  const mockSetReduceMotion = jest.fn();
  const mockSetHighContrast = jest.fn();
  const mockSetBiometricAuthEnabled = jest.fn();
  const mockSetCompanyName = jest.fn();
  const mockSetReportHeaderText = jest.fn();
  const mockSetReportFooterText = jest.fn();
  const mockSetBackupRemindersEnabled = jest.fn();
  const mockSetAutoLockTimeout = jest.fn();
  const mockSetTheme = jest.fn();
  const mockLoadProjects = jest.fn();
  const mockLoadIssues = jest.fn();
  const mockLoadPhotos = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        { id: 'proj-1', name: 'Alpha' },
        { id: 'proj-2', name: 'Beta' },
      ],
      loadProjects: mockLoadProjects,
    });
    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [],
      loadIssues: mockLoadIssues,
    });
    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotos: mockLoadPhotos,
    });
    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      theme: 'dark',
      reduceMotion: false,
      highContrast: false,
      backupRemindersEnabled: true,
      backupReminderLastShown: null,
      backupReminderPhotoCountAtLastBackup: null,
      backupReminderLastBackupDate: null,
      hasCompletedOnboarding: false,
      biometricAuthEnabled: false,
      autoLockTimeout: 5 * 60 * 1000,
      companyName: '',
      companyLogoPath: null,
      reportHeaderText: '',
      reportFooterText: '',
      setReduceMotion: mockSetReduceMotion,
      setHighContrast: mockSetHighContrast,
      setBiometricAuthEnabled: mockSetBiometricAuthEnabled,
      setAutoLockTimeout: mockSetAutoLockTimeout,
      setCompanyName: mockSetCompanyName,
      setReportHeaderText: mockSetReportHeaderText,
      setReportFooterText: mockSetReportFooterText,
      setBackupRemindersEnabled: mockSetBackupRemindersEnabled,
    });
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      themeSetting: 'dark',
      colors: {
        primary: '#4A9EFF',
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
        success: '#06D6A0',
        warning: '#FFD166',
        error: '#FF4757',
        info: '#4A9EFF',
        severity: { critical: '#FF4757', high: '#FF8C42', medium: '#FFD166', low: '#06D6A0' },
      },
      reduceMotion: false,
      highContrast: false,
      toggleTheme: jest.fn(),
      setTheme: mockSetTheme,
    });
  });

  it('renders settings screen', async () => {
    render(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeTruthy();
    });
    expect(screen.getByText('Appearance')).toBeTruthy();
    expect(screen.getByText('Accessibility & Security')).toBeTruthy();
  });

  it('invokes setTheme when a theme option is pressed', async () => {
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByLabelText('Set theme to Light')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Set theme to Light'));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('navigates to migration for backup', async () => {
    render(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Create Backup Now')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Create Backup Now'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/migration',
      params: { initialRole: 'old' },
    });
  });

  it('navigates to migration for restore', async () => {
    render(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByLabelText('Restore from backup')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Restore from backup'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/migration',
      params: { initialRole: 'new' },
    });
  });

  it('renders project chips for export', async () => {
    render(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeTruthy();
    });
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('toggles reduce motion', async () => {
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByLabelText('Reduce Motion')).toBeTruthy());
    fireEvent(screen.getByLabelText('Reduce Motion'), 'valueChange', true);
    expect(mockSetReduceMotion).toHaveBeenCalledWith(true);
  });

  it('toggles high contrast', async () => {
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByLabelText('High Contrast')).toBeTruthy());
    fireEvent(screen.getByLabelText('High Contrast'), 'valueChange', true);
    expect(mockSetHighContrast).toHaveBeenCalledWith(true);
  });

  it('toggles biometric auth', async () => {
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByLabelText('Biometric Unlock')).toBeTruthy());
    fireEvent(screen.getByLabelText('Biometric Unlock'), 'valueChange', true);
    expect(mockSetBiometricAuthEnabled).toHaveBeenCalledWith(true);
  });

  it('changes auto-lock timeout to 15 minutes', async () => {
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByText('15m')).toBeTruthy());
    fireEvent.press(screen.getByText('15m'));
    expect(mockSetAutoLockTimeout).toHaveBeenCalledWith(15 * 60 * 1000);
  });

  it('toggles backup reminders', async () => {
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByLabelText('Backup Reminders')).toBeTruthy());
    fireEvent(screen.getByLabelText('Backup Reminders'), 'valueChange', false);
    expect(mockSetBackupRemindersEnabled).toHaveBeenCalledWith(false);
  });

  it('updates company name', async () => {
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByPlaceholderText('Your company name')).toBeTruthy());
    fireEvent.changeText(screen.getByPlaceholderText('Your company name'), 'Acme Corp');
    expect(mockSetCompanyName).toHaveBeenCalledWith('Acme Corp');
  });

  it('updates report header text', async () => {
    render(<SettingsScreen />);

    await waitFor(() =>
      expect(screen.getByPlaceholderText('Text to appear at the top of PDF reports')).toBeTruthy()
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Text to appear at the top of PDF reports'),
      'Header text'
    );
    expect(mockSetReportHeaderText).toHaveBeenCalledWith('Header text');
  });

  it('updates report footer text', async () => {
    render(<SettingsScreen />);

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText('Text to appear at the bottom of PDF reports')
      ).toBeTruthy()
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Text to appear at the bottom of PDF reports'),
      'Footer text'
    );
    expect(mockSetReportFooterText).toHaveBeenCalledWith('Footer text');
  });

  it('navigates to templates when Manage Templates is pressed', async () => {
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByLabelText('Manage templates')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Manage templates'));
    expect(router.push).toHaveBeenCalledWith('/templates');
  });

  it('selects a different project from chips', async () => {
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByLabelText('Select project Beta')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Select project Beta'));
    expect(screen.getByLabelText('Select project Beta').props.accessibilityState?.selected).toBe(
      true
    );
  });

  it('exports the project as JSON', async () => {
    (exportProjectToJSON as jest.Mock).mockResolvedValue({ filePath: '/tmp/out.json' });
    (shareFile as jest.Mock).mockResolvedValue(undefined);
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByLabelText('Export as JSON')).toBeTruthy());
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Export as JSON'));
    });

    expect(exportProjectToJSON).toHaveBeenCalledWith('proj-1', undefined);
  });

  it('exports the project as CSV', async () => {
    (exportProjectToCSV as jest.Mock).mockResolvedValue({ filePath: '/tmp/out.csv' });
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByLabelText('Export as CSV')).toBeTruthy());
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Export as CSV'));
    });

    expect(exportProjectToCSV).toHaveBeenCalled();
  });

  it('exports the project as ZIP', async () => {
    (exportProjectToZIP as jest.Mock).mockResolvedValue({ filePath: '/tmp/out.zip' });
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByLabelText('Export as ZIP')).toBeTruthy());
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Export as ZIP'));
    });

    expect(exportProjectToZIP).toHaveBeenCalled();
  });

  it('passes export password when provided', async () => {
    (exportProjectToJSON as jest.Mock).mockResolvedValue({ filePath: '/tmp/out.json' });
    render(<SettingsScreen />);

    await waitFor(() =>
      expect(screen.getByPlaceholderText('Password-protect ZIP export')).toBeTruthy()
    );
    fireEvent.changeText(screen.getByPlaceholderText('Password-protect ZIP export'), 'secret');

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Export as JSON'));
    });

    expect(exportProjectToJSON).toHaveBeenCalledWith('proj-1', 'secret');
  });

  it('clears export history', async () => {
    (clearExportHistory as jest.Mock).mockResolvedValue(undefined);
    (getExportHistory as jest.Mock).mockResolvedValue([
      {
        id: 'exp-1',
        projectId: 'proj-1',
        format: 'json',
        fileName: 'test.json',
        filePath: '/tmp/test.json',
        fileSizeBytes: 1024,
        exportTimestamp: Date.now(),
        shareDestination: null,
      },
    ]);
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByText('test.json')).toBeTruthy());

    (jest.spyOn(Alert, 'alert') as unknown as jest.Mock).mockImplementation((_title: string, _message: string | undefined, buttons?: Array<{ style?: string; text?: string; onPress?: () => void }>) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Clear History'));
    });

    expect(clearExportHistory).toHaveBeenCalled();
  });

  it('clears cache', async () => {
    (runFullCleanup as jest.Mock).mockResolvedValue({ bytesFreed: 1048576 });
    (calculateCacheSize as jest.Mock).mockResolvedValue(5 * 1024 * 1024);
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByText('Clear Cache')).toBeTruthy());

    (jest.spyOn(Alert, 'alert') as unknown as jest.Mock).mockImplementation((_title: string, _message: string | undefined, buttons?: Array<{ style?: string; text?: string; onPress?: () => void }>) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Clear Cache'));
    });

    expect(runFullCleanup).toHaveBeenCalled();
  });

  it('shows Too short meter and disables Create when passphrase is under 12 chars', async () => {
    render(<SettingsScreen />);

    await waitFor(() =>
      expect(screen.getByPlaceholderText('Enter a strong passphrase (min 12 chars)')).toBeTruthy()
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Enter a strong passphrase (min 12 chars)'),
      'short'
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Passphrase strength: Too short')).toBeTruthy();
    });

    // Create button is disabled while the passphrase is too short, so no
    // backup is attempted even if the user taps it.
    await act(async () => {
      fireEvent.press(screen.getByText('Create Encrypted Backup'));
    });
    expect(createBackup).not.toHaveBeenCalled();
  });

  it('creates legacy backup with valid passphrase', async () => {
    (createBackup as jest.Mock).mockResolvedValue({ fileSizeBytes: 2048 });
    render(<SettingsScreen />);

    await waitFor(() =>
      expect(screen.getByPlaceholderText('Enter a strong passphrase (min 12 chars)')).toBeTruthy()
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Enter a strong passphrase (min 12 chars)'),
      'strongPass1234'
    );

    await act(async () => {
      fireEvent.press(screen.getByText('Create Encrypted Backup'));
    });

    expect(createBackup).toHaveBeenCalledWith('strongPass1234');
  });

  it('opens legacy restore modal', async () => {
    render(<SettingsScreen />);

    await waitFor(() => {
      const buttons = screen.getAllByText('Restore from Backup');
      expect(buttons.length).toBeGreaterThan(0);
    });

    const buttons = screen.getAllByText('Restore from Backup');
    fireEvent.press(buttons[buttons.length - 1]!);

    await waitFor(() => expect(screen.getByText('Restore Backup')).toBeTruthy());
  });

  it('closes legacy restore modal with cancel', async () => {
    render(<SettingsScreen />);

    await waitFor(() =>
      expect(screen.getAllByText('Restore from Backup').length).toBeGreaterThan(0)
    );
    const buttons = screen.getAllByText('Restore from Backup');
    fireEvent.press(buttons[buttons.length - 1]!);

    await waitFor(() => expect(screen.getByText('Restore Backup')).toBeTruthy());
    fireEvent.press(screen.getByText('Cancel'));

    await waitFor(() => expect(screen.queryByText('Restore Backup')).toBeNull());
  });

  it('performs legacy restore from modal with path and passphrase', async () => {
    (restoreBackup as jest.Mock).mockResolvedValue({
      success: true,
      errors: [],
      extractedPhotosCount: 5,
    });
    render(<SettingsScreen />);

    await waitFor(() =>
      expect(screen.getAllByText('Restore from Backup').length).toBeGreaterThan(0)
    );
    const buttons = screen.getAllByText('Restore from Backup');
    fireEvent.press(buttons[buttons.length - 1]!);

    await waitFor(() => expect(screen.getByText('Restore Backup')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Select backup file'));
    });

    fireEvent.changeText(screen.getByPlaceholderText('Enter backup passphrase'), 'restorePass1234');

    await act(async () => {
      fireEvent.press(screen.getByText('Restore'));
    });

    expect(restoreBackup).toHaveBeenCalledWith('file:///tmp/backup.esa', 'restorePass1234');
  });

  it('shows error when legacy restore missing input', async () => {
    render(<SettingsScreen />);

    await waitFor(() =>
      expect(screen.getAllByText('Restore from Backup').length).toBeGreaterThan(0)
    );
    const buttons = screen.getAllByText('Restore from Backup');
    fireEvent.press(buttons[buttons.length - 1]!);

    await waitFor(() => expect(screen.getByText('Restore Backup')).toBeTruthy());

    fireEvent.press(screen.getByText('Restore'));

    const errorToast = await screen.findByText(
      'Please enter both backup path and passphrase.',
      { includeHiddenElements: true },
      { timeout: 3000 }
    );
    expect(errorToast).toBeTruthy();
  });
});
