import { usePreferenceStore } from '@store/usePreferenceStore';

jest.mock('@services/storage/preferences');

const { loadPreferences, savePreferences } = jest.requireMock('@services/storage/preferences') as {
  loadPreferences: jest.Mock;
  savePreferences: jest.Mock;
};

describe('usePreferenceStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePreferenceStore.setState({
      theme: 'system',
      reduceMotion: false,
      highContrast: false,
      backupRemindersEnabled: true,
      backupReminderLastShown: null,
      backupReminderPhotoCountAtLastBackup: null,
      backupReminderLastBackupDate: null,
      hasCompletedOnboarding: false,
      biometricAuthEnabled: false,
      companyName: null,
      companyLogoPath: null,
      reportHeaderText: null,
      reportFooterText: null,
      isLoading: false,
      isLoaded: false,
    });
  });

  it('has correct initial state', () => {
    const state = usePreferenceStore.getState();
    expect(state.theme).toBe('system');
    expect(state.reduceMotion).toBe(false);
    expect(state.highContrast).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.isLoaded).toBe(false);
  });

  describe('load', () => {
    it('loads preferences successfully', async () => {
      loadPreferences.mockResolvedValue({
        theme: 'dark',
        reduceMotion: true,
        highContrast: false,
        backupRemindersEnabled: false,
        backupReminderLastShown: 1234,
        backupReminderPhotoCountAtLastBackup: 10,
        backupReminderLastBackupDate: 5678,
        hasCompletedOnboarding: true,
        biometricAuthEnabled: true,
        companyName: 'Acme',
        companyLogoPath: 'file:///logo.png',
        reportHeaderText: 'Header',
        reportFooterText: 'Footer',
      });

      await usePreferenceStore.getState().load();

      const state = usePreferenceStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.reduceMotion).toBe(true);
      expect(state.isLoaded).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('handles load errors gracefully', async () => {
      loadPreferences.mockRejectedValue(new Error('Load failed'));

      await usePreferenceStore.getState().load();

      const state = usePreferenceStore.getState();
      expect(state.isLoaded).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.theme).toBe('system');
    });
  });

  describe('setters', () => {
    it('setTheme persists theme', async () => {
      await usePreferenceStore.getState().setTheme('dark');
      expect(usePreferenceStore.getState().theme).toBe('dark');
      expect(savePreferences).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark' }));
    });

    it('setReduceMotion persists value', async () => {
      await usePreferenceStore.getState().setReduceMotion(true);
      expect(usePreferenceStore.getState().reduceMotion).toBe(true);
      expect(savePreferences).toHaveBeenCalledWith(expect.objectContaining({ reduceMotion: true }));
    });

    it('setHighContrast persists value', async () => {
      await usePreferenceStore.getState().setHighContrast(true);
      expect(usePreferenceStore.getState().highContrast).toBe(true);
      expect(savePreferences).toHaveBeenCalledWith(expect.objectContaining({ highContrast: true }));
    });

    it('setBackupRemindersEnabled persists value', async () => {
      await usePreferenceStore.getState().setBackupRemindersEnabled(false);
      expect(usePreferenceStore.getState().backupRemindersEnabled).toBe(false);
      expect(savePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ backupRemindersEnabled: false })
      );
    });

    it('setBackupReminderLastShown persists value', async () => {
      await usePreferenceStore.getState().setBackupReminderLastShown(12345);
      expect(usePreferenceStore.getState().backupReminderLastShown).toBe(12345);
      expect(savePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ backupReminderLastShown: 12345 })
      );
    });

    it('setBackupReminderPhotoCountAtLastBackup persists value', async () => {
      await usePreferenceStore.getState().setBackupReminderPhotoCountAtLastBackup(42);
      expect(usePreferenceStore.getState().backupReminderPhotoCountAtLastBackup).toBe(42);
      expect(savePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ backupReminderPhotoCountAtLastBackup: 42 })
      );
    });

    it('setBackupReminderLastBackupDate persists value', async () => {
      await usePreferenceStore.getState().setBackupReminderLastBackupDate(99999);
      expect(usePreferenceStore.getState().backupReminderLastBackupDate).toBe(99999);
      expect(savePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ backupReminderLastBackupDate: 99999 })
      );
    });

    it('setHasCompletedOnboarding persists value', async () => {
      await usePreferenceStore.getState().setHasCompletedOnboarding(true);
      expect(usePreferenceStore.getState().hasCompletedOnboarding).toBe(true);
      expect(savePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ hasCompletedOnboarding: true })
      );
    });

    it('setBiometricAuthEnabled persists value', async () => {
      await usePreferenceStore.getState().setBiometricAuthEnabled(true);
      expect(usePreferenceStore.getState().biometricAuthEnabled).toBe(true);
      expect(savePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ biometricAuthEnabled: true })
      );
    });

    it('setCompanyName persists value', async () => {
      await usePreferenceStore.getState().setCompanyName('Acme Inc');
      expect(usePreferenceStore.getState().companyName).toBe('Acme Inc');
      expect(savePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ companyName: 'Acme Inc' })
      );
    });

    it('setCompanyLogoPath persists value', async () => {
      await usePreferenceStore.getState().setCompanyLogoPath('file:///logo.png');
      expect(usePreferenceStore.getState().companyLogoPath).toBe('file:///logo.png');
      expect(savePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ companyLogoPath: 'file:///logo.png' })
      );
    });

    it('setReportHeaderText persists value', async () => {
      await usePreferenceStore.getState().setReportHeaderText('Header Text');
      expect(usePreferenceStore.getState().reportHeaderText).toBe('Header Text');
      expect(savePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ reportHeaderText: 'Header Text' })
      );
    });

    it('setReportFooterText persists value', async () => {
      await usePreferenceStore.getState().setReportFooterText('Footer Text');
      expect(usePreferenceStore.getState().reportFooterText).toBe('Footer Text');
      expect(savePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ reportFooterText: 'Footer Text' })
      );
    });
  });
});
