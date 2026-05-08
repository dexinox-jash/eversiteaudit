import * as FileSystem from 'expo-file-system';

import { getDatabase } from '@services/db/connection';
import { photoRepository } from '@services/db/repositories';
import { createBackup, computeSha256 } from '@services/backup/BackupArchiver';
import { encryptWithPassphrase } from '@services/backup/crypto';

jest.mock('@services/db/connection');
jest.mock('@services/db/repositories', () => ({
  photoRepository: {
    getAll: jest.fn(),
  },
}));
jest.mock('@services/backup/crypto');
jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => ({
    file: jest.fn(),
    folder: jest.fn().mockReturnValue({ file: jest.fn() }),
    generateAsync: jest.fn().mockResolvedValue('mock-zip-base64'),
  }));
});

describe('backup/BackupArchiver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDatabase as jest.Mock).mockReturnValue({});
    (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(1024 * 1024 * 1024);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 2048 });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('ZGF0YQ==');
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
    (encryptWithPassphrase as jest.Mock).mockResolvedValue('encrypted-data');
    (photoRepository.getAll as jest.Mock).mockResolvedValue([]);
  });

  it('throws when database file is missing', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    await expect(createBackup('passphrase')).rejects.toThrow('Database file not found');
  });

  it('creates backup with database and photos', async () => {
    (photoRepository.getAll as jest.Mock).mockResolvedValue([
      {
        id: 'photo-1',
        originalPath: 'file:///mock/photos/1.jpg',
        isDeleted: 0,
      },
    ]);

    const result = await createBackup('passphrase');

    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
      expect.stringContaining('eversiteaudit.db'),
      { encoding: 'base64' }
    );
    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith('file:///mock/photos/1.jpg', {
      encoding: 'base64',
    });
    expect(encryptWithPassphrase).toHaveBeenCalled();
    expect(result.fileName).toMatch(/^esa_backup_\d+\.bin$/);
    expect(result.uri).toContain(result.fileName);
  });

  it('skips deleted photos in backup', async () => {
    (photoRepository.getAll as jest.Mock).mockResolvedValue([
      { id: 'photo-1', originalPath: 'file:///mock/photos/1.jpg', isDeleted: 1 },
      { id: 'photo-2', originalPath: 'file:///mock/photos/2.jpg', isDeleted: 0 },
    ]);

    await createBackup('passphrase');

    expect(FileSystem.readAsStringAsync).not.toHaveBeenCalledWith(
      'file:///mock/photos/1.jpg',
      expect.anything()
    );
    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith('file:///mock/photos/2.jpg', {
      encoding: 'base64',
    });
  });

  it('falls back to photo id when originalPath is empty', async () => {
    (photoRepository.getAll as jest.Mock).mockResolvedValue([
      { id: 'photo-1', originalPath: '', isDeleted: 0 },
    ]);

    const result = await createBackup('passphrase');

    expect(result.fileName).toMatch(/^esa_backup_\d+\.bin$/);
  });

  it('sanitizes photo file names starting with dots', async () => {
    (photoRepository.getAll as jest.Mock).mockResolvedValue([
      { id: 'photo-1', originalPath: 'file:///mock/photos/.hidden.jpg', isDeleted: 0 },
    ]);

    const result = await createBackup('passphrase');

    expect(result.fileName).toMatch(/^esa_backup_\d+\.bin$/);
  });

  it('returns zero file size when backup info lacks size', async () => {
    (photoRepository.getAll as jest.Mock).mockResolvedValue([]);
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation((uri: string) => {
      if (uri.includes('eversiteaudit.db')) return { exists: true, size: 1024 };
      return { exists: true };
    });

    const result = await createBackup('passphrase');
    expect(result.fileSizeBytes).toBe(0);
  });

  it('returns actual file size when backup info includes size', async () => {
    (photoRepository.getAll as jest.Mock).mockResolvedValue([]);
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation((uri: string) => {
      if (uri.includes('eversiteaudit.db')) return { exists: true, size: 1024 };
      if (uri.includes('esa_backup_')) return { exists: true, size: 4096 };
      return { exists: false };
    });

    const result = await createBackup('passphrase');
    expect(result.fileSizeBytes).toBe(4096);
  });

  it('computes SHA-256 of a file', async () => {
    const hash = await computeSha256('file:///mock/test.bin');
    expect(typeof hash).toBe('string');
    expect(hash).toHaveLength(64);
  });
});
