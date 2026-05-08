export interface ExportOptions {
  projectId: string;
  format: 'json' | 'csv' | 'zip' | 'pdf';
  includePhotos?: boolean;
}

export interface ExportResult {
  filePath: string;
  fileSize: number;
  checksum: string;
  mimeType?: string;
}
