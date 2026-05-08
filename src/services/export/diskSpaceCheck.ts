import * as FileSystem from 'expo-file-system';

const AVG_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB heuristic

function formatMegabytes(bytes: number): string {
  return `${Math.ceil(bytes / (1024 * 1024))}`;
}

/**
 * Check whether the device has enough free disk space for an estimated
 * output size. If the estimated size exceeds 80 % of available space, a
 * user-friendly error is thrown.
 */
export async function assertEnoughDiskSpace(estimatedBytes: number): Promise<void> {
  const freeBytes = await FileSystem.getFreeDiskStorageAsync();
  const threshold = freeBytes * 0.8;
  if (estimatedBytes > threshold) {
    const needed = formatMegabytes(estimatedBytes - threshold);
    throw new Error(`Not enough storage space. Free up ${needed} MB and try again.`);
  }
}

/** Rough heuristic for ZIP / backup size based on photo count. */
export function estimateZipSize(photoCount: number): number {
  return photoCount * AVG_PHOTO_SIZE_BYTES + 1024 * 1024; // photos + 1 MB overhead
}

/** Rough heuristic for PDF size before generation. */
export function estimatePdfSize(issueCount: number, photoCount: number): number {
  return issueCount * 10 * 1024 + photoCount * 100 * 1024 + 512 * 1024;
}
