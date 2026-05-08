import {
  runMigrations,
  getSchemaVersion,
  migrations,
  __resetMigrationPromiseForTests,
} from '@services/db/migrations';
import { getDatabase } from '@services/db/connection';
import { encryptField, decryptField } from '@services/security/fieldEncryption';

jest.mock('@services/db/connection');
jest.mock('@services/security/fieldEncryption');

describe('migrations', () => {
  let mockDb: {
    getFirstSync: jest.Mock;
    withExclusiveTransactionAsync: jest.Mock;
    execSync: jest.Mock;
    runSync: jest.Mock;
    runAsync: jest.Mock;
    getAllAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __resetMigrationPromiseForTests();
    mockDb = {
      getFirstSync: jest.fn(),
      withExclusiveTransactionAsync: jest.fn(async (cb) => cb(mockDb)),
      execSync: jest.fn(),
      runSync: jest.fn(),
      runAsync: jest.fn(),
      getAllAsync: jest.fn().mockResolvedValue([]),
    };
    (getDatabase as jest.Mock).mockReturnValue(mockDb);
    (encryptField as jest.Mock).mockImplementation(async (value) =>
      value === null || value === undefined ? null : `v2:${String(value)}`
    );
    (decryptField as jest.Mock).mockImplementation(async (value) => {
      if (value === null || value === undefined) return null;
      const str = String(value);
      return str.startsWith('v2:') ? str.slice(3) : str;
    });
  });

  it('runs all migrations when database is at version 0', async () => {
    mockDb.getFirstSync.mockReturnValue({ user_version: 0 });

    await runMigrations(mockDb as unknown as import('expo-sqlite').SQLiteDatabase);

    expect(mockDb.withExclusiveTransactionAsync).toHaveBeenCalled();
    expect(mockDb.execSync).toHaveBeenCalled();
    expect(mockDb.runAsync).toHaveBeenCalledWith('PRAGMA user_version = ?', [1]);
    expect(mockDb.runAsync).toHaveBeenCalledWith('PRAGMA user_version = ?', [2]);
    expect(mockDb.runAsync).toHaveBeenCalledWith('PRAGMA user_version = ?', [3]);
    expect(mockDb.runAsync).toHaveBeenCalledWith('PRAGMA user_version = ?', [4]);
    expect(mockDb.runAsync).toHaveBeenCalledWith('PRAGMA user_version = ?', [5]);
  });

  it('skips migrations when database is up to date', async () => {
    mockDb.getFirstSync.mockReturnValue({ user_version: 5 });

    await runMigrations(mockDb as unknown as import('expo-sqlite').SQLiteDatabase);

    expect(mockDb.withExclusiveTransactionAsync).not.toHaveBeenCalled();
  });

  it('runs only pending migrations', async () => {
    mockDb.getFirstSync.mockReturnValue({ user_version: 2 });

    await runMigrations(mockDb as unknown as import('expo-sqlite').SQLiteDatabase);

    expect(mockDb.runAsync).not.toHaveBeenCalledWith('PRAGMA user_version = ?', [1]);
    expect(mockDb.runAsync).not.toHaveBeenCalledWith('PRAGMA user_version = ?', [2]);
    expect(mockDb.runAsync).toHaveBeenCalledWith('PRAGMA user_version = ?', [3]);
    expect(mockDb.runAsync).toHaveBeenCalledWith('PRAGMA user_version = ?', [4]);
    expect(mockDb.runAsync).toHaveBeenCalledWith('PRAGMA user_version = ?', [5]);
  });

  it('returns current schema version', () => {
    mockDb.getFirstSync.mockReturnValue({ user_version: 3 });
    expect(getSchemaVersion(mockDb as unknown as import('expo-sqlite').SQLiteDatabase)).toBe(3);
  });

  it('returns 0 when schema version query returns null', () => {
    mockDb.getFirstSync.mockReturnValue(null);
    expect(getSchemaVersion(mockDb as unknown as import('expo-sqlite').SQLiteDatabase)).toBe(0);
  });

  it('migration 1 creates tables and seeds templates', async () => {
    mockDb.getFirstSync.mockReturnValue({ user_version: 0 });
    await runMigrations(mockDb as unknown as import('expo-sqlite').SQLiteDatabase);

    const migration1Call = mockDb.execSync.mock.calls.find(
      (call) =>
        typeof call[0] === 'string' && call[0].includes('CREATE TABLE IF NOT EXISTS projects')
    );
    expect(migration1Call).toBeTruthy();
    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR IGNORE INTO templates'),
      [expect.any(Number)]
    );
  });

  it('migration 4 encrypts template fields', async () => {
    mockDb.getFirstSync.mockReturnValue({ user_version: 3 });
    mockDb.getAllAsync.mockResolvedValue([
      { id: 'tmpl-1', name: 'Name', description: 'Desc', content: 'Content' },
    ]);

    await runMigrations(mockDb as unknown as import('expo-sqlite').SQLiteDatabase);

    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id, name, description, content FROM templates')
    );
    expect(encryptField).toHaveBeenCalledWith('Name');
    expect(encryptField).toHaveBeenCalledWith('Desc');
    expect(encryptField).toHaveBeenCalledWith('Content');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE templates SET name = ?'),
      expect.arrayContaining(['tmpl-1'])
    );
  });

  it('migration registry length matches current schema version', () => {
    expect(migrations.length).toBe(5);
    expect(migrations[migrations.length - 1]!.version).toBe(5);
  });

  it('migration 5 re-encrypts every encrypted column across all tables', async () => {
    mockDb.getFirstSync.mockReturnValue({ user_version: 4 });

    // Return one row per table on each getAllAsync invocation.
    const tableRows: Record<string, Record<string, unknown>[]> = {
      projects: [
        {
          id: 'p1',
          name: 'OldName',
          description: null,
          site_address: 'old-addr',
          client_name: null,
        },
      ],
      issues: [
        {
          id: 'i1',
          title: 'OldTitle',
          description: null,
          location_description: null,
          assigned_to: null,
          resolution_notes: null,
        },
      ],
      photos: [{ id: 'ph1', caption: 'OldCaption', tags: '[]' }],
      annotations: [{ id: 'a1', text_content: 'OldText' }],
      templates: [{ id: 't1', name: 'OldTpl', description: null, content: '{}' }],
      export_history: [{ id: 'e1', file_name: 'old.zip', error_message: null }],
    };

    mockDb.getAllAsync.mockImplementation(async (sql: string) => {
      // v4 migration path still uses its own SELECT; v5 uses SELECT id, "col1", "col2"... FROM "table"
      const match = sql.match(/FROM\s+"?(\w+)"?/i);
      if (!match) return [];
      const table = match[1]!;
      if (table === 'templates' && sql.includes('is_deleted = 0')) {
        return []; // v4 migration's own query returns empty so we don't re-run it on this flow
      }
      return tableRows[table] ?? [];
    });

    await runMigrations(mockDb as unknown as import('expo-sqlite').SQLiteDatabase);

    // Assert decrypt-then-encrypt was invoked for at least one column of every table
    expect(decryptField).toHaveBeenCalledWith('OldName');
    expect(decryptField).toHaveBeenCalledWith('OldTitle');
    expect(decryptField).toHaveBeenCalledWith('OldCaption');
    expect(decryptField).toHaveBeenCalledWith('OldText');
    expect(decryptField).toHaveBeenCalledWith('OldTpl');
    expect(decryptField).toHaveBeenCalledWith('old.zip');

    // Assert rows were updated back with new ciphertext for each table.
    const updates = mockDb.runAsync.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[0].startsWith('UPDATE')
    );
    const updatedTables = new Set(
      updates.map((c) => (c[0] as string).match(/UPDATE\s+"?(\w+)"?/i)?.[1])
    );
    for (const t of [
      'projects',
      'issues',
      'photos',
      'annotations',
      'templates',
      'export_history',
    ]) {
      expect(updatedTables.has(t)).toBe(true);
    }
  });

  it('migration 5 is a no-op for tables with no encrypted rows', async () => {
    mockDb.getFirstSync.mockReturnValue({ user_version: 4 });
    mockDb.getAllAsync.mockResolvedValue([]);

    await runMigrations(mockDb as unknown as import('expo-sqlite').SQLiteDatabase);

    expect(mockDb.runAsync).toHaveBeenCalledWith('PRAGMA user_version = ?', [5]);
    // No UPDATE statements should have been emitted.
    const updates = mockDb.runAsync.mock.calls.filter(
      (c) => typeof c[0] === 'string' && (c[0] as string).startsWith('UPDATE')
    );
    expect(updates).toHaveLength(0);
  });
});
