import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import { projectRepository, issueRepository, photoRepository } from '@services/db/repositories';
import { encryptWithPassphrase } from '@services/backup/crypto';
import { computeSha256, joinPath } from './shareExport';
import { exportHistoryRepository } from '@services/db/repositories';
import { assertEnoughDiskSpace, estimateZipSize } from './diskSpaceCheck';
import type { Issue, Photo } from '@/types/domain';
import type { ExportResult } from './types';

interface IssueWithPhotos extends Issue {
  photos: Photo[];
}

const CSV_HEADER =
  'id,title,description,severity,status,locationDescription,assignedTo,dueDate,createdAt,updatedAt';

function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function getFileNameFromPath(filePath: string): string {
  const name = filePath.split(/[/\\]/).pop() ?? filePath;
  return (
    name
      .replace(/\.{2,}/g, '_')
      .replace(/[/\\]/g, '_')
      .replace(/^\.+/, '_') || filePath
  );
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

/** Export Project To Z I P. */
export async function exportProjectToZIP(
  projectId: string,
  password?: string,
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

    const estimatedSize = estimateZipSize(photos.length);
    await assertEnoughDiskSpace(estimatedSize);
    checkAbort(signal);

    const zip = new JSZip();

    const issuesWithPhotos: IssueWithPhotos[] = issues.map((issue) => ({
      ...issue,
      photos: photos.filter((photo) => photo.issueId === issue.id),
    }));

    zip.file('project.json', JSON.stringify({ project, issues: issuesWithPhotos }, null, 2));

    const csvRows = issues.map((issue) =>
      [
        issue.id,
        issue.title,
        issue.description,
        issue.severity,
        issue.status,
        issue.locationDescription,
        issue.assignedTo,
        issue.dueDate,
        issue.createdAt,
        issue.updatedAt,
      ]
        .map(escapeCsv)
        .join(',')
    );
    const csvContent = [CSV_HEADER, ...csvRows].join('\n');
    zip.file('issues.csv', csvContent);

    const photosFolder = zip.folder('photos');
    for (let i = 0; i < photos.length; i++) {
      checkAbort(signal);
      const photo = photos[i];
      if (!photo) continue;
      try {
        const fileName = getFileNameFromPath(photo.originalPath);
        const base64 = await FileSystem.readAsStringAsync(photo.originalPath, {
          encoding: 'base64',
        });
        photosFolder?.file(fileName, base64, { base64: true });
      } catch (err) {
        console.warn(`[zipExport] Skipping missing photo ${photo.id}:`, err);
      }
      onProgress?.(Math.round(((i + 1) / photos.length) * 100));
    }

    if (photos.length === 0) {
      onProgress?.(100);
    }

    checkAbort(signal);
    const zipBase64 = await zip.generateAsync({ type: 'base64' });

    let result: ExportResult;

    if (password) {
      const encrypted = await encryptWithPassphrase(zipBase64, password);
      const fileName = `export_${projectId}_${Date.now()}.zip.enc`;
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
      };
    } else {
      const fileName = `export_${projectId}_${Date.now()}.zip`;
      const filePath = joinPath(FileSystem.cacheDirectory, fileName);
      tempFiles.push(filePath);
      await FileSystem.writeAsStringAsync(filePath, zipBase64, {
        encoding: 'base64',
      });
      checkAbort(signal);

      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const checksum = await computeSha256(zipBase64);

      result = {
        filePath,
        fileSize: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
        checksum,
      };
    }

    const fileName = result.filePath.split('/').pop() ?? result.filePath;
    await exportHistoryRepository.create({
      projectId,
      exportType: 'zip',
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
