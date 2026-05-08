import * as FileSystem from 'expo-file-system';
import {
  createBackup,
  deleteBackup,
  listBackups,
  restoreBackup,
} from '@services/backup/BackupService';
import { createBackup as archiverCreateBackup } from '@services/backup/BackupArchiver';
import { restoreBackup as extractorRestoreBackup } from '@services/backup/BackupExtractor';

jest.mock('@services/db/repositories/PhotoRepository');
jest.mock('@services/db/connection');
jest.mock('@services/backup/BackupArchiver');
jest.mock('@services/backup/BackupExtractor');

describe('backup/BackupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists backups sorted by createdAt descending', async () => {
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
      'esa_backup_1000.bin',
      'esa_backup_3000.bin',
      'other_file.txt',
    ]);
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation((uri: string) => {
      if (uri.includes('esa_backup_1000.bin')) return { exists: true, size: 100 };
      if (uri.includes('esa_backup_3000.bin')) return { exists: true, size: 300 };
      return { exists: false };
    });

    const backups = await listBackups();
    expect(backups).toHaveLength(2);
    expect(backups[0]!.createdAt).toBe(3000);
    expect(backups[1]!.createdAt).toBe(1000);
  });

  it('deletes an existing backup', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

    await deleteBackup('file:///mock/esa_backup_1234.bin');
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///mock/esa_backup_1234.bin');
  });

  it('does nothing when deleting non-existent backup', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

    await deleteBackup('file:///mock/missing.bin');
    expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
  });

  it('skips backup files without size info', async () => {
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue(['esa_backup_1000.bin']);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

    const backups = await listBackups();
    expect(backups).toHaveLength(0);
  });

  it('handles invalid backup filenames with NaN timestamp', async () => {
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue(['esa_backup_abc.bin']);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 100 });

    const backups = await listBackups();
    expect(backups).toHaveLength(1);
    expect(backups[0]!.createdAt).toBe(0);
  });

  it('createBackup delegates to archiver and returns result', async () => {
    const mockResult = {
      uri: 'file:///mock/esa_backup_9999.bin',
      fileName: 'esa_backup_9999.bin',
      fileSizeBytes: 4096,
      createdAt: 9999,
    };
    (archiverCreateBackup as jest.Mock).mockResolvedValue(mockResult);

    const result = await createBackup('passphrase');

    expect(archiverCreateBackup).toHaveBeenCalledWith('passphrase');
    expect(result).toEqual(mockResult);
  });

  it('createBackup returns result from archiver on success', async () => {
    const mockResult = {
      uri: 'file:///mock/esa_backup_5678.bin',
      fileName: 'esa_backup_5678.bin',
      fileSizeBytes: 2048,
      createdAt: 5678,
    };
    (archiverCreateBackup as jest.Mock).mockResolvedValue(mockResult);

    const result = await createBackup('passphrase');

    expect(archiverCreateBackup).toHaveBeenCalledWith('passphrase');
    expect(result).toEqual(mockResult);
  });

  it('restoreBackup returns result from extractor', async () => {
    const mockResult = {
      success: true,
      stagedDbPath: 'file:///mock/restored.sqlite',
      extractedPhotosCount: 3,
      errors: [],
    };
    (extractorRestoreBackup as jest.Mock).mockResolvedValue(mockResult);

    const result = await restoreBackup('file:///mock/backup.bin', 'secret');

    expect(extractorRestoreBackup).toHaveBeenCalledWith('file:///mock/backup.bin', 'secret');
    expect(result).toEqual(mockResult);
  });
});
