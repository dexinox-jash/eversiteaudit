import { settingsRepository } from '@services/db/repositories';
import type { SettingValueType } from '@/types/domain';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface AppPreferences {
  theme: ThemePreference;
  reduceMotion: boolean;
  highContrast: boolean;
  backupRemindersEnabled: boolean;
  backupReminderLastShown: number | null;
  backupReminderPhotoCountAtLastBackup: number | null;
  backupReminderLastBackupDate: number | null;
  hasCompletedOnboarding: boolean;
  biometricAuthEnabled: boolean;
  autoLockTimeout: number;
  inspectorName: string | null;
  inspectorCompany: string | null;
  companyName: string | null;
  companyLogoPath: string | null;
  reportHeaderText: string | null;
  reportFooterText: string | null;
  lastPdfReportTemplate: string | null;
}

const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'system',
  reduceMotion: false,
  highContrast: false,
  backupRemindersEnabled: true,
  backupReminderLastShown: null,
  backupReminderPhotoCountAtLastBackup: null,
  backupReminderLastBackupDate: null,
  hasCompletedOnboarding: false,
  biometricAuthEnabled: false,
  autoLockTimeout: 15 * 60 * 1000,
  inspectorName: null,
  inspectorCompany: null,
  companyName: null,
  companyLogoPath: null,
  reportHeaderText: null,
  reportFooterText: null,
  lastPdfReportTemplate: null,
};

const KEYS: Record<keyof AppPreferences, string> = {
  theme: 'pref/theme',
  reduceMotion: 'pref/reduceMotion',
  highContrast: 'pref/highContrast',
  backupRemindersEnabled: 'pref/backupRemindersEnabled',
  backupReminderLastShown: 'pref/backupReminderLastShown',
  backupReminderPhotoCountAtLastBackup: 'pref/backupReminderPhotoCountAtLastBackup',
  backupReminderLastBackupDate: 'pref/backupReminderLastBackupDate',
  hasCompletedOnboarding: 'pref/hasCompletedOnboarding',
  biometricAuthEnabled: 'pref/biometricAuthEnabled',
  autoLockTimeout: 'pref/autoLockTimeout',
  inspectorName: 'pref/inspectorName',
  inspectorCompany: 'pref/inspectorCompany',
  companyName: 'pref/companyName',
  companyLogoPath: 'pref/companyLogoPath',
  reportHeaderText: 'pref/reportHeaderText',
  reportFooterText: 'pref/reportFooterText',
  lastPdfReportTemplate: 'pref/lastPdfReportTemplate',
};

function parseValue<T>(value: string | null, defaultValue: T, type: SettingValueType): T {
  if (value === null) return defaultValue;
  switch (type) {
    case 'bool':
      return (value === 'true') as unknown as T;
    case 'int':
    case 'double': {
      const num = Number(value);
      return (Number.isNaN(num) ? defaultValue : num) as unknown as T;
    }
    case 'string':
    default:
      return value as unknown as T;
  }
}

async function getSetting<T>(
  key: string,
  defaultValue: T,
  type: SettingValueType = 'string'
): Promise<T> {
  const setting = await settingsRepository.get(key);
  if (setting?.value == null) return defaultValue;
  return parseValue(setting.value, defaultValue, type);
}

