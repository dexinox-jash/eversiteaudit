import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import TrashScreen from '@app/trash/index';
import { useProjectStore } from '@store/useProjectStore';
import { useIssueStore } from '@store/useIssueStore';

jest.mock('@store/useProjectStore');
jest.mock('@store/useIssueStore');

describe('TrashScreen', () => {
  const mockLoadDeletedProjects = jest.fn();
  const mockLoadDeletedIssues = jest.fn();
  const mockRestoreProject = jest.fn();
  const mockRestoreIssue = jest.fn();
  const mockPermanentlyDeleteProject = jest.fn();
  const mockPermanentlyDeleteIssue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      loadDeletedProjects: mockLoadDeletedProjects,
      restoreProject: mockRestoreProject,
      permanentlyDeleteProject: mockPermanentlyDeleteProject,
      loadDeletedIssues: jest.fn(),
      restoreIssue: jest.fn(),
      permanentlyDeleteIssue: jest.fn(),
    });
    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      loadDeletedIssues: mockLoadDeletedIssues,
      restoreIssue: mockRestoreIssue,
      permanentlyDeleteIssue: mockPermanentlyDeleteIssue,
      loadDeletedProjects: jest.fn(),
      restoreProject: jest.fn(),
      permanentlyDeleteProject: jest.fn(),
    });
    (useProjectStore.getState as jest.Mock) = jest.fn(() => ({ projects: [] }));
    (useIssueStore.getState as jest.Mock) = jest.fn(() => ({ issues: [] }));
  });

  it('renders trash screen with tabs', async () => {
    render(<TrashScreen />);
    await waitFor(() => {
      expect(screen.getByText('Trash')).toBeTruthy();
    });
    expect(screen.getByLabelText('View deleted projects')).toBeTruthy();
    expect(screen.getByLabelText('View deleted issues')).toBeTruthy();
  });

  it('shows empty state when no deleted items', async () => {
    render(<TrashScreen />);
    await waitFor(() => {
      expect(screen.getByText('Trash is Empty')).toBeTruthy();
    });
  });

  it('switches to issues tab', async () => {
    render(<TrashScreen />);
    const issuesTab = screen.getByLabelText('View deleted issues');
    fireEvent.press(issuesTab);
    await waitFor(() => {
      expect(screen.getByText('Trash is Empty')).toBeTruthy();
    });
  });

  it('loads deleted projects and issues on mount', async () => {
    render(<TrashScreen />);
    await waitFor(() => {
      expect(mockLoadDeletedProjects).toHaveBeenCalled();
      expect(mockLoadDeletedIssues).toHaveBeenCalled();
    });
  });
});
