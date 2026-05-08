import { IssueRepository } from '@services/db/repositories/IssueRepository';
import { runMigrations } from '@services/db/migrations';
import { encryptField } from '@services/security/fieldEncryption';
import type { Issue } from '@/types/domain';

jest.mock('@services/db/migrations', () => ({
  runMigrations: jest.fn().mockResolvedValue(undefined),
}));

const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockRunAsync = jest.fn();

jest.mock('@services/db/connection', () => ({
  getDatabase: jest.fn(() => ({
    getAllAsync: mockGetAllAsync,
    getFirstAsync: mockGetFirstAsync,
    runAsync: mockRunAsync,
  })),
}));

jest.mock('@services/security/fieldEncryption', () => ({
  encryptField: jest.fn(async (value: string | null | undefined) => {
    if (value === null || value === undefined) return value;
    return `ENC:${value}`;
  }),
  decryptField: jest.fn(async (value: string | null | undefined) => {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string' && value.startsWith('ENC:')) {
      return value.slice(4);
    }
    return value;
  }),
}));

describe('IssueRepository', () => {
  let repo: IssueRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllAsync.mockReset();
    mockGetFirstAsync.mockReset();
    mockRunAsync.mockReset();
    repo = new IssueRepository();
  });

  const issueRow = {
    id: 'iss-1',
    project_id: 'proj-1',
    title: 'ENC:Leaky Roof',
    description: 'ENC:Water ingress on level 2',
    category: 'quality',
    severity: 'high',
    status: 'open',
    location_description: 'ENC:North wing',
    gps_latitude: null,
    gps_longitude: null,
    gps_accuracy: null,
    assigned_to: 'ENC:Bob',
    due_date: null,
    resolution_notes: null,
    resolved_at: null,
    resolved_by: null,
    voice_note_url: null,
    sort_order: 0,
    created_at: 1000,
    updated_at: 2000,
    is_deleted: 0,
    deleted_at: null,
  };

  const expectedIssue: Issue = {
    id: 'iss-1',
    projectId: 'proj-1',
    title: 'Leaky Roof',
    description: 'Water ingress on level 2',
    category: 'quality',
    severity: 'high',
    status: 'open',
    locationDescription: 'North wing',
    gpsLatitude: null,
    gpsLongitude: null,
    gpsAccuracy: null,
    assignedTo: 'Bob',
    dueDate: null,
    resolutionNotes: null,
    resolvedAt: null,
    resolvedBy: null,
    voiceNoteUrl: null,
    sortOrder: 0,
    createdAt: 1000,
    updatedAt: 2000,
    isDeleted: 0,
    deletedAt: null,
  };

  describe('getAll', () => {
    it('returns decrypted issues', async () => {
      mockGetAllAsync.mockResolvedValue([issueRow]);

      const result = await repo.getAll();

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM issues WHERE is_deleted = 0 ORDER BY sort_order ASC, updated_at DESC'
      );
      expect(result).toEqual([expectedIssue]);
    });
  });

  describe('getById', () => {
    it('returns the decrypted issue when found', async () => {
      mockGetFirstAsync.mockResolvedValue(issueRow);

      const result = await repo.getById('iss-1');

      expect(result).toEqual(expectedIssue);
    });

    it('returns null when issue is not found', async () => {
      mockGetFirstAsync.mockResolvedValue(null);

      const result = await repo.getById('missing');

      expect(result).toBeNull();
    });
  });

  describe('getByProjectId', () => {
    it('returns decrypted issues for a project', async () => {
      mockGetAllAsync.mockResolvedValue([issueRow]);

      const result = await repo.getByProjectId('proj-1');

      expect(result).toEqual([expectedIssue]);
    });
  });

  describe('create', () => {
    it('encrypts sensitive fields before insert and returns decrypted issue', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue(issueRow);

      const result = await repo.create({
        projectId: 'proj-1',
        title: 'Leaky Roof',
        description: 'Water ingress on level 2',
        category: 'quality',
        severity: 'high',
        status: 'open',
        locationDescription: 'North wing',
        assignedTo: 'Bob',
      });

      expect(encryptField).toHaveBeenCalledWith('Leaky Roof');
      expect(encryptField).toHaveBeenCalledWith('Water ingress on level 2');
      expect(encryptField).toHaveBeenCalledWith('North wing');
      expect(encryptField).toHaveBeenCalledWith('Bob');

      const callArgs = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(callArgs[2]).toBe('ENC:Leaky Roof');
      expect(callArgs[3]).toBe('ENC:Water ingress on level 2');
      expect(callArgs[7]).toBe('ENC:North wing');
      expect(callArgs[11]).toBe('ENC:Bob');

      expect(result).toEqual(expectedIssue);
    });

    it('uses default values for optional fields', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue({
        ...issueRow,
        description: null,
        category: null,
        location_description: null,
        assigned_to: null,
      });

      const result = await repo.create({ projectId: 'proj-1', title: 'Minimal' });

      expect(result.title).toBe('Leaky Roof');
      const params = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(params[3]).toBeNull();   // description
      expect(params[4]).toBeNull();   // category
      expect(params[6]).toBe('open'); // status default
      expect(params[7]).toBeNull();   // locationDescription
      expect(params[11]).toBeNull();  // assignedTo
    });

    it('throws when created issue cannot be retrieved', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue(null);

      await expect(
        repo.create({ projectId: 'proj-1', title: 'Test' })
      ).rejects.toThrow('Failed to retrieve created issue');
    });
  });

  describe('update', () => {
    it('encrypts sensitive fields before update', async () => {
      mockGetFirstAsync.mockResolvedValue(issueRow);
      mockRunAsync.mockResolvedValue(undefined);

      await repo.update('iss-1', { title: 'Fixed Roof', resolutionNotes: 'Sealed membrane' });

      expect(encryptField).toHaveBeenCalledWith('Fixed Roof');
      expect(encryptField).toHaveBeenCalledWith('Sealed membrane');

      const callArgs = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(callArgs[0]).toBe('ENC:Fixed Roof');
      expect(callArgs[8]).toBe('ENC:Sealed membrane');
    });

    it('updates all provided fields', async () => {
      mockGetFirstAsync.mockResolvedValue(issueRow);
      mockRunAsync.mockResolvedValue(undefined);

      await repo.update('iss-1', {
        title: 'Updated Title',
        description: 'Updated Desc',
        category: 'safety',
        severity: 'critical',
        status: 'in_progress',
        locationDescription: 'South wing',
        assignedTo: 'Alice',
        dueDate: 123456789,
        resolutionNotes: 'Fixed',
        resolvedAt: 123456790,
        resolvedBy: 'Bob',
        voiceNoteUrl: 'file:///voice.mp3',
        gpsLatitude: 1.23,
        gpsLongitude: 4.56,
        gpsAccuracy: 10,
        sortOrder: 5,
      });

      const params = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(params[0]).toBe('ENC:Updated Title');
      expect(params[1]).toBe('ENC:Updated Desc');
      expect(params[2]).toBe('safety');
      expect(params[3]).toBe('critical');
      expect(params[4]).toBe('in_progress');
      expect(params[5]).toBe('ENC:South wing');
      expect(params[6]).toBe('ENC:Alice');
      expect(params[7]).toBe(123456789);
      expect(params[8]).toBe('ENC:Fixed');
      expect(params[9]).toBe(123456790);
      expect(params[10]).toBe('Bob');
      expect(params[11]).toBe('file:///voice.mp3');
      expect(params[12]).toBe(1.23);
      expect(params[13]).toBe(4.56);
      expect(params[14]).toBe(10);
      expect(params[15]).toBe(5);
    });

    it('throws when issue does not exist', async () => {
      mockGetFirstAsync.mockResolvedValue(null);

      await expect(repo.update('missing', { title: 'X' })).rejects.toThrow(
        'Issue not found: missing'
      );
    });

    it('throws when updated issue cannot be retrieved', async () => {
      mockGetFirstAsync
        .mockResolvedValueOnce(issueRow)
        .mockResolvedValueOnce(null);
      mockRunAsync.mockResolvedValue(undefined);

      await expect(
        repo.update('iss-1', { title: 'Updated' })
      ).rejects.toThrow('Failed to retrieve updated issue');
    });
  });

  describe('updateSortOrder', () => {
    it('updates sort order', async () => {
      mockRunAsync.mockResolvedValue(undefined);

      await repo.updateSortOrder('iss-1', 5);

      expect(mockRunAsync).toHaveBeenCalledWith(
        'UPDATE issues SET sort_order = ?, updated_at = ? WHERE id = ?',
        expect.any(Array)
      );
    });
  });

  describe('delete', () => {
    it('soft-deletes an issue and cascades to photos and annotations', async () => {
      mockRunAsync.mockResolvedValue(undefined);

      await repo.delete('iss-1');

      expect(mockRunAsync).toHaveBeenCalledTimes(3);
      expect(mockRunAsync).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('UPDATE issues SET is_deleted = 1'),
        expect.any(Array)
      );
      expect(mockRunAsync).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE photos SET is_deleted = 1'),
        expect.arrayContaining([expect.any(Number), expect.any(Number), 'iss-1'])
      );
      expect(mockRunAsync).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('UPDATE annotations SET is_deleted = 1'),
        expect.arrayContaining([expect.any(Number), expect.any(Number), 'iss-1'])
      );
    });
  });

  describe('withTableRecovery', () => {
    it('runs migrations and retries on "no such table" error', async () => {
      mockGetAllAsync
        .mockRejectedValueOnce(new Error('no such table: issues'))
        .mockResolvedValueOnce([issueRow]);

      const result = await repo.getAll();

      expect(runMigrations).toHaveBeenCalled();
      expect(mockGetAllAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual([expectedIssue]);
    });
  });

  describe('error paths', () => {
    it('getAll throws when database query fails', async () => {
      mockGetAllAsync.mockRejectedValue(new Error('DB error'));
      await expect(repo.getAll()).rejects.toThrow('DB error');
    });

    it('getById throws when database query fails', async () => {
      mockGetFirstAsync.mockRejectedValue(new Error('DB timeout'));
      await expect(repo.getById('iss-1')).rejects.toThrow('DB timeout');
    });

    it('create throws when database insert fails', async () => {
      mockRunAsync.mockRejectedValue(new Error('Constraint violation'));
      await expect(repo.create({ projectId: 'proj-1', title: 'Test' })).rejects.toThrow(
        'Constraint violation'
      );
    });

    it('update throws when database update fails', async () => {
      mockGetFirstAsync.mockResolvedValue(issueRow);
      mockRunAsync.mockRejectedValue(new Error('DB locked'));
      await expect(repo.update('iss-1', { title: 'Updated' })).rejects.toThrow('DB locked');
    });

    it('delete throws when database delete fails', async () => {
      mockRunAsync.mockRejectedValue(new Error('Foreign key constraint'));
      await expect(repo.delete('iss-1')).rejects.toThrow('Foreign key constraint');
    });

    it('getByProjectId throws when database query fails', async () => {
      mockGetAllAsync.mockRejectedValue(new Error('Connection lost'));
      await expect(repo.getByProjectId('proj-1')).rejects.toThrow('Connection lost');
    });

    it('updateSortOrder throws when database update fails', async () => {
      mockRunAsync.mockRejectedValue(new Error('DB timeout'));
      await expect(repo.updateSortOrder('iss-1', 5)).rejects.toThrow('DB timeout');
    });
  });
});
