import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { CREATE_TABLES_SQL, CREATE_INDEXES_SQL, SEED_DEFAULT_TEMPLATES_SQL } from './schema';
import { runMigrations } from './migrations';

let dbInstance: SQLiteDatabase | null = null;
let dbInitPromise: Promise<void> | null = null;

const RESTORE_PENDING_FILE = 'RESTORE_PENDING.json';
const LIVE_DB_NAME = 'eversiteaudit.db';

/**
 * Internal initializer that ensures the database has at least the v1 schema
 * and then runs any pending migrations. Safe to call multiple times due to
 * dbInitPromise deduplication.
 */
async function initDatabase(): Promise<void> {
  const db = getDatabase();
  const result = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion === 0) {
    // Database is completely fresh — bootstrap the full v1 schema
    db.execSync(CREATE_TABLES_SQL);
    db.execSync(CREATE_INDEXES_SQL);
    const now = Date.now();
    db.runSync(SEED_DEFAULT_TEMPLATES_SQL, [now]);
    db.execSync('PRAGMA user_version = 1;');
  }

  // Apply any subsequent migrations
  await runMigrations(db);
}

/**
 * Returns the singleton SQLite database instance.
 * Uses synchronous open for simplicity during app initialization.
 * Also kicks off async initialization so the DB is ready for use.
 */
export function getDatabase(): SQLiteDatabase {
  if (dbInstance === null) {
    dbInstance = openDatabaseSync(LIVE_DB_NAME);
    dbInstance.execSync('PRAGMA foreign_keys = ON;');
    dbInstance.execSync('PRAGMA journal_mode = WAL;');
    dbInstance.execSync('PRAGMA busy_timeout = 5000;');
    // Start initialization immediately but don't block — callers that need
    // a guaranteed-ready DB should await getDatabaseAsync().
    dbInitPromise = initDatabase();
  }
  return dbInstance;
}

/**
 * Returns the singleton database instance after ensuring migrations
 * have completed. Multiple concurrent callers share the same init promise.
 * If the first attempt fails, a retry is triggered automatically.
 */
export async function getDatabaseAsync(): Promise<SQLiteDatabase> {
  // Ensure the DB file is open and init has started
  getDatabase();
  if (dbInitPromise) {
    try {
      await dbInitPromise;
    } catch {
      // If init failed, retry once by creating a fresh promise
      dbInitPromise = initDatabase();
      await dbInitPromise;
    }
  }
  return dbInstance!;
}

/**
 * Returns the current database initialization promise, if any.
 * Useful for callers that already hold a DB reference but want to
 * coordinate with ongoing initialization.
 */
export function getDbInitPromise(): Promise<void> | null {
  return dbInitPromise;
}

/**
 * Closes the database connection.
 * Call this when the app is backgrounded or during cleanup.
 */
export function closeDatabase(): void {
  if (dbInstance !== null) {
    dbInstance.closeSync();
    dbInstance = null;
    dbInitPromise = null;
  }
}

type RestoreState = 'staged' | 'swap-in-progress' | 'committed';

interface RestoreMarker {
  seq: string;
  state: RestoreState;
  stagedDbPath: string;
  liveDbBackupPath: string;
}

async function readRestoreMarker(markerPath: string): Promise<RestoreMarker | null> {
  try {
    const raw = await FileSystem.readAsStringAsync(markerPath, { encoding: 'utf8' });
    const parsed = JSON.parse(raw) as Partial<RestoreMarker> & Record<string, unknown>;
    if (typeof parsed.stagedDbPath !== 'string') return null;
    // Tolerate legacy markers written before the v2 atomicity guard: stagedDbPath
    // only, no seq / state / liveDbBackupPath. Treat them as a fresh 'staged' entry
    // and synthesise the missing fields so the state machine can complete safely.
    const seq = typeof parsed.seq === 'string' ? parsed.seq : `legacy-${Date.now()}`;
    const state: RestoreState =
      parsed.state === 'staged' ||
      parsed.state === 'swap-in-progress' ||
      parsed.state === 'committed'
        ? parsed.state
        : 'staged';
    const liveDbBackupPath =
      typeof parsed.liveDbBackupPath === 'string'
        ? parsed.liveDbBackupPath
        : `${FileSystem.documentDirectory ?? ''}SQLite/${LIVE_DB_NAME}.bak-${seq}`;
    return { seq, state, stagedDbPath: parsed.stagedDbPath, liveDbBackupPath };
  } catch {
    return null;
  }
}