/** Load Preferences. */
export async function loadPreferences(): Promise<AppPreferences> {
  const prefs: AppPreferences = {
    theme: await getSetting<ThemePreference>(KEYS.theme, DEFAULT_PREFERENCES.theme, 'string'),
    reduceMotion: await getSetting<boolean>(
      KEYS.reduceMotion,
      DEFAULT_PREFERENCES.reduceMotion,
      'bool'
    ),
    highContrast: await getSetting<boolean>(
      KEYS.highContrast,
      DEFAULT_PREFERENCES.highContrast,
      'bool'
    ),
    backupRemindersEnabled: await getSetting<boolean>(
      KEYS.backupRemindersEnabled,
      DEFAULT_PREFERENCES.backupRemindersEnabled,
      'bool'
    ),
    backupReminderLastShown: await getSetting<number | null>(
      KEYS.backupReminderLastShown,
      DEFAULT_PREFERENCES.backupReminderLastShown,
      'int'
    ),
    backupReminderPhotoCountAtLastBackup: await getSetting<number | null>(
      KEYS.backupReminderPhotoCountAtLastBackup,
      DEFAULT_PREFERENCES.backupReminderPhotoCountAtLastBackup,
      'int'
    ),
    backupReminderLastBackupDate: await getSetting<number | null>(
      KEYS.backupReminderLastBackupDate,
      DEFAULT_PREFERENCES.backupReminderLastBackupDate,
      'int'
    ),
    hasCompletedOnboarding: await getSetting<boolean>(
      KEYS.hasCompletedOnboarding,
      DEFAULT_PREFERENCES.hasCompletedOnboarding,
      'bool'
    ),
    biometricAuthEnabled: await getSetting<boolean>(
      KEYS.biometricAuthEnabled,
      DEFAULT_PREFERENCES.biometricAuthEnabled,
      'bool'
    ),
    autoLockTimeout: await getSetting<number>(
      KEYS.autoLockTimeout,
      DEFAULT_PREFERENCES.autoLockTimeout,
      'int'
    ),
    inspectorName: await getSetting<string | null>(
      KEYS.inspectorName,
      DEFAULT_PREFERENCES.inspectorName,
      'string'
    ),
    inspectorCompany: await getSetting<string | null>(
      KEYS.inspectorCompany,
      DEFAULT_PREFERENCES.inspectorCompany,
      'string'
    ),
    companyName: await getSetting<string | null>(
      KEYS.companyName,
      DEFAULT_PREFERENCES.companyName,
      'string'
    ),
    companyLogoPath: await getSetting<string | null>(
      KEYS.companyLogoPath,
      DEFAULT_PREFERENCES.companyLogoPath,
      'string'
    ),
    reportHeaderText: await getSetting<string | null>(
      KEYS.reportHeaderText,
      DEFAULT_PREFERENCES.reportHeaderText,
      'string'
    ),
    reportFooterText: await getSetting<string | null>(
      KEYS.reportFooterText,
      DEFAULT_PREFERENCES.reportFooterText,
      'string'
    ),
    lastPdfReportTemplate: await getSetting<string | null>(
      KEYS.lastPdfReportTemplate,
      DEFAULT_PREFERENCES.lastPdfReportTemplate,
      'string'
    ),
  };
  return prefs;
}

/** Save Preferences. */
export async function savePreferences(preferences: AppPreferences): Promise<void> {
  await settingsRepository.set(KEYS.theme, preferences.theme, 'string');
  await settingsRepository.set(KEYS.reduceMotion, String(preferences.reduceMotion), 'bool');
  await settingsRepository.set(KEYS.highContrast, String(preferences.highContrast), 'bool');
  await settingsRepository.set(
    KEYS.backupRemindersEnabled,
    String(preferences.backupRemindersEnabled),
    'bool'
  );
  await settingsRepository.set(
    KEYS.backupReminderLastShown,
    preferences.backupReminderLastShown !== null
      ? String(preferences.backupReminderLastShown)
      : null,
    'int'
  );
  await settingsRepository.set(
    KEYS.backupReminderPhotoCountAtLastBackup,
    preferences.backupReminderPhotoCountAtLastBackup !== null
      ? String(preferences.backupReminderPhotoCountAtLastBackup)
      : null,
    'int'
  );
  await settingsRepository.set(
    KEYS.backupReminderLastBackupDate,
    preferences.backupReminderLastBackupDate !== null
      ? String(preferences.backupReminderLastBackupDate)
      : null,
    'int'
  );
  await settingsRepository.set(
    KEYS.hasCompletedOnboarding,
    String(preferences.hasCompletedOnboarding),
    'bool'
  );
  await settingsRepository.set(
    KEYS.biometricAuthEnabled,
    String(preferences.biometricAuthEnabled),
    'bool'
  );
  await settingsRepository.set(KEYS.autoLockTimeout, String(preferences.autoLockTimeout), 'int');
  await settingsRepository.set(KEYS.inspectorName, preferences.inspectorName, 'string');
  await settingsRepository.set(KEYS.inspectorCompany, preferences.inspectorCompany, 'string');
  await settingsRepository.set(KEYS.companyName, preferences.companyName, 'string');
  await settingsRepository.set(KEYS.companyLogoPath, preferences.companyLogoPath, 'string');
  await settingsRepository.set(KEYS.reportHeaderText, preferences.reportHeaderText, 'string');
  await settingsRepository.set(KEYS.reportFooterText, preferences.reportFooterText, 'string');
  await settingsRepository.set(
    KEYS.lastPdfReportTemplate,
    preferences.lastPdfReportTemplate,
    'string'
  );
}
