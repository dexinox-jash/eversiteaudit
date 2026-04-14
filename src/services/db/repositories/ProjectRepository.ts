import { getDatabase } from '../connection';
import type { Project, ProjectStatus, ProjectPriority } from '@/types/domain';

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

function mapRowToProject(row: ProjectRow): Project {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description ?? null,
    siteAddress: row.site_address ?? null,
    clientName: row.client_name ?? null,
    status: String(row.status) as ProjectStatus,
    priority: Number(row.priority) as ProjectPriority,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    completedAt: row.completed_at ?? null,
    createdBy: row.created_by ?? null,
    isDeleted: Number(row.is_deleted),
    deletedAt: row.deleted_at ?? null,
  };
}

export class ProjectRepository {
  private db = getDatabase();

  async getAll(): Promise<Project[]> {
    const rows = await this.db.getAllAsync(
      `SELECT * FROM projects WHERE is_deleted = 0 ORDER BY updated_at DESC`
    );
    return (rows as ProjectRow[]).map(mapRowToProject);
  }

  async getById(id: string): Promise<Project | null> {
    const row = await this.db.getFirstAsync(
      `SELECT * FROM projects WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    return row ? mapRowToProject(row as ProjectRow) : null;
  }

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

    await this.db.runAsync(
      `INSERT INTO projects (
        id, name, description, site_address, client_name,
        status, priority, created_at, updated_at, completed_at, created_by,
        is_deleted, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, description, siteAddress, clientName, status, priority, now, now, null, null, 0, null]
    );

    const project = await this.getById(id);
    if (!project) {
      throw new Error('Failed to retrieve created project');
    }
    return project;
  }

  async update(id: string, payload: UpdateProjectPayload): Promise<Project> {
    const now = Date.now();
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Project not found: ${id}`);
    }

    const name = payload.name ?? existing.name;
    const description = payload.description !== undefined ? payload.description : existing.description;
    const siteAddress = payload.siteAddress !== undefined ? payload.siteAddress : existing.siteAddress;
    const clientName = payload.clientName !== undefined ? payload.clientName : existing.clientName;
    const status = payload.status ?? existing.status;
    const priority = payload.priority ?? existing.priority;
    const completedAt = payload.completedAt !== undefined ? payload.completedAt : existing.completedAt;

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

  async delete(id: string): Promise<void> {
    const now = Date.now();
    await this.db.runAsync(
      `UPDATE projects SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id]
    );
  }

  async getByStatus(status: ProjectStatus): Promise<Project[]> {
    const rows = await this.db.getAllAsync(
      `SELECT * FROM projects WHERE status = ? AND is_deleted = 0 ORDER BY updated_at DESC`,
      [status]
    );
    return (rows as ProjectRow[]).map(mapRowToProject);
  }
}

export const projectRepository = new ProjectRepository();
