import * as FileSystem from 'expo-file-system';
import { projectRepository, issueRepository, photoRepository } from '@services/db/repositories';
import { encryptWithPassphrase } from '@services/backup/crypto';
import { computeSha256, joinPath } from './shareExport';
import { exportHistoryRepository } from '@services/db/repositories';
import { assertEnoughDiskSpace } from './diskSpaceCheck';
import type { Project, Issue, Photo } from '@/types/domain';
import type { ExportResult } from './types';

interface ExportData {
  project: Project;
  issues: Issue[];
  photos: Photo[];
  exportedAt: string;
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

/** Export Project To J S O N. */
export async function exportProjectToJSON(
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
    onProgress?.(66);
    checkAbort(signal);
    const photos = await photoRepository.getByProjectId(projectId);

    const data: ExportData = {
      project,
      issues,
      photos,
      exportedAt: new Date().toISOString(),
    };

    const content = JSON.stringify(data, null, 2);
    await assertEnoughDiskSpace(content.length);
    checkAbort(signal);

    let result: ExportResult;

    if (password) {
      const encrypted = await encryptWithPassphrase(content, password);
      const fileName = `project-${projectId}-${Date.now()}.json.enc`;
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
      const fileName = `project-${projectId}-${Date.now()}.json`;
      const filePath = joinPath(FileSystem.documentDirectory, fileName);
      tempFiles.push(filePath);
      await FileSystem.writeAsStringAsync(filePath, content);
      checkAbort(signal);

      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const checksum = await computeSha256(content);

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
      exportType: 'json',
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
