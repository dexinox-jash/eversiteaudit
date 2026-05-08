import { getDatabase } from '../connection';
import { encryptField, decryptField } from '@services/security/fieldEncryption';
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
  checksum?: string | null;
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
  checksum?: string | null;
  tags?: string;
  sortOrder?: number;
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
  checksum: string | null;
  tags: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
  is_deleted: number;
  deleted_at: number | null;
}

async function mapRowToPhoto(row: PhotoRow): Promise<Photo> {
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
    caption: await decryptField(row.caption),
    checksum: row.checksum ?? null,
    tags: (await decryptField(row.tags)) ?? '[]',
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at ?? null,
  };
}

/**  Photo Repository. */
export class PhotoRepository {
  private db = getDatabase();

  /** Get All. */
  async getAll(): Promise<Photo[]> {
    const rows = await this.db.getAllAsync(
      `SELECT * FROM photos WHERE is_deleted = 0 ORDER BY sort_order ASC, updated_at DESC`
    );
    return await Promise.all((rows as PhotoRow[]).map(mapRowToPhoto));
  }

  /** Get By Id. */
  async getById(id: string): Promise<Photo | null> {
    const row = await this.db.getFirstAsync(
      `SELECT * FROM photos WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    return row ? await mapRowToPhoto(row as PhotoRow) : null;
  }

  /** Get By Project Id. */
  async getByProjectId(projectId: string): Promise<Photo[]> {
    const rows = await this.db.getAllAsync(
      `SELECT * FROM photos WHERE project_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, created_at DESC`,
      [projectId]
    );
    return await Promise.all((rows as PhotoRow[]).map(mapRowToPhoto));
  }

  /** Get By Issue Id. */
  async getByIssueId(issueId: string): Promise<Photo[]> {
    const rows = await this.db.getAllAsync(
      `SELECT * FROM photos WHERE issue_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, created_at DESC`,
      [issueId]
    );
    return await Promise.all((rows as PhotoRow[]).map(mapRowToPhoto));
  }

  /** Create. */
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
      checksum = null,
      tags = '[]',
    } = payload;

    const encryptedCaption = (await encryptField(caption)) ?? null;
    const encryptedTags = (await encryptField(tags)) ?? null;

    await this.db.runAsync(
      `INSERT INTO photos (
        id, project_id, issue_id, original_path, thumbnail_path, compressed_path,
        capture_timestamp, camera_make, camera_model, gps_latitude, gps_longitude, gps_altitude,
        width, height, file_size_bytes, caption, checksum, tags,
        sort_order, created_at, updated_at, is_deleted, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        projectId,
        issueId,
        originalPath,
        thumbnailPath,
        compressedPath,
        captureTimestamp,
        cameraMake,
        cameraModel,
        gpsLatitude,
        gpsLongitude,
        gpsAltitude,
        width,
        height,
        fileSizeBytes,
        encryptedCaption,
        checksum,
        encryptedTags,
        0,
        now,
        now,
        0,
        null,
      ]
    );

    const photo = await this.getById(id);
    if (!photo) {
      throw new Error('Failed to retrieve created photo');
    }
    return photo;
  }

  /** Update. */
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
    const compressedPath =
      payload.compressedPath !== undefined ? payload.compressedPath : existing.compressedPath;
    const captureTimestamp =
      payload.captureTimestamp !== undefined ? payload.captureTimestamp : existing.captureTimestamp;
    const cameraMake = payload.cameraMake !== undefined ? payload.cameraMake : existing.cameraMake;
    const cameraModel =
      payload.cameraModel !== undefined ? payload.cameraModel : existing.cameraModel;
    const gpsLatitude =
      payload.gpsLatitude !== undefined ? payload.gpsLatitude : existing.gpsLatitude;
    const gpsLongitude =
      payload.gpsLongitude !== undefined ? payload.gpsLongitude : existing.gpsLongitude;
    const gpsAltitude =
      payload.gpsAltitude !== undefined ? payload.gpsAltitude : existing.gpsAltitude;
    const width = payload.width !== undefined ? payload.width : existing.width;
    const height = payload.height !== undefined ? payload.height : existing.height;
    const fileSizeBytes =
      payload.fileSizeBytes !== undefined ? payload.fileSizeBytes : existing.fileSizeBytes;
    const caption =
      payload.caption !== undefined
        ? ((await encryptField(payload.caption)) ?? null)
        : ((await encryptField(existing.caption)) ?? null);
    const checksum = payload.checksum !== undefined ? payload.checksum : existing.checksum;
    const tags =
      payload.tags !== undefined
        ? ((await encryptField(payload.tags)) ?? null)
        : ((await encryptField(existing.tags)) ?? null);
    const sortOrder = payload.sortOrder ?? existing.sortOrder;

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
        checksum = ?,
        tags = ?,
        sort_order = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        projectId,
        issueId,
        originalPath,
        thumbnailPath,
        compressedPath,
        captureTimestamp,
        cameraMake,
        cameraModel,
        gpsLatitude,
        gpsLongitude,
        gpsAltitude,
        width,
        height,
        fileSizeBytes,
        caption,
        checksum,
        tags,
        sortOrder,
        now,
        id,
      ]
    );

    const photo = await this.getById(id);
    if (!photo) {
      throw new Error('Failed to retrieve updated photo');
    }
    return photo;
  }

  /** Update Sort Order. */
  async updateSortOrder(photoId: string, sortOrder: number): Promise<void> {
    const now = Date.now();
    await this.db.runAsync(`UPDATE photos SET sort_order = ?, updated_at = ? WHERE id = ?`, [
      sortOrder,
      now,
      photoId,
    ]);
  }

  /** Delete. */
  async delete(id: string): Promise<void> {
    const now = Date.now();
    await this.db.runAsync(
      `UPDATE photos SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id]
    );
  }
}

export const photoRepository = new PhotoRepository();
