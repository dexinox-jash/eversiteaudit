import * as FileSystem from 'expo-file-system';
import {
  assertEnoughDiskSpace,
  estimateZipSize,
  estimatePdfSize,
} from '@services/export/diskSpaceCheck';

jest.mock('expo-file-system');

describe('diskSpaceCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not throw when estimated size is below 80% of free space', async () => {
    (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(100 * 1024 * 1024); // 100 MB

    await expect(assertEnoughDiskSpace(10 * 1024 * 1024)).resolves.toBeUndefined();
  });

  it('throws a user-friendly error when estimated size exceeds 80% threshold', async () => {
    (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(10 * 1024 * 1024); // 10 MB

    await expect(assertEnoughDiskSpace(9 * 1024 * 1024)).rejects.toThrow(
      'Not enough storage space. Free up 1 MB and try again.'
    );
  });

  it('estimateZipSize returns photo count times average photo size plus overhead', () => {
    expect(estimateZipSize(0)).toBe(1024 * 1024);
    expect(estimateZipSize(5)).toBe(5 * 2 * 1024 * 1024 + 1024 * 1024);
  });

  it('estimatePdfSize returns issue and photo based heuristic', () => {
    expect(estimatePdfSize(10, 5)).toBe(10 * 10 * 1024 + 5 * 100 * 1024 + 512 * 1024);
  });
});
