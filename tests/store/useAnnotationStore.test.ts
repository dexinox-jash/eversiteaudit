import { useAnnotationStore, selectAnnotations } from '@store/useAnnotationStore';
import { annotationRepository } from '@services/db/repositories';
import type { Annotation } from '@/types/domain';

jest.mock('@services/db/repositories', () => ({
  annotationRepository: {
    getByPhotoId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('useAnnotationStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAnnotationStore.setState({
      annotations: [],
      isLoading: false,
      error: null,
    });
  });

  const mockAnnotation: Annotation = {
    id: 'ann-1',
    photoId: 'photo-1',
    type: 'arrow',
    x: 0.1,
    y: 0.2,
    width: 0.5,
    height: 0.6,
    rotation: 0,
    color: '#FF4757',
    strokeWidth: 2,
    textContent: null,
    fontSize: null,
    createdAt: 1000,
    updatedAt: 2000,
    isDeleted: 0,
    deletedAt: null,
  };

  it('has correct initial state', () => {
    const state = useAnnotationStore.getState();
    expect(state.annotations).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('selectAnnotations returns annotations array', () => {
    useAnnotationStore.setState({ annotations: [mockAnnotation] });
    expect(selectAnnotations(useAnnotationStore.getState())).toEqual([mockAnnotation]);
  });

  describe('loadAnnotations', () => {
    it('loads annotations by photo', async () => {
      (annotationRepository.getByPhotoId as jest.Mock).mockResolvedValue([mockAnnotation]);

      await useAnnotationStore.getState().loadAnnotations('photo-1');

      expect(annotationRepository.getByPhotoId).toHaveBeenCalledWith('photo-1');
      expect(useAnnotationStore.getState().annotations).toEqual([mockAnnotation]);
      expect(useAnnotationStore.getState().isLoading).toBe(false);
    });

    it('handles errors', async () => {
      (annotationRepository.getByPhotoId as jest.Mock).mockRejectedValue(new Error('Load error'));

      await useAnnotationStore.getState().loadAnnotations('photo-1');

      expect(useAnnotationStore.getState().error).toBe('Load error');
    });

    it('handles non-Error load failures', async () => {
      (annotationRepository.getByPhotoId as jest.Mock).mockRejectedValue('string-error');

      await useAnnotationStore.getState().loadAnnotations('photo-1');

      expect(useAnnotationStore.getState().error).toBe('Failed to load annotations');
    });
  });

  describe('addAnnotation', () => {
    it('adds annotation optimistically and replaces with saved', async () => {
      const saved = { ...mockAnnotation, id: 'ann-saved' };
      (annotationRepository.create as jest.Mock).mockResolvedValue(saved);

      const promise = useAnnotationStore.getState().addAnnotation({
        photoId: 'photo-1',
        type: 'arrow',
        x: 0.1,
        y: 0.2,
        width: 0.5,
        height: 0.6,
        rotation: 0,
        color: '#FF4757',
        strokeWidth: 2,
        textContent: null,
        fontSize: null,
        isDeleted: 0,
        deletedAt: null,
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(1);

      const result = await promise;
      expect(result).toEqual(saved);
      expect(useAnnotationStore.getState().annotations[0]!.id).toBe('ann-saved');
    });

    it('preserves other annotations when replacing temp annotation', async () => {
      const existing = { ...mockAnnotation, id: 'ann-existing' };
      useAnnotationStore.setState({ annotations: [existing] });
      const saved = { ...mockAnnotation, id: 'ann-saved' };
      (annotationRepository.create as jest.Mock).mockResolvedValue(saved);

      await useAnnotationStore.getState().addAnnotation({
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

      expect(useAnnotationStore.getState().annotations).toHaveLength(2);
      expect(useAnnotationStore.getState().annotations.map((a) => a.id)).toContain('ann-existing');
      expect(useAnnotationStore.getState().annotations.map((a) => a.id)).toContain('ann-saved');
    });

    it('rolls back on error', async () => {
      (annotationRepository.create as jest.Mock).mockRejectedValue(new Error('Create error'));

      await expect(
        useAnnotationStore.getState().addAnnotation({
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
      ).rejects.toThrow('Create error');

      expect(useAnnotationStore.getState().annotations).toEqual([]);
      expect(useAnnotationStore.getState().error).toBe('Create error');
    });

    it('rolls back on non-Error create failure', async () => {
      (annotationRepository.create as jest.Mock).mockRejectedValue('bad');

      await expect(
        useAnnotationStore.getState().addAnnotation({
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
      ).rejects.toBe('bad');

      expect(useAnnotationStore.getState().error).toBe('Failed to create annotation');
    });
  });

  describe('updateAnnotation', () => {
    it('updates annotation in state', async () => {
      useAnnotationStore.setState({ annotations: [mockAnnotation] });
      (annotationRepository.update as jest.Mock).mockResolvedValue(undefined);

      await useAnnotationStore.getState().updateAnnotation('ann-1', { color: '#00FF00' });

      const ann = useAnnotationStore.getState().annotations[0]!;
      expect(ann.color).toBe('#00FF00');
      expect(ann.updatedAt).toBeGreaterThanOrEqual(mockAnnotation.updatedAt);
    });

    it('updates only matching annotation when multiple exist', async () => {
      const ann2 = { ...mockAnnotation, id: 'ann-2', color: '#000000' };
      useAnnotationStore.setState({ annotations: [mockAnnotation, ann2] });
      (annotationRepository.update as jest.Mock).mockResolvedValue(undefined);

      await useAnnotationStore.getState().updateAnnotation('ann-1', { color: '#00FF00' });

      expect(useAnnotationStore.getState().annotations.find((a) => a.id === 'ann-1')!.color).toBe(
        '#00FF00'
      );
      expect(useAnnotationStore.getState().annotations.find((a) => a.id === 'ann-2')!.color).toBe(
        '#000000'
      );
    });

    it('sets error on failure', async () => {
      useAnnotationStore.setState({ annotations: [mockAnnotation] });
      (annotationRepository.update as jest.Mock).mockRejectedValue(new Error('Update error'));

      await expect(
        useAnnotationStore.getState().updateAnnotation('ann-1', { color: '#00FF00' })
      ).rejects.toThrow('Update error');

      expect(useAnnotationStore.getState().error).toBe('Update error');
    });

    it('sets generic error on non-Error update failure', async () => {
      useAnnotationStore.setState({ annotations: [mockAnnotation] });
      (annotationRepository.update as jest.Mock).mockRejectedValue(123);

      await expect(
        useAnnotationStore.getState().updateAnnotation('ann-1', { color: '#00FF00' })
      ).rejects.toBe(123);

      expect(useAnnotationStore.getState().error).toBe('Failed to update annotation');
    });
  });

  describe('deleteAnnotation', () => {
    it('deletes optimistically', async () => {
      useAnnotationStore.setState({ annotations: [mockAnnotation] });
      (annotationRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await useAnnotationStore.getState().deleteAnnotation('ann-1');

      expect(useAnnotationStore.getState().annotations).toEqual([]);
    });

    it('restores on failure', async () => {
      useAnnotationStore.setState({ annotations: [mockAnnotation] });
      (annotationRepository.delete as jest.Mock).mockRejectedValue(new Error('Delete error'));

      await expect(useAnnotationStore.getState().deleteAnnotation('ann-1')).rejects.toThrow(
        'Delete error'
      );

      expect(useAnnotationStore.getState().annotations).toEqual([mockAnnotation]);
      expect(useAnnotationStore.getState().error).toBe('Delete error');
    });

    it('restores on non-Error delete failure', async () => {
      const ann2 = { ...mockAnnotation, id: 'ann-2', createdAt: 500 };
      useAnnotationStore.setState({ annotations: [mockAnnotation, ann2] });
      (annotationRepository.delete as jest.Mock).mockRejectedValue('delete-err');

      await expect(useAnnotationStore.getState().deleteAnnotation('ann-1')).rejects.toBe(
        'delete-err'
      );

      expect(useAnnotationStore.getState().error).toBe('Failed to delete annotation');
    });

    it('does nothing if annotation not found', async () => {
      await useAnnotationStore.getState().deleteAnnotation('missing');
      expect(annotationRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('clearAnnotations', () => {
    it('clears all annotations', () => {
      useAnnotationStore.setState({ annotations: [mockAnnotation] });
      useAnnotationStore.getState().clearAnnotations();
      expect(useAnnotationStore.getState().annotations).toEqual([]);
    });
  });

  describe('clearError', () => {
    it('clears error', () => {
      useAnnotationStore.setState({ error: 'Err' });
      useAnnotationStore.getState().clearError();
      expect(useAnnotationStore.getState().error).toBeNull();
    });
  });
});
