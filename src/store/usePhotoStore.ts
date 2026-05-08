import { create } from 'zustand';
import type { Photo } from '@/types/domain';
import {
  photoRepository,
  type CreatePhotoPayload,
  type UpdatePhotoPayload,
} from '@services/db/repositories';
import { computeFileChecksum } from '@services/integrity/photoIntegrity';

export interface PhotoStoreState {
  photos: Photo[];
  isLoading: boolean;
  error: string | null;
}

export interface PhotoStoreActions {
  loadPhotos: () => Promise<void>;
  loadPhotosByProject: (projectId: string) => Promise<void>;
  loadPhotosByIssue: (issueId: string) => Promise<void>;
  createPhoto: (payload: CreatePhotoPayload) => Promise<Photo>;
  updatePhoto: (id: string, payload: UpdatePhotoPayload) => Promise<Photo>;
  deletePhoto: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  updateSortOrder: (updates: { id: string; sortOrder: number }[]) => Promise<void>;
  clearError: () => void;
}

export type PhotoStore = PhotoStoreState & PhotoStoreActions;

/** Selector: subscribe only to the photos array. */
export function selectPhotos(store: PhotoStore): Photo[] {
  return store.photos;
}

/** Selector: subscribe only to loading state. */
export function selectPhotosLoading(store: PhotoStore): boolean {
  return store.isLoading;
}

/**
 * Zustand store for photo data.
 *
 * Usage:
 *   const photos = usePhotoStore((s) => s.photos);
 *   const { loadPhotosByProject, createPhoto } = usePhotoStore();
 */
export const usePhotoStore = create<PhotoStore>((set, get) => ({
  photos: [],
  isLoading: false,
  error: null,

  loadPhotos: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const data = await photoRepository.getAll();
      set({ photos: data, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load photos',
        isLoading: false,
      });
    }
  },

  loadPhotosByProject: async (projectId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const data = await photoRepository.getByProjectId(projectId);
      set({ photos: data, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load photos',
        isLoading: false,
      });
    }
  },

  loadPhotosByIssue: async (issueId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const data = await photoRepository.getByIssueId(issueId);
      set({ photos: data, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load photos',
        isLoading: false,
      });
    }
  },

  createPhoto: async (payload: CreatePhotoPayload): Promise<Photo> => {
    set({ error: null });
    const now = Date.now();
    const tempId = crypto.randomUUID();

    let checksum: string | null = payload.checksum ?? null;
    if (!checksum && payload.originalPath) {
      try {
        checksum = await computeFileChecksum(payload.originalPath);
      } catch {
        checksum = null;
      }
    }

    const payloadWithChecksum: CreatePhotoPayload = { ...payload, checksum };

    const tempPhoto: Photo = {
      id: tempId,
      projectId: payload.projectId,
      issueId: payload.issueId ?? null,
      originalPath: payload.originalPath,
      thumbnailPath: payload.thumbnailPath,
      compressedPath: payload.compressedPath ?? null,
      captureTimestamp: payload.captureTimestamp ?? now,
      cameraMake: payload.cameraMake ?? null,
      cameraModel: payload.cameraModel ?? null,
      gpsLatitude: payload.gpsLatitude ?? null,
      gpsLongitude: payload.gpsLongitude ?? null,
      gpsAltitude: payload.gpsAltitude ?? null,
      width: payload.width ?? null,
      height: payload.height ?? null,
      fileSizeBytes: payload.fileSizeBytes ?? null,
      caption: payload.caption ?? null,
      checksum: payloadWithChecksum.checksum ?? null,
      tags: payload.tags ?? '[]',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
      isDeleted: 0,
      deletedAt: null,
    };

    set((state) => ({ photos: [tempPhoto, ...state.photos] }));

    try {
      const saved = await photoRepository.create(payloadWithChecksum);
      set((state) => ({
        photos: state.photos.map((p) => (p.id === tempId ? saved : p)),
      }));
      return saved;
    } catch (err) {
      set((state) => ({
        photos: state.photos.filter((p) => p.id !== tempId),
        error: err instanceof Error ? err.message : 'Failed to create photo',
      }));
      throw err;
    }
  },

  updatePhoto: async (id: string, payload: UpdatePhotoPayload): Promise<Photo> => {
    set({ error: null });
    try {
      const updated = await photoRepository.update(id, payload);
      set((state) => ({
        photos: state.photos.map((p) => (p.id === id ? updated : p)),
      }));
      return updated;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update photo' });
      throw err;
    }
  },

  deletePhoto: async (id: string): Promise<void> => {
    set({ error: null });
    const target = get().photos.find((p) => p.id === id);
    if (!target) return;

    set((state) => ({ photos: state.photos.filter((p) => p.id !== id) }));

    try {
      await photoRepository.delete(id);
    } catch (err) {
      set((state) => ({
        photos: [...state.photos, target].sort((a, b) => b.updatedAt - a.updatedAt),
        error: err instanceof Error ? err.message : 'Failed to delete photo',
      }));
      throw err;
    }
  },

  bulkDelete: async (ids: string[]): Promise<void> => {
    set({ error: null });
    const targets = get().photos.filter((p) => ids.includes(p.id));
    if (targets.length === 0) return;

    set((state) => ({ photos: state.photos.filter((p) => !ids.includes(p.id)) }));

    try {
      await Promise.all(ids.map((id) => photoRepository.delete(id)));
    } catch (err) {
      set((state) => ({
        photos: [...state.photos, ...targets].sort((a, b) => b.updatedAt - a.updatedAt),
        error: err instanceof Error ? err.message : 'Failed to delete photos',
      }));
      throw err;
    }
  },

  updateSortOrder: async (updates: { id: string; sortOrder: number }[]): Promise<void> => {
    set({ error: null });
    const previousPhotos = get().photos;

    set((state) => ({
      photos: state.photos.map((p) => {
        const update = updates.find((u) => u.id === p.id);
        return update ? { ...p, sortOrder: update.sortOrder } : p;
      }),
    }));

    try {
      await Promise.all(updates.map((u) => photoRepository.updateSortOrder(u.id, u.sortOrder)));
    } catch (err) {
      set({
        photos: previousPhotos,
        error: err instanceof Error ? err.message : 'Failed to update sort order',
      });
      throw err;
    }
  },

  clearError: (): void => {
    set({ error: null });
  },
}));
