import { getDatabase } from '../connection';
import { runMigrations } from '../migrations';
import { encryptField, decryptField } from '@services/security/fieldEncryption';
import type { Issue, IssueSeverity, IssueStatus, IssueCategory } from '@/types/domain';

export interface CreateIssuePayload {
  projectId: string;
  title: string;
  description?: string | null;
  category?: IssueCategory | null;
  severity?: IssueSeverity;
  status?: IssueStatus;
  locationDescription?: string | null;
  assignedTo?: string | null;
  dueDate?: number | null;
}

export interface UpdateIssuePayload {
  title?: string;
  description?: string | null;
  category?: IssueCategory | null;
  severity?: IssueSeverity;
  status?: IssueStatus;
  locationDescription?: string | null;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  gpsAccuracy?: number | null;
  assignedTo?: string | null;
  dueDate?: number | null;
  resolutionNotes?: string | null;
  resolvedAt?: number | null;
  resolvedBy?: string | null;
  voiceNoteUrl?: string | null;
  sortOrder?: number;
}

interface IssueRow {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  category: string | null;
  severity: string;
  status: string;
  location_description: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_accuracy: number | null;
  assigned_to: string | null;
  due_date: number | null;
  resolution_notes: string | null;
  resolved_at: number | null;
  resolved_by: string | null;
  voice_note_url: string | null;
  sort_order: number;
  created_at: number;
  updated_at: number;
  is_deleted: number;
  deleted_at: number | null;
}

async function mapRowToIssue(row: IssueRow): Promise<Issue> {
  return {
    id: row.id,
    projectId: row.project_id,
    title: (await decryptField(row.title)) ?? '',
    description: await decryptField(row.description),
    category: (row.category as IssueCategory) ?? null,
    severity: row.severity as IssueSeverity,
    status: row.status as IssueStatus,
    locationDescription: await decryptField(row.location_description),
    gpsLatitude: row.gps_latitude ?? null,
    gpsLongitude: row.gps_longitude ?? null,
    gpsAccuracy: row.gps_accuracy ?? null,
    assignedTo: await decryptField(row.assigned_to),
    dueDate: row.due_date ?? null,
    resolutionNotes: await decryptField(row.resolution_notes),
    resolvedAt: row.resolved_at ?? null,
    resolvedBy: row.resolved_by ?? null,
    voiceNoteUrl: row.voice_note_url ?? null,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at ?? null,
  };
}

/**  Issue Repository. */
export class IssueRepository {
  private db = getDatabase();

