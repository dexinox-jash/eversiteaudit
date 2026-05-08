import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useIssueStore } from '@store/useIssueStore';
import { usePhotoStore } from '@store/usePhotoStore';
import IssueEditScreen from '@app/issues/edit/[id]';
import {
  requestAudioPermissionsAsync,
  startRecording,
  stopRecording,
} from '@services/media/voiceRecorder';
import {
  pickImagesFromLibrary,
  requestMediaLibraryPermissionsAsync,
} from '@services/media/imagePicker';

jest.mock('@store/useIssueStore');
jest.mock('@store/usePhotoStore');
jest.mock('@services/media/voiceRecorder');
jest.mock('@services/media/imagePicker');
jest.mock('expo-location');

describe('IssueEdit screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with pre-populated issue data', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'issue-1' });

    // usePhotoStore is already mocked and imported
    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotosByIssue: jest.fn(),
      bulkDelete: jest.fn(),
      updateSortOrder: jest.fn(),
      createPhoto: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [
        {
          id: 'issue-1',
          projectId: 'proj-1',
          title: 'Broken Window',
          description: 'The window is cracked',
          category: 'safety',
          severity: 'high',
          status: 'open',
          locationDescription: 'Building A',
          gpsLatitude: null,
          gpsLongitude: null,
          gpsAccuracy: null,
          voiceNoteUrl: null,
          assignedTo: 'John Doe',
          dueDate: null,
          resolutionNotes: null,
          resolvedAt: null,
          resolvedBy: null,
          createdAt: 1000,
          updatedAt: 2000,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      updateIssue: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });

    render(<IssueEditScreen />);

    expect(screen.getByDisplayValue('Broken Window')).toBeTruthy();
    expect(screen.getByDisplayValue('The window is cracked')).toBeTruthy();
    expect(screen.getByDisplayValue('Building A')).toBeTruthy();
    expect(screen.getByDisplayValue('John Doe')).toBeTruthy();
    expect(screen.getByText('Save Changes')).toBeTruthy();
  });

  it('shows not found when issue does not exist', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'missing' });

    // usePhotoStore is already mocked and imported
    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotosByIssue: jest.fn(),
      bulkDelete: jest.fn(),
      updateSortOrder: jest.fn(),
      createPhoto: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [],
      updateIssue: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });

    render(<IssueEditScreen />);

    await waitFor(() => {
      expect(screen.getByText('Issue not found.')).toBeTruthy();
      expect(screen.getByText('Go Back')).toBeTruthy();
    });
  });

  it('captures GPS location and saves with issue', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'issue-1' });

    const mockUpdateIssue = jest.fn().mockResolvedValue(undefined);
    // usePhotoStore is already mocked and imported
    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotosByIssue: jest.fn(),
      bulkDelete: jest.fn(),
      updateSortOrder: jest.fn(),
      createPhoto: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [
        {
          id: 'issue-1',
          projectId: 'proj-1',
          title: 'Broken Window',
          description: '',
          category: null,
          severity: 'medium',
          status: 'open',
          locationDescription: '',
          gpsLatitude: null,
          gpsLongitude: null,
          gpsAccuracy: null,
          voiceNoteUrl: null,
          assignedTo: '',
          dueDate: null,
          resolutionNotes: null,
          resolvedAt: null,
          resolvedBy: null,
          createdAt: 1000,
          updatedAt: 2000,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      updateIssue: mockUpdateIssue,
      error: null,
      clearError: jest.fn(),
    });

    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 51.5074, longitude: -0.1278, accuracy: 5 },
    });

    render(<IssueEditScreen />);

    await waitFor(() => {
      expect(screen.getByText('Capture Location')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Capture Location'));

    await waitFor(() => {
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
      expect(screen.getByText(/Lat: 51.507400/)).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdateIssue).toHaveBeenCalledWith(
        'issue-1',
        expect.objectContaining({
          gpsLatitude: 51.5074,
          gpsLongitude: -0.1278,
          gpsAccuracy: 5,
        })
      );
    });
  });

  it('starts and stops voice recording', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'issue-1' });

    const mockUpdateIssue = jest.fn().mockResolvedValue(undefined);
    // usePhotoStore is already mocked and imported
    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotosByIssue: jest.fn(),
      bulkDelete: jest.fn(),
      updateSortOrder: jest.fn(),
      createPhoto: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [
        {
          id: 'issue-1',
          projectId: 'proj-1',
          title: 'Broken Window',
          description: '',
          category: null,
          severity: 'medium',
          status: 'open',
          locationDescription: '',
          gpsLatitude: null,
          gpsLongitude: null,
          gpsAccuracy: null,
          voiceNoteUrl: null,
          assignedTo: '',
          dueDate: null,
          resolutionNotes: null,
          resolvedAt: null,
          resolvedBy: null,
          createdAt: 1000,
          updatedAt: 2000,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      updateIssue: mockUpdateIssue,
      error: null,
      clearError: jest.fn(),
    });

    (requestAudioPermissionsAsync as jest.Mock).mockResolvedValue(true);
    (startRecording as jest.Mock).mockResolvedValue(undefined);
    (stopRecording as jest.Mock).mockResolvedValue('file:///voice/note.m4a');

    render(<IssueEditScreen />);

    await waitFor(() => {
      expect(screen.getByText('Record Voice Note')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Record Voice Note'));

    await waitFor(() => {
      expect(requestAudioPermissionsAsync).toHaveBeenCalled();
      expect(startRecording).toHaveBeenCalled();
      expect(screen.getByText('Recording...')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Stop Recording'));

    await waitFor(() => {
      expect(stopRecording).toHaveBeenCalled();
      expect(screen.getByText('Voice note saved')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdateIssue).toHaveBeenCalledWith(
        'issue-1',
        expect.objectContaining({
          voiceNoteUrl: 'file:///voice/note.m4a',
        })
      );
    });
  });

  it('renders photo grid with accessibility labels', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'issue-1' });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [
        {
          id: 'photo-1',
          projectId: 'proj-1',
          issueId: 'issue-1',
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
          caption: null,
          tags: '[]',
          sortOrder: 0,
          createdAt: 1000,
          updatedAt: 2000,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      loadPhotosByIssue: jest.fn(),
      bulkDelete: jest.fn(),
      updateSortOrder: jest.fn(),
      createPhoto: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [
        {
          id: 'issue-1',
          projectId: 'proj-1',
          title: 'Broken Window',
          description: '',
          category: null,
          severity: 'medium',
          status: 'open',
          locationDescription: '',
          gpsLatitude: null,
          gpsLongitude: null,
          gpsAccuracy: null,
          voiceNoteUrl: null,
          assignedTo: '',
          dueDate: null,
          resolutionNotes: null,
          resolvedAt: null,
          resolvedBy: null,
          createdAt: 1000,
          updatedAt: 2000,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      updateIssue: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });

    render(<IssueEditScreen />);

    expect(screen.getByLabelText('Photo 1, tap to view')).toBeTruthy();
  });

  it('imports photos from gallery', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'issue-1' });

    const mockCreatePhoto = jest.fn().mockResolvedValue({ id: 'photo-new' });
    // usePhotoStore is already mocked and imported
    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotosByIssue: jest.fn(),
      bulkDelete: jest.fn(),
      updateSortOrder: jest.fn(),
      createPhoto: mockCreatePhoto,
      error: null,
      clearError: jest.fn(),
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [
        {
          id: 'issue-1',
          projectId: 'proj-1',
          title: 'Broken Window',
          description: '',
          category: null,
          severity: 'medium',
          status: 'open',
          locationDescription: '',
          gpsLatitude: null,
          gpsLongitude: null,
          gpsAccuracy: null,
          voiceNoteUrl: null,
          assignedTo: '',
          dueDate: null,
          resolutionNotes: null,
          resolvedAt: null,
          resolvedBy: null,
          createdAt: 1000,
          updatedAt: 2000,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      updateIssue: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });

    (requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue(true);
    (pickImagesFromLibrary as jest.Mock).mockResolvedValue([
      { uri: 'file:///gallery/imported.jpg', width: 800, height: 600, fileSize: 2048 },
    ]);

    render(<IssueEditScreen />);

    await waitFor(() => {
      expect(screen.getByText('Import Photos from Gallery')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Import Photos from Gallery'));

    await waitFor(() => {
      expect(requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(pickImagesFromLibrary).toHaveBeenCalledWith({ allowsMultipleSelection: true });
      expect(mockCreatePhoto).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'proj-1',
          issueId: 'issue-1',
          originalPath: 'file:///gallery/imported.jpg',
        })
      );
    });
  });
});
