import * as FileSystem from 'expo-file-system';
import { restoreBackup } from '@services/backup/BackupExtractor';
import { decryptWithPassphrase, decryptKey } from '@services/backup/crypto';
import { storeEncryptionKey } from '@services/security/keyStore';

jest.mock('@services/backup/crypto');
jest.mock('@services/security/keyStore');

const DB_BASE64 = 'ZGF0YQ==';
const DB_HASH = '3a6eb0790f39ac87c94f3856b2dd2c5d110e6811602261a9a923d3bb23adc8b7';

let mockManifestJson: string | null = JSON.stringify({
  version: 1,
  createdAt: new Date().toISOString(),
  appVersion: '1.0.0',
  dbFileName: 'db.sqlite',
  photos: [],
  checksums: { 'db.sqlite': DB_HASH },
});

jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => ({
    loadAsync: jest.fn().mockImplementation((base64: string) => {
      if (base64 === 'not-valid-base64!!!') {
        return Promise.reject(new Error('Invalid base64'));
      }
      return Promise.resolve({
        file: jest.fn((name: string) => {
          if (name === 'manifest.json') {
            return mockManifestJson
              ? { async: jest.fn().mockResolvedValue(mockManifestJson) }
              : null;
          }
          if (name === 'db.sqlite') {
            return { async: jest.fn().mockResolvedValue(DB_BASE64) };
          }
          if (name === 'photos/photo.jpg') {
            return { async: jest.fn().mockResolvedValue(DB_BASE64) };
          }
          return null;
        }),
      });
    }),
  }));
});

