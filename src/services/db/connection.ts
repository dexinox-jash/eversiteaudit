import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

let dbInstance: SQLiteDatabase | null = null;

/**
 * Returns the singleton SQLite database instance.
 * Uses synchronous open for simplicity during app initialization.
 */
export function getDatabase(): SQLiteDatabase {
  dbInstance ??= openDatabaseSync('eversiteaudit.db');
  return dbInstance;
}

/**
 * Closes the database connection.
 * Call this when the app is backgrounded or during cleanup.
 */
export function closeDatabase(): void {
  if (dbInstance !== null) {
    dbInstance.closeSync();
    dbInstance = null;
  }
}
