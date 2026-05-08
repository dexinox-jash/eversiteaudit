import { create } from 'zustand';
import type { Annotation } from '@/types/domain';
import { annotationRepository } from '@services/db/repositories';

export interface AnnotationStoreState {
  annotations: Annotation[];
  isLoading: boolean;
  error: string | null;
}

export interface AnnotationStoreActions {
  loadAnnotations: (photoId: string) => Promise<void>;
  addAnnotation: (
    annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Annotation>;
  updateAnnotation: (id: string, fields: Partial<Annotation>) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
  clearAnnotations: () => void;
  clearError: () => void;
}

export type AnnotationStore = AnnotationStoreState & AnnotationStoreActions;

/** Selector: subscribe only to the annotations array. */
export function selectAnnotations(store: AnnotationStore): Annotation[] {
  return store.annotations;
}

/**
 * Zustand store for photo annotation data.
 *
 * Usage:
 *   const annotations = useAnnotationStore((s) => s.annotations);
 *   const { loadAnnotations, addAnnotation } = useAnnotationStore();
 */
export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  annotations: [],
  isLoading: false,
  error: null,

  loadAnnotations: async (photoId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const data = await annotationRepository.getByPhotoId(photoId);
      set({ annotations: data, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load annotations',
        isLoading: false,
      });
    }
  },

  addAnnotation: async (
    annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Annotation> => {
    set({ error: null });
    const now = Date.now();
    const tempId = crypto.randomUUID();
    const tempAnnotation: Annotation = {
      id: tempId,
      ...annotation,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({ annotations: [...state.annotations, tempAnnotation] }));

    try {
      const saved = await annotationRepository.create(annotation);
      set((state) => ({
        annotations: state.annotations.map((a) => (a.id === tempId ? saved : a)),
      }));
      return saved;
    } catch (err) {
      set((state) => ({
        annotations: state.annotations.filter((a) => a.id !== tempId),
        error: err instanceof Error ? err.message : 'Failed to create annotation',
      }));
      throw err;
    }
  },

  updateAnnotation: async (id: string, fields: Partial<Annotation>): Promise<void> => {
    set({ error: null });
    const previousAnnotations = get().annotations;

    set((state) => ({
      annotations: state.annotations.map((a) =>
        a.id === id ? { ...a, ...fields, updatedAt: Date.now() } : a
      ),
    }));

    try {
      await annotationRepository.update(id, fields);
    } catch (err) {
      set({
        annotations: previousAnnotations,
        error: err instanceof Error ? err.message : 'Failed to update annotation',
      });
      throw err;
    }
  },

  deleteAnnotation: async (id: string): Promise<void> => {
    set({ error: null });
    const target = get().annotations.find((a) => a.id === id);
    if (!target) return;

    set((state) => ({ annotations: state.annotations.filter((a) => a.id !== id) }));

    try {
      await annotationRepository.delete(id);
    } catch (err) {
      set((state) => ({
        annotations: [...state.annotations, target].sort((a, b) => a.createdAt - b.createdAt),
        error: err instanceof Error ? err.message : 'Failed to delete annotation',
      }));
      throw err;
    }
  },

  clearAnnotations: (): void => {
    set({ annotations: [] });
  },

  clearError: (): void => {
    set({ error: null });
  },
}));
