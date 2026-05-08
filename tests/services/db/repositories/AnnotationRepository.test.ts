import { AnnotationRepository } from '@services/db/repositories/AnnotationRepository';
import { encryptField } from '@services/security/fieldEncryption';
import type { Annotation } from '@/types/domain';

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

jest.mock('@services/security/fieldEncryption', () => ({
  encryptField: jest.fn(async (value: string | null | undefined) => {
    if (value === null || value === undefined) return value;
    return `ENC:${value}`;
  }),
  decryptField: jest.fn(async (value: string | null | undefined) => {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string' && value.startsWith('ENC:')) {
      return value.slice(4);
    }
    return value;
  }),
}));

describe('AnnotationRepository', () => {
  let repo: AnnotationRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new AnnotationRepository();
  });

  const annotationRows = [
    {
      id: 'ann-1',
      photo_id: 'photo-1',
      type: 'arrow',
      x: 0.1,
      y: 0.2,
      width: 0.5,
      height: 0.6,
      rotation: 0,
      color: '#FF4757',
      stroke_width: 3,
      text_content: null,
      font_size: null,
      created_at: 1000,
      updated_at: 2000,
      is_deleted: 0,
      deleted_at: null,
    },
    {
      id: 'ann-2',
      photo_id: 'photo-1',
      type: 'text',
      x: 0.3,
      y: 0.4,
      width: null,
      height: null,
      rotation: 0,
      color: '#000000',
      stroke_width: 2,
      text_content: 'ENC:Hello',
      font_size: 16,
      created_at: 1500,
      updated_at: 2500,
      is_deleted: 0,
      deleted_at: null,
    },
  ];

  const expectedAnnotations: Annotation[] = [
    {
      id: 'ann-1',
      photoId: 'photo-1',
      type: 'arrow',
      x: 0.1,
      y: 0.2,
      width: 0.5,
      height: 0.6,
      rotation: 0,
      color: '#FF4757',
      strokeWidth: 3,
      textContent: null,
      fontSize: null,
      createdAt: 1000,
      updatedAt: 2000,
      isDeleted: 0,
      deletedAt: null,
    },
    {
      id: 'ann-2',
      photoId: 'photo-1',
      type: 'text',
      x: 0.3,
      y: 0.4,
      width: null,
      height: null,
      rotation: 0,
      color: '#000000',
      strokeWidth: 2,
      textContent: 'Hello',
      fontSize: 16,
      createdAt: 1500,
      updatedAt: 2500,
      isDeleted: 0,
      deletedAt: null,
    },
  ];

  describe('getByPhotoId', () => {
    it('returns annotations for a photo ordered by created_at', async () => {
      mockGetAllAsync.mockResolvedValue(annotationRows);

      const result = await repo.getByPhotoId('photo-1');

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM annotations WHERE photo_id = ? AND is_deleted = 0 ORDER BY created_at ASC',
        ['photo-1']
      );
      expect(result).toEqual(expectedAnnotations);
    });

    it('returns an empty array when no annotations exist', async () => {
      mockGetAllAsync.mockResolvedValue([]);

      const result = await repo.getByPhotoId('photo-1');

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns the annotation when found', async () => {
      mockGetFirstAsync.mockResolvedValue(annotationRows[0]);

      const result = await repo.getById('ann-1');

      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        'SELECT * FROM annotations WHERE id = ? AND is_deleted = 0',
        ['ann-1']
      );
      expect(result).toEqual(expectedAnnotations[0]);
    });

    it('returns null when annotation is not found', async () => {
      mockGetFirstAsync.mockResolvedValue(null);

      const result = await repo.getById('ann-missing');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates and returns a new annotation with encrypted text content', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue(annotationRows[1]);

      const result = await repo.create({
        photoId: 'photo-1',
        type: 'text',
        x: 0.3,
        y: 0.4,
        width: null,
        height: null,
        rotation: 0,
        color: '#000000',
        strokeWidth: 2,
        textContent: 'Hello',
        fontSize: 16,
        isDeleted: 0,
        deletedAt: null,
      });

      expect(encryptField).toHaveBeenCalledWith('Hello');
      const callArgs = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(callArgs[10]).toBe('ENC:Hello');
      expect(result).toEqual(expectedAnnotations[1]);
    });

    it('throws when created annotation cannot be retrieved', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue(null);

      await expect(
        repo.create({
          photoId: 'photo-1',
          type: 'arrow',
          x: 0.1,
          y: 0.2,
          width: null,
          height: null,
          rotation: 0,
          color: '#FF4757',
          strokeWidth: 2,
          textContent: null,
          fontSize: null,
          isDeleted: 0,
          deletedAt: null,
        })
      ).rejects.toThrow('Failed to retrieve created annotation');
    });

    it('uses defaults for optional fields', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue(annotationRows[0]);

      const result = await repo.create({
        photoId: 'photo-1',
        type: 'arrow',
        x: 0.1,
        y: 0.2,
        width: null,
        height: null,
        rotation: 0,
        color: '#FF4757',
        strokeWidth: 2,
        textContent: null,
        fontSize: null,
        isDeleted: 0,
        deletedAt: null,
      });

      const callArgs = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(callArgs[5]).toBeNull();  // width
      expect(callArgs[6]).toBeNull();  // height
      expect(callArgs[7]).toBe(0);     // rotation default
      expect(callArgs[8]).toBe('#FF4757'); // color default
      expect(callArgs[9]).toBe(2);     // strokeWidth default
      expect(callArgs[10]).toBeNull(); // textContent
      expect(callArgs[11]).toBeNull(); // fontSize
      expect(result).toEqual(expectedAnnotations[0]);
    });

    it('uses defaults when optional fields are omitted', async () => {
      mockRunAsync.mockResolvedValue(undefined);
      mockGetFirstAsync.mockResolvedValue(annotationRows[0]);

      await repo.create({
        photoId: 'photo-1',
        type: 'arrow',
        x: 0.1,
        y: 0.2,
      } as unknown as Annotation);

      const callArgs = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(callArgs[5]).toBeNull();  // width default
      expect(callArgs[6]).toBeNull();  // height default
      expect(callArgs[7]).toBe(0);     // rotation default
      expect(callArgs[8]).toBe('#FF4757'); // color default
      expect(callArgs[9]).toBe(2);     // strokeWidth default
      expect(callArgs[10]).toBeNull(); // textContent default
      expect(callArgs[11]).toBeNull(); // fontSize default
    });
  });

  describe('update', () => {
    it('updates an existing annotation and encrypts text content', async () => {
      mockGetFirstAsync.mockResolvedValue(annotationRows[1]);
      mockRunAsync.mockResolvedValue(undefined);

      await repo.update('ann-2', { textContent: 'Updated text' });

      expect(encryptField).toHaveBeenCalledWith('Updated text');
      const callArgs = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(callArgs[9]).toBe('ENC:Updated text');
    });

    it('updates all provided fields', async () => {
      mockGetFirstAsync.mockResolvedValue(annotationRows[0]);
      mockRunAsync.mockResolvedValue(undefined);

      await repo.update('ann-1', {
        photoId: 'photo-2',
        type: 'circle',
        x: 0.5,
        y: 0.6,
        width: 0.7,
        height: 0.8,
        rotation: 45,
        color: '#00FF00',
        strokeWidth: 5,
        textContent: 'New text',
        fontSize: 20,
      });

      const callArgs = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(callArgs[0]).toBe('photo-2');
      expect(callArgs[1]).toBe('circle');
      expect(callArgs[2]).toBe(0.5);
      expect(callArgs[3]).toBe(0.6);
      expect(callArgs[4]).toBe(0.7);
      expect(callArgs[5]).toBe(0.8);
      expect(callArgs[6]).toBe(45);
      expect(callArgs[7]).toBe('#00FF00');
      expect(callArgs[8]).toBe(5);
      expect(callArgs[9]).toBe('ENC:New text');
      expect(callArgs[10]).toBe(20);
    });

    it('falls back to existing textContent when not provided in payload', async () => {
      mockGetFirstAsync.mockResolvedValue(annotationRows[1]);
      mockRunAsync.mockResolvedValue(undefined);

      await repo.update('ann-2', { color: '#00FF00' });

      expect(encryptField).toHaveBeenCalledWith('Hello');
      const callArgs = mockRunAsync.mock.calls[0]![1] as unknown[];
      expect(callArgs[9]).toBe('ENC:Hello');
    });

    it('throws when annotation does not exist', async () => {
      mockGetFirstAsync.mockResolvedValue(null);

      await expect(repo.update('missing', { color: '#00FF00' })).rejects.toThrow(
        'Annotation not found: missing'
      );
    });
  });

  describe('delete', () => {
    it('soft-deletes an annotation', async () => {
      mockRunAsync.mockResolvedValue(undefined);

      await repo.delete('ann-1');

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE annotations SET is_deleted = 1'),
        expect.any(Array)
      );
    });
  });

  describe('deleteByPhotoId', () => {
    it('soft-deletes all annotations for a photo', async () => {
      mockRunAsync.mockResolvedValue(undefined);

      await repo.deleteByPhotoId('photo-1');

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE annotations SET is_deleted = 1'),
        expect.arrayContaining(['photo-1'])
      );
    });
  });
});
