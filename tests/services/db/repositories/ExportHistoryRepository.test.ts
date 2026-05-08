import { ExportHistoryRepository } from '@services/db/repositories/ExportHistoryRepository';
import { encryptField } from '@services/security/fieldEncryption';
import type { ExportHistory } from '@/types/domain';

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

describe('ExportHistoryRepository', () => {
  let repo: ExportHistoryRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new ExportHistoryRepository();
  });

  const historyRow = {
    id: 'hist-1',
    project_id: 'proj-1',
    export_type: 'pdf',
    file_name: 'ENC:export.pdf',
    file_size_bytes: 1024,
    export_timestamp: 1000,
    password_protected: 1,
    success: 1,
    error_message: null,
  };

  const expectedHistory: ExportHistory = {
    id: 'hist-1',
    projectId: 'proj-1',
    exportType: 'pdf',
    fileName: 'export.pdf',
    fileSizeBytes: 1024,
    exportTimestamp: 1000,
    passwordProtected: 1,
    success: 1,
    errorMessage: null,
  };

  describe('create', () => {
    it('inserts an export record and returns decrypted row', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue(historyRow);

      const result = await repo.create({
        projectId: 'proj-1',
        exportType: 'pdf',
        fileName: 'export.pdf',
        fileSizeBytes: 1024,
        passwordProtected: true,
        success: true,
      });

      expect(encryptField).toHaveBeenCalledWith('export.pdf');
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO export_history'),
        expect.arrayContaining([
          expect.any(String),
          'proj-1',
          'pdf',
          'ENC:export.pdf',
          1024,
          expect.any(Number),
          1,
          1,
          null,
        ])
      );
      expect(result).toEqual(expectedHistory);
    });

    it('throws when created record cannot be retrieved', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue(null);

      await expect(
        repo.create({
          projectId: 'proj-1',
          exportType: 'csv',
          fileName: 'export.csv',
          fileSizeBytes: null,
          passwordProtected: false,
          success: true,
        })
      ).rejects.toThrow('Failed to retrieve created export history');
    });

    it('stores false success and error message', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue({
        ...historyRow,
        success: 0,
        error_message: 'ENC:failed',
      });

      const result = await repo.create({
        projectId: 'proj-1',
        exportType: 'pdf',
        fileName: 'export.pdf',
        fileSizeBytes: 0,
        passwordProtected: false,
        success: false,
        errorMessage: 'failed',
      });

      expect(result.success).toBe(0);
      expect(result.errorMessage).toBe('failed');
      const callArgs = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(callArgs[7]).toBe(0); // success = 0
    });

    it('returns empty string when decrypted fileName is null', async () => {
      mockGetAllAsync.mockResolvedValue([{ ...historyRow, file_name: null }]);

      const result = await repo.getAll();

      expect(result[0]?.fileName).toBe('');
    });
  });

  describe('getByProjectId', () => {
    it('returns decrypted export history for a project', async () => {
      mockGetAllAsync.mockResolvedValue([historyRow]);

      const result = await repo.getByProjectId('proj-1');

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM export_history WHERE project_id = ? ORDER BY export_timestamp DESC',
        ['proj-1']
      );
      expect(result).toEqual([expectedHistory]);
    });
  });

  describe('getAll', () => {
    it('returns all decrypted export history', async () => {
      mockGetAllAsync.mockResolvedValue([historyRow]);

      const result = await repo.getAll();

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM export_history ORDER BY export_timestamp DESC'
      );
      expect(result).toEqual([expectedHistory]);
    });
  });

  describe('delete', () => {
    it('deletes an export history record by id', async () => {
      mockRunAsync.mockResolvedValue(undefined);

      await repo.delete('hist-1');

      expect(mockRunAsync).toHaveBeenCalledWith('DELETE FROM export_history WHERE id = ?', [
        'hist-1',
      ]);
    });
  });

  describe('clearAll', () => {
    it('deletes all export history rows', async () => {
      mockRunAsync.mockResolvedValue(undefined);

      await repo.clearAll();

      expect(mockRunAsync).toHaveBeenCalledWith('DELETE FROM export_history');
    });
  });
});
