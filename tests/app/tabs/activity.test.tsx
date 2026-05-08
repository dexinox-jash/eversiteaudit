import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import ActivityScreen from '@app/(tabs)/activity';
import { useProjectStore } from '@store/useProjectStore';
import { useIssueStore } from '@store/useIssueStore';
import { usePhotoStore } from '@store/usePhotoStore';

jest.mock('@store/useProjectStore');
jest.mock('@store/useIssueStore');
jest.mock('@store/usePhotoStore');
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

describe('ActivityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [],
      loadProjects: jest.fn(),
    });
    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [],
      loadIssues: jest.fn(),
    });
    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotos: jest.fn(),
    });
  });

  it('renders empty state when no activity', () => {
    render(<ActivityScreen />);
    expect(screen.getByText('No activity yet')).toBeTruthy();
    expect(
      screen.getByText('Your recent projects, issues, and photos will appear here.')
    ).toBeTruthy();
  });

  it('renders recent projects, issues, and photos', () => {
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        {
          id: 'p1',
          name: 'Site A',
          siteAddress: '123 Main St',
          status: 'active',
          createdAt: 1000,
          updatedAt: 1000,
          isDeleted: 0,
        },
      ],
      loadProjects: jest.fn(),
    });
    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [
        {
          id: 'i1',
          title: 'Crack in wall',
          severity: 'high',
          status: 'open',
          projectId: 'p1',
          createdAt: 2000,
          updatedAt: 2000,
          isDeleted: 0,
          description: null,
          category: null,
          locationDescription: null,
          assignedTo: null,
          dueDate: null,
          gpsLatitude: null,
          gpsLongitude: null,
          gpsAccuracy: null,
          voiceNoteUrl: null,
          sortOrder: 0,
          deletedAt: null,
          resolutionNotes: null,
          resolvedAt: null,
          resolvedBy: null,
        },
      ],
      loadIssues: jest.fn(),
    });
    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [
        {
          id: 'ph1',
          caption: 'Foundation photo',
          width: 1200,
          height: 800,
          createdAt: 3000,
          updatedAt: 3000,
          isDeleted: 0,
          projectId: 'p1',
          issueId: null,
          originalPath: '',
          thumbnailPath: '',
          compressedPath: null,
          captureTimestamp: 3000,
          cameraMake: null,
          cameraModel: null,
          gpsLatitude: null,
          gpsLongitude: null,
          gpsAltitude: null,
          fileSizeBytes: null,
          checksum: null,
          tags: '[]',
          sortOrder: 0,
          deletedAt: null,
        },
      ],
      loadPhotos: jest.fn(),
    });

    render(<ActivityScreen />);

    expect(screen.getByText('Foundation photo')).toBeTruthy();
    expect(screen.getByText('Crack in wall')).toBeTruthy();
    expect(screen.getByText('Site A')).toBeTruthy();
  });

  it('navigates to project detail on press', () => {
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        {
          id: 'p1',
          name: 'Site A',
          siteAddress: '123 Main St',
          status: 'active',
          createdAt: 1000,
          updatedAt: 1000,
          isDeleted: 0,
        },
      ],
      loadProjects: jest.fn(),
    });
    (useIssueStore as unknown as jest.Mock).mockReturnValue({ issues: [], loadIssues: jest.fn() });
    (usePhotoStore as unknown as jest.Mock).mockReturnValue({ photos: [], loadPhotos: jest.fn() });

    render(<ActivityScreen />);
    fireEvent.press(screen.getByLabelText('project: Site A'));
    expect(router.push).toHaveBeenCalledWith('/projects/p1');
  });
});
