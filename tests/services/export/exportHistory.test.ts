import { recordExport, getExportHistory, clearExportHistory } from '@services/export/exportHistory';
import { exportHistoryRepository } from '@services/db/repositories';

jest.mock('@services/db/repositories', () => ({
  exportHistoryRepository: {
    create: jest.fn(),
    getByProjectId: jest.fn(),
    getAll: jest.fn(),
    clearAll: jest.fn(),
  },
}));

describe('exportHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordExport', () => {
    it('records a successful export via repository', async () => {
      (exportHistoryRepository.create as jest.Mock).mockResolvedValue(undefined);

      await recordExport({
        projectId: 'proj-1',
        exportType: 'pdf',
        fileName: 'export.pdf',
        fileSizeBytes: 1024,
        passwordProtected: true,
        success: true,
      });

      expect(exportHistoryRepository.create).toHaveBeenCalledWith({
        projectId: 'proj-1',
        exportType: 'pdf',
        fileName: 'export.pdf',
        fileSizeBytes: 1024,
        passwordProtected: true,
        success: true,
        errorMessage: null,
      });
    });

    it('records a failed export with error message', async () => {
      (exportHistoryRepository.create as jest.Mock).mockResolvedValue(undefined);

      await recordExport({
        projectId: 'proj-1',
        exportType: 'zip',
        fileName: 'export.zip',
        fileSizeBytes: null,
        passwordProtected: false,
        success: false,
        errorMessage: 'Export failed',
      });

      expect(exportHistoryRepository.create).toHaveBeenCalledWith({
        projectId: 'proj-1',
        exportType: 'zip',
        fileName: 'export.zip',
        fileSizeBytes: null,
        passwordProtected: false,
        success: false,
        errorMessage: 'Export failed',
      });
    });
  });

  describe('getExportHistory', () => {
    it('returns all history when no projectId is provided', async () => {
      const history = [
        {
          id: 'hist-1',
          projectId: 'proj-1',
          exportType: 'pdf' as const,
          fileName: 'export.pdf',
          fileSizeBytes: 1024,
          exportTimestamp: 123456789,
          passwordProtected: 1,
          success: 1,
          errorMessage: null,
        },
      ];
      (exportHistoryRepository.getAll as jest.Mock).mockResolvedValue(history);

      const result = await getExportHistory();

      expect(exportHistoryRepository.getAll).toHaveBeenCalled();
      expect(result).toEqual(history);
    });

    it('filters history by projectId', async () => {
      (exportHistoryRepository.getByProjectId as jest.Mock).mockResolvedValue([]);

      await getExportHistory('proj-1');

      expect(exportHistoryRepository.getByProjectId).toHaveBeenCalledWith('proj-1');
    });
  });

  describe('clearExportHistory', () => {
    it('clears all export history via repository', async () => {
      (exportHistoryRepository.clearAll as jest.Mock).mockResolvedValue(undefined);

      await clearExportHistory();

      expect(exportHistoryRepository.clearAll).toHaveBeenCalled();
    });
  });
});
