import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { useIssueStore } from '@store/useIssueStore';
import { usePhotoStore } from '@store/usePhotoStore';
import IssueDetailScreen from '@app/issues/[id]';
import { duplicateIssue } from '@services/duplication/issueDuplication';

jest.mock('@store/useIssueStore');
jest.mock('@store/usePhotoStore');
jest.mock('@services/duplication/issueDuplication');
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() =>
        Promise.resolve({
          sound: {
            playAsync: jest.fn(() => Promise.resolve()),
            pauseAsync: jest.fn(() => Promise.resolve()),
            unloadAsync: jest.fn(() => Promise.resolve()),
            getStatusAsync: jest.fn(() =>
              Promise.resolve({ isLoaded: true, durationMillis: 15000, positionMillis: 0 })
            ),
            setOnPlaybackStatusUpdate: jest.fn(),
          },
        })
      ),
    },
  },
}));

describe('IssueDetail screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders issue details with mocked store data', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'issue-1' });

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
      deleteIssue: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotosByIssue: jest.fn(),
      isLoading: false,
    });

    render(<IssueDetailScreen />);

    expect(screen.getByText('Broken Window')).toBeTruthy();
    expect(screen.getByText('High')).toBeTruthy();
    expect(screen.getByText('open')).toBeTruthy();
    expect(screen.getByText('Building A')).toBeTruthy();
    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.getByText('The window is cracked')).toBeTruthy();
  });

  it('shows not found when issue does not exist', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'missing' });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [],
      deleteIssue: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotosByIssue: jest.fn(),
      isLoading: false,
    });

    render(<IssueDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Issue not found.')).toBeTruthy();
      expect(screen.getByText('Go Back')).toBeTruthy();
    });
  });

  it('displays GPS coordinates when available', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'issue-1' });

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
          gpsLatitude: 51.5074,
          gpsLongitude: -0.1278,
          gpsAccuracy: null,
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
      deleteIssue: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotosByIssue: jest.fn(),
      isLoading: false,
    });

    render(<IssueDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Lat: 51.507400/)).toBeTruthy();
      expect(screen.getByText(/Lng: -0.127800/)).toBeTruthy();
    });
  });

  it('renders voice note player when voiceNoteUrl is present', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'issue-1' });

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
          voiceNoteUrl: 'file:///voice/note.m4a',
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
      deleteIssue: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotosByIssue: jest.fn(),
      isLoading: false,
    });

    render(<IssueDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Voice Note')).toBeTruthy();
      expect(screen.getByText('Play Voice Note')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Play Voice Note'));

    await waitFor(() => {
      expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
        { uri: 'file:///voice/note.m4a' },
        { shouldPlay: false },
        expect.any(Function)
      );
    });
  });

  it('renders Duplicate Issue action', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'issue-1' });

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
      deleteIssue: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotosByIssue: jest.fn(),
      isLoading: false,
    });

    render(<IssueDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Duplicate Issue')).toBeTruthy();
    });
  });

  it('duplicates issue when Duplicate Issue is pressed', async () => {
    (duplicateIssue as jest.Mock).mockResolvedValue({
      id: 'issue-duplicated',
      title: 'Broken Window (Copy)',
    });
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'issue-1' });

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
      deleteIssue: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotosByIssue: jest.fn(),
      isLoading: false,
    });

    render(<IssueDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Duplicate Issue')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Duplicate Issue'));

    await waitFor(() => {
      expect(duplicateIssue).toHaveBeenCalledWith('issue-1');
    });
  });
});
