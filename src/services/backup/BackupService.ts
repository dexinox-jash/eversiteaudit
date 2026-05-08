import * as FileSystem from 'expo-file-system';
import { createBackup } from './BackupArchiver';
import { restoreBackup } from './BackupExtractor';
import type { BackupResult, RestoreResult } from './types';

export { createBackup, restoreBackup };
export type { BackupResult, RestoreResult };

export interface BackupService {
  createBackup(passphrase: string): Promise<BackupResult>;
  restoreBackup(backupUri: string, passphrase: string): Promise<RestoreResult>;
  deleteBackup(backupUri: string): Promise<void>;
  listBackups(): Promise<BackupResult[]>;
}

/** Delete Backup. */
export async function deleteBackup(backupUri: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(backupUri);
  if (info.exists) {
    await FileSystem.deleteAsync(backupUri);
  }
}

/** List Backups. */
export async function listBackups(): Promise<BackupResult[]> {
  const dir = FileSystem.documentDirectory ?? '';
  const items = await FileSystem.readDirectoryAsync(dir);
  const backupFiles = items.filter(
    (name) => name.startsWith('esa_backup_') && name.endsWith('.bin')
  );

  const results: BackupResult[] = [];
  for (const fileName of backupFiles) {
    const uri = `${dir}${fileName}`;
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && 'size' in info) {
      const timestamp = parseInt(fileName.replace('esa_backup_', '').replace('.bin', ''), 10);
      results.push({
        uri,
        fileName,
        fileSizeBytes: info.size,
        createdAt: isNaN(timestamp) ? 0 : timestamp,
      });
    }
  }

  return results.sort((a, b) => b.createdAt - a.createdAt);
}
