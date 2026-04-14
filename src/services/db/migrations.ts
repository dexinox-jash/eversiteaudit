import { getDatabase } from './connection';
import {
  CREATE_TABLES_SQL,
  CREATE_INDEXES_SQL,
  SEED_DEFAULT_TEMPLATES_SQL,
  CURRENT_SCHEMA_VERSION,
} from './schema';

export interface Migration {
  version: number;
  name: string;
  up: (db: ReturnType<typeof getDatabase>) => void;
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
];

/**
 * Runs pending migrations and updates the schema version (user_version pragma).
 * Migrations are executed inside an exclusive transaction.
 */
export function runMigrations(): void {
  const db = getDatabase();

  const result = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    return;
  }

  db.withTransactionSync(() => {
    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        migration.up(db);
        db.runSync('PRAGMA user_version = ?', [migration.version]);
      }
    }
  });
}

/**
 * Returns the current schema version from the database.
 */
export function getSchemaVersion(): number {
  const db = getDatabase();
  const result = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  return result?.user_version ?? 0;
}
