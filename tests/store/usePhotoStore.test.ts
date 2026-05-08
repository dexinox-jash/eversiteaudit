import { usePhotoStore, selectPhotos, selectPhotosLoading } from '@store/usePhotoStore';
import { photoRepository } from '@services/db/repositories';
import { computeFileChecksum } from '@services/integrity/photoIntegrity';
import type { Photo } from '@/types/domain';

jest.mock('@services/db/repositories', () => ({
  photoRepository: {
    getAll: jest.fn(),
    getByProjectId: jest.fn(),
    getByIssueId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateSortOrder: jest.fn(),
  },
}));

jest.mock('@services/integrity/photoIntegrity', () => ({
  computeFileChecksum: jest.fn(),
}));

describe('usePhotoStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePhotoStore.setState({
      photos: [],
      isLoading: false,
      error: null,
    });
  });

  const mockPhoto: Photo = {
    id: 'photo-1',
    projectId: 'proj-1',
    issueId: 'issue-1',
    originalPath: 'file:///original.jpg',
    thumbnailPath: 'file:///thumb.jpg',
    compressedPath: null,
    captureTimestamp: 1000,
    cameraMake: null,
    cameraModel: null,
    gpsLatitude: null,
    gpsLongitude: null,
    gpsAltitude: null,
    width: null,
    height: null,
    fileSizeBytes: null,
    caption: null,
    checksum: null,
    tags: '[]',
    sortOrder: 0,
    createdAt: 1000,
    updatedAt: 2000,
    isDeleted: 0,
    deletedAt: null,
  };

  it('has correct initial state', () => {
    const state = usePhotoStore.getState();
    expect(state.photos).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('selectPhotos returns photos array', () => {
    usePhotoStore.setState({ photos: [mockPhoto] });
    expect(selectPhotos(usePhotoStore.getState())).toEqual([mockPhoto]);
  });

  it('selectPhotosLoading returns loading state', () => {
    usePhotoStore.setState({ isLoading: true });
    expect(selectPhotosLoading(usePhotoStore.getState())).toBe(true);
  });

  describe('loadPhotos', () => {
    it('loads all photos', async () => {
      (photoRepository.getAll as jest.Mock).mockResolvedValue([mockPhoto]);

      await usePhotoStore.getState().loadPhotos();

      expect(usePhotoStore.getState().photos).toEqual([mockPhoto]);
      expect(usePhotoStore.getState().isLoading).toBe(false);
    });

    it('handles errors', async () => {
      (photoRepository.getAll as jest.Mock).mockRejectedValue(new Error('Load error'));

      await usePhotoStore.getState().loadPhotos();

      expect(usePhotoStore.getState().error).toBe('Load error');
    });

    it('handles non-Error load failures', async () => {
      (photoRepository.getAll as jest.Mock).mockRejectedValue('load-err');

      await usePhotoStore.getState().loadPhotos();

      expect(usePhotoStore.getState().error).toBe('Failed to load photos');
    });
  });

  describe('loadPhotosByProject', () => {
    it('loads photos by project', async () => {
      (photoRepository.getByProjectId as jest.Mock).mockResolvedValue([mockPhoto]);

      await usePhotoStore.getState().loadPhotosByProject('proj-1');

      expect(photoRepository.getByProjectId).toHaveBeenCalledWith('proj-1');
      expect(usePhotoStore.getState().photos).toEqual([mockPhoto]);
    });

    it('handles errors', async () => {
      (photoRepository.getByProjectId as jest.Mock).mockRejectedValue(new Error('Load error'));

      await usePhotoStore.getState().loadPhotosByProject('proj-1');

      expect(usePhotoStore.getState().error).toBe('Load error');
    });

    it('handles non-Error load failures', async () => {
      (photoRepository.getByProjectId as jest.Mock).mockRejectedValue('load-err');

      await usePhotoStore.getState().loadPhotosByProject('proj-1');

      expect(usePhotoStore.getState().error).toBe('Failed to load photos');
    });
  });

  describe('loadPhotosByIssue', () => {
    it('loads photos by issue', async () => {
      (photoRepository.getByIssueId as jest.Mock).mockResolvedValue([mockPhoto]);

      await usePhotoStore.getState().loadPhotosByIssue('issue-1');

      expect(photoRepository.getByIssueId).toHaveBeenCalledWith('issue-1');
      expect(usePhotoStore.getState().photos).toEqual([mockPhoto]);
    });

    it('handles errors', async () => {
      (photoRepository.getByIssueId as jest.Mock).mockRejectedValue(new Error('Load error'));

      await usePhotoStore.getState().loadPhotosByIssue('issue-1');

      expect(usePhotoStore.getState().error).toBe('Load error');
    });

    it('handles non-Error load failures', async () => {
      (photoRepository.getByIssueId as jest.Mock).mockRejectedValue('load-err');

      await usePhotoStore.getState().loadPhotosByIssue('issue-1');

      expect(usePhotoStore.getState().error).toBe('Failed to load photos');
    });
  });

  describe('createPhoto', () => {
    it('creates photo and computes checksum', async () => {
      (computeFileChecksum as jest.Mock).mockResolvedValue('abc123');
      const saved = { ...mockPhoto, id: 'photo-saved' };
      (photoRepository.create as jest.Mock).mockResolvedValue(saved);

      const result = await usePhotoStore.getState().createPhoto({
        projectId: 'proj-1',
        issueId: 'issue-1',
        originalPath: 'file:///original.jpg',
        thumbnailPath: 'file:///thumb.jpg',
      });

      expect(result).toEqual(saved);
      expect(photoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ checksum: 'abc123' })
      );
      expect(usePhotoStore.getState().photos).toHaveLength(1);
      expect(usePhotoStore.getState().photos[0]!.id).toBe('photo-saved');
    });

    it('preserves other photos when replacing temp photo', async () => {
      const existing = { ...mockPhoto, id: 'photo-existing' };
      usePhotoStore.setState({ photos: [existing] });
      const saved = { ...mockPhoto, id: 'photo-saved' };
      (photoRepository.create as jest.Mock).mockResolvedValue(saved);

      await usePhotoStore.getState().createPhoto({
        projectId: 'proj-1',
        originalPath: 'file:///original.jpg',
        thumbnailPath: 'file:///thumb.jpg',
      });

      expect(usePhotoStore.getState().photos).toHaveLength(2);
      expect(usePhotoStore.getState().photos.map((p) => p.id)).toContain('photo-existing');
      expect(usePhotoStore.getState().photos.map((p) => p.id)).toContain('photo-saved');
    });

    it('skips checksum computation when originalPath is empty', async () => {
      const saved = { ...mockPhoto, id: 'photo-saved' };
      (photoRepository.create as jest.Mock).mockResolvedValue(saved);

      await usePhotoStore.getState().createPhoto({
        projectId: 'proj-1',
        originalPath: '',
        thumbnailPath: 'file:///thumb.jpg',
      });

      expect(computeFileChecksum).not.toHaveBeenCalled();
    });

    it('uses provided checksum without computing', async () => {
      const saved = { ...mockPhoto, id: 'photo-saved' };
      (photoRepository.create as jest.Mock).mockResolvedValue(saved);

      await usePhotoStore.getState().createPhoto({
        projectId: 'proj-1',
        originalPath: 'file:///original.jpg',
        thumbnailPath: 'file:///thumb.jpg',
        checksum: 'provided',
      });

      expect(computeFileChecksum).not.toHaveBeenCalled();
      expect(photoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ checksum: 'provided' })
      );
    });

    it('rolls back on error', async () => {
      (photoRepository.create as jest.Mock).mockRejectedValue(new Error('Create error'));

      await expect(
        usePhotoStore.getState().createPhoto({
          projectId: 'proj-1',
          originalPath: 'file:///original.jpg',
          thumbnailPath: 'file:///thumb.jpg',
        })
      ).rejects.toThrow('Create error');

      expect(usePhotoStore.getState().photos).toEqual([]);
      expect(usePhotoStore.getState().error).toBe('Create error');
    });

    it('rolls back on non-Error create failure', async () => {
      (photoRepository.create as jest.Mock).mockRejectedValue('create-err');

      await expect(
        usePhotoStore.getState().createPhoto({
          projectId: 'proj-1',
          originalPath: 'file:///original.jpg',
          thumbnailPath: 'file:///thumb.jpg',
        })
      ).rejects.toBe('create-err');

      expect(usePhotoStore.getState().error).toBe('Failed to create photo');
    });

    it('handles checksum computation failure gracefully', async () => {
      (computeFileChecksum as jest.Mock).mockRejectedValue(new Error('Checksum failed'));
      const saved = { ...mockPhoto, id: 'photo-saved' };
      (photoRepository.create as jest.Mock).mockResolvedValue(saved);

      const result = await usePhotoStore.getState().createPhoto({
        projectId: 'proj-1',
        originalPath: 'file:///original.jpg',
        thumbnailPath: 'file:///thumb.jpg',
      });

      expect(result).toEqual(saved);
      expect(photoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ checksum: null })
      );
    });
  });

  describe('updatePhoto', () => {
    it('updates photo in state', async () => {
      usePhotoStore.setState({ photos: [mockPhoto] });
      const updated = { ...mockPhoto, caption: 'New caption' };
      (photoRepository.update as jest.Mock).mockResolvedValue(updated);

      const result = await usePhotoStore
        .getState()
        .updatePhoto('photo-1', { caption: 'New caption' });

      expect(result).toEqual(updated);
      expect(usePhotoStore.getState().photos[0]!.caption).toBe('New caption');
    });

    it('updates only matching photo when multiple exist', async () => {
      const photo2 = { ...mockPhoto, id: 'photo-2', caption: 'Other' };
      usePhotoStore.setState({ photos: [mockPhoto, photo2] });
      const updated = { ...mockPhoto, caption: 'New caption' };
      (photoRepository.update as jest.Mock).mockResolvedValue(updated);

      await usePhotoStore.getState().updatePhoto('photo-1', { caption: 'New caption' });

      expect(usePhotoStore.getState().photos.find((p) => p.id === 'photo-1')!.caption).toBe(
        'New caption'
      );
      expect(usePhotoStore.getState().photos.find((p) => p.id === 'photo-2')!.caption).toBe('Other');
    });

    it('sets error on failure', async () => {
      usePhotoStore.setState({ photos: [mockPhoto] });
      (photoRepository.update as jest.Mock).mockRejectedValue(new Error('Update error'));

      await expect(
        usePhotoStore.getState().updatePhoto('photo-1', { caption: 'New caption' })
      ).rejects.toThrow('Update error');

      expect(usePhotoStore.getState().error).toBe('Update error');
    });

    it('sets generic error on non-Error update failure', async () => {
      usePhotoStore.setState({ photos: [mockPhoto] });
      (photoRepository.update as jest.Mock).mockRejectedValue(123);

      await expect(
        usePhotoStore.getState().updatePhoto('photo-1', { caption: 'New caption' })
      ).rejects.toBe(123);

      expect(usePhotoStore.getState().error).toBe('Failed to update photo');
    });
  });

  describe('deletePhoto', () => {
    it('deletes optimistically', async () => {
      usePhotoStore.setState({ photos: [mockPhoto] });
      (photoRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await usePhotoStore.getState().deletePhoto('photo-1');

      expect(usePhotoStore.getState().photos).toEqual([]);
    });

    it('restores on failure', async () => {
      usePhotoStore.setState({ photos: [mockPhoto] });
      (photoRepository.delete as jest.Mock).mockRejectedValue(new Error('Delete error'));

      await expect(usePhotoStore.getState().deletePhoto('photo-1')).rejects.toThrow('Delete error');

      expect(usePhotoStore.getState().photos).toEqual([mockPhoto]);
      expect(usePhotoStore.getState().error).toBe('Delete error');
    });

    it('restores on non-Error delete failure', async () => {
      const photo2 = { ...mockPhoto, id: 'photo-2', updatedAt: 500 };
      usePhotoStore.setState({ photos: [mockPhoto, photo2] });
      (photoRepository.delete as jest.Mock).mockRejectedValue('del-err');

      await expect(usePhotoStore.getState().deletePhoto('photo-1')).rejects.toBe('del-err');

      expect(usePhotoStore.getState().error).toBe('Failed to delete photo');
    });

    it('does nothing if photo not found', async () => {
      await usePhotoStore.getState().deletePhoto('missing');
      expect(photoRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('bulkDelete', () => {
    it('bulk deletes photos', async () => {
      const photo2 = { ...mockPhoto, id: 'photo-2' };
      usePhotoStore.setState({ photos: [mockPhoto, photo2] });
      (photoRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await usePhotoStore.getState().bulkDelete(['photo-1']);

      expect(usePhotoStore.getState().photos).toEqual([photo2]);
    });

    it('restores on failure', async () => {
      const photo2 = { ...mockPhoto, id: 'photo-2', updatedAt: 3000 };
      usePhotoStore.setState({ photos: [mockPhoto, photo2] });
      (photoRepository.delete as jest.Mock).mockRejectedValue(new Error('Bulk delete error'));

      await expect(usePhotoStore.getState().bulkDelete(['photo-1'])).rejects.toThrow(
        'Bulk delete error'
      );

      expect(usePhotoStore.getState().photos).toEqual(expect.arrayContaining([mockPhoto, photo2]));
    });

    it('restores on non-Error bulk delete failure', async () => {
      const photo2 = { ...mockPhoto, id: 'photo-2', updatedAt: 500 };
      usePhotoStore.setState({ photos: [mockPhoto, photo2] });
      (photoRepository.delete as jest.Mock).mockRejectedValue('bulk-del-err');

      await expect(usePhotoStore.getState().bulkDelete(['photo-1'])).rejects.toBe('bulk-del-err');

      expect(usePhotoStore.getState().error).toBe('Failed to delete photos');
    });

    it('does nothing if no matching photos', async () => {
      usePhotoStore.setState({ photos: [mockPhoto] });
      await usePhotoStore.getState().bulkDelete(['missing']);
      expect(photoRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateSortOrder', () => {
    it('updates sort order optimistically', async () => {
      usePhotoStore.setState({ photos: [mockPhoto] });
      (photoRepository.updateSortOrder as jest.Mock).mockResolvedValue(undefined);

      await usePhotoStore.getState().updateSortOrder([{ id: 'photo-1', sortOrder: 5 }]);

      expect(usePhotoStore.getState().photos[0]!.sortOrder).toBe(5);
    });

    it('restores on error', async () => {
      usePhotoStore.setState({ photos: [mockPhoto] });
      (photoRepository.updateSortOrder as jest.Mock).mockRejectedValue(new Error('Sort error'));

      await expect(
        usePhotoStore.getState().updateSortOrder([{ id: 'photo-1', sortOrder: 5 }])
      ).rejects.toThrow('Sort error');

      expect(usePhotoStore.getState().photos[0]!.sortOrder).toBe(0);
    });

    it('leaves unmatched photos unchanged during sort order update', async () => {
      const photo2 = { ...mockPhoto, id: 'photo-2', sortOrder: 0 };
      usePhotoStore.setState({ photos: [mockPhoto, photo2] });
      (photoRepository.updateSortOrder as jest.Mock).mockResolvedValue(undefined);

      await usePhotoStore.getState().updateSortOrder([{ id: 'photo-1', sortOrder: 5 }]);

      expect(usePhotoStore.getState().photos.find((p) => p.id === 'photo-1')!.sortOrder).toBe(5);
      expect(usePhotoStore.getState().photos.find((p) => p.id === 'photo-2')!.sortOrder).toBe(0);
    });

    it('restores on non-Error sort order failure', async () => {
      usePhotoStore.setState({ photos: [mockPhoto] });
      (photoRepository.updateSortOrder as jest.Mock).mockRejectedValue('sort-err');

      await expect(
        usePhotoStore.getState().updateSortOrder([{ id: 'photo-1', sortOrder: 5 }])
      ).rejects.toBe('sort-err');

      expect(usePhotoStore.getState().error).toBe('Failed to update sort order');
    });
  });

  describe('clearError', () => {
    it('clears error', () => {
      usePhotoStore.setState({ error: 'Err' });
      usePhotoStore.getState().clearError();
      expect(usePhotoStore.getState().error).toBeNull();
    });
  });
});
