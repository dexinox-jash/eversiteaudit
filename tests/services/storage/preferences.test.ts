jest.mock('@services/db/repositories', () => {
  const mockGet = jest.fn();
  const mockSet = jest.fn();
  return {
    __esModule: true,
    settingsRepository: {
      get: mockGet,
      set: mockSet,
    },
    _mockInternals: { mockGet, mockSet },
  };
});

import {
  loadPreferences,
  savePreferences,
  type AppPreferences,
} from '@services/storage/preferences';

const { _mockInternals } = jest.requireMock('@services/db/repositories') as {
  _mockInternals: {
    mockGet: jest.Mock;
    mockSet: jest.Mock;
  };
};

describe('preferences storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _mockInternals.mockGet.mockResolvedValue(null);
    _mockInternals.mockSet.mockResolvedValue(undefined);
  });

  it('returns default preferences when no settings exist', async () => {
    const prefs = await loadPreferences();
    expect(prefs.theme).toBe('system');
    expect(prefs.reduceMotion).toBe(false);
    expect(prefs.highContrast).toBe(false);
    expect(prefs.autoLockTimeout).toBe(15 * 60 * 1000);
  });

  it('loads saved preferences from settings repository', async () => {
    const stored: AppPreferences = {
      theme: 'light',
      reduceMotion: true,
      highContrast: true,
      backupRemindersEnabled: true,
      backupReminderLastShown: null,
      backupReminderPhotoCountAtLastBackup: null,
      backupReminderLastBackupDate: null,
      hasCompletedOnboarding: false,
      biometricAuthEnabled: false,
      autoLockTimeout: 15 * 60 * 1000,
      companyName: null,
      companyLogoPath: null,
      reportHeaderText: null,
      reportFooterText: null,
      inspectorName: null,
      inspectorCompany: null,
      lastPdfReportTemplate: null,
    };

    _mockInternals.mockGet.mockImplementation(async (key: string) => {
      const map: Record<string, string | null> = {
        'pref/theme': stored.theme,
        'pref/reduceMotion': String(stored.reduceMotion),
        'pref/highContrast': String(stored.highContrast),
        'pref/backupRemindersEnabled': String(stored.backupRemindersEnabled),
        'pref/backupReminderLastShown':
          stored.backupReminderLastShown !== null ? String(stored.backupReminderLastShown) : null,
        'pref/backupReminderPhotoCountAtLastBackup':
          stored.backupReminderPhotoCountAtLastBackup !== null
            ? String(stored.backupReminderPhotoCountAtLastBackup)
            : null,
        'pref/backupReminderLastBackupDate':
          stored.backupReminderLastBackupDate !== null
            ? String(stored.backupReminderLastBackupDate)
            : null,
        'pref/hasCompletedOnboarding': String(stored.hasCompletedOnboarding),
        'pref/biometricAuthEnabled': String(stored.biometricAuthEnabled),
        'pref/autoLockTimeout': String(stored.autoLockTimeout),
        'pref/companyName': stored.companyName,
        'pref/companyLogoPath': stored.companyLogoPath,
        'pref/reportHeaderText': stored.reportHeaderText,
        'pref/reportFooterText': stored.reportFooterText,
        'pref/lastPdfReportTemplate': stored.lastPdfReportTemplate,
      };
      const value = map[key];
      if (value === undefined) return null;
      return { key, value, valueType: 'string', updatedAt: Date.now() };
    });

    const prefs = await loadPreferences();
    expect(prefs).toEqual(stored);
  });

  it('saves preferences to settings repository', async () => {
    const prefs: AppPreferences = {
      theme: 'dark',
      reduceMotion: true,
      highContrast: false,
      backupRemindersEnabled: true,
      backupReminderLastShown: null,
      backupReminderPhotoCountAtLastBackup: null,
      backupReminderLastBackupDate: null,
      hasCompletedOnboarding: false,
      biometricAuthEnabled: false,
      autoLockTimeout: 15 * 60 * 1000,
      companyName: null,
      companyLogoPath: null,
      reportHeaderText: null,
      reportFooterText: null,
      inspectorName: null,
      inspectorCompany: null,
      lastPdfReportTemplate: null,
    };

    await savePreferences(prefs);
    expect(_mockInternals.mockSet).toHaveBeenCalledWith('pref/theme', 'dark', 'string');
    expect(_mockInternals.mockSet).toHaveBeenCalledWith('pref/reduceMotion', 'true', 'bool');
    expect(_mockInternals.mockSet).toHaveBeenCalledWith('pref/highContrast', 'false', 'bool');
    expect(_mockInternals.mockSet).toHaveBeenCalledWith(
      'pref/autoLockTimeout',
      String(15 * 60 * 1000),
      'int'
    );
  });

  it('falls back to default for invalid numeric values', async () => {
    _mockInternals.mockGet.mockImplementation(async (key: string) => {
      if (key === 'pref/autoLockTimeout') {
        return { key, value: 'not-a-number', valueType: 'int' };
      }
      return null;
    });

    const prefs = await loadPreferences();
    expect(prefs.autoLockTimeout).toBe(15 * 60 * 1000);
  });

  it('falls back to default when stored value is null', async () => {
    _mockInternals.mockGet.mockImplementation(async (key: string) => {
      if (key === 'pref/theme') {
        return { key, value: null, valueType: 'string' };
      }
      return null;
    });

    const prefs = await loadPreferences();
    expect(prefs.theme).toBe('system');
  });

  it('saves non-null backup reminder values', async () => {
    const prefs: AppPreferences = {
      theme: 'dark',
      reduceMotion: true,
      highContrast: false,
      backupRemindersEnabled: true,
      backupReminderLastShown: 12345,
      backupReminderPhotoCountAtLastBackup: 10,
      backupReminderLastBackupDate: 67890,
      hasCompletedOnboarding: false,
      biometricAuthEnabled: false,
      autoLockTimeout: 15 * 60 * 1000,
      companyName: null,
      companyLogoPath: null,
      reportHeaderText: null,
      reportFooterText: null,
      inspectorName: null,
      inspectorCompany: null,
      lastPdfReportTemplate: null,
    };

    await savePreferences(prefs);
    expect(_mockInternals.mockSet).toHaveBeenCalledWith(
      'pref/backupReminderLastShown',
      '12345',
      'int'
    );
    expect(_mockInternals.mockSet).toHaveBeenCalledWith(
      'pref/backupReminderPhotoCountAtLastBackup',
      '10',
      'int'
    );
    expect(_mockInternals.mockSet).toHaveBeenCalledWith(
      'pref/backupReminderLastBackupDate',
      '67890',
      'int'
    );
  });
});
