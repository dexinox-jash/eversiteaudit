import { encryptField, decryptField } from '@services/security/fieldEncryption';
import type { SQLiteDatabase } from 'expo-sqlite';
import {
  CREATE_TABLES_SQL,
  CREATE_INDEXES_SQL,
  SEED_DEFAULT_TEMPLATES_SQL,
  CURRENT_SCHEMA_VERSION,
} from './schema';

export interface Migration {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => void | Promise<void>;
}

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  content: string;
}

/**
 * Tables and their text columns that store field-encrypted data. The v5
 * migration walks every row in every listed column, decrypts with the
 * auto-detecting legacy+v2 path, then re-encrypts (which always emits v2
 * GCM), and writes the row back.
 */
const ENCRYPTED_COLUMNS: ReadonlyArray<{ table: string; columns: readonly string[] }> = [
  { table: 'projects', columns: ['name', 'description', 'site_address', 'client_name'] },
  {
    table: 'issues',
    columns: ['title', 'description', 'location_description', 'assigned_to', 'resolution_notes'],
  },
  { table: 'photos', columns: ['caption', 'tags'] },
  { table: 'annotations', columns: ['text_content'] },
  { table: 'templates', columns: ['name', 'description', 'content'] },
  { table: 'export_history', columns: ['file_name', 'error_message'] },
];

async function reencryptTableColumns(
  db: SQLiteDatabase,
  table: string,
  columns: readonly string[]
): Promise<void> {
  const columnList = columns.map((c) => `"${c}"`).join(', ');
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT id, ${columnList} FROM "${table}"`
  );
  for (const row of rows) {
    for (const column of columns) {
      const value = row[column];
      if (typeof value !== 'string') continue;
      const decrypted = await decryptField(value);
      const reencrypted = (await encryptField(decrypted)) ?? null;
      await db.runAsync(`UPDATE "${table}" SET "${column}" = ? WHERE id = ?`, [
        reencrypted,
        row['id'] as string,
      ]);
    }
  }
}

/**
 * Migration registry.
 * Add new migrations here when schema changes are required.
 */
export const migrations: Migration[] = [
  {
    version: 1,
    name: 'Initial schema with projects, issues, photos, annotations, templates, settings, and export_history',
    up: (db): void => {
      db.execSync(CREATE_TABLES_SQL);
      db.execSync(CREATE_INDEXES_SQL);

      const now = Date.now();
      db.runSync(SEED_DEFAULT_TEMPLATES_SQL, [now]);
    },
  },
  {
    version: 2,
    name: 'Add sort_order to issues and photos tables',
    up: (db): void => {
      db.execSync(`ALTER TABLE issues ADD COLUMN sort_order INTEGER DEFAULT 0;`);
      db.execSync(`ALTER TABLE photos ADD COLUMN sort_order INTEGER DEFAULT 0;`);
    },
  },
  {
    version: 3,
    name: 'Add voice_note_url to issues and checksum to photos',
    up: (db): void => {
      db.execSync(`ALTER TABLE issues ADD COLUMN voice_note_url TEXT;`);
      db.execSync(`ALTER TABLE photos ADD COLUMN checksum TEXT;`);
    },
  },
  {
    version: 4,
    name: 'Encrypt template fields at rest',
    up: async (db): Promise<void> => {
      const templates = await db.getAllAsync<TemplateRow>(
        `SELECT id, name, description, content FROM templates WHERE is_deleted = 0`
      );
      for (const template of templates) {
        const encryptedName = (await encryptField(template.name)) ?? '';
        const encryptedDescription = (await encryptField(template.description)) ?? null;
        const encryptedContent = (await encryptField(template.content)) ?? '';
        await db.runAsync(
          `UPDATE templates SET name = ?, description = ?, content = ? WHERE id = ?`,
          [encryptedName, encryptedDescription, encryptedContent, template.id]
        );
      }
    },
  },
  {
    version: 5,
    name: 'Re-encrypt all encrypted columns with AES-256-GCM',
    up: async (db): Promise<void> => {
      for (const { table, columns } of ENCRYPTED_COLUMNS) {
        await reencryptTableColumns(db, table, columns);
      }
    },
  },
];

let migrationPromise: Promise<void> | null = null;

/** Test-only helper to reset the migration promise guard. */
export function __resetMigrationPromiseForTests(): void {
  migrationPromise = null;
}

/**
 * Runs pending migrations and updates the schema version (user_version pragma).
 * Migrations are executed inside an exclusive transaction.
 * Safe to call multiple times — concurrent callers share the same promise
 * and will wait for the in-flight migration to complete instead of starting
 * a second one.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  if (migrationPromise) {
    return migrationPromise;
  }

  migrationPromise = (async (): Promise<void> => {
    try {
      const result = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
      const currentVersion = result?.user_version ?? 0;

      if (currentVersion >= CURRENT_SCHEMA_VERSION) {
        return;
      }

      await db.withExclusiveTransactionAsync(async (txn) => {
        for (const migration of migrations) {
          if (migration.version > currentVersion) {
            await migration.up(txn);
            await txn.runAsync('PRAGMA user_version = ?', [migration.version]);
          }
        }
      });
    } finally {
      migrationPromise = null;
    }
  })();

  return migrationPromise;
}

/**
 * Returns the current schema version from the database.
 */
export function getSchemaVersion(db: SQLiteDatabase): number {
  const result = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  return result?.user_version ?? 0;
}

/**
 * Helper alias that returns the current schema version from the database.
 */
export function getCurrentSchemaVersion(db: SQLiteDatabase): number {
  return getSchemaVersion(db);
}