describe('backup/BackupExtractor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockManifestJson = JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      appVersion: '1.0.0',
      dbFileName: 'db.sqlite',
      photos: [],
      checksums: { 'db.sqlite': DB_HASH },
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('encrypted-content');
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
  });

  it('returns error when passphrase is invalid', async () => {
    (decryptWithPassphrase as jest.Mock).mockRejectedValue(new Error('bad passphrase'));

    const result = await restoreBackup('file:///mock/backup.bin', 'wrong');

    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/Decryption failed/);
  });

  it('returns error when archive is invalid', async () => {
    (decryptWithPassphrase as jest.Mock).mockResolvedValue('not-valid-base64!!!');

    const result = await restoreBackup('file:///mock/backup.bin', 'pass');

    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/Invalid backup archive/);
  });

  it('returns error when manifest is missing', async () => {
    mockManifestJson = null;
    (decryptWithPassphrase as jest.Mock).mockResolvedValue('any-valid-base64');

    const result = await restoreBackup('file:///mock/backup.bin', 'pass');

    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/Backup manifest missing/);
  });

  it('successfully restores backup with valid archive', async () => {
    (decryptWithPassphrase as jest.Mock).mockResolvedValue('any-valid-base64');

    const result = await restoreBackup('file:///mock/backup.bin', 'pass');

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      expect.stringContaining('restore_db_'),
      DB_BASE64,
      { encoding: 'base64' }
    );
  });

  it('returns error when manifest is corrupted JSON', async () => {
    mockManifestJson = 'not-valid-json';
    (decryptWithPassphrase as jest.Mock).mockResolvedValue('any-valid-base64');

    const result = await restoreBackup('file:///mock/backup.bin', 'pass');

    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/manifest is corrupted/);
  });

  it('returns error when manifest version is unsupported', async () => {
    mockManifestJson = JSON.stringify({
      version: 99,
      createdAt: new Date().toISOString(),
      appVersion: '1.0.0',
      dbFileName: 'db.sqlite',
      photos: [],
      checksums: { 'db.sqlite': DB_HASH },
    });
    (decryptWithPassphrase as jest.Mock).mockResolvedValue('any-valid-base64');

    const result = await restoreBackup('file:///mock/backup.bin', 'pass');

    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/Unsupported backup version/);
  });

  it('returns error when database file is missing from backup', async () => {
    mockManifestJson = JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      appVersion: '1.0.0',
      dbFileName: 'missing.db',
      photos: [],
      checksums: { 'missing.db': DB_HASH },
    });
    (decryptWithPassphrase as jest.Mock).mockResolvedValue('any-valid-base64');

    const result = await restoreBackup('file:///mock/backup.bin', 'pass');

    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/Database file missing/);
  });

  it('returns error when database checksum mismatches', async () => {
    mockManifestJson = JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      appVersion: '1.0.0',
      dbFileName: 'db.sqlite',
      photos: [],
      checksums: { 'db.sqlite': 'wrong-hash' },
    });
    (decryptWithPassphrase as jest.Mock).mockResolvedValue('any-valid-base64');

    const result = await restoreBackup('file:///mock/backup.bin', 'pass');

    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/checksum mismatch/);
  });

  it('returns error when photo is missing from backup', async () => {
    mockManifestJson = JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      appVersion: '1.0.0',
      dbFileName: 'db.sqlite',
      photos: [{ fileName: 'missing.jpg' }],
      checksums: { 'db.sqlite': DB_HASH, 'photos/missing.jpg': 'abc' },
    });
    (decryptWithPassphrase as jest.Mock).mockResolvedValue('any-valid-base64');

    const result = await restoreBackup('file:///mock/backup.bin', 'pass');

    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/Photo missing/);
  });

  it('returns error when key escrow decryption fails', async () => {
    mockManifestJson = JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      appVersion: '1.0.0',
      dbFileName: 'db.sqlite',
      photos: [],
      checksums: { 'db.sqlite': DB_HASH },
      keyEscrow: 'encrypted-key-data',
    });
    (decryptWithPassphrase as jest.Mock).mockResolvedValue('any-valid-base64');
    (decryptKey as jest.Mock).mockRejectedValue(new Error('Bad passphrase'));

    const result = await restoreBackup('file:///mock/backup.bin', 'pass');

    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/Failed to restore encryption key/);
  });

  it('returns error when photo checksum mismatches', async () => {
    mockManifestJson = JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      appVersion: '1.0.0',
      dbFileName: 'db.sqlite',
      photos: [{ fileName: 'photo.jpg' }],
      checksums: { 'db.sqlite': DB_HASH, 'photos/photo.jpg': 'wrong-hash' },
    });
    (decryptWithPassphrase as jest.Mock).mockResolvedValue('any-valid-base64');

    const result = await restoreBackup('file:///mock/backup.bin', 'pass');

    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/Photo checksum mismatch/);
  });

  it('successfully restores backup with key escrow', async () => {
    mockManifestJson = JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      appVersion: '1.0.0',
      dbFileName: 'db.sqlite',
      photos: [],
      checksums: { 'db.sqlite': DB_HASH },
      keyEscrow: 'encrypted-key-data',
    });
    (decryptWithPassphrase as jest.Mock).mockResolvedValue('any-valid-base64');
    (decryptKey as jest.Mock).mockResolvedValue(new Uint8Array([1, 2, 3]));

    const result = await restoreBackup('file:///mock/backup.bin', 'pass');

    expect(result.success).toBe(true);
    expect(storeEncryptionKey).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]));
  });

  it('returns error when key escrow throws non-Error', async () => {
    mockManifestJson = JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      appVersion: '1.0.0',
      dbFileName: 'db.sqlite',
      photos: [],
      checksums: { 'db.sqlite': DB_HASH },
      keyEscrow: 'encrypted-key-data',
    });
    (decryptWithPassphrase as jest.Mock).mockResolvedValue('any-valid-base64');
    (decryptKey as jest.Mock).mockRejectedValue('string-error');

    const result = await restoreBackup('file:///mock/backup.bin', 'pass');

    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe('Failed to restore encryption key: string-error');
  });

  it('successfully restores backup when photos directory already exists', async () => {
    mockManifestJson = JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      appVersion: '1.0.0',
      dbFileName: 'db.sqlite',
      photos: [{ fileName: 'photo.jpg' }],
      checksums: { 'db.sqlite': DB_HASH, 'photos/photo.jpg': DB_HASH },
    });
    (decryptWithPassphrase as jest.Mock).mockResolvedValue('any-valid-base64');
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
      if (path.includes('photos')) {
        return { exists: true, isDirectory: true };
      }
      return { exists: false };
    });

    const result = await restoreBackup('file:///mock/backup.bin', 'pass');

    expect(result.success).toBe(true);
    expect(result.extractedPhotosCount).toBe(1);
    expect(FileSystem.makeDirectoryAsync).not.toHaveBeenCalled();
  });

  it('successfully restores backup with photos', async () => {
    mockManifestJson = JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      appVersion: '1.0.0',
      dbFileName: 'db.sqlite',
      photos: [{ fileName: 'photo.jpg' }],
      checksums: { 'db.sqlite': DB_HASH, 'photos/photo.jpg': DB_HASH },
    });
    (decryptWithPassphrase as jest.Mock).mockResolvedValue('any-valid-base64');

    const result = await restoreBackup('file:///mock/backup.bin', 'pass');

    expect(result.success).toBe(true);
    expect(result.extractedPhotosCount).toBe(1);
    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      expect.stringContaining('photos/'),
      DB_BASE64,
      { encoding: 'base64' }
    );
  });
});
