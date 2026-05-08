import * as FileSystem from 'expo-file-system';
import {
  calculateCacheSize,
  clearOldExports,
  clearOrphanedThumbnails,
  clearTempCache,
  runFullCleanup,
} from '@services/storage/cacheManager';

jest.mock('expo-file-system');

describe('cacheManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateCacheSize', () => {
    it('returns 0 when directories do not exist', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

      const size = await calculateCacheSize();
      expect(size).toBe(0);
    });

    it('sums file sizes in cache and exports directories', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
        if (path === `${FileSystem.documentDirectory ?? ''}exports/`) {
          return { exists: true, isDirectory: true };
        }
        if (path === (FileSystem.cacheDirectory ?? '')) {
          return { exists: true, isDirectory: true };
        }
        return { exists: true, size: 100, isDirectory: false };
      });
      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue(['file1', 'file2']);

      const size = await calculateCacheSize();
      expect(size).toBe(400);
    });

    it('sums sizes including nested subdirectories', async () => {
      const docDir = FileSystem.documentDirectory ?? '';

      (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
        if (path === `${docDir}exports/` || path === `${docDir}exports/nested/`) {
          return { exists: true, isDirectory: true };
        }
        return { exists: true, size: 100, isDirectory: false };
      });

      (FileSystem.readDirectoryAsync as jest.Mock).mockImplementation(async (path: string) => {
        if (path === `${docDir}exports/`) {
          return ['file1', 'nested'];
        }
        if (path === `${docDir}exports/nested/`) {
          return ['nested-file'];
        }
        return [];
      });

      const size = await calculateCacheSize();
      expect(size).toBe(200); // file1 (100) + nested-file (100)
    });
  });

  describe('clearOldExports', () => {
    it('removes files older than maxAgeDays', async () => {
      const oldTime = Math.floor((Date.now() - 10 * 24 * 60 * 60 * 1000) / 1000);
      const recentTime = Math.floor(Date.now() / 1000);

      (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
        if (path === `${FileSystem.documentDirectory ?? ''}exports/`) {
          return { exists: true, isDirectory: true };
        }
        if (path.includes('old')) {
          return { exists: true, size: 200, modificationTime: oldTime, isDirectory: false };
        }
        if (path.includes('recent')) {
          return { exists: true, size: 300, modificationTime: recentTime, isDirectory: false };
        }
        return { exists: false };
      });
      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue(['old.txt', 'recent.txt']);
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await clearOldExports(7);

      expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(1);
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(expect.stringContaining('old.txt'), {
        idempotent: true,
      });
      expect(result.removed).toBe(1);
      expect(result.bytesFreed).toBe(200);
    });

    it('handles entries missing info, modTime, or size', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
        if (path === `${FileSystem.documentDirectory ?? ''}exports/`) {
          return { exists: true, isDirectory: true };
        }
        if (path.includes('ghost')) {
          return { exists: false };
        }
        if (path.includes('no-meta')) {
          return { exists: true, isDirectory: false };
        }
        return { exists: false };
      });

      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
        'ghost.txt',
        'no-meta.txt',
      ]);
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await clearOldExports(7);
      expect(result.removed).toBe(0);
      expect(result.bytesFreed).toBe(0);
    });
  });

  describe('clearOrphanedThumbnails', () => {
    it('returns zero as placeholder', async () => {
      const result = await clearOrphanedThumbnails();
      expect(result).toEqual({ removed: 0, bytesFreed: 0 });
    });
  });

  describe('clearTempCache', () => {
    it('deletes all files in the cache directory', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
        if (path === (FileSystem.cacheDirectory ?? '')) {
          return { exists: true, isDirectory: true };
        }
        return { exists: true, size: 150, isDirectory: false };
      });
      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue(['temp1', 'temp2']);
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await clearTempCache();

      expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(2);
      expect(result.removed).toBe(2);
      expect(result.bytesFreed).toBe(300);
    });
  });

  describe('runFullCleanup', () => {
    it('aggregates results from all cleanup tasks', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

      const result = await runFullCleanup();

      expect(result.bytesFreed).toBe(0);
      expect(result.oldExportsRemoved).toBe(0);
      expect(result.orphanedThumbnailsRemoved).toBe(0);
      expect(result.tempCacheFilesRemoved).toBe(0);
    });
  });
});