async function writeRestoreMarker(markerPath: string, marker: RestoreMarker): Promise<void> {
  await FileSystem.writeAsStringAsync(markerPath, JSON.stringify(marker), { encoding: 'utf8' });
}

async function safeDelete(path: string): Promise<void> {
  await FileSystem.deleteAsync(path).catch(() => {});
}

async function ensureLiveDbDir(): Promise<string> {
  const liveDbDir = `${FileSystem.documentDirectory ?? ''}SQLite`;
  const dirInfo = await FileSystem.getInfoAsync(liveDbDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(liveDbDir, { intermediates: true });
  }
  return liveDbDir;
}

/**
 * Check for a pending restore marker in cacheDirectory and, if found, run the
 * atomic swap state machine to completion.
 *
 * The marker file encodes three states:
 *   - 'staged'           → staged DB is ready; live DB has not been touched yet.
 *   - 'swap-in-progress' → previous run crashed mid-swap. Resume or roll back.
 *   - 'committed'        → prior run finished the swap but didn't clean up.
 *
 * Before overwriting the live DB, we first take a backup copy at
 * `liveDbBackupPath` so a crash between closeDatabase() and the staged-to-live
 * copy can be recovered by restoring from the backup. On success, both the
 * staged DB and the backup are removed along with the marker.
 */
export async function applyPendingRestore(): Promise<void> {
  const markerPath = `${FileSystem.cacheDirectory ?? ''}${RESTORE_PENDING_FILE}`;
  const info = await FileSystem.getInfoAsync(markerPath);
  if (!info.exists) {
    return;
  }

  const marker = await readRestoreMarker(markerPath);
  if (!marker) {
    await safeDelete(markerPath);
    return;
  }

  closeDatabase();

  const liveDbDir = await ensureLiveDbDir();
  const liveDbPath = `${liveDbDir}/${LIVE_DB_NAME}`;

  if (marker.state === 'committed') {
    // Previous run finished the copy but didn't get to clean up. Finish cleanup.
    await safeDelete(marker.stagedDbPath);
    await safeDelete(marker.liveDbBackupPath);
    await safeDelete(markerPath);
    return;
  }

  if (marker.state === 'swap-in-progress') {
    // Previous run crashed between backup and commit. Try to finish the swap,
    // else roll back from the live DB backup.
    const stagedInfo = await FileSystem.getInfoAsync(marker.stagedDbPath);
    if (stagedInfo.exists) {
      await FileSystem.copyAsync({ from: marker.stagedDbPath, to: liveDbPath });
      await writeRestoreMarker(markerPath, { ...marker, state: 'committed' });
      await safeDelete(marker.stagedDbPath);
      await safeDelete(marker.liveDbBackupPath);
      await safeDelete(markerPath);
      return;
    }
    const backupInfo = await FileSystem.getInfoAsync(marker.liveDbBackupPath);
    if (backupInfo.exists) {
      await FileSystem.copyAsync({ from: marker.liveDbBackupPath, to: liveDbPath });
      await safeDelete(marker.liveDbBackupPath);
      await safeDelete(markerPath);
      return;
    }
    // Neither staged nor backup present; nothing to do. Leave live DB as-is.
    await safeDelete(markerPath);
    return;
  }

  // state === 'staged' — perform the full swap.
  const liveInfo = await FileSystem.getInfoAsync(liveDbPath);
  if (liveInfo.exists) {
    await FileSystem.copyAsync({ from: liveDbPath, to: marker.liveDbBackupPath });
  }
  await writeRestoreMarker(markerPath, { ...marker, state: 'swap-in-progress' });
  await FileSystem.copyAsync({ from: marker.stagedDbPath, to: liveDbPath });
  await writeRestoreMarker(markerPath, { ...marker, state: 'committed' });
  await safeDelete(marker.stagedDbPath);
  await safeDelete(marker.liveDbBackupPath);
  await safeDelete(markerPath);
}
