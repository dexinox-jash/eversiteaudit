jest.unmock('@services/security/keyStore');

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import {
  getOrCreateEncryptionKey,
  storeEncryptionKey,
  clearEncryptionKey,
} from '@services/security/keyStore';

jest.mock('expo-secure-store');
jest.mock('expo-crypto');

describe('keyStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateEncryptionKey', () => {
    it('returns existing key from secure store', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('existing-key-hex');

      const key = await getOrCreateEncryptionKey();
      expect(key).toBe('existing-key-hex');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('esa_db_encryption_key');
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('generates and stores a new 64-character hex key when none exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      (Crypto.getRandomValues as jest.Mock).mockImplementation((arr: Uint8Array) => {
        arr.fill(0xab);
        return arr;
      });

      const key = await getOrCreateEncryptionKey();
      expect(key).toBe('ab'.repeat(32));
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'esa_db_encryption_key',
        'ab'.repeat(32)
      );
    });

    it('throws when secure store fails', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Store locked'));

      await expect(getOrCreateEncryptionKey()).rejects.toThrow(
        /Failed to get or create encryption key/
      );
    });

    it('throws with non-Error rejection', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue('string-error');

      await expect(getOrCreateEncryptionKey()).rejects.toThrow(
        'Failed to get or create encryption key: string-error'
      );
    });
  });

  describe('storeEncryptionKey', () => {
    it('stores the given key', async () => {
      await storeEncryptionKey('my-key');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('esa_db_encryption_key', 'my-key');
    });

    it('throws when storing fails', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('Store locked'));
      await expect(storeEncryptionKey('my-key')).rejects.toThrow(/Failed to store encryption key/);
    });

    it('throws with non-Error rejection', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(123);
      await expect(storeEncryptionKey('my-key')).rejects.toThrow(
        'Failed to store encryption key: 123'
      );
    });
  });

  describe('clearEncryptionKey', () => {
    it('deletes the stored key', async () => {
      await clearEncryptionKey();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('esa_db_encryption_key');
    });

    it('throws when deletion fails', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(new Error('Store locked'));
      await expect(clearEncryptionKey()).rejects.toThrow(/Failed to clear encryption key/);
    });

    it('throws with non-Error rejection', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(null);
      await expect(clearEncryptionKey()).rejects.toThrow(
        'Failed to clear encryption key: null'
      );
    });
  });
});
