import { getDatabase } from '../connection';
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
  assignedTo?: string | null;
  dueDate?: number | null;
  resolutionNotes?: string | null;
  resolvedAt?: number | null;
  resolvedBy?: string | null;
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
  created_at: number;
  updated_at: number;
  is_deleted: number;
  deleted_at: number | null;
}

function mapRowToIssue(row: IssueRow): Issue {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description ?? null,
    category: (row.category as IssueCategory) ?? null,
    severity: row.severity as IssueSeverity,
    status: row.status as IssueStatus,
    locationDescription: row.location_description ?? null,
    gpsLatitude: row.gps_latitude ?? null,
    gpsLongitude: row.gps_longitude ?? null,
    gpsAccuracy: row.gps_accuracy ?? null,
    assignedTo: row.assigned_to ?? null,
    dueDate: row.due_date ?? null,
    resolutionNotes: row.resolution_notes ?? null,
    resolvedAt: row.resolved_at ?? null,
    resolvedBy: row.resolved_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at ?? null,
  };
}

export class IssueRepository {
  private db = getDatabase();

  async getAll(): Promise<Issue[]> {
    const rows = await this.db.getAllAsync(
      `SELECT * FROM issues WHERE is_deleted = 0 ORDER BY updated_at DESC`
    );
    return (rows as IssueRow[]).map(mapRowToIssue);
  }

  async getById(id: string): Promise<Issue | null> {
    const row = await this.db.getFirstAsync(
      `SELECT * FROM issues WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    return row ? mapRowToIssue(row as IssueRow) : null;
  }

  async getByProjectId(projectId: string): Promise<Issue[]> {
    const rows = await this.db.getAllAsync(
      `SELECT * FROM issues WHERE project_id = ? AND is_deleted = 0 ORDER BY updated_at DESC`,
      [projectId]
    );
    return (rows as IssueRow[]).map(mapRowToIssue);
  }

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

    await this.db.runAsync(
      `INSERT INTO issues (
        id, project_id, title, description, category, severity, status,
        location_description, gps_latitude, gps_longitude, gps_accuracy,
        assigned_to, due_date, resolution_notes, resolved_at, resolved_by,
        created_at, updated_at, is_deleted, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, projectId, title, description, category, severity, status,
        locationDescription, null, null, null,
        assignedTo, dueDate, null, null, null,
        now, now, 0, null,
      ]
    );

    const issue = await this.getById(id);
    if (!issue) {
      throw new Error('Failed to retrieve created issue');
    }
    return issue;
  }

  async update(id: string, payload: UpdateIssuePayload): Promise<Issue> {
    const now = Date.now();
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Issue not found: ${id}`);
    }

    const title = payload.title ?? existing.title;
    const description = payload.description !== undefined ? payload.description : existing.description;
    const category = payload.category !== undefined ? payload.category : existing.category;
    const severity = payload.severity ?? existing.severity;
    const status = payload.status ?? existing.status;
    const locationDescription = payload.locationDescription !== undefined ? payload.locationDescription : existing.locationDescription;
    const assignedTo = payload.assignedTo !== undefined ? payload.assignedTo : existing.assignedTo;
    const dueDate = payload.dueDate !== undefined ? payload.dueDate : existing.dueDate;
    const resolutionNotes = payload.resolutionNotes !== undefined ? payload.resolutionNotes : existing.resolutionNotes;
    const resolvedAt = payload.resolvedAt !== undefined ? payload.resolvedAt : existing.resolvedAt;
    const resolvedBy = payload.resolvedBy !== undefined ? payload.resolvedBy : existing.resolvedBy;

    await this.db.runAsync(
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
        updated_at = ?
      WHERE id = ?`,
      [
        title, description, category, severity, status,
        locationDescription, assignedTo, dueDate,
        resolutionNotes, resolvedAt, resolvedBy,
        now, id,
      ]
    );

    const issue = await this.getById(id);
    if (!issue) {
      throw new Error('Failed to retrieve updated issue');
    }
    return issue;
  }

  async delete(id: string): Promise<void> {
    const now = Date.now();
    await this.db.runAsync(
      `UPDATE issues SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id]
    );
  }
}

export const issueRepository = new IssueRepository();
