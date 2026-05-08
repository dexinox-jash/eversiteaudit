import {
  shouldShowBackupReminder,
  recordBackupReminderShown,
  recordBackupCreated,
} from '../reminderService';
import { loadPreferences, savePreferences } from '@services/storage/preferences';

jest.mock('@services/storage/preferences');

const mockedLoadPreferences = jest.mocked(loadPreferences);
const mockedSavePreferences = jest.mocked(savePreferences);

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe('reminderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSavePreferences.mockResolvedValue(undefined);
  });

  describe('shouldShowBackupReminder', () => {
    it('returns false on first launch when no backup has ever been made', async () => {
      mockedLoadPreferences.mockResolvedValue({
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
        autoLockTimeout: 15 * 60 * 1000,
        inspectorName: null,
        inspectorCompany: null,
        lastPdfReportTemplate: null,
      });

      const result = await shouldShowBackupReminder(100);
      expect(result.shouldShow).toBe(false);
      expect(result.urgency).toBeNull();
    });

    it('returns false when backup reminders are disabled', async () => {
      mockedLoadPreferences.mockResolvedValue({
        theme: 'system',
        reduceMotion: false,
        highContrast: false,
        backupRemindersEnabled: false,
        backupReminderLastShown: null,
        backupReminderPhotoCountAtLastBackup: null,
        backupReminderLastBackupDate: null,
        hasCompletedOnboarding: false,
        biometricAuthEnabled: false,
        companyName: null,
        companyLogoPath: null,
        reportHeaderText: null,
        reportFooterText: null,
        autoLockTimeout: 15 * 60 * 1000,
        inspectorName: null,
        inspectorCompany: null,
        lastPdfReportTemplate: null,
      });

      const result = await shouldShowBackupReminder(100);
      expect(result.shouldShow).toBe(false);
    });

    it('returns false when within cooldown period', async () => {
      const now = Date.now();
      mockedLoadPreferences.mockResolvedValue({
        theme: 'system',
        reduceMotion: false,
        highContrast: false,
        backupRemindersEnabled: true,
        backupReminderLastShown: now - ONE_DAY_MS,
        backupReminderPhotoCountAtLastBackup: 0,
        backupReminderLastBackupDate: now - 10 * ONE_DAY_MS,
        hasCompletedOnboarding: false,
        biometricAuthEnabled: false,
        companyName: null,
        companyLogoPath: null,
        reportHeaderText: null,
        reportFooterText: null,
        autoLockTimeout: 15 * 60 * 1000,
        inspectorName: null,
        inspectorCompany: null,
        lastPdfReportTemplate: null,
      });

      const result = await shouldShowBackupReminder(100);
      expect(result.shouldShow).toBe(false);
    });

    it('shows urgent reminder after 60 days without backup', async () => {
      const now = Date.now();
      mockedLoadPreferences.mockResolvedValue({
        theme: 'system',
        reduceMotion: false,
        highContrast: false,
        backupRemindersEnabled: true,
        backupReminderLastShown: null,
        backupReminderPhotoCountAtLastBackup: 0,
        backupReminderLastBackupDate: now - 65 * ONE_DAY_MS,
        hasCompletedOnboarding: false,
        biometricAuthEnabled: false,
        companyName: null,
        companyLogoPath: null,
        reportHeaderText: null,
        reportFooterText: null,
        autoLockTimeout: 15 * 60 * 1000,
        inspectorName: null,
        inspectorCompany: null,
        lastPdfReportTemplate: null,
      });

      const result = await shouldShowBackupReminder(10);
      expect(result.shouldShow).toBe(true);
      expect(result.urgency).toBe('urgent');
      expect(result.message).toContain('60 days');
    });

    it('shows normal reminder after 30 days without backup', async () => {
      const now = Date.now();
      mockedLoadPreferences.mockResolvedValue({
        theme: 'system',
        reduceMotion: false,
        highContrast: false,
        backupRemindersEnabled: true,
        backupReminderLastShown: null,
        backupReminderPhotoCountAtLastBackup: 0,
        backupReminderLastBackupDate: now - 35 * ONE_DAY_MS,
        hasCompletedOnboarding: false,
        biometricAuthEnabled: false,
        companyName: null,
        companyLogoPath: null,
        reportHeaderText: null,
        reportFooterText: null,
        autoLockTimeout: 15 * 60 * 1000,
        inspectorName: null,
        inspectorCompany: null,
        lastPdfReportTemplate: null,
      });

      const result = await shouldShowBackupReminder(10);
      expect(result.shouldShow).toBe(true);
      expect(result.urgency).toBe('normal');
      expect(result.message).toContain('30 days');
    });

    it('shows normal reminder when 50+ photos captured since last backup', async () => {
      const now = Date.now();
      mockedLoadPreferences.mockResolvedValue({
        theme: 'system',
        reduceMotion: false,
        highContrast: false,
        backupRemindersEnabled: true,
        backupReminderLastShown: null,
        backupReminderPhotoCountAtLastBackup: 10,
        backupReminderLastBackupDate: now - 5 * ONE_DAY_MS,
        hasCompletedOnboarding: false,
        biometricAuthEnabled: false,
        companyName: null,
        companyLogoPath: null,
        reportHeaderText: null,
        reportFooterText: null,
        autoLockTimeout: 15 * 60 * 1000,
        inspectorName: null,
        inspectorCompany: null,
        lastPdfReportTemplate: null,
      });

      const result = await shouldShowBackupReminder(65);
      expect(result.shouldShow).toBe(true);
      expect(result.urgency).toBe('normal');
      expect(result.message).toContain('55');
    });

    it('does not show reminder when fewer than 50 photos since last backup', async () => {
      const now = Date.now();
      mockedLoadPreferences.mockResolvedValue({
        theme: 'system',
        reduceMotion: false,
        highContrast: false,
        backupRemindersEnabled: true,
        backupReminderLastShown: null,
        backupReminderPhotoCountAtLastBackup: 10,
        backupReminderLastBackupDate: now - 5 * ONE_DAY_MS,
        hasCompletedOnboarding: false,
        biometricAuthEnabled: false,
        companyName: null,
        companyLogoPath: null,
        reportHeaderText: null,
        reportFooterText: null,
        autoLockTimeout: 15 * 60 * 1000,
        inspectorName: null,
        inspectorCompany: null,
        lastPdfReportTemplate: null,
      });

      const result = await shouldShowBackupReminder(55);
      expect(result.shouldShow).toBe(false);
    });

    it('prioritizes time trigger over photo count trigger when both apply', async () => {
      const now = Date.now();
      mockedLoadPreferences.mockResolvedValue({
        theme: 'system',
        reduceMotion: false,
        highContrast: false,
        backupRemindersEnabled: true,
        backupReminderLastShown: null,
        backupReminderPhotoCountAtLastBackup: 0,
        backupReminderLastBackupDate: now - 60 * ONE_DAY_MS,
        hasCompletedOnboarding: false,
        biometricAuthEnabled: false,
        companyName: null,
        companyLogoPath: null,
        reportHeaderText: null,
        reportFooterText: null,
        autoLockTimeout: 15 * 60 * 1000,
        inspectorName: null,
        inspectorCompany: null,
        lastPdfReportTemplate: null,
      });

      const result = await shouldShowBackupReminder(100);
      expect(result.shouldShow).toBe(true);
      expect(result.urgency).toBe('urgent');
      expect(result.message).toContain('60 days');
    });
  });

  describe('recordBackupReminderShown', () => {
    it('saves the current timestamp as last shown', async () => {
      const before = Date.now();
      mockedLoadPreferences.mockResolvedValue({
        theme: 'system',
        reduceMotion: false,
        highContrast: false,
        backupRemindersEnabled: true,
        backupReminderLastShown: null,
        backupReminderPhotoCountAtLastBackup: 0,
        backupReminderLastBackupDate: null,
        hasCompletedOnboarding: false,
        biometricAuthEnabled: false,
        companyName: null,
        companyLogoPath: null,
        reportHeaderText: null,
        reportFooterText: null,
        autoLockTimeout: 15 * 60 * 1000,
        inspectorName: null,
        inspectorCompany: null,
        lastPdfReportTemplate: null,
      });

      await recordBackupReminderShown();

      expect(mockedSavePreferences).toHaveBeenCalledTimes(1);
      const saved = mockedSavePreferences.mock.calls[0]![0];
      expect(saved.backupReminderLastShown).toBeGreaterThanOrEqual(before);
    });
  });

  describe('recordBackupCreated', () => {
    it('resets reminder triggers with current photo count and timestamp', async () => {
      const before = Date.now();
      mockedLoadPreferences.mockResolvedValue({
        theme: 'system',
        reduceMotion: false,
        highContrast: false,
        backupRemindersEnabled: true,
        backupReminderLastShown: Date.now() - ONE_DAY_MS,
        backupReminderPhotoCountAtLastBackup: 10,
        backupReminderLastBackupDate: Date.now() - 30 * ONE_DAY_MS,
        hasCompletedOnboarding: false,
        biometricAuthEnabled: false,
        companyName: null,
        companyLogoPath: null,
        reportHeaderText: null,
        reportFooterText: null,
        autoLockTimeout: 15 * 60 * 1000,
        inspectorName: null,
        inspectorCompany: null,
        lastPdfReportTemplate: null,
      });

      await recordBackupCreated(42);

      expect(mockedSavePreferences).toHaveBeenCalledTimes(1);
      const saved = mockedSavePreferences.mock.calls[0]![0];
      expect(saved.backupReminderLastBackupDate).toBeGreaterThanOrEqual(before);
      expect(saved.backupReminderPhotoCountAtLastBackup).toBe(42);
      expect(saved.backupReminderLastShown).toBeNull();
    });
  });
});
