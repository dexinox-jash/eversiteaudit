import { PhotoRepository } from '@services/db/repositories/PhotoRepository';
import type { Photo } from '@/types/domain';

const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockRunAsync = jest.fn();

jest.mock('@services/db/connection', () => ({
  getDatabase: jest.fn(() => ({
    getAllAsync: mockGetAllAsync,
    getFirstAsync: mockGetFirstAsync,
    runAsync: mockRunAsync,
  })),
}));

describe('PhotoRepository', () => {
  let repo: PhotoRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new PhotoRepository();
  });

  const photoRow = {
    id: 'photo-1',
    project_id: 'proj-1',
    issue_id: 'issue-1',
    original_path: 'file:///original.jpg',
    thumbnail_path: 'file:///thumb.jpg',
    compressed_path: null,
    capture_timestamp: 1000,
    camera_make: null,
    camera_model: null,
    gps_latitude: null,
    gps_longitude: null,
    gps_altitude: null,
    width: null,
    height: null,
    file_size_bytes: null,
    caption: null,
    checksum: null,
    tags: '[]',
    sort_order: 0,
    created_at: 1000,
    updated_at: 2000,
    is_deleted: 0,
    deleted_at: null,
  };

  const sparsePhotoRow = {
    id: 'photo-2',
    project_id: 'proj-1',
    issue_id: null,
    original_path: 'file:///original2.jpg',
    thumbnail_path: 'file:///thumb2.jpg',
    compressed_path: null,
    capture_timestamp: null,
    camera_make: null,
    camera_model: null,
    gps_latitude: null,
    gps_longitude: null,
    gps_altitude: null,
    width: null,
    height: null,
    file_size_bytes: null,
    caption: null,
    checksum: null,
    tags: null,
    sort_order: 0,
    created_at: 1000,
    updated_at: 2000,
    is_deleted: 0,
    deleted_at: null,
  };

  const expectedPhoto: Photo = {
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

  describe('getAll', () => {
    it('returns all non-deleted photos', async () => {
      mockGetAllAsync.mockResolvedValue([photoRow]);

      const result = await repo.getAll();

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM photos WHERE is_deleted = 0 ORDER BY sort_order ASC, updated_at DESC'
      );
      expect(result).toEqual([expectedPhoto]);
    });

    it('returns empty array when no photos', async () => {
      mockGetAllAsync.mockResolvedValue([]);
      const result = await repo.getAll();
      expect(result).toEqual([]);
    });

    it('handles sparse photo rows with null values', async () => {
      mockGetAllAsync.mockResolvedValue([sparsePhotoRow]);

      const result = await repo.getAll();

      expect(result[0]?.issueId).toBeNull();
      expect(result[0]?.captureTimestamp).toBeNull();
      expect(result[0]?.tags).toBe('[]');
    });
  });

  describe('getById', () => {
    it('returns photo when found', async () => {
      mockGetFirstAsync.mockResolvedValue(photoRow);
      const result = await repo.getById('photo-1');
      expect(result).toEqual(expectedPhoto);
    });

    it('returns null when not found', async () => {
      mockGetFirstAsync.mockResolvedValue(null);
      const result = await repo.getById('missing');
      expect(result).toBeNull();
    });
  });

  describe('getByProjectId', () => {
    it('returns photos for a project', async () => {
      mockGetAllAsync.mockResolvedValue([photoRow]);

      const result = await repo.getByProjectId('proj-1');

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM photos WHERE project_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, created_at DESC',
        ['proj-1']
      );
      expect(result).toEqual([expectedPhoto]);
    });
  });

  describe('getByIssueId', () => {
    it('returns photos for an issue', async () => {
      mockGetAllAsync.mockResolvedValue([photoRow]);

      const result = await repo.getByIssueId('issue-1');

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM photos WHERE issue_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, created_at DESC',
        ['issue-1']
      );
      expect(result).toEqual([expectedPhoto]);
    });
  });

  describe('create', () => {
    it('creates and returns a new photo', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue(photoRow);

      const result = await repo.create({
        projectId: 'proj-1',
        issueId: 'issue-1',
        originalPath: 'file:///original.jpg',
        thumbnailPath: 'file:///thumb.jpg',
      });

      expect(mockRunAsync).toHaveBeenCalled();
      expect(result).toEqual(expectedPhoto);
    });

    it('creates photo with null caption and defaults', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue(sparsePhotoRow);

      await repo.create({
        projectId: 'proj-1',
        originalPath: 'file:///original2.jpg',
        thumbnailPath: 'file:///thumb2.jpg',
        caption: null,
        tags: '[]',
      });

      const callArgs = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(callArgs[2]).toBeNull(); // issueId default
      expect(callArgs[5]).toBeNull(); // compressedPath default
      expect(callArgs[6]).toBeNull(); // captureTimestamp default
    });

    it('throws if created photo cannot be retrieved', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue(null);

      await expect(
        repo.create({
          projectId: 'proj-1',
          originalPath: 'file:///o.jpg',
          thumbnailPath: 'file:///t.jpg',
        })
      ).rejects.toThrow('Failed to retrieve created photo');
    });
  });

  describe('update', () => {
    it('updates an existing photo', async () => {
      mockGetFirstAsync.mockResolvedValue(photoRow);
      mockRunAsync.mockResolvedValue(undefined);

      const result = await repo.update('photo-1', { caption: 'Updated' });

      expect(mockRunAsync).toHaveBeenCalled();
      expect(result).toEqual(expectedPhoto);
    });

    it('update preserves existing values when fields are omitted', async () => {
      mockGetFirstAsync.mockResolvedValue(photoRow);
      mockRunAsync.mockResolvedValue(undefined);

      await repo.update('photo-1', { caption: 'Updated' });

      const callArgs = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(callArgs[1]).toBe('issue-1'); // issueId preserved
      expect(callArgs[4]).toBeNull(); // compressedPath preserved
    });

    it('throws when photo does not exist', async () => {
      mockGetFirstAsync.mockResolvedValue(null);

      await expect(repo.update('missing', { caption: 'Updated' })).rejects.toThrow(
        'Photo not found: missing'
      );
    });

    it('throws when updated photo cannot be retrieved', async () => {
      mockGetFirstAsync.mockResolvedValue(photoRow);
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValueOnce(photoRow).mockResolvedValueOnce(null);

      await expect(repo.update('photo-1', { caption: 'Updated' })).rejects.toThrow(
        'Failed to retrieve updated photo'
      );
    });
  });

  describe('updateSortOrder', () => {
    it('updates sort order', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      await repo.updateSortOrder('photo-1', 5);
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE photos SET sort_order = ?'),
        expect.arrayContaining([5, expect.any(Number), 'photo-1'])
      );
    });
  });

  describe('delete', () => {
    it('soft-deletes a photo', async () => {
      mockRunAsync.mockResolvedValue(undefined);

      await repo.delete('photo-1');

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE photos SET is_deleted = 1'),
        expect.any(Array)
      );
    });
  });
});
