import { create } from 'zustand';
import type { Issue, IssueStatus } from '@/types/domain';
import {
  issueRepository,
  type CreateIssuePayload,
  type UpdateIssuePayload,
} from '@services/db/repositories';

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
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: IssueStatus) => Promise<void>;
  updateSortOrder: (updates: { id: string; sortOrder: number }[]) => Promise<void>;
  loadDeletedIssues: () => Promise<void>;
  restoreIssue: (id: string) => Promise<void>;
  permanentlyDeleteIssue: (id: string) => Promise<void>;
  clearError: () => void;
}

export type IssueStore = IssueStoreState & IssueStoreActions;

/** Selector: subscribe only to the issues array (prevents re-render on isLoading changes). */
export function selectIssues(store: IssueStore): Issue[] {
  return store.issues;
}

/** Selector: subscribe only to loading state. */
export function selectIssuesLoading(store: IssueStore): boolean {
  return store.isLoading;
}

/** Selector: subscribe only to error state. */
export function selectIssuesError(store: IssueStore): string | null {
  return store.error;
}

/**
 * Zustand store for issue data.
 *
 * Usage:
 *   const issues = useIssueStore((s) => s.issues);
 *   const { loadIssuesByProject, createIssue } = useIssueStore();
 */
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
      set({
        error: err instanceof Error ? err.message : 'Failed to load issues',
        isLoading: false,
      });
    }
  },

  loadIssuesByProject: async (projectId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const data = await issueRepository.getByProjectId(projectId);
      set({ issues: data, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load issues',
        isLoading: false,
      });
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
      voiceNoteUrl: null,
      sortOrder: 0,
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

  bulkDelete: async (ids: string[]): Promise<void> => {
    set({ error: null });
    const targets = get().issues.filter((i) => ids.includes(i.id));
    if (targets.length === 0) return;

    set((state) => ({ issues: state.issues.filter((i) => !ids.includes(i.id)) }));

    try {
      await Promise.all(ids.map((id) => issueRepository.delete(id)));
    } catch (err) {
      set((state) => ({
        issues: [...state.issues, ...targets].sort((a, b) => b.updatedAt - a.updatedAt),
        error: err instanceof Error ? err.message : 'Failed to delete issues',
      }));
      throw err;
    }
  },

  bulkUpdateStatus: async (ids: string[], status: IssueStatus): Promise<void> => {
    set({ error: null });
    const previousIssues = get().issues;

    set((state) => ({
      issues: state.issues.map((i) => (ids.includes(i.id) ? { ...i, status } : i)),
    }));

    try {
      await Promise.all(ids.map((id) => issueRepository.update(id, { status })));
      const updated = await Promise.all(ids.map((id) => issueRepository.getById(id)));
      set((state) => ({
        issues: state.issues.map((i) => {
          const u = updated.find((x) => x?.id === i.id);
          return u ?? i;
        }),
      }));
    } catch (err) {
      set({
        issues: previousIssues,
        error: err instanceof Error ? err.message : 'Failed to update issues',
      });
      throw err;
    }
  },

  updateSortOrder: async (updates: { id: string; sortOrder: number }[]): Promise<void> => {
    set({ error: null });
    const previousIssues = get().issues;

    set((state) => ({
      issues: state.issues.map((i) => {
        const update = updates.find((u) => u.id === i.id);
        return update ? { ...i, sortOrder: update.sortOrder } : i;
      }),
    }));

    try {
      await Promise.all(updates.map((u) => issueRepository.updateSortOrder(u.id, u.sortOrder)));
    } catch (err) {
      set({
        issues: previousIssues,
        error: err instanceof Error ? err.message : 'Failed to update sort order',
      });
      throw err;
    }
  },

  loadDeletedIssues: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const issues = await issueRepository.getDeleted();
      set({ issues, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load deleted issues',
        isLoading: false,
      });
    }
  },

  restoreIssue: async (id: string): Promise<void> => {
    set({ error: null });
    try {
      await issueRepository.restore(id);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to restore issue' });
      throw err;
    }
  },

  permanentlyDeleteIssue: async (id: string): Promise<void> => {
    set({ error: null });
    try {
      await issueRepository.permanentlyDelete(id);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to permanently delete issue' });
      throw err;
    }
  },

  clearError: (): void => {
    set({ error: null });
  },
}));
