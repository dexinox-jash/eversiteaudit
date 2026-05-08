import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import {
  projectRepository,
  issueRepository,
  photoRepository,
  annotationRepository,
} from '@services/db/repositories';
import { encryptWithPassphrase } from '@services/backup/crypto';
import { computeSha256, joinPath } from './shareExport';
import { exportHistoryRepository } from '@services/db/repositories';
import { getReportTemplate } from './reportTemplates';
import { assertEnoughDiskSpace, estimatePdfSize } from './diskSpaceCheck';
import type { ExportResult } from './types';

export interface PDFBranding {
  companyName?: string | null;
  headerText?: string | null;
  footerText?: string | null;
}

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error('Export aborted');
  }
}

async function cleanupFiles(filePaths: string[]): Promise<void> {
  await Promise.all(
    filePaths.map(async (path) => {
      try {
        await FileSystem.deleteAsync(path, { idempotent: true });
      } catch {
        // ignore cleanup errors
      }
    })
  );
}

/** Export Project To P D F. */
export async function exportProjectToPDF(
  projectId: string,
  password?: string,
  branding?: PDFBranding,
  templateId?: string,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<ExportResult> {
  const tempFiles: string[] = [];
  try {
    const project = await projectRepository.getById(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    checkAbort(signal);

    const issues = await issueRepository.getByProjectId(projectId);
    const photos = await photoRepository.getByProjectId(projectId);
    checkAbort(signal);

    const estimatedSize = estimatePdfSize(issues.length, photos.length);
    await assertEnoughDiskSpace(estimatedSize);
    checkAbort(signal);

    const annotationResults = await Promise.all(
      photos.map(async (photo) => {
        const anns = await annotationRepository.getByPhotoId(photo.id);
        return { photoId: photo.id, count: anns.length };
      })
    );
    const annotationCountMap = new Map(annotationResults.map((a) => [a.photoId, a.count]));
    const template = getReportTemplate(templateId);
    const html = template.generate(project, issues, photos, {
      branding: branding ?? {},
      annotationCountMap,
    });
    checkAbort(signal);

    const { uri } = await Print.printToFileAsync({ html, base64: false });
    checkAbort(signal);

    onProgress?.(100);

    let result: ExportResult;

    if (password) {
      const pdfBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      checkAbort(signal);
      const encrypted = await encryptWithPassphrase(pdfBase64, password);
      const fileName = `export_${projectId}_${Date.now()}.pdf.enc`;
      const filePath = joinPath(FileSystem.cacheDirectory, fileName);
      tempFiles.push(filePath);
      await FileSystem.writeAsStringAsync(filePath, encrypted);
      checkAbort(signal);
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const checksum = await computeSha256(encrypted);
      result = {
        filePath,
        fileSize: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
        checksum,
        mimeType: 'application/pdf',
      };
    } else {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const fileSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      const checksum = await computeSha256(base64);

      result = {
        filePath: uri,
        fileSize,
        checksum,
        mimeType: 'application/pdf',
      };
    }

    const fileName = result.filePath.split('/').pop() ?? result.filePath;
    await exportHistoryRepository.create({
      projectId,
      exportType: 'pdf',
      fileName,
      fileSizeBytes: result.fileSize,
      passwordProtected: !!password,
      success: true,
    });

    return result;
  } catch (error) {
    if (signal?.aborted) {
      await cleanupFiles(tempFiles);
    }
    throw error;
  }
}
