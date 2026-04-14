import { getDatabase } from '../connection';
import type { Photo } from '@/types/domain';

export interface CreatePhotoPayload {
  projectId: string;
  issueId?: string | null;
  originalPath: string;
  thumbnailPath: string;
  compressedPath?: string | null;
  captureTimestamp?: number | null;
  cameraMake?: string | null;
  cameraModel?: string | null;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  gpsAltitude?: number | null;
  width?: number | null;
  height?: number | null;
  fileSizeBytes?: number | null;
  caption?: string | null;
  tags?: string;
}

export interface UpdatePhotoPayload {
  projectId?: string;
  issueId?: string | null;
  originalPath?: string;
  thumbnailPath?: string;
  compressedPath?: string | null;
  captureTimestamp?: number | null;
  cameraMake?: string | null;
  cameraModel?: string | null;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  gpsAltitude?: number | null;
  width?: number | null;
  height?: number | null;
  fileSizeBytes?: number | null;
  caption?: string | null;
  tags?: string;
}

interface PhotoRow {
  id: string;
  project_id: string;
  issue_id: string | null;
  original_path: string;
  thumbnail_path: string;
  compressed_path: string | null;
  capture_timestamp: number | null;
  camera_make: string | null;
  camera_model: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_altitude: number | null;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
  caption: string | null;
  tags: string;
  created_at: number;
  updated_at: number;
  is_deleted: number;
  deleted_at: number | null;
}

function mapRowToPhoto(row: PhotoRow): Photo {
  return {
    id: row.id,
    projectId: row.project_id,
    issueId: row.issue_id ?? null,
    originalPath: row.original_path,
    thumbnailPath: row.thumbnail_path,
    compressedPath: row.compressed_path ?? null,
    captureTimestamp: row.capture_timestamp ?? null,
    cameraMake: row.camera_make ?? null,
    cameraModel: row.camera_model ?? null,
    gpsLatitude: row.gps_latitude ?? null,
    gpsLongitude: row.gps_longitude ?? null,
    gpsAltitude: row.gps_altitude ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    fileSizeBytes: row.file_size_bytes ?? null,
    caption: row.caption ?? null,
    tags: row.tags ?? '[]',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at ?? null,
  };
}

export class PhotoRepository {
  private db = getDatabase();

  async getAll(): Promise<Photo[]> {
    const rows = await this.db.getAllAsync(
      `SELECT * FROM photos WHERE is_deleted = 0 ORDER BY updated_at DESC`
    );
    return (rows as PhotoRow[]).map(mapRowToPhoto);
  }

  async getById(id: string): Promise<Photo | null> {
    const row = await this.db.getFirstAsync(
      `SELECT * FROM photos WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    return row ? mapRowToPhoto(row as PhotoRow) : null;
  }

  async getByProjectId(projectId: string): Promise<Photo[]> {
    const rows = await this.db.getAllAsync(
      `SELECT * FROM photos WHERE project_id = ? AND is_deleted = 0 ORDER BY updated_at DESC`,
      [projectId]
    );
    return (rows as PhotoRow[]).map(mapRowToPhoto);
  }

  async create(payload: CreatePhotoPayload): Promise<Photo> {
    const now = Date.now();
    const id = crypto.randomUUID();
    const {
      projectId,
      issueId = null,
      originalPath,
      thumbnailPath,
      compressedPath = null,
      captureTimestamp = null,
      cameraMake = null,
      cameraModel = null,
      gpsLatitude = null,
      gpsLongitude = null,
      gpsAltitude = null,
      width = null,
      height = null,
      fileSizeBytes = null,
      caption = null,
      tags = '[]',
    } = payload;

    await this.db.runAsync(
      `INSERT INTO photos (
        id, project_id, issue_id, original_path, thumbnail_path, compressed_path,
        capture_timestamp, camera_make, camera_model, gps_latitude, gps_longitude, gps_altitude,
        width, height, file_size_bytes, caption, tags,
        created_at, updated_at, is_deleted, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, projectId, issueId, originalPath, thumbnailPath, compressedPath,
        captureTimestamp, cameraMake, cameraModel, gpsLatitude, gpsLongitude, gpsAltitude,
        width, height, fileSizeBytes, caption, tags,
        now, now, 0, null,
      ]
    );

    const photo = await this.getById(id);
    if (!photo) {
      throw new Error('Failed to retrieve created photo');
    }
    return photo;
  }

  async update(id: string, payload: UpdatePhotoPayload): Promise<Photo> {
    const now = Date.now();
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Photo not found: ${id}`);
    }

    const projectId = payload.projectId ?? existing.projectId;
    const issueId = payload.issueId !== undefined ? payload.issueId : existing.issueId;
    const originalPath = payload.originalPath ?? existing.originalPath;
    const thumbnailPath = payload.thumbnailPath ?? existing.thumbnailPath;
    const compressedPath = payload.compressedPath !== undefined ? payload.compressedPath : existing.compressedPath;
    const captureTimestamp = payload.captureTimestamp !== undefined ? payload.captureTimestamp : existing.captureTimestamp;
    const cameraMake = payload.cameraMake !== undefined ? payload.cameraMake : existing.cameraMake;
    const cameraModel = payload.cameraModel !== undefined ? payload.cameraModel : existing.cameraModel;
    const gpsLatitude = payload.gpsLatitude !== undefined ? payload.gpsLatitude : existing.gpsLatitude;
    const gpsLongitude = payload.gpsLongitude !== undefined ? payload.gpsLongitude : existing.gpsLongitude;
    const gpsAltitude = payload.gpsAltitude !== undefined ? payload.gpsAltitude : existing.gpsAltitude;
    const width = payload.width !== undefined ? payload.width : existing.width;
    const height = payload.height !== undefined ? payload.height : existing.height;
    const fileSizeBytes = payload.fileSizeBytes !== undefined ? payload.fileSizeBytes : existing.fileSizeBytes;
    const caption = payload.caption !== undefined ? payload.caption : existing.caption;
    const tags = payload.tags ?? existing.tags;

    await this.db.runAsync(
      `UPDATE photos SET
        project_id = ?,
        issue_id = ?,
        original_path = ?,
        thumbnail_path = ?,
        compressed_path = ?,
        capture_timestamp = ?,
        camera_make = ?,
        camera_model = ?,
        gps_latitude = ?,
        gps_longitude = ?,
        gps_altitude = ?,
        width = ?,
        height = ?,
        file_size_bytes = ?,
        caption = ?,
        tags = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        projectId, issueId, originalPath, thumbnailPath, compressedPath,
        captureTimestamp, cameraMake, cameraModel, gpsLatitude, gpsLongitude, gpsAltitude,
        width, height, fileSizeBytes, caption, tags,
        now, id,
      ]
    );

    const photo = await this.getById(id);
    if (!photo) {
      throw new Error('Failed to retrieve updated photo');
    }
    return photo;
  }

  async delete(id: string): Promise<void> {
    const now = Date.now();
    await this.db.runAsync(
      `UPDATE photos SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id]
    );
  }
}

export const photoRepository = new PhotoRepository();
