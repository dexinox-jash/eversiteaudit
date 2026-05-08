import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import * as CryptoJS from 'crypto-js';
import { getDatabase } from '@services/db/connection';
import { photoRepository } from '@services/db/repositories';
import { encryptWithPassphrase, encryptKey } from './crypto';
import { getOrCreateEncryptionKey } from '@services/security/keyStore';
import { assertEnoughDiskSpace, estimateZipSize } from '@services/export/diskSpaceCheck';
import type { BackupManifest, BackupResult } from './types';

const BACKUP_MANIFEST_VERSION = 2;

function sanitizeFileName(filePath: string): string {
  const name = filePath.split(/[/\\]/).pop() ?? filePath;
  return name
    .replace(/\.{2,}/g, '_')
    .replace(/[/\\]/g, '_')
    .replace(/^\.+/, '_');
}

function getDbFilePath(): string {
  // expo-sqlite databases are stored in the SQLite directory under documentDirectory
  getDatabase(); // ensure database is initialized before accessing its path
  // The database path in expo-sqlite/next is typically:
  // documentDirectory/SQLite/eversiteaudit.db
  return `${FileSystem.documentDirectory ?? ''}SQLite/eversiteaudit.db`;
}

/** Compute SHA-256 of a file. */
export async function computeSha256(filePath: string): Promise<string> {
  await FileSystem.getInfoAsync(filePath, { md5: false });
  const content = await FileSystem.readAsStringAsync(filePath, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const hash = CryptoJS.SHA256(uint8ToWordArray(bytes));
  return hash.toString(CryptoJS.enc.Hex);
}

function uint8ToWordArray(u8: Uint8Array): CryptoJS.lib.WordArray {
  const words: number[] = [];
  for (let i = 0; i < u8.length; i++) {
    words[i >>> 2] = (words[i >>> 2] ?? 0) | (u8[i]! << (24 - (i % 4) * 8));
  }
  return CryptoJS.lib.WordArray.create(words, u8.length);
}

/** Create Backup. */
export async function createBackup(passphrase: string): Promise<BackupResult> {
  const dbPath = getDbFilePath();
  const dbExists = await FileSystem.getInfoAsync(dbPath);
  if (!dbExists.exists) {
    throw new Error('Database file not found. Cannot create backup.');
  }

  const photos = await photoRepository.getAll();
  const activePhotos = photos.filter((p) => !p.isDeleted);
  const estimatedSize = estimateZipSize(activePhotos.length);
  await assertEnoughDiskSpace(estimatedSize);

  const zip = new JSZip();

  // Add database file
  const dbBase64 = await FileSystem.readAsStringAsync(dbPath, { encoding: 'base64' });
  zip.file('db.sqlite', dbBase64, { base64: true });

  // Add photos folder
  const photosFolder = zip.folder('photos');
  const photoEntries: BackupManifest['photos'] = [];
  const checksums: Record<string, string> = {};

  for (const photo of activePhotos) {
    const fileName = sanitizeFileName(photo.originalPath) || `${photo.id}.jpg`;
    const photoBase64 = await FileSystem.readAsStringAsync(photo.originalPath, {
      encoding: 'base64',
    });
    photosFolder?.file(fileName, photoBase64, { base64: true });

    const checksum = await computeSha256(photo.originalPath);
    photoEntries.push({ id: photo.id, fileName, checksum });
    checksums[`photos/${fileName}`] = checksum;
  }

  checksums['db.sqlite'] = await computeSha256(dbPath);

  const encryptionKey = await getOrCreateEncryptionKey();
  const keyEscrow = await encryptKey(encryptionKey, passphrase);

  const manifest: BackupManifest = {
    version: BACKUP_MANIFEST_VERSION,
    cryptoVersion: 'v2-gcm',
    createdAt: new Date().toISOString(),
    appVersion: '1.0.0',
    dbFileName: 'db.sqlite',
    photos: photoEntries,
    checksums,
    keyEscrow,
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  const zipBase64 = await zip.generateAsync({ type: 'base64' });
  const encrypted = await encryptWithPassphrase(zipBase64, passphrase);

  const fileName = `esa_backup_${Date.now()}.bin`;
  const filePath = `${FileSystem.documentDirectory ?? ''}${fileName}`;
  await FileSystem.writeAsStringAsync(filePath, encrypted, { encoding: 'utf8' });

  const info = await FileSystem.getInfoAsync(filePath);
  const fileSizeBytes = info.exists && 'size' in info ? info.size : 0;

  return {
    uri: filePath,
    fileName,
    fileSizeBytes,
    createdAt: Date.now(),
  };
}
