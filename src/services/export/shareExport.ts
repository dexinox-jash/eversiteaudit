import * as Sharing from 'expo-sharing';
import type { ExportResult } from './types';

/** Join directory and filename ensuring exactly one separator. */
export function joinPath(dir: string | null | undefined, fileName: string): string {
  if (!dir) return fileName;
  const normalized = dir.endsWith('/') ? dir : `${dir}/`;
  return `${normalized}${fileName}`;
}

/** Get Mime Type From Path. */
export function getMimeTypeFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'json':
      return 'application/json';
    case 'csv':
      return 'text/csv';
    case 'zip':
      return 'application/zip';
    default:
      return 'application/octet-stream';
  }
}

function getMimeTypeAndUti(fileUri: string): { mimeType: string; UTI: string } {
  const ext = fileUri.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' };
    case 'json':
      return { mimeType: 'application/json', UTI: 'public.json' };
    case 'csv':
      return { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' };
    case 'zip':
      return { mimeType: 'application/zip', UTI: 'com.pkware.zip-archive' };
    case 'bin':
    default:
      return { mimeType: 'application/octet-stream', UTI: 'public.data' };
  }
}

/** Share File. */
export async function shareFile(fileUri: string | ExportResult): Promise<void> {
  try {
    const uri = typeof fileUri === 'string' ? fileUri : fileUri.filePath;
    const mimeType = typeof fileUri === 'string' ? undefined : fileUri.mimeType;
    const { mimeType: detectedMimeType, UTI } = getMimeTypeAndUti(uri);
    await Sharing.shareAsync(uri, {
      mimeType: mimeType ?? detectedMimeType,
      UTI,
    });
  } catch (error) {
    throw new Error(
      error instanceof Error ? `Sharing failed: ${error.message}` : 'Sharing failed.'
    );
  }
}

/** Compute Sha256. */
export async function computeSha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
