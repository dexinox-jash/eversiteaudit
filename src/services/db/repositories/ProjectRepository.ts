import { getDatabase } from '../connection';
import { encryptField, decryptField } from '@services/security/fieldEncryption';
import type { Project, ProjectStatus, ProjectPriority } from '@/types/domain';
import type { CreateIssuePayload } from './IssueRepository';

export interface CreateProjectPayload {
  name: string;
  description?: string | null;
  siteAddress?: string | null;
  clientName?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string | null;
  siteAddress?: string | null;
  clientName?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  completedAt?: number | null;
}

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  site_address: string | null;
  client_name: string | null;
  status: string;
  priority: number;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
  created_by: string | null;
  is_deleted: number;
  deleted_at: number | null;
}

async function mapRowToProject(row: ProjectRow): Promise<Project> {
  return {
    id: String(row.id),
    name: (await decryptField(row.name)) ?? '',
    description: await decryptField(row.description),
    siteAddress: await decryptField(row.site_address),
    clientName: await decryptField(row.client_name),
    status: String(row.status) as ProjectStatus,
    priority: Number(row.priority) as ProjectPriority,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    completedAt: row.completed_at ?? null,
    createdBy: await decryptField(row.created_by),
    isDeleted: Number(row.is_deleted),
    deletedAt: row.deleted_at ?? null,
  };
}

/**  Project Repository. */
export class ProjectRepository {
  private db = getDatabase();

  /** Get All. */
  async getAll(): Promise<Project[]> {
    const rows = await this.db.getAllAsync(
      `SELECT * FROM projects WHERE is_deleted = 0 ORDER BY updated_at DESC`
    );
    return await Promise.all((rows as ProjectRow[]).map(mapRowToProject));
  }

  /** Get By Id. */
  async getById(id: string): Promise<Project | null> {
    const row = await this.db.getFirstAsync(
      `SELECT * FROM projects WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    return row ? await mapRowToProject(row as ProjectRow) : null;
  }

  /** Create. */
  async create(payload: CreateProjectPayload): Promise<Project> {
    const now = Date.now();
    const id = crypto.randomUUID();
    const {
      name,
      description = null,
      siteAddress = null,
      clientName = null,
      status = 'active',
      priority = 0,
    } = payload;

    const encryptedName = (await encryptField(name)) ?? null;
    const encryptedDescription = (await encryptField(description)) ?? null;
    const encryptedSiteAddress = (await encryptField(siteAddress)) ?? null;
    const encryptedClientName = (await encryptField(clientName)) ?? null;

    await this.db.runAsync(
      `INSERT INTO projects (
        id, name, description, site_address, client_name,
        status, priority, created_at, updated_at, completed_at, created_by,
        is_deleted, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        encryptedName,
        encryptedDescription,
        encryptedSiteAddress,
        encryptedClientName,
        status,
        priority,
        now,
        now,
        null,
        null,
        0,
        null,
      ]
    );

    const project = await this.getById(id);
    if (!project) {
      throw new Error('Failed to retrieve created project');
    }
    return project;
  }

  /** Create Project with Issues in a single transaction. */
  async createProjectWithIssues(
    payload: CreateProjectPayload,
    issues: Array<Omit<CreateIssuePayload, 'projectId'>>
  ): Promise<Project> {
    const db = getDatabase();
    let projectId = '';

    await db.withExclusiveTransactionAsync(async (txn) => {
      const now = Date.now();
      projectId = crypto.randomUUID();
      const {
        name,
        description = null,
        siteAddress = null,
        clientName = null,
        status = 'active',
        priority = 0,
      } = payload;

      const encryptedName = (await encryptField(name)) ?? null;
      const encryptedDescription = (await encryptField(description)) ?? null;
      const encryptedSiteAddress = (await encryptField(siteAddress)) ?? null;
      const encryptedClientName = (await encryptField(clientName)) ?? null;

      await txn.runAsync(
        `INSERT INTO projects (
          id, name, description, site_address, client_name,
          status, priority, created_at, updated_at, completed_at, created_by,
          is_deleted, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          projectId,
          encryptedName,
          encryptedDescription,
          encryptedSiteAddress,
          encryptedClientName,
          status,
          priority,
          now,
          now,
          null,
          null,
          0,
          null,
        ]
      );

      for (const issue of issues) {
        const issueId = crypto.randomUUID();
        const encryptedTitle = (await encryptField(issue.title)) ?? null;
        const encryptedIssueDescription = (await encryptField(issue.description ?? null)) ?? null;
        const encryptedLocationDescription =
          (await encryptField(issue.locationDescription ?? null)) ?? null;
        const encryptedAssignedTo = (await encryptField(issue.assignedTo ?? null)) ?? null;

        await txn.runAsync(
          `INSERT INTO issues (
            id, project_id, title, description, category, severity, status,
            location_description, gps_latitude, gps_longitude, gps_accuracy,
            assigned_to, due_date, resolution_notes, resolved_at, resolved_by,
            voice_note_url, sort_order, created_at, updated_at, is_deleted, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            issueId,
            projectId,
            encryptedTitle,
            encryptedIssueDescription,
            issue.category ?? null,
            issue.severity ?? 'medium',
            issue.status ?? 'open',
            encryptedLocationDescription,
            null,
            null,
            null,
            encryptedAssignedTo,
            issue.dueDate ?? null,
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
        );
      }
    });

    const project = await this.getById(projectId);
    if (!project) {
      throw new Error('Failed to retrieve created project');
    }
    return project;
  }

