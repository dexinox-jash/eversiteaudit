import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePhotoStore } from '@store/usePhotoStore';
import { useAnnotationStore } from '@store/useAnnotationStore';
import PhotoViewerScreen from '@app/photos/[id]';
import { photoRepository } from '@services/db/repositories';
import {
  pickImagesFromLibrary,
  requestMediaLibraryPermissionsAsync,
} from '@services/media/imagePicker';

jest.mock('@store/usePhotoStore');
jest.mock('@store/useAnnotationStore');
jest.mock('@services/db/repositories');
jest.mock('@services/media/imagePicker');

describe('PhotoViewer screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    (useAnnotationStore as unknown as jest.Mock).mockReturnValue({
      annotations: [],
      loadAnnotations: jest.fn(),
    });
  });

  it('renders photo details with mocked store data', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      id: 'photo-1',
      issueId: undefined,
      projectId: undefined,
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [
        {
          id: 'photo-1',
          projectId: 'proj-1',
          issueId: null,
          originalPath: 'file:///mock/original.jpg',
          thumbnailPath: 'file:///mock/thumb.jpg',
          compressedPath: null,
          captureTimestamp: 1000,
          cameraMake: 'Canon',
          cameraModel: 'EOS R5',
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
        },
      ],
      deletePhoto: jest.fn(),
      createPhoto: jest.fn(),
    });

    render(<PhotoViewerScreen />);

    expect(screen.queryByText('Photo not found')).toBeNull();
  });

  it('shows not found when photo does not exist', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      id: 'missing',
      issueId: undefined,
      projectId: undefined,
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      deletePhoto: jest.fn(),
      createPhoto: jest.fn(),
    });

    render(<PhotoViewerScreen />);

    expect(screen.getByText('Photo not found')).toBeTruthy();
  });

  it('allows editing and saving a caption', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      id: 'photo-1',
      issueId: undefined,
      projectId: undefined,
    });

    const mockDeletePhoto = jest.fn();
    const mockCreatePhoto = jest.fn();

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [
        {
          id: 'photo-1',
          projectId: 'proj-1',
          issueId: null,
          originalPath: 'file:///mock/original.jpg',
          thumbnailPath: 'file:///mock/thumb.jpg',
          compressedPath: null,
          captureTimestamp: 1000,
          cameraMake: 'Canon',
          cameraModel: 'EOS R5',
          gpsLatitude: null,
          gpsLongitude: null,
          gpsAltitude: null,
          width: 1920,
          height: 1080,
          fileSizeBytes: 2048000,
          caption: 'Original caption',
          tags: '[]',
          createdAt: 1000,
          updatedAt: 2000,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      deletePhoto: mockDeletePhoto,
      createPhoto: mockCreatePhoto,
    });

    (useAnnotationStore as unknown as jest.Mock).mockReturnValue({
      annotations: [],
      loadAnnotations: jest.fn(),
    });

    (photoRepository.update as jest.Mock).mockResolvedValue(undefined);

    render(<PhotoViewerScreen />);

    // Open the info panel to access caption input
    const showInfoButton = screen.getByText('Show Info');
    fireEvent.press(showInfoButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Original caption')).toBeTruthy();
    });

    const captionInput = screen.getByDisplayValue('Original caption');
    fireEvent.changeText(captionInput, 'Updated caption');

    const saveButton = screen.getByText('Save Caption');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(photoRepository.update).toHaveBeenCalledWith('photo-1', {
        caption: 'Updated caption',
      });
    });
  });

  it('imports photos from gallery', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      id: 'photo-1',
      issueId: 'issue-1',
      projectId: 'proj-1',
    });

    const mockCreatePhoto = jest.fn().mockResolvedValue({ id: 'photo-2' });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [
        {
          id: 'photo-1',
          projectId: 'proj-1',
          issueId: 'issue-1',
          originalPath: 'file:///mock/original.jpg',
          thumbnailPath: 'file:///mock/thumb.jpg',
          compressedPath: null,
          captureTimestamp: null,
          cameraMake: null,
          cameraModel: null,
          gpsLatitude: null,
          gpsLongitude: null,
          gpsAltitude: null,
          width: null,
          height: null,
          fileSizeBytes: null,
          caption: null,
          tags: '[]',
          createdAt: 1000,
          updatedAt: 2000,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      deletePhoto: jest.fn(),
      createPhoto: mockCreatePhoto,
    });

    (useAnnotationStore as unknown as jest.Mock).mockReturnValue({
      annotations: [],
      loadAnnotations: jest.fn(),
    });

    (requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue(true);
    (pickImagesFromLibrary as jest.Mock).mockResolvedValue([
      { uri: 'file:///gallery/photo1.jpg', width: 1000, height: 800, fileSize: 1024 },
    ]);

    render(<PhotoViewerScreen />);

    const showInfoButton = screen.getByText('Show Info');
    fireEvent.press(showInfoButton);

    await waitFor(() => {
      expect(screen.getByText('Import from Gallery')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Import from Gallery'));

    await waitFor(() => {
      expect(requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(pickImagesFromLibrary).toHaveBeenCalledWith({ allowsMultipleSelection: true });
      expect(mockCreatePhoto).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'proj-1',
          issueId: 'issue-1',
          originalPath: 'file:///gallery/photo1.jpg',
        })
      );
    });
  });

  it('renders share and delete buttons with correct accessibility labels', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      id: 'photo-1',
      issueId: undefined,
      projectId: undefined,
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [
        {
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
          fileSizeBytes: 500000,
          caption: null,
          tags: '[]',
          createdAt: 1000,
          updatedAt: 2000,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      deletePhoto: jest.fn(),
      createPhoto: jest.fn(),
    });

    render(<PhotoViewerScreen />);

    expect(screen.getByLabelText('Share photo')).toBeTruthy();
    expect(screen.getByLabelText('Delete photo')).toBeTruthy();
    expect(screen.getByLabelText('Annotate photo')).toBeTruthy();
  });

  it('shows delete confirmation Alert when delete is pressed', () => {
    const alertSpy = jest
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      .spyOn(require('react-native').Alert, 'alert')
      .mockImplementation(() => {});

    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      id: 'photo-1',
      issueId: undefined,
      projectId: undefined,
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [
        {
          id: 'photo-1',
          projectId: 'proj-1',
          issueId: null,
          originalPath: 'file:///mock/original.jpg',
          thumbnailPath: 'file:///mock/thumb.jpg',
          compressedPath: null,
          captureTimestamp: null,
          cameraMake: null,
          cameraModel: null,
          gpsLatitude: null,
          gpsLongitude: null,
          gpsAltitude: null,
          width: null,
          height: null,
          fileSizeBytes: null,
          caption: null,
          tags: '[]',
          createdAt: 1000,
          updatedAt: 2000,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      deletePhoto: jest.fn(),
      createPhoto: jest.fn(),
    });

    render(<PhotoViewerScreen />);

    fireEvent.press(screen.getByLabelText('Delete photo'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Delete Photo',
      expect.stringContaining('Are you sure'),
      expect.any(Array)
    );

    alertSpy.mockRestore();
  });

  it('displays GPS coordinates when provided', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      id: 'photo-1',
      issueId: undefined,
      projectId: undefined,
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [
        {
          id: 'photo-1',
          projectId: 'proj-1',
          issueId: null,
          originalPath: 'file:///mock/original.jpg',
          thumbnailPath: 'file:///mock/thumb.jpg',
          compressedPath: null,
          captureTimestamp: 1700000000000,
          cameraMake: null,
          cameraModel: null,
          gpsLatitude: 40.7128,
          gpsLongitude: -74.006,
          gpsAltitude: null,
          width: 1920,
          height: 1080,
          fileSizeBytes: 500000,
          caption: null,
          tags: '[]',
          createdAt: 1000,
          updatedAt: 2000,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      deletePhoto: jest.fn(),
      createPhoto: jest.fn(),
    });

    render(<PhotoViewerScreen />);

    fireEvent.press(screen.getByText('Show Info'));

    // GPS coordinates should appear
    expect(screen.getByText(/40.7128/)).toBeTruthy();
  });

  it('shows permission denied alert when media library is denied', async () => {
    const alertSpy = jest
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      .spyOn(require('react-native').Alert, 'alert')
      .mockImplementation(() => {});

    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      id: 'photo-1',
      issueId: 'issue-1',
      projectId: 'proj-1',
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [
        {
          id: 'photo-1',
          projectId: 'proj-1',
          issueId: 'issue-1',
          originalPath: 'file:///mock/original.jpg',
          thumbnailPath: 'file:///mock/thumb.jpg',
          compressedPath: null,
          captureTimestamp: null,
          cameraMake: null,
          cameraModel: null,
          gpsLatitude: null,
          gpsLongitude: null,
          gpsAltitude: null,
          width: null,
          height: null,
          fileSizeBytes: null,
          caption: null,
          tags: '[]',
          createdAt: 1000,
          updatedAt: 2000,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      deletePhoto: jest.fn(),
      createPhoto: jest.fn(),
    });

    (requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue(false);

    render(<PhotoViewerScreen />);

    fireEvent.press(screen.getByText('Show Info'));

    await waitFor(() => {
      expect(screen.getByText('Import from Gallery')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Import from Gallery'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Permission Denied',
        expect.stringContaining('permission'),
        expect.any(Array)
      );
    });

    alertSpy.mockRestore();
  });
});
