import { getDatabase } from '../connection';
import { encryptField, decryptField } from '@services/security/fieldEncryption';
import type { Setting, SettingValueType } from '@/types/domain';

export interface SetSettingPayload {
  key: string;
  value: string | null;
  valueType?: SettingValueType;
}

interface SettingRow {
  key: string;
  value: string | null;
  value_type: string;
  updated_at: number;
}

async function mapRowToSetting(row: SettingRow): Promise<Setting> {
  return {
    key: row.key,
    value: (await decryptField(row.value)) ?? null,
    valueType: row.value_type as SettingValueType,
    updatedAt: row.updated_at,
  };
}

/**  Settings Repository. */
export class SettingsRepository {
  private db = getDatabase();

  /** Get. */
  async get(key: string): Promise<Setting | null> {
    const row = await this.db.getFirstAsync(`SELECT * FROM settings WHERE key = ?`, [key]);
    return row ? await mapRowToSetting(row as SettingRow) : null;
  }

  /** Set. */
  async set(
    key: string,
    value: string | null,
    valueType: SettingValueType = 'string'
  ): Promise<Setting> {
    const now = Date.now();
    const encryptedValue = (await encryptField(value)) ?? null;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO settings (key, value, value_type, updated_at) VALUES (?, ?, ?, ?)`,
      [key, encryptedValue, valueType, now]
    );

    const setting = await this.get(key);
    if (!setting) {
      throw new Error('Failed to retrieve saved setting');
    }
    return setting;
  }

  /** Get All. */
  async getAll(): Promise<Setting[]> {
    const rows = await this.db.getAllAsync(`SELECT * FROM settings ORDER BY key ASC`);
    return await Promise.all((rows as SettingRow[]).map(mapRowToSetting));
  }

  /** Delete. */
  async delete(key: string): Promise<void> {
    await this.db.runAsync(`DELETE FROM settings WHERE key = ?`, [key]);
  }
}

export const settingsRepository = new SettingsRepository();
