import * as FileSystem from 'expo-file-system';

const EXPORTS_DIR = `${FileSystem.documentDirectory ?? ''}exports/`;
const CACHE_DIR = FileSystem.cacheDirectory ?? '';

export interface CleanupResult {
  bytesFreed: number;
  oldExportsRemoved: number;
  orphanedThumbnailsRemoved: number;
  tempCacheFilesRemoved: number;
}

async function getDirectorySize(dirUri: string): Promise<number> {
  let total = 0;
  try {
    const info = await FileSystem.getInfoAsync(dirUri);
    if (!info.exists || !('isDirectory' in info) || !info.isDirectory) {
      return 0;
    }
    const entries = await FileSystem.readDirectoryAsync(dirUri);
    for (const entry of entries) {
      const entryPath = `${dirUri}${entry}`;
      const entryInfo = await FileSystem.getInfoAsync(entryPath);
      if (entryInfo.exists) {
        if ('isDirectory' in entryInfo && entryInfo.isDirectory) {
          total += await getDirectorySize(`${entryPath}/`);
        } else if ('size' in entryInfo) {
          total += entryInfo.size ?? 0;
        }
      }
    }
  } catch {
    // ignore
  }
  return total;
}

/** Calculate Cache Size. */
export async function calculateCacheSize(): Promise<number> {
  const exportsSize = await getDirectorySize(EXPORTS_DIR);
  const cacheSize = await getDirectorySize(CACHE_DIR);
  return exportsSize + cacheSize;
}

/** Clear Old Exports. */
export async function clearOldExports(
  maxAgeDays = 7
): Promise<{ removed: number; bytesFreed: number }> {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  let removed = 0;
  let bytesFreed = 0;

  try {
    const info = await FileSystem.getInfoAsync(EXPORTS_DIR);
    if (!info.exists || !('isDirectory' in info) || !info.isDirectory) {
      return { removed, bytesFreed };
    }

    const entries = await FileSystem.readDirectoryAsync(EXPORTS_DIR);
    for (const entry of entries) {
      const entryPath = `${EXPORTS_DIR}${entry}`;
      const entryInfo = await FileSystem.getInfoAsync(entryPath);
      if (entryInfo.exists && !('isDirectory' in entryInfo && entryInfo.isDirectory)) {
        const modTime = 'modificationTime' in entryInfo ? entryInfo.modificationTime : null;
        if (modTime && modTime * 1000 < cutoff) {
          const size = 'size' in entryInfo ? (entryInfo.size ?? 0) : 0;
          await FileSystem.deleteAsync(entryPath, { idempotent: true });
          bytesFreed += size;
          removed++;
        }
      }
    }
  } catch {
    // ignore
  }

  return { removed, bytesFreed };
}

/** Clear Orphaned Thumbnails. */
export function clearOrphanedThumbnails(): Promise<{ removed: number; bytesFreed: number }> {
  // This is a placeholder implementation. In a real app, we would scan the
  // photos table and compare against the thumbnail directory. Since we don't
  // have direct DB access here without importing repositories (which could
  // create circular deps), we return zero. The UI can call a more integrated
  // version later if needed.
  return Promise.resolve({ removed: 0, bytesFreed: 0 });
}

/** Clear Temp Cache. */
export async function clearTempCache(): Promise<{ removed: number; bytesFreed: number }> {
  let removed = 0;
  let bytesFreed = 0;

  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists || !('isDirectory' in info) || !info.isDirectory) {
      return { removed, bytesFreed };
    }

    const entries = await FileSystem.readDirectoryAsync(CACHE_DIR);
    for (const entry of entries) {
      const entryPath = `${CACHE_DIR}${entry}`;
      const entryInfo = await FileSystem.getInfoAsync(entryPath);
      if (entryInfo.exists) {
        const size = 'size' in entryInfo ? (entryInfo.size ?? 0) : 0;
        await FileSystem.deleteAsync(entryPath, { idempotent: true });
        bytesFreed += size;
        removed++;
      }
    }
  } catch {
    // ignore
  }

  return { removed, bytesFreed };
}

/** Run Full Cleanup. */
export async function runFullCleanup(maxAgeDays = 7): Promise<CleanupResult> {
  const oldExports = await clearOldExports(maxAgeDays);
  const orphanedThumbnails = await clearOrphanedThumbnails();
  const tempCache = await clearTempCache();

  return {
    bytesFreed: oldExports.bytesFreed + orphanedThumbnails.bytesFreed + tempCache.bytesFreed,
    oldExportsRemoved: oldExports.removed,
    orphanedThumbnailsRemoved: orphanedThumbnails.removed,
    tempCacheFilesRemoved: tempCache.removed,
  };
}
