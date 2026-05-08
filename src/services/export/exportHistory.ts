import { exportHistoryRepository } from '@services/db/repositories';
import type { ExportHistory, ExportType } from '@/types/domain';

export interface RecordExportParams {
  projectId: string;
  exportType: string;
  fileName: string;
  fileSizeBytes: number | null;
  passwordProtected: boolean;
  success: boolean;
  errorMessage?: string | null;
}

/** Record Export. */
export async function recordExport(params: RecordExportParams): Promise<void> {
  await exportHistoryRepository.create({
    projectId: params.projectId,
    exportType: params.exportType as ExportType,
    fileName: params.fileName,
    fileSizeBytes: params.fileSizeBytes,
    passwordProtected: params.passwordProtected,
    success: params.success,
    errorMessage: params.errorMessage ?? null,
  });
}

/** Get Export History. */
export async function getExportHistory(projectId?: string): Promise<ExportHistory[]> {
  if (projectId) {
    return exportHistoryRepository.getByProjectId(projectId);
  }
  return exportHistoryRepository.getAll();
}

/** Clear Export History. */
export async function clearExportHistory(): Promise<void> {
  await exportHistoryRepository.clearAll();
}
