import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import * as CryptoJS from 'crypto-js';
import { decryptWithPassphrase, decryptKey } from './crypto';
import { storeEncryptionKey } from '@services/security/keyStore';
import type { BackupManifest, RestoreResult } from './types';

const SUPPORTED_MANIFEST_VERSIONS = [1, 2] as const;

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/\.{2,}/g, '_')
    .replace(/[/\\]/g, '_')
    .replace(/^\.+/, '_');
}

function uint8ToWordArray(u8: Uint8Array): CryptoJS.lib.WordArray {
  const words: number[] = [];
  for (let i = 0; i < u8.length; i++) {
    words[i >>> 2] = (words[i >>> 2] ?? 0) | (u8[i]! << (24 - (i % 4) * 8));
  }
  return CryptoJS.lib.WordArray.create(words, u8.length);
}

function computeSha256FromBase64(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const hash = CryptoJS.SHA256(uint8ToWordArray(bytes));
  return hash.toString(CryptoJS.enc.Hex);
}

/** Restore Backup. */
export async function restoreBackup(backupUri: string, passphrase: string): Promise<RestoreResult> {
  const errors: string[] = [];

  // Read and decrypt backup
  const encryptedContent = await FileSystem.readAsStringAsync(backupUri, { encoding: 'utf8' });
  let zipBase64: string;
  try {
    zipBase64 = await decryptWithPassphrase(encryptedContent, passphrase);
  } catch {
    errors.push('Decryption failed: incorrect passphrase or corrupted backup.');
    return { success: false, stagedDbPath: '', extractedPhotosCount: 0, errors };
  }

  // Load ZIP
  const zip = new JSZip();
  let zipContents: JSZip;
  try {
    zipContents = await zip.loadAsync(zipBase64, { base64: true });
  } catch {
    errors.push('Invalid backup archive: unable to parse ZIP contents.');
    return { success: false, stagedDbPath: '', extractedPhotosCount: 0, errors };
  }

  // Validate manifest
  const manifestFile = zipContents.file('manifest.json');
  if (!manifestFile) {
    errors.push('Backup manifest missing.');
    return { success: false, stagedDbPath: '', extractedPhotosCount: 0, errors };
  }

  const manifestRaw = await manifestFile.async('string');
  let manifest: BackupManifest;
  try {
    manifest = JSON.parse(manifestRaw) as BackupManifest;
  } catch {
    errors.push('Backup manifest is corrupted.');
    return { success: false, stagedDbPath: '', extractedPhotosCount: 0, errors };
  }

  if (!SUPPORTED_MANIFEST_VERSIONS.includes(manifest.version as 1 | 2)) {
    errors.push(`Unsupported backup version: ${manifest.version}`);
  }

  // Validate checksums
  const dbFile = zipContents.file(manifest.dbFileName);
  if (!dbFile) {
    errors.push('Database file missing from backup.');
  } else {
    const dbBase64 = await dbFile.async('base64');
    const dbChecksum = computeSha256FromBase64(dbBase64);
    if (dbChecksum !== manifest.checksums[manifest.dbFileName]) {
      errors.push('Database file checksum mismatch.');
    }
  }

  for (const photo of manifest.photos) {
    const photoFile = zipContents.file(`photos/${photo.fileName}`);
    if (!photoFile) {
      errors.push(`Photo missing from backup: ${photo.fileName}`);
      continue;
    }
    const photoBase64 = await photoFile.async('base64');
    const photoChecksum = computeSha256FromBase64(photoBase64);
    if (photoChecksum !== manifest.checksums[`photos/${photo.fileName}`]) {
      errors.push(`Photo checksum mismatch: ${photo.fileName}`);
    }
  }

  if (errors.length > 0) {
    return { success: false, stagedDbPath: '', extractedPhotosCount: 0, errors };
  }

  // Restore encryption key from escrow
  if (manifest.keyEscrow) {
    try {
      const encryptionKey = await decryptKey(manifest.keyEscrow, passphrase);
      await storeEncryptionKey(encryptionKey);
    } catch (err) {
      errors.push(
        `Failed to restore encryption key: ${err instanceof Error ? err.message : String(err)}`
      );
      return { success: false, stagedDbPath: '', extractedPhotosCount: 0, errors };
    }
  }

  // Stage database
  const stagedDbPath = `${FileSystem.cacheDirectory ?? ''}restore_db_${Date.now()}.sqlite`;
  const dbBase64 = await dbFile!.async('base64');
  await FileSystem.writeAsStringAsync(stagedDbPath, dbBase64, { encoding: 'base64' });

  // Extract photos
  const photosDir = `${FileSystem.documentDirectory ?? ''}photos/`;
  const photosDirInfo = await FileSystem.getInfoAsync(photosDir);
  if (!photosDirInfo.exists) {
    await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
  }

  let extractedPhotosCount = 0;
  for (const photo of manifest.photos) {
    const photoFile = zipContents.file(`photos/${photo.fileName}`);
    if (!photoFile) continue;
    const photoBase64 = await photoFile.async('base64');
    const safeFileName = sanitizeFileName(photo.fileName);
    const photoPath = `${photosDir}${safeFileName}`;
    await FileSystem.writeAsStringAsync(photoPath, photoBase64, { encoding: 'base64' });
    extractedPhotosCount++;
  }

  // Write restore pending marker so connection.ts can swap the DB on next launch.
  // The marker carries a sequence id + state so a crash mid-swap is recoverable
  // (see applyPendingRestore in src/services/db/connection.ts).
  const pendingMarker = `${FileSystem.cacheDirectory ?? ''}RESTORE_PENDING.json`;
  const seqBytes = CryptoJS.lib.WordArray.random(8).toString(CryptoJS.enc.Hex);
  const seq = `${Date.now()}-${seqBytes}`;
  const liveDbBackupPath = `${FileSystem.documentDirectory ?? ''}SQLite/eversiteaudit.db.bak-${seq}`;
  await FileSystem.writeAsStringAsync(
    pendingMarker,
    JSON.stringify({ seq, state: 'staged', stagedDbPath, liveDbBackupPath }),
    { encoding: 'utf8' }
  );

  return {
    success: true,
    stagedDbPath,
    extractedPhotosCount,
    errors: [],
  };
}
