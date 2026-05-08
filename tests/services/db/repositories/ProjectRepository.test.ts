import { ProjectRepository } from '@services/db/repositories/ProjectRepository';
import { encryptField } from '@services/security/fieldEncryption';
import type { Project } from '@/types/domain';

const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockRunAsync = jest.fn();
const mockWithExclusiveTransactionAsync = jest.fn();

jest.mock('@services/db/connection', () => ({
  getDatabase: jest.fn(() => ({
    getAllAsync: mockGetAllAsync,
    getFirstAsync: mockGetFirstAsync,
    runAsync: mockRunAsync,
    withExclusiveTransactionAsync: mockWithExclusiveTransactionAsync,
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

describe('ProjectRepository', () => {
  let repo: ProjectRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllAsync.mockReset();
    mockGetFirstAsync.mockReset();
    mockRunAsync.mockReset();
    mockWithExclusiveTransactionAsync.mockReset();
    repo = new ProjectRepository();
  });

  const projectRow = {
    id: 'proj-1',
    name: 'ENC:Test Project',
    description: 'ENC:A test description',
    site_address: 'ENC:123 Site St',
    client_name: 'ENC:Client A',
    status: 'active',
    priority: 1,
    created_at: 1000,
    updated_at: 2000,
    completed_at: null,
    created_by: 'ENC:Admin',
    is_deleted: 0,
    deleted_at: null,
  };

  const expectedProject: Project = {
    id: 'proj-1',
    name: 'Test Project',
    description: 'A test description',
    siteAddress: '123 Site St',
    clientName: 'Client A',
    status: 'active',
    priority: 1,
    createdAt: 1000,
    updatedAt: 2000,
    completedAt: null,
    createdBy: 'Admin',
    isDeleted: 0,
    deletedAt: null,
  };

  describe('getAll', () => {
    it('returns decrypted projects', async () => {
      mockGetAllAsync.mockResolvedValue([projectRow]);

      const result = await repo.getAll();

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM projects WHERE is_deleted = 0 ORDER BY updated_at DESC'
      );
      expect(result).toEqual([expectedProject]);
    });
  });

  describe('getById', () => {
    it('returns the decrypted project when found', async () => {
      mockGetFirstAsync.mockResolvedValue(projectRow);

      const result = await repo.getById('proj-1');

      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        'SELECT * FROM projects WHERE id = ? AND is_deleted = 0',
        ['proj-1']
      );
      expect(result).toEqual(expectedProject);
    });

    it('returns null when project is not found', async () => {
      mockGetFirstAsync.mockResolvedValue(null);

      const result = await repo.getById('missing');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('encrypts sensitive fields before insert and returns decrypted project', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue(projectRow);

      const result = await repo.create({
        name: 'Test Project',
        description: 'A test description',
        siteAddress: '123 Site St',
        clientName: 'Client A',
        status: 'active',
        priority: 1,
      });

      expect(encryptField).toHaveBeenCalledWith('Test Project');
      expect(encryptField).toHaveBeenCalledWith('A test description');
      expect(encryptField).toHaveBeenCalledWith('123 Site St');
      expect(encryptField).toHaveBeenCalledWith('Client A');

      const callArgs = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(callArgs[1]).toBe('ENC:Test Project');
      expect(callArgs[2]).toBe('ENC:A test description');
      expect(callArgs[3]).toBe('ENC:123 Site St');
      expect(callArgs[4]).toBe('ENC:Client A');

      expect(result).toEqual(expectedProject);
    });

    it('uses default values for optional fields', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue({
        ...projectRow,
        description: null,
        site_address: null,
        client_name: null,
      });

      const result = await repo.create({ name: 'Minimal' });

      expect(result.name).toBe('Test Project');
      const params = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(params[2]).toBeNull();    // description
      expect(params[3]).toBeNull();    // siteAddress
      expect(params[4]).toBeNull();    // clientName
      expect(params[5]).toBe('active'); // status default
      expect(params[6]).toBe(0);        // priority default
    });
  });

  describe('update', () => {
    it('encrypts sensitive fields before update', async () => {
      mockGetFirstAsync.mockResolvedValue(projectRow);
      mockRunAsync.mockResolvedValue(undefined);

      await repo.update('proj-1', { name: 'Updated Name' });

      expect(encryptField).toHaveBeenCalledWith('Updated Name');
      const callArgs = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(callArgs[0]).toBe('ENC:Updated Name');
    });

    it('throws when project does not exist', async () => {
      mockGetFirstAsync.mockResolvedValue(null);

      await expect(repo.update('missing', { name: 'X' })).rejects.toThrow(
        'Project not found: missing'
      );
    });

    it('updates with partial payload keeping existing values', async () => {
      mockGetFirstAsync.mockResolvedValue(projectRow);
      mockRunAsync.mockResolvedValue(undefined);

      const result = await repo.update('proj-1', { status: 'completed' });

      expect(result).toEqual(expectedProject);
      const callArgs = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(callArgs[4]).toBe('completed');
    });

    it('updates all provided fields', async () => {
      mockGetFirstAsync.mockResolvedValue(projectRow);
      mockRunAsync.mockResolvedValue(undefined);

      await repo.update('proj-1', {
        name: 'New Name',
        description: 'New Desc',
        siteAddress: 'New Address',
        clientName: 'New Client',
        status: 'completed',
        priority: 2,
        completedAt: 12345,
      });

      const callArgs = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(callArgs[0]).toBe('ENC:New Name');
      expect(callArgs[1]).toBe('ENC:New Desc');
      expect(callArgs[2]).toBe('ENC:New Address');
      expect(callArgs[3]).toBe('ENC:New Client');
      expect(callArgs[4]).toBe('completed');
      expect(callArgs[5]).toBe(2);
      expect(callArgs[7]).toBe(12345);
    });

    it('throws when updated project cannot be refetched', async () => {
      mockGetFirstAsync
        .mockResolvedValueOnce(projectRow)
        .mockResolvedValueOnce(null);
      mockRunAsync.mockResolvedValue(undefined);

      await expect(repo.update('proj-1', { name: 'Updated' })).rejects.toThrow(
        'Failed to retrieve updated project'
      );
    });
  });

  describe('delete', () => {
    it('soft-deletes a project and cascades to issues, photos, and annotations', async () => {
      mockRunAsync.mockResolvedValue(undefined);

      await repo.delete('proj-1');

      expect(mockRunAsync).toHaveBeenCalledTimes(4);
      expect(mockRunAsync).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('UPDATE projects SET is_deleted = 1'),
        expect.any(Array)
      );
      expect(mockRunAsync).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE issues SET is_deleted = 1'),
        expect.arrayContaining([expect.any(Number), expect.any(Number), 'proj-1'])
      );
      expect(mockRunAsync).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('UPDATE photos SET is_deleted = 1'),
        expect.arrayContaining([expect.any(Number), expect.any(Number), 'proj-1'])
      );
      expect(mockRunAsync).toHaveBeenNthCalledWith(
        4,
        expect.stringContaining('UPDATE annotations SET is_deleted = 1'),
        expect.arrayContaining([expect.any(Number), expect.any(Number), 'proj-1'])
      );
    });
  });

  describe('getByStatus', () => {
    it('returns decrypted projects filtered by status', async () => {
      mockGetAllAsync.mockResolvedValue([projectRow]);

      const result = await repo.getByStatus('active');

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM projects WHERE status = ? AND is_deleted = 0 ORDER BY updated_at DESC',
        ['active']
      );
      expect(result).toEqual([expectedProject]);
    });
  });

  describe('error paths', () => {
    it('getAll throws when database query fails', async () => {
      mockGetAllAsync.mockRejectedValue(new Error('DB connection lost'));

      await expect(repo.getAll()).rejects.toThrow('DB connection lost');
    });

    it('getById throws when database query fails', async () => {
      mockGetFirstAsync.mockRejectedValue(new Error('DB timeout'));

      await expect(repo.getById('proj-1')).rejects.toThrow('DB timeout');
    });

    it('create throws when database insert fails', async () => {
      mockRunAsync.mockRejectedValue(new Error('Constraint violation'));

      await expect(
        repo.create({
          name: 'Test',
          description: null,
          siteAddress: null,
          clientName: null,
          status: 'active',
          priority: 0,
        })
      ).rejects.toThrow('Constraint violation');
    });

    it('create throws when retrieving created project fails', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue(null);

      await expect(
        repo.create({
          name: 'Test',
          description: null,
          siteAddress: null,
          clientName: null,
          status: 'active',
          priority: 0,
        })
      ).rejects.toThrow('Failed to retrieve created project');
    });

    it('update throws when database update fails', async () => {
      mockGetFirstAsync.mockResolvedValue(projectRow);
      mockRunAsync.mockRejectedValue(new Error('DB locked'));

      await expect(repo.update('proj-1', { name: 'Updated' })).rejects.toThrow('DB locked');
    });

    it('delete throws when database delete fails', async () => {
      mockRunAsync.mockRejectedValue(new Error('Foreign key constraint'));

      await expect(repo.delete('proj-1')).rejects.toThrow('Foreign key constraint');
    });

    it('createProjectWithIssues throws when transaction fails', async () => {
      const mockTxn = {
        runAsync: jest.fn().mockRejectedValue(new Error('Transaction rollback')),
      };
      mockWithExclusiveTransactionAsync.mockImplementation(
        async (cb: (txn: unknown) => Promise<void>) => {
          await cb(mockTxn);
        }
      );

      await expect(
        repo.createProjectWithIssues(
          {
            name: 'Test',
            description: null,
            siteAddress: null,
            clientName: null,
            status: 'active',
            priority: 0,
          },
          [
            {
              title: 'Issue 1',
              description: null,
              category: null,
              severity: 'medium',
              status: 'open',
              locationDescription: null,
              assignedTo: null,
              dueDate: null,
            },
          ]
        )
      ).rejects.toThrow('Transaction rollback');
    });

    it('createProjectWithIssues succeeds and returns project', async () => {
      const mockTxn = {
        runAsync: jest.fn().mockResolvedValue(undefined),
      };
      mockWithExclusiveTransactionAsync.mockImplementation(
        async (cb: (txn: unknown) => Promise<void>) => {
          await cb(mockTxn);
        }
      );
      mockGetFirstAsync.mockResolvedValue(projectRow);

      const result = await repo.createProjectWithIssues(
        {
          name: 'Test',
          description: null,
          siteAddress: null,
          clientName: null,
          status: 'active',
          priority: 0,
        },
        [
          {
            title: 'Issue 1',
            description: null,
            category: null,
            severity: 'medium',
            status: 'open',
            locationDescription: null,
            assignedTo: null,
            dueDate: null,
          },
        ]
      );

      expect(result).toEqual(expectedProject);
      expect(mockTxn.runAsync).toHaveBeenCalledTimes(2);
    });

    it('createProjectWithIssues uses default severity and status for issues', async () => {
      const mockTxn = {
        runAsync: jest.fn().mockResolvedValue(undefined),
      };
      mockWithExclusiveTransactionAsync.mockImplementation(
        async (cb: (txn: unknown) => Promise<void>) => {
          await cb(mockTxn);
        }
      );
      mockGetFirstAsync.mockResolvedValue(projectRow);

      await repo.createProjectWithIssues(
        {
          name: 'Test',
          description: null,
          siteAddress: null,
          clientName: null,
          status: 'active',
          priority: 0,
        },
        [
          {
            title: 'Issue 1',
            description: null,
            category: 'quality',
            locationDescription: null,
            assignedTo: null,
            dueDate: 12345,
          },
        ]
      );

      const issueCall = mockTxn.runAsync.mock.calls[1]![1] as unknown[];
      expect(issueCall[4]).toBe('quality');
      expect(issueCall[5]).toBe('medium');
      expect(issueCall[6]).toBe('open');
      expect(issueCall[12]).toBe(12345);
    });

    it('createProjectWithIssues uses default values for optional fields', async () => {
      const mockTxn = {
        runAsync: jest.fn().mockResolvedValue(undefined),
      };
      mockWithExclusiveTransactionAsync.mockImplementation(
        async (cb: (txn: unknown) => Promise<void>) => {
          await cb(mockTxn);
        }
      );
      mockGetFirstAsync.mockResolvedValue(projectRow);

      await repo.createProjectWithIssues({ name: 'Minimal' }, []);

      const params = mockTxn.runAsync.mock.calls[0]![1] as unknown[];
      expect(params[2]).toBeNull();    // description
      expect(params[3]).toBeNull();    // siteAddress
      expect(params[5]).toBe('active'); // status default
      expect(params[6]).toBe(0);        // priority default
    });

    it('throws when project cannot be retrieved after transaction', async () => {
      const mockTxn = {
        runAsync: jest.fn().mockResolvedValue(undefined),
      };
      mockWithExclusiveTransactionAsync.mockImplementation(
        async (cb: (txn: unknown) => Promise<void>) => {
          await cb(mockTxn);
        }
      );
      mockGetFirstAsync.mockResolvedValue(null);

      await expect(
        repo.createProjectWithIssues(
          { name: 'Test', description: null, siteAddress: null, clientName: null, status: 'active', priority: 0 },
          []
        )
      ).rejects.toThrow('Failed to retrieve created project');
    });
  });
});
