import { SettingsRepository } from '@services/db/repositories/SettingsRepository';
import { encryptField } from '@services/security/fieldEncryption';
import type { Setting } from '@/types/domain';

const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockRunAsync = jest.fn();

jest.mock('@services/db/connection', () => ({
  getDatabase: jest.fn(() => ({
    getAllAsync: mockGetAllAsync,
    getFirstAsync: mockGetFirstAsync,
    runAsync: mockRunAsync,
  })),
}));

jest.mock('@services/security/fieldEncryption', () => ({
  encryptField: jest.fn(async (value: string | null | undefined) => {
    if (value === null || value === undefined) return value;
    return `ENC:${value}`;
  }),
  decryptField: jest.fn(async (value: string | null | undefined) => {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string' && value.startsWith('ENC:')) {
      return value.slice(4);
    }
    return value;
  }),
}));

describe('SettingsRepository', () => {
  let repo: SettingsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new SettingsRepository();
  });

  const settingRow = {
    key: 'theme',
    value: 'ENC:dark',
    value_type: 'string',
    updated_at: 1000,
  };

  const expectedSetting: Setting = {
    key: 'theme',
    value: 'dark',
    valueType: 'string',
    updatedAt: 1000,
  };

  describe('set', () => {
    it('encrypts value and upserts setting', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue(settingRow);

      const result = await repo.set('theme', 'dark', 'string');

      expect(encryptField).toHaveBeenCalledWith('dark');
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO settings'),
        expect.arrayContaining(['theme', 'ENC:dark', 'string', expect.any(Number)])
      );
      expect(result).toEqual(expectedSetting);
    });

    it('throws when saved setting cannot be retrieved', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue(null);

      await expect(repo.set('theme', 'dark')).rejects.toThrow('Failed to retrieve saved setting');
    });

    it('handles null value', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue({
        key: 'theme',
        value: null,
        value_type: 'string',
        updated_at: 1000,
      });

      const result = await repo.set('theme', null);

      expect(encryptField).toHaveBeenCalledWith(null);
      expect(result.value).toBeNull();
    });
  });

  describe('get', () => {
    it('returns decrypted setting when found', async () => {
      mockGetFirstAsync.mockResolvedValue(settingRow);

      const result = await repo.get('theme');

      expect(mockGetFirstAsync).toHaveBeenCalledWith('SELECT * FROM settings WHERE key = ?', [
        'theme',
      ]);
      expect(result).toEqual(expectedSetting);
    });

    it('returns null when setting is not found', async () => {
      mockGetFirstAsync.mockResolvedValue(null);

      const result = await repo.get('missing');

      expect(result).toBeNull();
    });

    it('returns null when stored value is null', async () => {
      mockGetFirstAsync.mockResolvedValue({
        key: 'theme',
        value: null,
        value_type: 'string',
        updated_at: 1000,
      });

      const result = await repo.get('theme');

      expect(result).not.toBeNull();
      expect(result?.value).toBeNull();
    });
  });

  describe('getAll', () => {
    it('returns all decrypted settings ordered by key', async () => {
      mockGetAllAsync.mockResolvedValue([settingRow]);

      const result = await repo.getAll();

      expect(mockGetAllAsync).toHaveBeenCalledWith('SELECT * FROM settings ORDER BY key ASC');
      expect(result).toEqual([expectedSetting]);
    });
  });

  describe('delete', () => {
    it('deletes a setting by key', async () => {
      mockRunAsync.mockResolvedValue(undefined);

      await repo.delete('theme');

      expect(mockRunAsync).toHaveBeenCalledWith('DELETE FROM settings WHERE key = ?', ['theme']);
    });
  });
});
