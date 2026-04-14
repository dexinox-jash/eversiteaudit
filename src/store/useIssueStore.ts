import { create } from 'zustand';
import type { Issue } from '@/types/domain';
import { issueRepository, type CreateIssuePayload, type UpdateIssuePayload } from '@services/db/repositories';

export interface IssueStoreState {
  issues: Issue[];
  isLoading: boolean;
  error: string | null;
}

export interface IssueStoreActions {
  loadIssues: () => Promise<void>;
  loadIssuesByProject: (projectId: string) => Promise<void>;
  createIssue: (payload: CreateIssuePayload) => Promise<Issue>;
  updateIssue: (id: string, payload: UpdateIssuePayload) => Promise<Issue>;
  deleteIssue: (id: string) => Promise<void>;
  clearError: () => void;
}

export type IssueStore = IssueStoreState & IssueStoreActions;

export const useIssueStore = create<IssueStore>((set, get) => ({
  issues: [],
  isLoading: false,
  error: null,

  loadIssues: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const data = await issueRepository.getAll();
      set({ issues: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load issues', isLoading: false });
    }
  },

  loadIssuesByProject: async (projectId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const data = await issueRepository.getByProjectId(projectId);
      set({ issues: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load issues', isLoading: false });
    }
  },

  createIssue: async (payload: CreateIssuePayload): Promise<Issue> => {
    set({ error: null });
    const now = Date.now();
    const tempId = crypto.randomUUID();
    const tempIssue: Issue = {
      id: tempId,
      projectId: payload.projectId,
      title: payload.title,
      description: payload.description ?? null,
      category: payload.category ?? null,
      severity: payload.severity ?? 'medium',
      status: payload.status ?? 'open',
      locationDescription: payload.locationDescription ?? null,
      gpsLatitude: null,
      gpsLongitude: null,
      gpsAccuracy: null,
      assignedTo: payload.assignedTo ?? null,
      dueDate: payload.dueDate ?? null,
      resolutionNotes: null,
      resolvedAt: null,
      resolvedBy: null,
      createdAt: now,
      updatedAt: now,
      isDeleted: 0,
      deletedAt: null,
    };

    set((state) => ({ issues: [tempIssue, ...state.issues] }));

    try {
      const saved = await issueRepository.create(payload);
      set((state) => ({
        issues: state.issues.map((i) => (i.id === tempId ? saved : i)),
      }));
      return saved;
    } catch (err) {
      set((state) => ({
        issues: state.issues.filter((i) => i.id !== tempId),
        error: err instanceof Error ? err.message : 'Failed to create issue',
      }));
      throw err;
    }
  },

  updateIssue: async (id: string, payload: UpdateIssuePayload): Promise<Issue> => {
    set({ error: null });
    try {
      const updated = await issueRepository.update(id, payload);
      set((state) => ({
        issues: state.issues.map((i) => (i.id === id ? updated : i)),
      }));
      return updated;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update issue' });
      throw err;
    }
  },

  deleteIssue: async (id: string): Promise<void> => {
    set({ error: null });
    const target = get().issues.find((i) => i.id === id);
    if (!target) return;

    set((state) => ({ issues: state.issues.filter((i) => i.id !== id) }));

    try {
      await issueRepository.delete(id);
    } catch (err) {
      set((state) => ({
        issues: [...state.issues, target].sort((a, b) => b.updatedAt - a.updatedAt),
        error: err instanceof Error ? err.message : 'Failed to delete issue',
      }));
      throw err;
    }
  },

  clearError: (): void => {
    set({ error: null });
  },
}));
