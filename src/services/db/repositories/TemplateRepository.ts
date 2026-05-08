import { getDatabase } from '../connection';
import { encryptField, decryptField } from '@services/security/fieldEncryption';
import type { Template, TemplateType } from '@/types/domain';

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  content: string;
  is_default: number;
  usage_count: number;
  created_at: number;
  updated_at: number;
  is_deleted: number;
  deleted_at: number | null;
}

export interface CreateTemplatePayload {
  name: string;
  description?: string | null;
  type: TemplateType;
  content: string;
  isDefault?: number;
}

export interface UpdateTemplatePayload {
  name?: string;
  description?: string | null;
  type?: TemplateType;
  content?: string;
  isDefault?: number;
}

/**
 * Safely decrypt a field value, falling back to the raw value if decryption
 * fails. This handles legacy plaintext template data that was seeded before
 * field-level encryption was introduced.
 */
async function safeDecrypt(value: string | null): Promise<string | null> {
  if (value === null) return null;
  try {
    return (await decryptField(value)) as string;
  } catch {
    return value;
  }
}

async function mapRowToTemplate(row: TemplateRow): Promise<Template> {
  return {
    id: row.id,
    name: (await safeDecrypt(row.name)) ?? '',
    description: await safeDecrypt(row.description),
    type: row.type as TemplateType,
    content: (await safeDecrypt(row.content)) ?? '',
    isDefault: row.is_default,
    usageCount: row.usage_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at ?? null,
  };
}

/**  Template Repository. */
export class TemplateRepository {
  private db = getDatabase();

  /** Get All. */
  async getAll(): Promise<Template[]> {
    // NOTE: Removed SQL-level ORDER BY name because the column now stores
    // ciphertext. Sorting is performed in JavaScript after decryption.
    const rows = await this.db.getAllAsync(`SELECT * FROM templates WHERE is_deleted = 0`);
    const templates = await Promise.all((rows as TemplateRow[]).map(mapRowToTemplate));
    return templates.sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Get By Id. */
  async getById(id: string): Promise<Template | null> {
    const row = await this.db.getFirstAsync(
      `SELECT * FROM templates WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    return row ? await mapRowToTemplate(row as TemplateRow) : null;
  }

  /** Get By Type. */
  async getByType(type: string): Promise<Template[]> {
    // NOTE: SQL-level name ordering is removed because the column stores
    // ciphertext. Default ordering is preserved in SQL; name sorting happens
    // in JavaScript after decryption.
    const rows = await this.db.getAllAsync(
      `SELECT * FROM templates WHERE type = ? AND is_deleted = 0 ORDER BY is_default DESC`,
      [type]
    );
    const templates = await Promise.all((rows as TemplateRow[]).map(mapRowToTemplate));
    return templates.sort((a, b) => {
      if (a.isDefault !== b.isDefault) {
        return b.isDefault - a.isDefault;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /** Create. */
  async create(payload: CreateTemplatePayload): Promise<Template> {
    const now = Date.now();
    const id = crypto.randomUUID();
    const { name, description = null, type, content, isDefault = 0 } = payload;

    const encryptedName = (await encryptField(name)) ?? null;
    const encryptedDescription = (await encryptField(description)) ?? null;
    const encryptedContent = (await encryptField(content)) ?? null;

    await this.db.runAsync(
      `INSERT INTO templates (
        id, name, description, type, content, is_default, usage_count,
        created_at, updated_at, is_deleted, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        encryptedName,
        encryptedDescription,
        type,
        encryptedContent,
        isDefault,
        0,
        now,
        now,
        0,
        null,
      ]
    );

    const template = await this.getById(id);
    if (!template) {
      throw new Error('Failed to retrieve created template');
    }
    return template;
  }

  /** Update. */
  async update(id: string, payload: UpdateTemplatePayload): Promise<Template> {
    const now = Date.now();
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Template not found: ${id}`);
    }

    const name =
      payload.name !== undefined
        ? ((await encryptField(payload.name)) ?? null)
        : ((await encryptField(existing.name)) ?? null);
    const description =
      payload.description !== undefined
        ? ((await encryptField(payload.description)) ?? null)
        : ((await encryptField(existing.description)) ?? null);
    const type = payload.type ?? existing.type;
    const content =
      payload.content !== undefined
        ? ((await encryptField(payload.content)) ?? null)
        : ((await encryptField(existing.content)) ?? null);
    const isDefault = payload.isDefault ?? existing.isDefault;

    await this.db.runAsync(
      `UPDATE templates SET
        name = ?,
        description = ?,
        type = ?,
        content = ?,
        is_default = ?,
        updated_at = ?
      WHERE id = ?`,
      [name, description, type, content, isDefault, now, id]
    );

    const template = await this.getById(id);
    if (!template) {
      throw new Error('Failed to retrieve updated template');
    }
    return template;
  }

  /** Delete. */
  async delete(id: string): Promise<void> {
    if (id.startsWith('tmpl-')) {
      throw new Error('Cannot delete built-in template');
    }
    const now = Date.now();
    await this.db.runAsync(
      `UPDATE templates SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id]
    );
  }
}

export const templateRepository = new TemplateRepository();
