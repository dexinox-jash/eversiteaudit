import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';

/** Compute File Checksum. */
export async function computeFileChecksum(uri: string): Promise<string> {
  // TODO: expo-crypto does not expose a streaming digest API. Loading the entire
  // file as Base64 into JS heap can cause OOM for large images. Consider:
  // 1. A native module that computes SHA-256 in chunks, or
  // 2. expo-crypto's digestAsync with a Uint8Array if chunking support is added.
  const content = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, content, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
}

/** Verify File Checksum. */
export async function verifyFileChecksum(uri: string, expectedChecksum: string): Promise<boolean> {
  try {
    const actual = await computeFileChecksum(uri);
    return actual === expectedChecksum;
  } catch {
    return false;
  }
}

export interface IntegrityResult {
  photoId: string;
  valid: boolean;
  error?: string;
}

/** Verify Photos Integrity. */
export async function verifyPhotosIntegrity(
  photos: { id: string; originalPath: string; checksum: string | null }[]
): Promise<IntegrityResult[]> {
  const results: IntegrityResult[] = [];

  for (const photo of photos) {
    if (!photo.checksum) {
      results.push({ photoId: photo.id, valid: false, error: 'No checksum stored' });
      continue;
    }

    const valid = await verifyFileChecksum(photo.originalPath, photo.checksum);
    results.push({ photoId: photo.id, valid });
  }

  return results;
}
