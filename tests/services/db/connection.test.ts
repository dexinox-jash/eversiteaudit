// We need to isolate connection module state between tests
let connectionModule: typeof import('@services/db/connection');
let FS: typeof import('expo-file-system');

describe('connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset module to clear singleton state
    jest.resetModules();
    // Re-require to get fresh module state with same mock wiring
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    connectionModule = require('@services/db/connection');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    FS = require('expo-file-system');
  });

  describe('getDatabase', () => {
    it('opens database and returns instance', () => {
      const db = connectionModule.getDatabase();

      expect(db).toBeDefined();
      expect(db.execSync).toBeDefined();
    });

    it('enables foreign keys and WAL mode', () => {
      const db = connectionModule.getDatabase();

      expect(db.execSync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
      expect(db.execSync).toHaveBeenCalledWith('PRAGMA journal_mode = WAL;');
    });

    it('returns same instance on repeated calls (singleton)', () => {
      const db1 = connectionModule.getDatabase();
      const db2 = connectionModule.getDatabase();

      expect(db1).toBe(db2);
    });
  });

  describe('getDatabaseAsync', () => {
    it('returns database instance after init', async () => {
      const db = await connectionModule.getDatabaseAsync();

      expect(db).toBeDefined();
      expect(db.execSync).toBeDefined();
    });
  });

  describe('getDbInitPromise', () => {
    it('returns null before getDatabase is called', () => {
      expect(connectionModule.getDbInitPromise()).toBeNull();
    });

    it('returns a promise after getDatabase is called', () => {
      connectionModule.getDatabase();
      const promise = connectionModule.getDbInitPromise();
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  describe('closeDatabase', () => {
    it('closes database and clears instance', () => {
      const db = connectionModule.getDatabase();
      connectionModule.closeDatabase();

      expect(db.closeSync).toHaveBeenCalled();
    });

    it('allows opening a new instance after close', () => {
      const db1 = connectionModule.getDatabase();
      connectionModule.closeDatabase();
      const db2 = connectionModule.getDatabase();

      // Should be different instances
      expect(db1).not.toBe(db2);
    });

    it('does nothing when no database is open', () => {
      // Should not throw
      expect(() => connectionModule.closeDatabase()).not.toThrow();
    });
  });

  describe('applyPendingRestore', () => {
    it('does nothing when no marker file exists', async () => {
      (FS.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

      await connectionModule.applyPendingRestore();

      expect(FS.copyAsync).not.toHaveBeenCalled();
    });

    it('replaces live DB when marker is in staged state', async () => {
      (FS.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true }) // marker file exists
        .mockResolvedValueOnce({ exists: true }) // SQLite dir exists
        .mockResolvedValueOnce({ exists: true }); // live DB exists for backup copy
      (FS.readAsStringAsync as jest.Mock).mockResolvedValue(
        JSON.stringify({
          seq: 'seq-1',
          state: 'staged',
          stagedDbPath: 'file:///cache/staged.db',
          liveDbBackupPath: 'file:///docs/SQLite/eversiteaudit.db.bak-seq-1',
        })
      );

      await connectionModule.applyPendingRestore();

      // Two copies: live → backup, then staged → live
      expect(FS.copyAsync).toHaveBeenCalledTimes(2);
      expect(FS.copyAsync).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'file:///cache/staged.db' })
      );
      // Cleanup: staged + backup + marker
      expect(FS.deleteAsync).toHaveBeenCalledTimes(3);
    });

    it('creates SQLite directory if it does not exist', async () => {
      (FS.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true }) // marker exists
        .mockResolvedValueOnce({ exists: false }) // dir does not exist
        .mockResolvedValueOnce({ exists: false }); // no live DB to back up
      (FS.readAsStringAsync as jest.Mock).mockResolvedValue(
        JSON.stringify({
          seq: 'seq-2',
          state: 'staged',
          stagedDbPath: 'file:///cache/staged.db',
          liveDbBackupPath: 'file:///docs/SQLite/eversiteaudit.db.bak-seq-2',
        })
      );

      await connectionModule.applyPendingRestore();

      expect(FS.makeDirectoryAsync).toHaveBeenCalled();
    });

    it('handles malformed marker file gracefully', async () => {
      (FS.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (FS.readAsStringAsync as jest.Mock).mockResolvedValue('not valid json');

      await expect(connectionModule.applyPendingRestore()).resolves.toBeUndefined();
      expect(FS.deleteAsync).toHaveBeenCalled();
    });

    it('accepts a legacy marker (stagedDbPath only, no seq/state)', async () => {
      (FS.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true }) // marker
        .mockResolvedValueOnce({ exists: true }) // SQLite dir
        .mockResolvedValueOnce({ exists: false }); // no live DB → skip backup copy
      (FS.readAsStringAsync as jest.Mock).mockResolvedValue(
        JSON.stringify({ stagedDbPath: 'file:///cache/legacy.db' })
      );

      await connectionModule.applyPendingRestore();

      expect(FS.copyAsync).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'file:///cache/legacy.db' })
      );
    });

    it('resumes swap when state is swap-in-progress and staged DB is still present', async () => {
      (FS.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true }) // marker
        .mockResolvedValueOnce({ exists: true }) // SQLite dir
        .mockResolvedValueOnce({ exists: true }); // staged DB still there
      (FS.readAsStringAsync as jest.Mock).mockResolvedValue(
        JSON.stringify({
          seq: 'seq-3',
          state: 'swap-in-progress',
          stagedDbPath: 'file:///cache/staged.db',
          liveDbBackupPath: 'file:///docs/SQLite/eversiteaudit.db.bak-seq-3',
        })
      );

      await connectionModule.applyPendingRestore();

      // One copy only: staged → live (no pre-backup, we're already past that step)
      expect(FS.copyAsync).toHaveBeenCalledTimes(1);
      expect(FS.copyAsync).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'file:///cache/staged.db' })
      );
    });

    it('rolls back from backup when state is swap-in-progress but staged DB is gone', async () => {
      (FS.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true }) // marker
        .mockResolvedValueOnce({ exists: true }) // SQLite dir
        .mockResolvedValueOnce({ exists: false }) // staged DB gone
        .mockResolvedValueOnce({ exists: true }); // backup exists
      (FS.readAsStringAsync as jest.Mock).mockResolvedValue(
        JSON.stringify({
          seq: 'seq-4',
          state: 'swap-in-progress',
          stagedDbPath: 'file:///cache/staged.db',
          liveDbBackupPath: 'file:///docs/SQLite/eversiteaudit.db.bak-seq-4',
        })
      );

      await connectionModule.applyPendingRestore();

      expect(FS.copyAsync).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'file:///docs/SQLite/eversiteaudit.db.bak-seq-4' })
      );
    });

    it('cleans up when state is committed', async () => {
      (FS.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true }) // marker
        .mockResolvedValueOnce({ exists: true }); // SQLite dir
      (FS.readAsStringAsync as jest.Mock).mockResolvedValue(
        JSON.stringify({
          seq: 'seq-5',
          state: 'committed',
          stagedDbPath: 'file:///cache/staged.db',
          liveDbBackupPath: 'file:///docs/SQLite/eversiteaudit.db.bak-seq-5',
        })
      );

      await connectionModule.applyPendingRestore();

      expect(FS.copyAsync).not.toHaveBeenCalled();
      expect(FS.deleteAsync).toHaveBeenCalledTimes(3); // staged + backup + marker
    });
  });
});
