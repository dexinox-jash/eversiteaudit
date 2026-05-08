import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, router } from 'expo-router';
import NewIssueScreen from '@app/issues/new';
import { useProjectStore } from '@store/useProjectStore';
import { useIssueStore } from '@store/useIssueStore';
import { hapticSuccess } from '@services/os/haptics';

jest.mock('@store/useProjectStore');
jest.mock('@store/useIssueStore');
jest.mock('@services/os/haptics');

describe('NewIssueScreen', () => {
  const mockLoadProjects = jest.fn();
  const mockCreateIssue = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({});
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        { id: 'proj-1', name: 'Alpha' },
        { id: 'proj-2', name: 'Beta' },
      ],
      loadProjects: mockLoadProjects,
    });
    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      createIssue: mockCreateIssue,
      error: null,
      clearError: mockClearError,
    });
    mockCreateIssue.mockResolvedValue({ id: 'issue-1' });
  });

  it('renders form and loads projects on mount', () => {
    render(<NewIssueScreen />);
    expect(screen.getByText('New Issue')).toBeTruthy();
    expect(screen.getByLabelText('Select project Alpha')).toBeTruthy();
    expect(screen.getByLabelText('Select project Beta')).toBeTruthy();
    expect(screen.getByLabelText('Title *')).toBeTruthy();
    expect(screen.getByLabelText('Description')).toBeTruthy();
    expect(mockLoadProjects).toHaveBeenCalled();
  });

  it('selects a project', () => {
    render(<NewIssueScreen />);
    const alphaButton = screen.getByLabelText('Select project Alpha');
    fireEvent.press(alphaButton);
    expect(alphaButton.props.accessibilityState.selected).toBe(true);
  });

  it('changes severity selection', () => {
    render(<NewIssueScreen />);
    fireEvent.press(screen.getByLabelText('Set severity to Critical'));
    expect(
      screen.getByLabelText('Set severity to Critical').props.accessibilityState.selected
    ).toBe(true);
    fireEvent.press(screen.getByLabelText('Set severity to Low'));
    expect(screen.getByLabelText('Set severity to Low').props.accessibilityState.selected).toBe(
      true
    );
  });

  it('changes status selection', () => {
    render(<NewIssueScreen />);
    fireEvent.press(screen.getByLabelText('Set status to Resolved'));
    expect(screen.getByLabelText('Set status to Resolved').props.accessibilityState.selected).toBe(
      true
    );
  });

  it('shows validation error when title is empty', () => {
    render(<NewIssueScreen />);
    fireEvent.press(screen.getByLabelText('Create issue'));
    expect(screen.getByText('Title is required')).toBeTruthy();
  });

  it('shows validation error when no project is selected', () => {
    render(<NewIssueScreen />);
    fireEvent.changeText(screen.getByLabelText('Title *'), 'Leak in roof');
    fireEvent.press(screen.getByLabelText('Create issue'));
    expect(screen.getByText('Please select a project')).toBeTruthy();
  });

  it('creates issue and navigates back on success', async () => {
    render(<NewIssueScreen />);
    fireEvent.press(screen.getByLabelText('Select project Alpha'));
    fireEvent.changeText(screen.getByLabelText('Title *'), 'Leak in roof');
    fireEvent.changeText(screen.getByLabelText('Description'), 'Water dripping from ceiling');
    fireEvent.press(screen.getByLabelText('Set severity to High'));
    fireEvent.press(screen.getByLabelText('Set status to In Progress'));

    fireEvent.press(screen.getByLabelText('Create issue'));

    await waitFor(() => {
      expect(mockCreateIssue).toHaveBeenCalledWith({
        projectId: 'proj-1',
        title: 'Leak in roof',
        description: 'Water dripping from ceiling',
        severity: 'high',
        status: 'in_progress',
      });
      expect(hapticSuccess).toHaveBeenCalled();
      expect(router.back).toHaveBeenCalled();
    });
  });

  it('uses projectId from query params as initial selection', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ projectId: 'proj-2' });
    render(<NewIssueScreen />);
    expect(screen.getByLabelText('Select project Beta').props.accessibilityState.selected).toBe(
      true
    );
  });

  it('clears error and goes back when header back is pressed', () => {
    render(<NewIssueScreen />);
    const backButton = screen.getByLabelText('Go back');
    fireEvent.press(backButton);
    expect(mockClearError).toHaveBeenCalled();
    expect(router.back).toHaveBeenCalled();
  });
});
