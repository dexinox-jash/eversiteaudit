import { useProjectStore, selectFilteredProjects, type ProjectStore } from '@store/useProjectStore';
import { projectRepository } from '@services/db/repositories';
import type { Project } from '@/types/domain';

jest.mock('@services/db/repositories', () => ({
  projectRepository: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@services/integrity/photoIntegrity', () => ({
  computeFileChecksum: jest.fn(),
}));

describe('useProjectStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProjectStore.setState({
      projects: [],
      isLoading: false,
      error: null,
      filter: 'all',
    });
  });

  const mockProject: Project = {
    id: 'proj-1',
    name: 'Test Project',
    description: 'Description',
    siteAddress: '123 Main St',
    clientName: 'Client',
    status: 'active',
    priority: 1,
    createdAt: 1000,
    updatedAt: 2000,
    completedAt: null,
    createdBy: null,
    isDeleted: 0,
    deletedAt: null,
  };

  it('has correct initial state', () => {
    const state = useProjectStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.filter).toBe('all');
  });

  describe('loadProjects', () => {
    it('loads projects successfully', async () => {
      (projectRepository.getAll as jest.Mock).mockResolvedValue([mockProject]);

      await useProjectStore.getState().loadProjects();

      const state = useProjectStore.getState();
      expect(state.projects).toEqual([mockProject]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('handles load errors', async () => {
      (projectRepository.getAll as jest.Mock).mockRejectedValue(new Error('DB error'));

      await useProjectStore.getState().loadProjects();

      const state = useProjectStore.getState();
      expect(state.projects).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('DB error');
    });

    it('handles non-Error load failures', async () => {
      (projectRepository.getAll as jest.Mock).mockRejectedValue('load-err');

      await useProjectStore.getState().loadProjects();

      expect(useProjectStore.getState().error).toBe('Failed to load projects');
    });
  });

  describe('createProject', () => {
    it('creates a project optimistically and replaces with saved', async () => {
      const savedProject = { ...mockProject, id: 'proj-saved' };
      (projectRepository.create as jest.Mock).mockResolvedValue(savedProject);

      const promise = useProjectStore.getState().createProject({
        name: 'Test Project',
        description: 'Description',
        siteAddress: '123 Main St',
        clientName: 'Client',
        status: 'active',
        priority: 1,
      });

      // Optimistic state
      let state = useProjectStore.getState();
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0]!.name).toBe('Test Project');

      const result = await promise;
      expect(result).toEqual(savedProject);

      state = useProjectStore.getState();
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0]!.id).toBe('proj-saved');
    });

    it('preserves other projects when replacing temp project', async () => {
      const existing = { ...mockProject, id: 'proj-existing' };
      useProjectStore.setState({ projects: [existing] });
      const savedProject = { ...mockProject, id: 'proj-saved' };
      (projectRepository.create as jest.Mock).mockResolvedValue(savedProject);

      await useProjectStore.getState().createProject({ name: 'Test Project' });

      expect(useProjectStore.getState().projects).toHaveLength(2);
      expect(useProjectStore.getState().projects.map((p) => p.id)).toContain('proj-existing');
      expect(useProjectStore.getState().projects.map((p) => p.id)).toContain('proj-saved');
    });

    it('rolls back on error', async () => {
      (projectRepository.create as jest.Mock).mockRejectedValue(new Error('Create failed'));

      await expect(
        useProjectStore.getState().createProject({ name: 'Test Project' })
      ).rejects.toThrow('Create failed');

      const state = useProjectStore.getState();
      expect(state.projects).toEqual([]);
      expect(state.error).toBe('Create failed');
    });

    it('rolls back on non-Error create failure', async () => {
      (projectRepository.create as jest.Mock).mockRejectedValue('create-err');

      await expect(
        useProjectStore.getState().createProject({ name: 'Test Project' })
      ).rejects.toBe('create-err');

      expect(useProjectStore.getState().error).toBe('Failed to create project');
    });
  });

  describe('updateProject', () => {
    it('updates a project in state', async () => {
      useProjectStore.setState({ projects: [mockProject] });
      const updatedProject = { ...mockProject, name: 'Updated Name' };
      (projectRepository.update as jest.Mock).mockResolvedValue(updatedProject);

      const result = await useProjectStore
        .getState()
        .updateProject('proj-1', { name: 'Updated Name' });

      expect(result).toEqual(updatedProject);
      expect(useProjectStore.getState().projects[0]!.name).toBe('Updated Name');
    });

    it('updates only matching project when multiple exist', async () => {
      const proj2 = { ...mockProject, id: 'proj-2', name: 'Other' };
      useProjectStore.setState({ projects: [mockProject, proj2] });
      const updatedProject = { ...mockProject, name: 'Updated Name' };
      (projectRepository.update as jest.Mock).mockResolvedValue(updatedProject);

      await useProjectStore.getState().updateProject('proj-1', { name: 'Updated Name' });

      expect(useProjectStore.getState().projects.find((p) => p.id === 'proj-1')!.name).toBe(
        'Updated Name'
      );
      expect(useProjectStore.getState().projects.find((p) => p.id === 'proj-2')!.name).toBe('Other');
    });

    it('sets error on update failure', async () => {
      useProjectStore.setState({ projects: [mockProject] });
      (projectRepository.update as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(
        useProjectStore.getState().updateProject('proj-1', { name: 'Updated Name' })
      ).rejects.toThrow('Update failed');

      expect(useProjectStore.getState().error).toBe('Update failed');
    });

    it('sets generic error on non-Error update failure', async () => {
      useProjectStore.setState({ projects: [mockProject] });
      (projectRepository.update as jest.Mock).mockRejectedValue(123);

      await expect(
        useProjectStore.getState().updateProject('proj-1', { name: 'Updated Name' })
      ).rejects.toBe(123);

      expect(useProjectStore.getState().error).toBe('Failed to update project');
    });
  });

  describe('deleteProject', () => {
    it('deletes a project optimistically', async () => {
      useProjectStore.setState({ projects: [mockProject] });
      (projectRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await useProjectStore.getState().deleteProject('proj-1');

      expect(useProjectStore.getState().projects).toEqual([]);
    });

    it('restores project on delete failure', async () => {
      useProjectStore.setState({ projects: [mockProject] });
      (projectRepository.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      await expect(useProjectStore.getState().deleteProject('proj-1')).rejects.toThrow(
        'Delete failed'
      );

      expect(useProjectStore.getState().projects).toEqual([mockProject]);
      expect(useProjectStore.getState().error).toBe('Delete failed');
    });

    it('restores on non-Error delete failure', async () => {
      const proj2 = { ...mockProject, id: 'proj-2', updatedAt: 500 };
      useProjectStore.setState({ projects: [mockProject, proj2] });
      (projectRepository.delete as jest.Mock).mockRejectedValue('del-err');

      await expect(useProjectStore.getState().deleteProject('proj-1')).rejects.toBe('del-err');

      expect(useProjectStore.getState().error).toBe('Failed to delete project');
    });

    it('does nothing if project not found', async () => {
      await useProjectStore.getState().deleteProject('missing');
      expect(projectRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('setFilter', () => {
    it('sets the filter', () => {
      useProjectStore.getState().setFilter('active');
      expect(useProjectStore.getState().filter).toBe('active');
    });
  });

  describe('clearError', () => {
    it('clears the error', () => {
      useProjectStore.setState({ error: 'Some error' });
      useProjectStore.getState().clearError();
      expect(useProjectStore.getState().error).toBeNull();
    });
  });

  describe('selectFilteredProjects', () => {
    it('returns all projects when filter is all', () => {
      const store: ProjectStore = {
        projects: [mockProject],
        isLoading: false,
        error: null,
        filter: 'all',
        loadProjects: jest.fn(),
        createProject: jest.fn(),
        updateProject: jest.fn(),
        deleteProject: jest.fn(),
        setFilter: jest.fn(),
        clearError: jest.fn(),
        loadDeletedProjects: jest.fn(),
        restoreProject: jest.fn(),
        permanentlyDeleteProject: jest.fn(),
      };
      expect(selectFilteredProjects(store)).toEqual([mockProject]);
    });

    it('filters by status', () => {
      const activeProj = mockProject;
      const completedProj = { ...mockProject, id: 'proj-2', status: 'completed' as const };
      const store: ProjectStore = {
        projects: [activeProj, completedProj],
        isLoading: false,
        error: null,
        filter: 'completed',
        loadProjects: jest.fn(),
        createProject: jest.fn(),
        updateProject: jest.fn(),
        deleteProject: jest.fn(),
        setFilter: jest.fn(),
        clearError: jest.fn(),
        loadDeletedProjects: jest.fn(),
        restoreProject: jest.fn(),
        permanentlyDeleteProject: jest.fn(),
      };
      expect(selectFilteredProjects(store)).toEqual([completedProj]);
    });
  });
});
