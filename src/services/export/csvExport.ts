import * as FileSystem from 'expo-file-system';
import { projectRepository, issueRepository } from '@services/db/repositories';
import { encryptWithPassphrase } from '@services/backup/crypto';
import { computeSha256, joinPath } from './shareExport';
import { exportHistoryRepository } from '@services/db/repositories';
import { assertEnoughDiskSpace } from './diskSpaceCheck';
import type { ExportResult } from './types';

const CSV_HEADER =
  'id,projectId,title,description,category,severity,status,locationDescription,assignedTo,dueDate,createdAt,updatedAt';

function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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

/** Export Project To C S V. */
export async function exportProjectToCSV(
  projectId: string,
  password?: string,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<ExportResult> {
  const tempFiles: string[] = [];
  try {
    onProgress?.(0);
    const project = await projectRepository.getById(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    checkAbort(signal);

    onProgress?.(33);
    const issues = await issueRepository.getByProjectId(projectId);

    const rows = issues.map((issue) =>
      [
        issue.id,
        issue.projectId,
        issue.title,
        issue.description,
        issue.category,
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

    const csvContent = [CSV_HEADER, ...rows].join('\n');
    await assertEnoughDiskSpace(csvContent.length);
    checkAbort(signal);

    let result: ExportResult;

    if (password) {
      const encrypted = await encryptWithPassphrase(csvContent, password);
      const fileName = `project-${projectId}-${Date.now()}.csv.enc`;
      const filePath = joinPath(FileSystem.documentDirectory, fileName);
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
      const fileName = `project-${projectId}-${Date.now()}.csv`;
      const filePath = joinPath(FileSystem.documentDirectory, fileName);
      tempFiles.push(filePath);
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      checkAbort(signal);

      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const checksum = await computeSha256(csvContent);

      result = {
        filePath,
        fileSize: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
        checksum,
      };
    }

    const fileName = result.filePath.split('/').pop() ?? result.filePath;
    onProgress?.(100);

    await exportHistoryRepository.create({
      projectId,
      exportType: 'csv',
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
