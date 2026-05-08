import { useIssueStore, selectIssues, selectIssuesLoading, selectIssuesError } from '@store/useIssueStore';
import { issueRepository } from '@services/db/repositories';
import type { Issue } from '@/types/domain';

jest.mock('@services/db/repositories', () => ({
  issueRepository: {
    getAll: jest.fn(),
    getByProjectId: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateSortOrder: jest.fn(),
  },
}));

describe('useIssueStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIssueStore.setState({
      issues: [],
      isLoading: false,
      error: null,
    });
  });

  const mockIssue: Issue = {
    id: 'issue-1',
    projectId: 'proj-1',
    title: 'Test Issue',
    description: 'Desc',
    category: 'safety',
    severity: 'high',
    status: 'open',
    locationDescription: null,
    gpsLatitude: null,
    gpsLongitude: null,
    gpsAccuracy: null,
    assignedTo: null,
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

  it('has correct initial state', () => {
    const state = useIssueStore.getState();
    expect(state.issues).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('selectIssues returns issues array', () => {
    useIssueStore.setState({ issues: [mockIssue] });
    expect(selectIssues(useIssueStore.getState())).toEqual([mockIssue]);
  });

  it('selectIssuesLoading returns loading state', () => {
    useIssueStore.setState({ isLoading: true });
    expect(selectIssuesLoading(useIssueStore.getState())).toBe(true);
  });

  it('selectIssuesError returns error state', () => {
    useIssueStore.setState({ error: 'err' });
    expect(selectIssuesError(useIssueStore.getState())).toBe('err');
  });

  describe('loadIssues', () => {
    it('loads all issues', async () => {
      (issueRepository.getAll as jest.Mock).mockResolvedValue([mockIssue]);

      await useIssueStore.getState().loadIssues();

      expect(useIssueStore.getState().issues).toEqual([mockIssue]);
      expect(useIssueStore.getState().isLoading).toBe(false);
    });

    it('handles errors', async () => {
      (issueRepository.getAll as jest.Mock).mockRejectedValue(new Error('Load error'));

      await useIssueStore.getState().loadIssues();

      expect(useIssueStore.getState().error).toBe('Load error');
    });

    it('handles non-Error load failures', async () => {
      (issueRepository.getAll as jest.Mock).mockRejectedValue('string-error');

      await useIssueStore.getState().loadIssues();

      expect(useIssueStore.getState().error).toBe('Failed to load issues');
    });
  });

  describe('loadIssuesByProject', () => {
    it('loads issues by project', async () => {
      (issueRepository.getByProjectId as jest.Mock).mockResolvedValue([mockIssue]);

      await useIssueStore.getState().loadIssuesByProject('proj-1');

      expect(issueRepository.getByProjectId).toHaveBeenCalledWith('proj-1');
      expect(useIssueStore.getState().issues).toEqual([mockIssue]);
    });

    it('handles errors', async () => {
      (issueRepository.getByProjectId as jest.Mock).mockRejectedValue(new Error('Load error'));

      await useIssueStore.getState().loadIssuesByProject('proj-1');

      expect(useIssueStore.getState().error).toBe('Load error');
    });

    it('handles non-Error load failures', async () => {
      (issueRepository.getByProjectId as jest.Mock).mockRejectedValue('string-error');

      await useIssueStore.getState().loadIssuesByProject('proj-1');

      expect(useIssueStore.getState().error).toBe('Failed to load issues');
    });
  });

  describe('createIssue', () => {
    it('creates issue optimistically and replaces with saved', async () => {
      const saved = { ...mockIssue, id: 'issue-saved' };
      (issueRepository.create as jest.Mock).mockResolvedValue(saved);

      const promise = useIssueStore.getState().createIssue({
        projectId: 'proj-1',
        title: 'Test Issue',
      });

      expect(useIssueStore.getState().issues).toHaveLength(1);

      const result = await promise;
      expect(result).toEqual(saved);
      expect(useIssueStore.getState().issues[0]!.id).toBe('issue-saved');
    });

    it('preserves other issues when replacing temp issue', async () => {
      const existing = { ...mockIssue, id: 'issue-existing' };
      useIssueStore.setState({ issues: [existing] });
      const saved = { ...mockIssue, id: 'issue-saved' };
      (issueRepository.create as jest.Mock).mockResolvedValue(saved);

      await useIssueStore.getState().createIssue({
        projectId: 'proj-1',
        title: 'Test Issue',
      });

      expect(useIssueStore.getState().issues).toHaveLength(2);
      expect(useIssueStore.getState().issues.map((i) => i.id)).toContain('issue-existing');
      expect(useIssueStore.getState().issues.map((i) => i.id)).toContain('issue-saved');
    });

    it('rolls back on error', async () => {
      (issueRepository.create as jest.Mock).mockRejectedValue(new Error('Create error'));

      await expect(
        useIssueStore.getState().createIssue({ projectId: 'proj-1', title: 'Test' })
      ).rejects.toThrow('Create error');

      expect(useIssueStore.getState().issues).toEqual([]);
      expect(useIssueStore.getState().error).toBe('Create error');
    });

    it('rolls back on non-Error create failure', async () => {
      (issueRepository.create as jest.Mock).mockRejectedValue('create-err');

      await expect(
        useIssueStore.getState().createIssue({ projectId: 'proj-1', title: 'Test' })
      ).rejects.toBe('create-err');

      expect(useIssueStore.getState().error).toBe('Failed to create issue');
    });
  });

  describe('updateIssue', () => {
    it('updates issue in state', async () => {
      useIssueStore.setState({ issues: [mockIssue] });
      const updated = { ...mockIssue, title: 'Updated' };
      (issueRepository.update as jest.Mock).mockResolvedValue(updated);

      const result = await useIssueStore.getState().updateIssue('issue-1', { title: 'Updated' });

      expect(result).toEqual(updated);
      expect(useIssueStore.getState().issues[0]!.title).toBe('Updated');
    });

    it('updates only matching issue when multiple exist', async () => {
      const issue2 = { ...mockIssue, id: 'issue-2', title: 'Other' };
      useIssueStore.setState({ issues: [mockIssue, issue2] });
      const updated = { ...mockIssue, title: 'Updated' };
      (issueRepository.update as jest.Mock).mockResolvedValue(updated);

      await useIssueStore.getState().updateIssue('issue-1', { title: 'Updated' });

      expect(useIssueStore.getState().issues.find((i) => i.id === 'issue-1')!.title).toBe('Updated');
      expect(useIssueStore.getState().issues.find((i) => i.id === 'issue-2')!.title).toBe('Other');
    });

    it('sets error on failure', async () => {
      useIssueStore.setState({ issues: [mockIssue] });
      (issueRepository.update as jest.Mock).mockRejectedValue(new Error('Update error'));

      await expect(
        useIssueStore.getState().updateIssue('issue-1', { title: 'Updated' })
      ).rejects.toThrow('Update error');

      expect(useIssueStore.getState().error).toBe('Update error');
    });

    it('sets generic error on non-Error update failure', async () => {
      useIssueStore.setState({ issues: [mockIssue] });
      (issueRepository.update as jest.Mock).mockRejectedValue(123);

      await expect(
        useIssueStore.getState().updateIssue('issue-1', { title: 'Updated' })
      ).rejects.toBe(123);

      expect(useIssueStore.getState().error).toBe('Failed to update issue');
    });
  });

  describe('deleteIssue', () => {
    it('deletes optimistically', async () => {
      useIssueStore.setState({ issues: [mockIssue] });
      (issueRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await useIssueStore.getState().deleteIssue('issue-1');

      expect(useIssueStore.getState().issues).toEqual([]);
    });

    it('does nothing when issue not found in state', async () => {
      useIssueStore.setState({ issues: [mockIssue] });

      await useIssueStore.getState().deleteIssue('missing');

      expect(useIssueStore.getState().issues).toEqual([mockIssue]);
      expect(issueRepository.delete).not.toHaveBeenCalled();
    });

    it('restores on failure', async () => {
      useIssueStore.setState({ issues: [mockIssue] });
      (issueRepository.delete as jest.Mock).mockRejectedValue(new Error('Delete error'));

      await expect(useIssueStore.getState().deleteIssue('issue-1')).rejects.toThrow('Delete error');

      expect(useIssueStore.getState().issues).toEqual([mockIssue]);
      expect(useIssueStore.getState().error).toBe('Delete error');
    });

    it('restores on non-Error delete failure', async () => {
      const issue2 = { ...mockIssue, id: 'issue-2', updatedAt: 500 };
      useIssueStore.setState({ issues: [mockIssue, issue2] });
      (issueRepository.delete as jest.Mock).mockRejectedValue('del-err');

      await expect(useIssueStore.getState().deleteIssue('issue-1')).rejects.toBe('del-err');

      expect(useIssueStore.getState().error).toBe('Failed to delete issue');
    });
  });

  describe('bulkDelete', () => {
    it('bulk deletes issues', async () => {
      const issue2 = { ...mockIssue, id: 'issue-2' };
      useIssueStore.setState({ issues: [mockIssue, issue2] });
      (issueRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await useIssueStore.getState().bulkDelete(['issue-1']);

      expect(useIssueStore.getState().issues).toEqual([issue2]);
    });

    it('restores on failure', async () => {
      const issue2 = { ...mockIssue, id: 'issue-2', updatedAt: 3000 };
      useIssueStore.setState({ issues: [mockIssue, issue2] });
      (issueRepository.delete as jest.Mock).mockRejectedValue(new Error('Bulk delete error'));

      await expect(useIssueStore.getState().bulkDelete(['issue-1'])).rejects.toThrow(
        'Bulk delete error'
      );

      expect(useIssueStore.getState().issues).toEqual(expect.arrayContaining([mockIssue, issue2]));
    });

    it('restores on non-Error bulk delete failure', async () => {
      const issue2 = { ...mockIssue, id: 'issue-2', updatedAt: 500 };
      useIssueStore.setState({ issues: [mockIssue, issue2] });
      (issueRepository.delete as jest.Mock).mockRejectedValue('bulk-del-err');

      await expect(useIssueStore.getState().bulkDelete(['issue-1'])).rejects.toBe('bulk-del-err');

      expect(useIssueStore.getState().error).toBe('Failed to delete issues');
    });

    it('does nothing if no matching issues', async () => {
      useIssueStore.setState({ issues: [mockIssue] });
      await useIssueStore.getState().bulkDelete(['missing']);
      expect(issueRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('bulkUpdateStatus', () => {
    it('updates status for multiple issues', async () => {
      const issue2 = { ...mockIssue, id: 'issue-2', status: 'open' as const };
      useIssueStore.setState({ issues: [mockIssue, issue2] });
      const updated1 = { ...mockIssue, status: 'resolved' as const };
      const updated2 = { ...issue2, status: 'resolved' as const };
      (issueRepository.update as jest.Mock).mockResolvedValue(undefined);
      (issueRepository.getById as jest.Mock)
        .mockResolvedValueOnce(updated1)
        .mockResolvedValueOnce(updated2);

      await useIssueStore.getState().bulkUpdateStatus(['issue-1', 'issue-2'], 'resolved');

      expect(useIssueStore.getState().issues[0]!.status).toBe('resolved');
      expect(useIssueStore.getState().issues[1]!.status).toBe('resolved');
    });

    it('falls back to current issue when getById returns null', async () => {
      const issue2 = { ...mockIssue, id: 'issue-2', status: 'open' as const };
      useIssueStore.setState({ issues: [mockIssue, issue2] });
      (issueRepository.update as jest.Mock).mockResolvedValue(undefined);
      (issueRepository.getById as jest.Mock).mockResolvedValue(null);

      await useIssueStore.getState().bulkUpdateStatus(['issue-1'], 'resolved');

      // Optimistic update applied, refetch fallback keeps it since getById returns null
      expect(useIssueStore.getState().issues.find((i) => i.id === 'issue-1')!.status).toBe('resolved');
    });

    it('restores previous state on error', async () => {
      useIssueStore.setState({ issues: [mockIssue] });
      (issueRepository.update as jest.Mock).mockRejectedValue(new Error('Bulk update error'));

      await expect(
        useIssueStore.getState().bulkUpdateStatus(['issue-1'], 'resolved')
      ).rejects.toThrow('Bulk update error');

      expect(useIssueStore.getState().issues[0]!.status).toBe('open');
      expect(useIssueStore.getState().error).toBe('Bulk update error');
    });

    it('restores on non-Error bulk update failure', async () => {
      useIssueStore.setState({ issues: [mockIssue] });
      (issueRepository.update as jest.Mock).mockRejectedValue('bulk-up-err');

      await expect(
        useIssueStore.getState().bulkUpdateStatus(['issue-1'], 'resolved')
      ).rejects.toBe('bulk-up-err');

      expect(useIssueStore.getState().error).toBe('Failed to update issues');
    });
  });

  describe('updateSortOrder', () => {
    it('updates sort order optimistically', async () => {
      useIssueStore.setState({ issues: [mockIssue] });
      (issueRepository.updateSortOrder as jest.Mock).mockResolvedValue(undefined);

      await useIssueStore.getState().updateSortOrder([{ id: 'issue-1', sortOrder: 5 }]);

      expect(useIssueStore.getState().issues[0]!.sortOrder).toBe(5);
    });

    it('leaves unmatched issues unchanged during sort order update', async () => {
      const issue2 = { ...mockIssue, id: 'issue-2', sortOrder: 0 };
      useIssueStore.setState({ issues: [mockIssue, issue2] });
      (issueRepository.updateSortOrder as jest.Mock).mockResolvedValue(undefined);

      await useIssueStore.getState().updateSortOrder([{ id: 'issue-1', sortOrder: 5 }]);

      expect(useIssueStore.getState().issues.find((i) => i.id === 'issue-1')!.sortOrder).toBe(5);
      expect(useIssueStore.getState().issues.find((i) => i.id === 'issue-2')!.sortOrder).toBe(0);
    });

    it('restores on error', async () => {
      useIssueStore.setState({ issues: [mockIssue] });
      (issueRepository.updateSortOrder as jest.Mock).mockRejectedValue(new Error('Sort error'));

      await expect(
        useIssueStore.getState().updateSortOrder([{ id: 'issue-1', sortOrder: 5 }])
      ).rejects.toThrow('Sort error');

      expect(useIssueStore.getState().issues[0]!.sortOrder).toBe(0);
    });

    it('restores on non-Error sort order failure', async () => {
      useIssueStore.setState({ issues: [mockIssue] });
      (issueRepository.updateSortOrder as jest.Mock).mockRejectedValue('sort-err');

      await expect(
        useIssueStore.getState().updateSortOrder([{ id: 'issue-1', sortOrder: 5 }])
      ).rejects.toBe('sort-err');

      expect(useIssueStore.getState().error).toBe('Failed to update sort order');
    });
  });

  describe('clearError', () => {
    it('clears error', () => {
      useIssueStore.setState({ error: 'Err' });
      useIssueStore.getState().clearError();
      expect(useIssueStore.getState().error).toBeNull();
    });
  });
});
