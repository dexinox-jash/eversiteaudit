import { create } from 'zustand';
import type { Project, ProjectStatus } from '@/types/domain';
import {
  projectRepository,
  type CreateProjectPayload,
  type UpdateProjectPayload,
} from '@services/db/repositories';

export type ProjectFilter = ProjectStatus | 'all';

export interface ProjectStoreState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  filter: ProjectFilter;
}

export interface ProjectStoreActions {
  loadProjects: () => Promise<void>;
  createProject: (payload: CreateProjectPayload) => Promise<Project>;
  updateProject: (id: string, payload: UpdateProjectPayload) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  loadDeletedProjects: () => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  permanentlyDeleteProject: (id: string) => Promise<void>;
  setFilter: (filter: ProjectFilter) => void;
  clearError: () => void;
}

export type ProjectStore = ProjectStoreState & ProjectStoreActions;

/**
 * Zustand store for project data.
 *
 * Usage:
 *   const projects = useProjectStore((s) => s.projects);
 *   const { loadProjects, createProject } = useProjectStore();
 */
export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,
  filter: 'all',

  loadProjects: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const data = await projectRepository.getAll();
      set({ projects: data, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load projects',
        isLoading: false,
      });
    }
  },

  createProject: async (payload: CreateProjectPayload): Promise<Project> => {
    set({ error: null });
    const now = Date.now();
    const tempId = crypto.randomUUID();
    const tempProject: Project = {
      id: tempId,
      name: payload.name,
      description: payload.description ?? null,
      siteAddress: payload.siteAddress ?? null,
      clientName: payload.clientName ?? null,
      status: payload.status ?? 'active',
      priority: payload.priority ?? 0,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      createdBy: null,
      isDeleted: 0,
      deletedAt: null,
    };

    set((state) => ({ projects: [tempProject, ...state.projects] }));

    try {
      const saved = await projectRepository.create(payload);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === tempId ? saved : p)),
      }));
      return saved;
    } catch (err) {
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== tempId),
        error: err instanceof Error ? err.message : 'Failed to create project',
      }));
      throw err;
    }
  },

  updateProject: async (id: string, payload: UpdateProjectPayload): Promise<Project> => {
    set({ error: null });
    try {
      const updated = await projectRepository.update(id, payload);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
      }));
      return updated;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update project' });
      throw err;
    }
  },

  deleteProject: async (id: string): Promise<void> => {
    set({ error: null });
    const target = get().projects.find((p) => p.id === id);
    if (!target) return;

    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }));

    try {
      await projectRepository.delete(id);
    } catch (err) {
      set((state) => ({
        projects: [...state.projects, target].sort((a, b) => b.updatedAt - a.updatedAt),
        error: err instanceof Error ? err.message : 'Failed to delete project',
      }));
      throw err;
    }
  },

  loadDeletedProjects: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const projects = await projectRepository.getDeleted();
      set({ projects, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load deleted projects',
        isLoading: false,
      });
    }
  },

  restoreProject: async (id: string): Promise<void> => {
    set({ error: null });
    try {
      await projectRepository.restore(id);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to restore project' });
      throw err;
    }
  },

  permanentlyDeleteProject: async (id: string): Promise<void> => {
    set({ error: null });
    try {
      await projectRepository.permanentlyDelete(id);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to permanently delete project' });
      throw err;
    }
  },

  setFilter: (filter: ProjectFilter): void => {
    set({ filter });
  },

  clearError: (): void => {
    set({ error: null });
  },
}));

export function selectFilteredProjects(store: ProjectStore): Project[] {
  if (store.filter === 'all') return store.projects;
  return store.projects.filter((p) => p.status === store.filter);
}
