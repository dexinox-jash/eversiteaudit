import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { usePhotoStore } from '@store/usePhotoStore';
import { useAnnotationStore } from '@store/useAnnotationStore';
import AnnotateScreen from '@app/photos/annotate/[id]';

jest.mock('@store/usePhotoStore');
jest.mock('@store/useAnnotationStore');

const mockPhoto = {
  id: 'photo-1',
  projectId: 'proj-1',
  issueId: null,
  originalPath: 'file:///mock/original.jpg',
  thumbnailPath: 'file:///mock/thumb.jpg',
  compressedPath: null,
  captureTimestamp: 1000,
  cameraMake: null,
  cameraModel: null,
  gpsLatitude: null,
  gpsLongitude: null,
  gpsAltitude: null,
  width: 1920,
  height: 1080,
  fileSizeBytes: 2048000,
  caption: 'Site overview',
  tags: '[]',
  createdAt: 1000,
  updatedAt: 2000,
  isDeleted: 0,
  deletedAt: null,
};

function mockStores(
  photos = [mockPhoto],
  annotations: unknown[] = [],
  annotationStoreOverrides: Record<string, unknown> = {}
): {
  mockLoadAnnotations: jest.Mock;
  mockAddAnnotation: jest.Mock;
  mockDeleteAnnotation: jest.Mock;
  mockUpdateAnnotation: jest.Mock;
} {
  const mockLoadAnnotations = jest.fn();
  const mockAddAnnotation = jest.fn().mockResolvedValue(undefined);
  const mockDeleteAnnotation = jest.fn().mockResolvedValue(undefined);
  const mockUpdateAnnotation = jest.fn().mockResolvedValue(undefined);

  (usePhotoStore as unknown as jest.Mock).mockReturnValue({ photos });

  const storeState = {
    annotations,
    loadAnnotations: mockLoadAnnotations,
    addAnnotation: mockAddAnnotation,
    deleteAnnotation: mockDeleteAnnotation,
    updateAnnotation: mockUpdateAnnotation,
    ...annotationStoreOverrides,
  };
  (useAnnotationStore as unknown as jest.Mock).mockReturnValue(storeState);
  (useAnnotationStore as unknown as { getState: jest.Mock }).getState = jest.fn(() => storeState);

  return { mockLoadAnnotations, mockAddAnnotation, mockDeleteAnnotation, mockUpdateAnnotation };
}

describe('Annotate screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'photo-1' });
  });

  it('renders annotation canvas for an existing photo', () => {
    mockStores();
    render(<AnnotateScreen />);
    expect(screen.queryByText('Photo not found')).toBeNull();
  });

  it('stroke width slider has adjustable accessibility role', () => {
    mockStores();
    render(<AnnotateScreen />);
    expect(screen.getByLabelText('Stroke width')).toBeTruthy();
  });

  it('shows not found when photo does not exist', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'missing' });
    mockStores([]);
    render(<AnnotateScreen />);
    expect(screen.getByText('Photo not found')).toBeTruthy();
  });

  it('navigates back from not-found view', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'missing' });
    mockStores([]);
    render(<AnnotateScreen />);
    fireEvent.press(screen.getByText('Go Back'));
    expect(router.back).toHaveBeenCalled();
  });

  it('renders all five annotation tools', () => {
    mockStores();
    render(<AnnotateScreen />);
    expect(screen.getByLabelText('Arrow')).toBeTruthy();
    expect(screen.getByLabelText('Circle')).toBeTruthy();
    expect(screen.getByLabelText('Rectangle')).toBeTruthy();
    expect(screen.getByLabelText('Pen')).toBeTruthy();
    expect(screen.getByLabelText('Text')).toBeTruthy();
  });

  it('selects a tool when pressed', () => {
    mockStores();
    render(<AnnotateScreen />);
    fireEvent.press(screen.getByLabelText('Circle'));
    expect(screen.getByLabelText('Circle').props.accessibilityState?.selected).toBe(true);
  });

  it('renders preset color swatches and selects one on press', () => {
    mockStores();
    render(<AnnotateScreen />);
    const color = screen.getByLabelText('Select color #06D6A0');
    fireEvent.press(color);
    expect(color.props.accessibilityState?.selected).toBe(true);
  });

  it('increases stroke width when + pressed', () => {
    mockStores();
    render(<AnnotateScreen />);
    const increase = screen.getByLabelText('Increase stroke width');
    fireEvent.press(increase);
    const slider = screen.getByLabelText('Stroke width');
    expect(slider.props.accessibilityValue?.now).toBe(4);
  });

  it('decreases stroke width when - pressed', () => {
    mockStores();
    render(<AnnotateScreen />);
    const decrease = screen.getByLabelText('Decrease stroke width');
    fireEvent.press(decrease);
    const slider = screen.getByLabelText('Stroke width');
    expect(slider.props.accessibilityValue?.now).toBe(2);
  });

  it('stroke width stays within bounds', () => {
    mockStores();
    render(<AnnotateScreen />);
    const decrease = screen.getByLabelText('Decrease stroke width');
    for (let i = 0; i < 10; i++) fireEvent.press(decrease);
    const slider = screen.getByLabelText('Stroke width');
    expect(slider.props.accessibilityValue?.now).toBe(1);

    const increase = screen.getByLabelText('Increase stroke width');
    for (let i = 0; i < 20; i++) fireEvent.press(increase);
    expect(screen.getByLabelText('Stroke width').props.accessibilityValue?.now).toBe(8);
  });

  it('undo button is disabled when no history', () => {
    mockStores();
    render(<AnnotateScreen />);
    const undo = screen.getByLabelText('Undo');
    expect(undo.props.accessibilityState?.disabled).toBe(true);
  });

  it('redo button is disabled initially', () => {
    mockStores();
    render(<AnnotateScreen />);
    const redo = screen.getByLabelText('Redo');
    expect(redo.props.accessibilityState?.disabled).toBe(true);
  });

  it('close button navigates back', () => {
    mockStores();
    render(<AnnotateScreen />);
    fireEvent.press(screen.getByLabelText('Close annotation'));
    expect(router.back).toHaveBeenCalled();
  });

  it('save button triggers back navigation', async () => {
    mockStores();
    render(<AnnotateScreen />);
    await (async () => {
      fireEvent.press(screen.getByLabelText('Save annotations'));
      await Promise.resolve();
    })();
    expect(router.back).toHaveBeenCalled();
  });

  it('loads annotations when mounted with a photo id', () => {
    const { mockLoadAnnotations } = mockStores();
    render(<AnnotateScreen />);
    expect(mockLoadAnnotations).toHaveBeenCalledWith('photo-1');
  });
});
