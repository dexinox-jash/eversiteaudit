import { loadPreferences, savePreferences } from '@services/storage/preferences';

export type BackupReminderUrgency = 'normal' | 'urgent' | null;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_COOLDOWN_MS = 3 * ONE_DAY_MS; // Don't show more than once every 3 days

export interface BackupReminderCheck {
  shouldShow: boolean;
  urgency: BackupReminderUrgency;
  message: string;
}

/** Should Show Backup Reminder. */
export async function shouldShowBackupReminder(
  currentPhotoCount: number
): Promise<BackupReminderCheck> {
  const prefs = await loadPreferences();

  if (!prefs.backupRemindersEnabled) {
    return { shouldShow: false, urgency: null, message: '' };
  }

  const now = Date.now();

  // Check cooldown
  if (prefs.backupReminderLastShown && now - prefs.backupReminderLastShown < REMINDER_COOLDOWN_MS) {
    return { shouldShow: false, urgency: null, message: '' };
  }

  // Time-based triggers
  const lastBackupDate = prefs.backupReminderLastBackupDate;
  if (!lastBackupDate) {
    return { shouldShow: false, urgency: null, message: '' };
  }
  const daysSinceBackup = Math.floor((now - lastBackupDate) / ONE_DAY_MS);

  // Photo count trigger
  const photoCountAtLastBackup = prefs.backupReminderPhotoCountAtLastBackup ?? 0;
  const photosSinceBackup = currentPhotoCount - photoCountAtLastBackup;

  let shouldShow = false;
  let urgency: BackupReminderUrgency = 'normal';
  let message = '';

  if (daysSinceBackup >= 60) {
    shouldShow = true;
    urgency = 'urgent';
    message = "It's been 60 days since your last backup. Your data is at risk.";
  } else if (daysSinceBackup >= 30) {
    shouldShow = true;
    urgency = 'normal';
    message = "It's been 30 days since your last backup. Protect your data.";
  } else if (photosSinceBackup >= 50) {
    shouldShow = true;
    urgency = 'normal';
    message = `You've captured ${photosSinceBackup} photos since your last backup. Don't lose your work.`;
  }

  return { shouldShow, urgency, message };
}

/** Record Backup Reminder Shown. */
export async function recordBackupReminderShown(): Promise<void> {
  const prefs = await loadPreferences();
  await savePreferences({
    ...prefs,
    backupReminderLastShown: Date.now(),
  });
}

/** Record Backup Created. */
export async function recordBackupCreated(photoCount: number): Promise<void> {
  const prefs = await loadPreferences();
  await savePreferences({
    ...prefs,
    backupReminderLastBackupDate: Date.now(),
    backupReminderPhotoCountAtLastBackup: photoCount,
    backupReminderLastShown: null,
  });
}
