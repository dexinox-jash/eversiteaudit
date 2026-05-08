import { getDatabase } from '../connection';
import { encryptField, decryptField } from '@services/security/fieldEncryption';
import type { ExportHistory, ExportType } from '@/types/domain';

export interface CreateExportHistoryPayload {
  projectId: string;
  exportType: ExportType;
  fileName: string;
  fileSizeBytes: number | null;
  passwordProtected: boolean;
  success: boolean;
  errorMessage?: string | null;
}

interface ExportHistoryRow {
  id: string;
  project_id: string;
  export_type: string;
  file_name: string;
  file_size_bytes: number | null;
  export_timestamp: number;
  password_protected: number;
  success: number;
  error_message: string | null;
}

async function mapRowToExportHistory(row: ExportHistoryRow): Promise<ExportHistory> {
  return {
    id: row.id,
    projectId: row.project_id,
    exportType: row.export_type as ExportType,
    fileName: (await decryptField(row.file_name)) ?? '',
    fileSizeBytes: row.file_size_bytes,
    exportTimestamp: row.export_timestamp,
    passwordProtected: row.password_protected,
    success: row.success,
    errorMessage: (await decryptField(row.error_message)) ?? null,
  };
}

/**  Export History Repository. */
export class ExportHistoryRepository {
  private db = getDatabase();

  /** Create. */
  async create(payload: CreateExportHistoryPayload): Promise<ExportHistory> {
    const now = Date.now();
    const id = crypto.randomUUID();
    const encryptedFileName = (await encryptField(payload.fileName)) ?? null;
    const encryptedErrorMessage = (await encryptField(payload.errorMessage ?? null)) ?? null;

    await this.db.runAsync(
      `INSERT INTO export_history (
        id, project_id, export_type, file_name, file_size_bytes,
        export_timestamp, password_protected, success, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.projectId,
        payload.exportType,
        encryptedFileName,
        payload.fileSizeBytes ?? null,
        now,
        payload.passwordProtected ? 1 : 0,
        payload.success ? 1 : 0,
        encryptedErrorMessage,
      ]
    );

    const row = await this.db.getFirstAsync(`SELECT * FROM export_history WHERE id = ?`, [id]);
    if (!row) {
      throw new Error('Failed to retrieve created export history');
    }
    return mapRowToExportHistory(row as ExportHistoryRow);
  }

  /** Get By Project Id. */
  async getByProjectId(projectId: string): Promise<ExportHistory[]> {
    const rows = await this.db.getAllAsync(
      `SELECT * FROM export_history WHERE project_id = ? ORDER BY export_timestamp DESC`,
      [projectId]
    );
    return await Promise.all((rows as ExportHistoryRow[]).map(mapRowToExportHistory));
  }

  /** Get All. */
  async getAll(): Promise<ExportHistory[]> {
    const rows = await this.db.getAllAsync(
      `SELECT * FROM export_history ORDER BY export_timestamp DESC`
    );
    return await Promise.all((rows as ExportHistoryRow[]).map(mapRowToExportHistory));
  }

  /** Delete. */
  async delete(id: string): Promise<void> {
    await this.db.runAsync(`DELETE FROM export_history WHERE id = ?`, [id]);
  }

  /** Clear All. */
  async clearAll(): Promise<void> {
    await this.db.runAsync(`DELETE FROM export_history`);
  }
}

export const exportHistoryRepository = new ExportHistoryRepository();
