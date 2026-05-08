export type BackupCryptoVersion = 'v1-cbc-sha256' | 'v2-gcm';

export interface BackupManifest {
  version: number;
  /**
   * Declares the cipher construction used for `keyEscrow` and the top-level
   * backup payload. Missing field (older backups) implies `'v1-cbc-sha256'`.
   * New backups created after the v2 migration always set `'v2-gcm'`.
   */
  cryptoVersion?: BackupCryptoVersion;
  createdAt: string;
  appVersion: string;
  dbFileName: string;
  photos: BackupPhotoEntry[];
  checksums: Record<string, string>;
  keyEscrow?: string;
}

export interface BackupPhotoEntry {
  id: string;
  fileName: string;
  checksum: string;
}

export interface BackupResult {
  uri: string;
  fileName: string;
  fileSizeBytes: number;
  createdAt: number;
}

export interface RestoreResult {
  success: boolean;
  stagedDbPath: string;
  extractedPhotosCount: number;
  errors: string[];
}
