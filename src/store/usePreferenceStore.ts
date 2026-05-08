import { create } from 'zustand';
import type { AppPreferences, ThemePreference } from '@services/storage/preferences';
import { loadPreferences, savePreferences } from '@services/storage/preferences';

export interface PreferenceStoreState extends AppPreferences {
  isLoading: boolean;
  isLoaded: boolean;
}

export interface PreferenceStoreActions {
  load: () => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setReduceMotion: (value: boolean) => Promise<void>;
  setHighContrast: (value: boolean) => Promise<void>;
  setBackupRemindersEnabled: (value: boolean) => Promise<void>;
  setBackupReminderLastShown: (timestamp: number) => Promise<void>;
  setBackupReminderPhotoCountAtLastBackup: (count: number) => Promise<void>;
  setBackupReminderLastBackupDate: (timestamp: number) => Promise<void>;
  setHasCompletedOnboarding: (value: boolean) => Promise<void>;
  setBiometricAuthEnabled: (value: boolean) => Promise<void>;
  setAutoLockTimeout: (value: number) => Promise<void>;
  setCompanyName: (value: string | null) => Promise<void>;
  setCompanyLogoPath: (value: string | null) => Promise<void>;
  setInspectorName: (value: string | null) => Promise<void>;
  setInspectorCompany: (value: string | null) => Promise<void>;
  setReportHeaderText: (value: string | null) => Promise<void>;
  setReportFooterText: (value: string | null) => Promise<void>;
  setLastPdfReportTemplate: (value: string | null) => Promise<void>;
}

export type PreferenceStore = PreferenceStoreState & PreferenceStoreActions;

export const usePreferenceStore = create<PreferenceStore>((set, get) => ({
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
  isLoading: false,
  isLoaded: false,

  load: async (): Promise<void> => {
    set({ isLoading: true });
    try {
      const prefs = await loadPreferences();
      set({ ...prefs, isLoading: false, isLoaded: true });
    } catch {
      set({ isLoading: false, isLoaded: true });
    }
  },

  setTheme: async (theme: ThemePreference): Promise<void> => {
    const next = { ...get(), theme };
    set(next);
    await savePreferences(next);
  },

  setReduceMotion: async (value: boolean): Promise<void> => {
    const next = { ...get(), reduceMotion: value };
    set(next);
    await savePreferences(next);
  },

  setHighContrast: async (value: boolean): Promise<void> => {
    const next = { ...get(), highContrast: value };
    set(next);
    await savePreferences(next);
  },

  setBackupRemindersEnabled: async (value: boolean): Promise<void> => {
    const next = { ...get(), backupRemindersEnabled: value };
    set(next);
    await savePreferences(next);
  },

  setBackupReminderLastShown: async (timestamp: number): Promise<void> => {
    const next = { ...get(), backupReminderLastShown: timestamp };
    set(next);
    await savePreferences(next);
  },

  setBackupReminderPhotoCountAtLastBackup: async (count: number): Promise<void> => {
    const next = { ...get(), backupReminderPhotoCountAtLastBackup: count };
    set(next);
    await savePreferences(next);
  },

  setBackupReminderLastBackupDate: async (timestamp: number): Promise<void> => {
    const next = { ...get(), backupReminderLastBackupDate: timestamp };
    set(next);
    await savePreferences(next);
  },

  setHasCompletedOnboarding: async (value: boolean): Promise<void> => {
    const next = { ...get(), hasCompletedOnboarding: value };
    set(next);
    await savePreferences(next);
  },

  setBiometricAuthEnabled: async (value: boolean): Promise<void> => {
    const next = { ...get(), biometricAuthEnabled: value };
    set(next);
    await savePreferences(next);
  },

  setAutoLockTimeout: async (value: number): Promise<void> => {
    const next = { ...get(), autoLockTimeout: value };
    set(next);
    await savePreferences(next);
  },

  setInspectorName: async (value: string | null): Promise<void> => {
    const next = { ...get(), inspectorName: value };
    set(next);
    await savePreferences(next);
  },

  setInspectorCompany: async (value: string | null): Promise<void> => {
    const next = { ...get(), inspectorCompany: value };
    set(next);
    await savePreferences(next);
  },

  setCompanyName: async (value: string | null): Promise<void> => {
    const next = { ...get(), companyName: value };
    set(next);
    await savePreferences(next);
  },

  setCompanyLogoPath: async (value: string | null): Promise<void> => {
    const next = { ...get(), companyLogoPath: value };
    set(next);
    await savePreferences(next);
  },

  setReportHeaderText: async (value: string | null): Promise<void> => {
    const next = { ...get(), reportHeaderText: value };
    set(next);
    await savePreferences(next);
  },

  setReportFooterText: async (value: string | null): Promise<void> => {
    const next = { ...get(), reportFooterText: value };
    set(next);
    await savePreferences(next);
  },

  setLastPdfReportTemplate: async (value: string | null): Promise<void> => {
    const next = { ...get(), lastPdfReportTemplate: value };
    set(next);
    await savePreferences(next);
  },
}));
