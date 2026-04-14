import { create } from 'zustand';
import type { Photo } from '@/types/domain';
import { photoRepository, type CreatePhotoPayload, type UpdatePhotoPayload } from '@services/db/repositories';

export interface PhotoStoreState {
  photos: Photo[];
  isLoading: boolean;
  error: string | null;
}

export interface PhotoStoreActions {
  loadPhotos: () => Promise<void>;
  loadPhotosByProject: (projectId: string) => Promise<void>;
  createPhoto: (payload: CreatePhotoPayload) => Promise<Photo>;
  updatePhoto: (id: string, payload: UpdatePhotoPayload) => Promise<Photo>;
  deletePhoto: (id: string) => Promise<void>;
  clearError: () => void;
}

export type PhotoStore = PhotoStoreState & PhotoStoreActions;

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
      set({ error: err instanceof Error ? err.message : 'Failed to load photos', isLoading: false });
    }
  },

  loadPhotosByProject: async (projectId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const data = await photoRepository.getByProjectId(projectId);
      set({ photos: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load photos', isLoading: false });
    }
  },

  createPhoto: async (payload: CreatePhotoPayload): Promise<Photo> => {
    set({ error: null });
    const now = Date.now();
    const tempId = crypto.randomUUID();
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
      tags: payload.tags ?? '[]',
      createdAt: now,
      updatedAt: now,
      isDeleted: 0,
      deletedAt: null,
    };

    set((state) => ({ photos: [tempPhoto, ...state.photos] }));

    try {
      const saved = await photoRepository.create(payload);
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

  clearError: (): void => {
    set({ error: null });
  },
}));