  /**
   * Defensive wrapper: if a query throws because a table does not exist,
   * run migrations once and retry the exact same query exactly once.
   * This guards against race conditions where the app renders before
   * the initial schema has been created.
   */
  private async withTableRecovery<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Error && error.message.includes('no such table')) {
        console.warn('[IssueRepository] Caught "no such table", running recovery migrations...');
        await runMigrations(this.db);
        return await operation();
      }
      throw error;
    }
  }

  /** Get All. */
  async getAll(): Promise<Issue[]> {
    const rows = await this.withTableRecovery(() =>
      this.db.getAllAsync(
        `SELECT * FROM issues WHERE is_deleted = 0 ORDER BY sort_order ASC, updated_at DESC`
      )
    );
    return await Promise.all((rows as IssueRow[]).map(mapRowToIssue));
  }

  /** Get By Id. */
  async getById(id: string): Promise<Issue | null> {
    const row = await this.withTableRecovery(() =>
      this.db.getFirstAsync(`SELECT * FROM issues WHERE id = ? AND is_deleted = 0`, [id])
    );
    return row ? await mapRowToIssue(row as IssueRow) : null;
  }

  /** Get By Project Id. */
  async getByProjectId(projectId: string): Promise<Issue[]> {
    const rows = await this.withTableRecovery(() =>
      this.db.getAllAsync(
        `SELECT * FROM issues WHERE project_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, created_at DESC`,
        [projectId]
      )
    );
    return await Promise.all((rows as IssueRow[]).map(mapRowToIssue));
  }

  /** Create. */
  async create(payload: CreateIssuePayload): Promise<Issue> {
    const now = Date.now();
    const id = crypto.randomUUID();
    const {
      projectId,
      title,
      description = null,
      category = null,
      severity = 'medium',
      status = 'open',
      locationDescription = null,
      assignedTo = null,
      dueDate = null,
    } = payload;

    const encryptedTitle = (await encryptField(title)) ?? null;
    const encryptedDescription = (await encryptField(description)) ?? null;
    const encryptedLocationDescription = (await encryptField(locationDescription)) ?? null;
    const encryptedAssignedTo = (await encryptField(assignedTo)) ?? null;

    await this.withTableRecovery(() =>
      this.db.runAsync(
        `INSERT INTO issues (
          id, project_id, title, description, category, severity, status,
          location_description, gps_latitude, gps_longitude, gps_accuracy,
          assigned_to, due_date, resolution_notes, resolved_at, resolved_by,
          voice_note_url, sort_order, created_at, updated_at, is_deleted, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          projectId,
          encryptedTitle,
          encryptedDescription,
          category,
          severity,
          status,
          encryptedLocationDescription,
          null,
          null,
          null,
          encryptedAssignedTo,
          dueDate,
          null,
          null,
          null,
          null,
          0,
          now,
          now,
          0,
          null,
        ]
      )
    );

    const issue = await this.getById(id);
    if (!issue) {
      throw new Error('Failed to retrieve created issue');
    }
    return issue;
  }

  /** Update. */
  async update(id: string, payload: UpdateIssuePayload): Promise<Issue> {
    const now = Date.now();
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Issue not found: ${id}`);
    }

    const title =
      payload.title !== undefined
        ? ((await encryptField(payload.title)) ?? null)
        : ((await encryptField(existing.title)) ?? null);
    const description =
      payload.description !== undefined
        ? ((await encryptField(payload.description)) ?? null)
        : ((await encryptField(existing.description)) ?? null);
    const category = payload.category !== undefined ? payload.category : existing.category;
    const severity = payload.severity ?? existing.severity;
    const status = payload.status ?? existing.status;
    const locationDescription =
      payload.locationDescription !== undefined
        ? ((await encryptField(payload.locationDescription)) ?? null)
        : ((await encryptField(existing.locationDescription)) ?? null);
    const assignedTo =
      payload.assignedTo !== undefined
        ? ((await encryptField(payload.assignedTo)) ?? null)
        : ((await encryptField(existing.assignedTo)) ?? null);
    const dueDate = payload.dueDate !== undefined ? payload.dueDate : existing.dueDate;
    const resolutionNotes =
      payload.resolutionNotes !== undefined
        ? ((await encryptField(payload.resolutionNotes)) ?? null)
        : ((await encryptField(existing.resolutionNotes)) ?? null);
    const resolvedAt = payload.resolvedAt !== undefined ? payload.resolvedAt : existing.resolvedAt;
    const resolvedBy = payload.resolvedBy !== undefined ? payload.resolvedBy : existing.resolvedBy;
    const voiceNoteUrl =
      payload.voiceNoteUrl !== undefined ? payload.voiceNoteUrl : existing.voiceNoteUrl;
    const gpsLatitude =
      payload.gpsLatitude !== undefined ? payload.gpsLatitude : existing.gpsLatitude;
    const gpsLongitude =
      payload.gpsLongitude !== undefined ? payload.gpsLongitude : existing.gpsLongitude;
    const gpsAccuracy =
      payload.gpsAccuracy !== undefined ? payload.gpsAccuracy : existing.gpsAccuracy;
    const sortOrder = payload.sortOrder ?? existing.sortOrder;

    await this.withTableRecovery(() =>
      this.db.runAsync(
        `UPDATE issues SET
          title = ?,
          description = ?,
          category = ?,
          severity = ?,
          status = ?,
          location_description = ?,
          assigned_to = ?,
          due_date = ?,
          resolution_notes = ?,
          resolved_at = ?,
          resolved_by = ?,
          voice_note_url = ?,
          gps_latitude = ?,
          gps_longitude = ?,
          gps_accuracy = ?,
          sort_order = ?,
          updated_at = ?
        WHERE id = ?`,
        [
          title,
          description,
          category,
          severity,
          status,
          locationDescription,
          assignedTo,
          dueDate,
          resolutionNotes,
          resolvedAt,
          resolvedBy,
          voiceNoteUrl,
          gpsLatitude,
          gpsLongitude,
          gpsAccuracy,
          sortOrder,
          now,
          id,
        ]
      )
    );

    const issue = await this.getById(id);
    if (!issue) {
      throw new Error('Failed to retrieve updated issue');
    }
    return issue;
  }

  /** Update Sort Order. */
  async updateSortOrder(issueId: string, sortOrder: number): Promise<void> {
    const now = Date.now();
    await this.withTableRecovery(() =>
      this.db.runAsync(`UPDATE issues SET sort_order = ?, updated_at = ? WHERE id = ?`, [
        sortOrder,
        now,
        issueId,
      ])
    );
  }

  /** Get Deleted. */
  async getDeleted(): Promise<Issue[]> {
    const rows = await this.withTableRecovery(() =>
      this.db.getAllAsync(`SELECT * FROM issues WHERE is_deleted = 1 ORDER BY deleted_at DESC`)
    );
    return await Promise.all((rows as IssueRow[]).map(mapRowToIssue));
  }

  /** Restore. */
  async restore(id: string): Promise<void> {
    const now = Date.now();
    await this.withTableRecovery(async () => {
      await this.db.runAsync(
        `UPDATE issues SET is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE id = ?`,
        [now, id]
      );
      await this.db.runAsync(
        `UPDATE photos SET is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE issue_id = ?`,
        [now, id]
      );
      await this.db.runAsync(
        `UPDATE annotations SET is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE photo_id IN (SELECT id FROM photos WHERE issue_id = ?)`,
        [now, id]
      );
    });
  }

  /** Permanently Delete. */
  async permanentlyDelete(id: string): Promise<void> {
    await this.withTableRecovery(async () => {
      await this.db.runAsync(
        `DELETE FROM annotations WHERE photo_id IN (SELECT id FROM photos WHERE issue_id = ?)`,
        [id]
      );
      await this.db.runAsync(`DELETE FROM photos WHERE issue_id = ?`, [id]);
      await this.db.runAsync(`DELETE FROM issues WHERE id = ?`, [id]);
    });
  }

  /** Delete. */
  async delete(id: string): Promise<void> {
    const now = Date.now();
    await this.withTableRecovery(async () => {
      await this.db.runAsync(
        `UPDATE issues SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?`,
        [now, now, id]
      );
      await this.db.runAsync(
        `UPDATE photos SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE issue_id = ? AND is_deleted = 0`,
        [now, now, id]
      );
      await this.db.runAsync(
        `UPDATE annotations SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE photo_id IN (SELECT id FROM photos WHERE issue_id = ?) AND is_deleted = 0`,
        [now, now, id]
      );
    });
  }
}

export const issueRepository = new IssueRepository();
