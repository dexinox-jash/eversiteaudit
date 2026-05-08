import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import MigrationWizardScreen from '@app/migration/index';
import { useProjectStore } from '@store/useProjectStore';
import { useIssueStore } from '@store/useIssueStore';
import { usePhotoStore } from '@store/usePhotoStore';
import { createBackup, restoreBackup, computeSha256 } from '@services/backup';
import { recordBackupCreated } from '@services/backup/reminderService';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('@store/useProjectStore');
jest.mock('@store/useIssueStore');
jest.mock('@store/usePhotoStore');
jest.mock('@services/backup');
jest.mock('@services/backup/reminderService');

describe('MigrationWizardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({});
    (useProjectStore as unknown as jest.Mock).mockReturnValue({ projects: [] });
    (useIssueStore as unknown as jest.Mock).mockReturnValue({ issues: [] });
    (usePhotoStore as unknown as jest.Mock).mockReturnValue({ photos: [] });
    (createBackup as jest.Mock).mockResolvedValue({
      uri: 'file:///mock/esa_backup_1234.bin',
      fileName: 'esa_backup_1234.bin',
      fileSizeBytes: 1024,
      createdAt: 1234,
    });
    (restoreBackup as jest.Mock).mockResolvedValue({
      success: true,
      stagedDbPath: 'file:///mock/restore.sqlite',
      extractedPhotosCount: 5,
      errors: [],
    });
    (computeSha256 as jest.Mock).mockResolvedValue('deadbeef');
    (recordBackupCreated as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders intro step by default', () => {
    render(<MigrationWizardScreen />);
    expect(screen.getByText('Transfer to New Device')).toBeTruthy();
    expect(screen.getByLabelText('This is my old device')).toBeTruthy();
    expect(screen.getByLabelText('This is my new device')).toBeTruthy();
  });

  it('selects old device role and shows create backup step', () => {
    render(<MigrationWizardScreen />);
    fireEvent.press(screen.getByLabelText('This is my old device'));
    expect(screen.getAllByText('Create Backup')[0]).toBeTruthy();
    expect(screen.getByText('0 projects')).toBeTruthy();
    expect(screen.getByText('0 issues')).toBeTruthy();
    expect(screen.getByText('0 photos')).toBeTruthy();
  });

  it('selects new device role and shows import backup step', () => {
    render(<MigrationWizardScreen />);
    fireEvent.press(screen.getByLabelText('This is my new device'));
    expect(screen.getAllByText('Import Backup')[0]).toBeTruthy();
    expect(screen.getByLabelText('Select backup file')).toBeTruthy();
    expect(screen.getByLabelText('Passphrase')).toBeTruthy();
  });

  it('validates passphrase length before creating backup', () => {
    render(<MigrationWizardScreen />);
    fireEvent.press(screen.getByLabelText('This is my old device'));
    const createButton = screen.getByLabelText('Create backup');
    expect(createButton.props.accessibilityState.disabled).toBe(true);
  });

  it('creates backup when passphrase is valid', async () => {
    render(<MigrationWizardScreen />);
    fireEvent.press(screen.getByLabelText('This is my old device'));

    const passphraseInput = screen.getByLabelText('Backup Passphrase');
    fireEvent.changeText(passphraseInput, 'securepass123');

    fireEvent.press(screen.getByLabelText('Create backup'));

    await waitFor(() => {
      expect(createBackup).toHaveBeenCalledWith('securepass123');
      expect(recordBackupCreated).toHaveBeenCalledWith(0);
    });

    expect(screen.getByText('Backup Created')).toBeTruthy();
    expect(screen.getByText('esa_backup_1234.bin')).toBeTruthy();
    expect(screen.getByText('deadbeef')).toBeTruthy();
  });

  it('shows error when backup creation fails', async () => {
    (createBackup as jest.Mock).mockRejectedValue(new Error('Disk full'));
    render(<MigrationWizardScreen />);
    fireEvent.press(screen.getByLabelText('This is my old device'));

    fireEvent.changeText(screen.getByLabelText('Backup Passphrase'), 'securepass123');
    fireEvent.press(screen.getByLabelText('Create backup'));

    await waitFor(() => {
      expect(screen.getByText('Backup Failed')).toBeTruthy();
      expect(screen.getByText('Disk full')).toBeTruthy();
    });
  });

  it('restores backup with valid path and passphrase', async () => {
    render(<MigrationWizardScreen />);
    fireEvent.press(screen.getByLabelText('This is my new device'));

    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///mock/backup.bin' }],
    });
    fireEvent.press(screen.getByLabelText('Select backup file'));
    await waitFor(() => {
      expect(screen.getByText('backup.bin')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByLabelText('Passphrase'), 'mysecret');

    fireEvent.press(screen.getByLabelText('Import backup'));

    await waitFor(() => {
      expect(restoreBackup).toHaveBeenCalledWith('file:///mock/backup.bin', 'mysecret');
    });

    expect(screen.getByText('Restore Complete')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('shows error when restore returns success false', async () => {
    (restoreBackup as jest.Mock).mockResolvedValue({
      success: false,
      stagedDbPath: '',
      extractedPhotosCount: 0,
      errors: ['Invalid checksum'],
    });
    render(<MigrationWizardScreen />);
    fireEvent.press(screen.getByLabelText('This is my new device'));

    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///mock/bad.bin' }],
    });
    fireEvent.press(screen.getByLabelText('Select backup file'));
    await waitFor(() => {
      expect(screen.getByText('bad.bin')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByLabelText('Passphrase'), 'wrong');

    fireEvent.press(screen.getByLabelText('Import backup'));

    await waitFor(() => {
      expect(screen.getByText('Restore Failed')).toBeTruthy();
      expect(screen.getByText('Invalid checksum')).toBeTruthy();
    });
  });

  it('shares backup from success step', async () => {
    render(<MigrationWizardScreen />);
    fireEvent.press(screen.getByLabelText('This is my old device'));

    fireEvent.changeText(screen.getByLabelText('Backup Passphrase'), 'securepass123');
    fireEvent.press(screen.getByLabelText('Create backup'));

    await waitFor(() => {
      expect(screen.getByText('Backup Created')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Share backup file'));
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///mock/esa_backup_1234.bin');
  });

  it('starts at old-device step when initialRole is old', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ initialRole: 'old' });
    render(<MigrationWizardScreen />);
    expect(screen.getAllByText('Create Backup')[0]).toBeTruthy();
  });

  it('starts at new-device step when initialRole is new', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ initialRole: 'new' });
    render(<MigrationWizardScreen />);
    expect(screen.getAllByText('Import Backup')[0]).toBeTruthy();
  });
});
