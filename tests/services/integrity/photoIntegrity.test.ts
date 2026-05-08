import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import {
  computeFileChecksum,
  verifyFileChecksum,
  verifyPhotosIntegrity,
} from '@services/integrity/photoIntegrity';

jest.mock('expo-crypto');
jest.mock('expo-file-system');

describe('photoIntegrity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('computeFileChecksum', () => {
    it('reads file and returns SHA-256 digest', async () => {
      const mockContent = 'base64content';
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(mockContent);
      (Crypto.digestStringAsync as jest.Mock).mockResolvedValue('sha256-checksum');

      const result = await computeFileChecksum('file:///photo.jpg');

      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith('file:///photo.jpg', {
        encoding: FileSystem.EncodingType.Base64,
      });
      expect(Crypto.digestStringAsync).toHaveBeenCalledWith(
        Crypto.CryptoDigestAlgorithm.SHA256,
        mockContent,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      expect(result).toBe('sha256-checksum');
    });
  });

  describe('verifyFileChecksum', () => {
    it('returns true when checksum matches', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('content');
      (Crypto.digestStringAsync as jest.Mock).mockResolvedValue('expected-checksum');

      const result = await verifyFileChecksum('file:///photo.jpg', 'expected-checksum');
      expect(result).toBe(true);
    });

    it('returns false when checksum does not match', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('content');
      (Crypto.digestStringAsync as jest.Mock).mockResolvedValue('actual-checksum');

      const result = await verifyFileChecksum('file:///photo.jpg', 'expected-checksum');
      expect(result).toBe(false);
    });

    it('returns false when reading file throws', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValue(new Error('File not found'));

      const result = await verifyFileChecksum('file:///photo.jpg', 'expected-checksum');
      expect(result).toBe(false);
    });
  });

  describe('verifyPhotosIntegrity', () => {
    it('marks photos without checksum as invalid', async () => {
      const photos = [
        { id: 'photo-1', originalPath: 'file:///1.jpg', checksum: null },
        { id: 'photo-2', originalPath: 'file:///2.jpg', checksum: 'abc' },
      ];

      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('content');
      (Crypto.digestStringAsync as jest.Mock).mockResolvedValue('abc');

      const results = await verifyPhotosIntegrity(photos);

      expect(results).toEqual([
        { photoId: 'photo-1', valid: false, error: 'No checksum stored' },
        { photoId: 'photo-2', valid: true },
      ]);
    });

    it('verifies checksum for all photos', async () => {
      const photos = [
        { id: 'photo-1', originalPath: 'file:///1.jpg', checksum: 'checksum-1' },
        { id: 'photo-2', originalPath: 'file:///2.jpg', checksum: 'checksum-2' },
      ];

      (FileSystem.readAsStringAsync as jest.Mock)
        .mockResolvedValueOnce('content1')
        .mockResolvedValueOnce('content2');
      (Crypto.digestStringAsync as jest.Mock)
        .mockResolvedValueOnce('checksum-1')
        .mockResolvedValueOnce('wrong-checksum');

      const results = await verifyPhotosIntegrity(photos);

      expect(results).toEqual([
        { photoId: 'photo-1', valid: true },
        { photoId: 'photo-2', valid: false },
      ]);
    });

    it('handles verification errors gracefully', async () => {
      const photos = [{ id: 'photo-1', originalPath: 'file:///1.jpg', checksum: 'checksum-1' }];

      (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      const results = await verifyPhotosIntegrity(photos);

      // verifyFileChecksum swallows errors internally and returns false
      expect(results).toEqual([{ photoId: 'photo-1', valid: false }]);
    });

  });
});
