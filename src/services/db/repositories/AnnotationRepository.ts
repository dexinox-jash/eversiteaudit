import { getDatabase } from '../connection';
import { encryptField, decryptField } from '@services/security/fieldEncryption';
import type { Annotation } from '@/types/domain';

export type CreateAnnotationPayload = Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateAnnotationPayload = Partial<Annotation>;

interface AnnotationRow {
  id: string;
  photo_id: string;
  type: string;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  rotation: number;
  color: string;
  stroke_width: number;
  text_content: string | null;
  font_size: number | null;
  created_at: number;
  updated_at: number;
  is_deleted: number;
  deleted_at: number | null;
}

async function mapRowToAnnotation(row: AnnotationRow): Promise<Annotation> {
  return {
    id: row.id,
    photoId: row.photo_id,
    type: row.type as Annotation['type'],
    x: row.x,
    y: row.y,
    width: row.width ?? null,
    height: row.height ?? null,
    rotation: row.rotation,
    color: row.color,
    strokeWidth: row.stroke_width,
    textContent: await decryptField(row.text_content),
    fontSize: row.font_size ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at ?? null,
  };
}

/**  Annotation Repository. */
export class AnnotationRepository {
  private db = getDatabase();

  /** Get By Photo Id. */
  async getByPhotoId(photoId: string): Promise<Annotation[]> {
    const rows = await this.db.getAllAsync(
      `SELECT * FROM annotations WHERE photo_id = ? AND is_deleted = 0 ORDER BY created_at ASC`,
      [photoId]
    );
    return await Promise.all((rows as AnnotationRow[]).map(mapRowToAnnotation));
  }

  /** Get By Id. */
  async getById(id: string): Promise<Annotation | null> {
    const row = await this.db.getFirstAsync(
      `SELECT * FROM annotations WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    return row ? await mapRowToAnnotation(row as AnnotationRow) : null;
  }

  /** Create. */
  async create(payload: CreateAnnotationPayload): Promise<Annotation> {
    const now = Date.now();
    const id = crypto.randomUUID();
    const {
      photoId,
      type,
      x,
      y,
      width = null,
      height = null,
      rotation = 0,
      color = '#FF4757',
      strokeWidth = 2,
      textContent = null,
      fontSize = null,
    } = payload;

    const encryptedTextContent = (await encryptField(textContent)) ?? null;

    await this.db.runAsync(
      `INSERT INTO annotations (
        id, photo_id, type, x, y, width, height, rotation, color, stroke_width,
        text_content, font_size, created_at, updated_at, is_deleted, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        photoId,
        type,
        x,
        y,
        width,
        height,
        rotation,
        color,
        strokeWidth,
        encryptedTextContent,
        fontSize,
        now,
        now,
        0,
        null,
      ]
    );

    const annotation = await this.getById(id);
    if (!annotation) {
      throw new Error('Failed to retrieve created annotation');
    }
    return annotation;
  }

  /** Update. */
  async update(id: string, payload: UpdateAnnotationPayload): Promise<void> {
    const now = Date.now();
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Annotation not found: ${id}`);
    }

    const photoId = payload.photoId ?? existing.photoId;
    const type = payload.type ?? existing.type;
    const x = payload.x ?? existing.x;
    const y = payload.y ?? existing.y;
    const width = payload.width !== undefined ? payload.width : existing.width;
    const height = payload.height !== undefined ? payload.height : existing.height;
    const rotation = payload.rotation ?? existing.rotation;
    const color = payload.color ?? existing.color;
    const strokeWidth = payload.strokeWidth ?? existing.strokeWidth;
    const textContent =
      payload.textContent !== undefined
        ? ((await encryptField(payload.textContent)) ?? null)
        : ((await encryptField(existing.textContent)) ?? null);
    const fontSize = payload.fontSize !== undefined ? payload.fontSize : existing.fontSize;

    await this.db.runAsync(
      `UPDATE annotations SET
        photo_id = ?,
        type = ?,
        x = ?,
        y = ?,
        width = ?,
        height = ?,
        rotation = ?,
        color = ?,
        stroke_width = ?,
        text_content = ?,
        font_size = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        photoId,
        type,
        x,
        y,
        width,
        height,
        rotation,
        color,
        strokeWidth,
        textContent,
        fontSize,
        now,
        id,
      ]
    );
  }

  /** Delete. */
  async delete(id: string): Promise<void> {
    const now = Date.now();
    await this.db.runAsync(
      `UPDATE annotations SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id]
    );
  }

  /** Delete By Photo Id. */
  async deleteByPhotoId(photoId: string): Promise<void> {
    const now = Date.now();
    await this.db.runAsync(
      `UPDATE annotations SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE photo_id = ?`,
      [now, now, photoId]
    );
  }
}

export const annotationRepository = new AnnotationRepository();
