import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useProjectStore } from '@store/useProjectStore';
import { useIssueStore } from '@store/useIssueStore';
import { usePhotoStore } from '@store/usePhotoStore';
import { usePreferenceStore } from '@store/usePreferenceStore';
import ProjectDetailScreen from '@app/projects/[id]';
import { duplicateProject } from '@services/duplication/projectDuplication';

jest.mock('@store/useProjectStore');
jest.mock('@store/useIssueStore');
jest.mock('@store/usePhotoStore');
jest.mock('@store/usePreferenceStore');
jest.mock('@services/duplication/projectDuplication');

describe('ProjectDetail screen', () => {
  const mockUpdateProject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders project details with mocked store data', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'proj-1' });

    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        {
          id: 'proj-1',
          name: 'Test Project',
          description: 'A test project description',
          siteAddress: '123 Main St',
          clientName: 'Acme Corp',
          status: 'active',
          priority: 1,
          createdAt: 1000,
          updatedAt: 2000,
          completedAt: null,
          createdBy: null,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      updateProject: mockUpdateProject,
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [],
      isLoading: false,
      loadIssuesByProject: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      isLoading: false,
      loadPhotosByProject: jest.fn(),
    });

    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      companyName: null,
      reportHeaderText: null,
      reportFooterText: null,
    });

    render(<ProjectDetailScreen />);

    expect(screen.getByText('Test Project')).toBeTruthy();
    expect(screen.getByText('123 Main St')).toBeTruthy();
    expect(screen.getByText('Acme Corp')).toBeTruthy();
    expect(screen.getByText('active')).toBeTruthy();
    expect(screen.getByText('Overview')).toBeTruthy();
    expect(screen.getByText('Issues')).toBeTruthy();
    expect(screen.getByText('Photos')).toBeTruthy();
  });

  it('shows not found when project does not exist', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'missing' });

    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [],
      updateProject: mockUpdateProject,
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [],
      isLoading: false,
      loadIssuesByProject: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      isLoading: false,
      loadPhotosByProject: jest.fn(),
    });

    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      companyName: null,
      reportHeaderText: null,
      reportFooterText: null,
    });

    render(<ProjectDetailScreen />);

    expect(screen.getByText('Project Not Found')).toBeTruthy();
  });

  it('renders Archive Project action for active project', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'proj-1' });

    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        {
          id: 'proj-1',
          name: 'Test Project',
          description: null,
          siteAddress: null,
          clientName: null,
          status: 'active',
          priority: 0,
          createdAt: 1000,
          updatedAt: 2000,
          completedAt: null,
          createdBy: null,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      updateProject: mockUpdateProject,
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [],
      isLoading: false,
      loadIssuesByProject: jest.fn(),
      bulkDelete: jest.fn(),
      bulkUpdateStatus: jest.fn(),
      updateSortOrder: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      isLoading: false,
      loadPhotosByProject: jest.fn(),
    });

    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      companyName: null,
      reportHeaderText: null,
      reportFooterText: null,
    });

    render(<ProjectDetailScreen />);
    expect(screen.getByText('Archive Project')).toBeTruthy();
  });

  it('renders Unarchive Project action for archived project', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'proj-1' });

    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        {
          id: 'proj-1',
          name: 'Test Project',
          description: null,
          siteAddress: null,
          clientName: null,
          status: 'archived',
          priority: 0,
          createdAt: 1000,
          updatedAt: 2000,
          completedAt: null,
          createdBy: null,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      updateProject: mockUpdateProject,
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [],
      isLoading: false,
      loadIssuesByProject: jest.fn(),
      bulkDelete: jest.fn(),
      bulkUpdateStatus: jest.fn(),
      updateSortOrder: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      isLoading: false,
      loadPhotosByProject: jest.fn(),
    });

    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      companyName: null,
      reportHeaderText: null,
      reportFooterText: null,
    });

    render(<ProjectDetailScreen />);
    expect(screen.getByText('Unarchive Project')).toBeTruthy();
  });

  it('calls updateProject when Archive Project is pressed', async () => {
    mockUpdateProject.mockResolvedValue({ id: 'proj-1', status: 'archived' });
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'proj-1' });

    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        {
          id: 'proj-1',
          name: 'Test Project',
          description: null,
          siteAddress: null,
          clientName: null,
          status: 'active',
          priority: 0,
          createdAt: 1000,
          updatedAt: 2000,
          completedAt: null,
          createdBy: null,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      updateProject: mockUpdateProject,
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [],
      isLoading: false,
      loadIssuesByProject: jest.fn(),
      bulkDelete: jest.fn(),
      bulkUpdateStatus: jest.fn(),
      updateSortOrder: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      isLoading: false,
      loadPhotosByProject: jest.fn(),
    });

    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      companyName: null,
      reportHeaderText: null,
      reportFooterText: null,
    });

    (jest.spyOn(Alert, 'alert') as unknown as jest.Mock).mockImplementation((_title: string, _message: string | undefined, buttons?: Array<{ style?: string; text?: string; onPress?: () => void }>) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });

    render(<ProjectDetailScreen />);
    const archiveButton = screen.getByText('Archive Project');
    fireEvent.press(archiveButton);

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith('proj-1', { status: 'archived' });
    });
  });

  it('renders Duplicate Project action', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'proj-1' });

    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        {
          id: 'proj-1',
          name: 'Test Project',
          description: null,
          siteAddress: null,
          clientName: null,
          status: 'active',
          priority: 0,
          createdAt: 1000,
          updatedAt: 2000,
          completedAt: null,
          createdBy: null,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      updateProject: mockUpdateProject,
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [],
      isLoading: false,
      loadIssuesByProject: jest.fn(),
      bulkDelete: jest.fn(),
      bulkUpdateStatus: jest.fn(),
      updateSortOrder: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      isLoading: false,
      loadPhotosByProject: jest.fn(),
    });

    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      companyName: null,
      reportHeaderText: null,
      reportFooterText: null,
    });

    render(<ProjectDetailScreen />);
    expect(screen.getByText('Duplicate Project')).toBeTruthy();
  });

  it('status picker modal has accessibility labels', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'proj-1' });

    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        {
          id: 'proj-1',
          name: 'Test Project',
          description: null,
          siteAddress: null,
          clientName: null,
          status: 'active',
          priority: 0,
          createdAt: 1000,
          updatedAt: 2000,
          completedAt: null,
          createdBy: null,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      updateProject: mockUpdateProject,
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [
        {
          id: 'issue-1',
          projectId: 'proj-1',
          title: 'Issue 1',
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
      isLoading: false,
      loadIssuesByProject: jest.fn(),
      bulkDelete: jest.fn(),
      bulkUpdateStatus: jest.fn(),
      updateSortOrder: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      isLoading: false,
      loadPhotosByProject: jest.fn(),
    });

    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      companyName: null,
      reportHeaderText: null,
      reportFooterText: null,
    });

    render(<ProjectDetailScreen />);

    // Switch to Issues tab
    fireEvent.press(screen.getByText('Issues'));

    // Enter selection mode to show bulk actions
    const listFilterButton = screen.getByLabelText('Select issues');
    fireEvent.press(listFilterButton);

    // Open status picker
    const statusButton = screen.getByLabelText('Change status');
    fireEvent.press(statusButton);

    expect(screen.getAllByLabelText('Change status')[0]).toBeTruthy();
    expect(screen.getAllByLabelText('open').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText('in progress').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText('resolved').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText('closed').length).toBeGreaterThanOrEqual(1);
  });

  it('duplicates project when Duplicate Project is pressed', async () => {
    (duplicateProject as jest.Mock).mockResolvedValue({
      id: 'proj-duplicated',
      name: 'Test Project (Copy)',
    });
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'proj-1' });

    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        {
          id: 'proj-1',
          name: 'Test Project',
          description: null,
          siteAddress: null,
          clientName: null,
          status: 'active',
          priority: 0,
          createdAt: 1000,
          updatedAt: 2000,
          completedAt: null,
          createdBy: null,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      updateProject: mockUpdateProject,
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [],
      isLoading: false,
      loadIssuesByProject: jest.fn(),
      bulkDelete: jest.fn(),
      bulkUpdateStatus: jest.fn(),
      updateSortOrder: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      isLoading: false,
      loadPhotosByProject: jest.fn(),
    });

    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      companyName: null,
      reportHeaderText: null,
      reportFooterText: null,
    });

    render(<ProjectDetailScreen />);
    const duplicateButton = screen.getByText('Duplicate Project');
    fireEvent.press(duplicateButton);

    await waitFor(() => {
      expect(duplicateProject).toHaveBeenCalledWith('proj-1');
    });
  });
});
