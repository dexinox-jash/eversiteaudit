import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const KEY_ALIAS = 'esa_db_encryption_key';

/**
 * Retrieve the existing encryption key from secure storage, or generate a new
 * 256-bit (32-byte) key, hex-encode it to 64 characters, and store it.
 */
export async function getOrCreateEncryptionKey(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(KEY_ALIAS);
    if (existing) {
      return existing;
    }

    const bytes = Crypto.getRandomValues(new Uint8Array(32));
    const key = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    await SecureStore.setItemAsync(KEY_ALIAS, key);
    return key;
  } catch (error) {
    throw new Error(
      `Failed to get or create encryption key: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Store the given encryption key in secure storage.
 */
export async function storeEncryptionKey(key: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY_ALIAS, key);
  } catch (error) {
    throw new Error(
      `Failed to store encryption key: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Remove the encryption key from secure storage.
 */
export async function clearEncryptionKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY_ALIAS);
  } catch (error) {
    throw new Error(
      `Failed to clear encryption key: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