  /** Update. */
  async update(id: string, payload: UpdateProjectPayload): Promise<Project> {
    const now = Date.now();
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Project not found: ${id}`);
    }

    const name =
      payload.name !== undefined
        ? ((await encryptField(payload.name)) ?? null)
        : ((await encryptField(existing.name)) ?? null);
    const description =
      payload.description !== undefined
        ? ((await encryptField(payload.description)) ?? null)
        : ((await encryptField(existing.description)) ?? null);
    const siteAddress =
      payload.siteAddress !== undefined
        ? ((await encryptField(payload.siteAddress)) ?? null)
        : ((await encryptField(existing.siteAddress)) ?? null);
    const clientName =
      payload.clientName !== undefined
        ? ((await encryptField(payload.clientName)) ?? null)
        : ((await encryptField(existing.clientName)) ?? null);
    const status = payload.status ?? existing.status;
    const priority = payload.priority ?? existing.priority;
    const completedAt =
      payload.completedAt !== undefined ? payload.completedAt : existing.completedAt;

    await this.db.runAsync(
      `UPDATE projects SET
        name = ?,
        description = ?,
        site_address = ?,
        client_name = ?,
        status = ?,
        priority = ?,
        updated_at = ?,
        completed_at = ?
      WHERE id = ?`,
      [name, description, siteAddress, clientName, status, priority, now, completedAt, id]
    );

    const project = await this.getById(id);
    if (!project) {
      throw new Error('Failed to retrieve updated project');
    }
    return project;
  }

  /** Delete. */
  async delete(id: string): Promise<void> {
    const now = Date.now();
    await this.db.runAsync(
      `UPDATE projects SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id]
    );
    await this.db.runAsync(
      `UPDATE issues SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE project_id = ? AND is_deleted = 0`,
      [now, now, id]
    );
    await this.db.runAsync(
      `UPDATE photos SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE project_id = ? AND is_deleted = 0`,
      [now, now, id]
    );
    await this.db.runAsync(
      `UPDATE annotations SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE photo_id IN (SELECT id FROM photos WHERE project_id = ?) AND is_deleted = 0`,
      [now, now, id]
    );
  }

  /** Get Deleted. */
  async getDeleted(): Promise<Project[]> {
    const rows = await this.db.getAllAsync(
      `SELECT * FROM projects WHERE is_deleted = 1 ORDER BY deleted_at DESC`
    );
    return await Promise.all((rows as ProjectRow[]).map(mapRowToProject));
  }

  /** Restore. */
  async restore(id: string): Promise<void> {
    const now = Date.now();
    await this.db.runAsync(
      `UPDATE projects SET is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE id = ?`,
      [now, id]
    );
    await this.db.runAsync(
      `UPDATE issues SET is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE project_id = ?`,
      [now, id]
    );
    await this.db.runAsync(
      `UPDATE photos SET is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE project_id = ?`,
      [now, id]
    );
    await this.db.runAsync(
      `UPDATE annotations SET is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE photo_id IN (SELECT id FROM photos WHERE project_id = ?)`,
      [now, id]
    );
  }

  /** Permanently Delete. */
  async permanentlyDelete(id: string): Promise<void> {
    await this.db.runAsync(
      `DELETE FROM annotations WHERE photo_id IN (SELECT id FROM photos WHERE project_id = ?)`,
      [id]
    );
    await this.db.runAsync(`DELETE FROM photos WHERE project_id = ?`, [id]);
    await this.db.runAsync(`DELETE FROM issues WHERE project_id = ?`, [id]);
    await this.db.runAsync(`DELETE FROM projects WHERE id = ?`, [id]);
  }

  /** Get By Status. */
  async getByStatus(status: ProjectStatus): Promise<Project[]> {
    const rows = await this.db.getAllAsync(
      `SELECT * FROM projects WHERE status = ? AND is_deleted = 0 ORDER BY updated_at DESC`,
      [status]
    );
    return await Promise.all((rows as ProjectRow[]).map(mapRowToProject));
  }
}

export const projectRepository = new ProjectRepository();
