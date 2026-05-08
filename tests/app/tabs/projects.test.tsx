import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import ProjectsScreen from '@app/(tabs)/index';
import { useProjectStore } from '@store/useProjectStore';

jest.mock('@store/useProjectStore');

describe('ProjectsScreen', () => {
  const mockLoadProjects = jest.fn();
  const mockSetFilter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [],
      isLoading: false,
      error: null,
      filter: 'all',
      loadProjects: mockLoadProjects,
      setFilter: mockSetFilter,
    });
  });

  it('renders empty state when no projects', async () => {
    render(<ProjectsScreen />);

    await waitFor(() => {
      expect(screen.getByText('No Projects Yet')).toBeTruthy();
    });
    expect(mockLoadProjects).toHaveBeenCalled();
  });

  it('renders project list', async () => {
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        { id: 'proj-1', name: 'Alpha', siteAddress: 'Site A', status: 'active' },
        { id: 'proj-2', name: 'Beta', siteAddress: 'Site B', status: 'completed' },
      ],
      isLoading: false,
      error: null,
      filter: 'all',
      loadProjects: mockLoadProjects,
      setFilter: mockSetFilter,
    });

    render(<ProjectsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeTruthy();
    });
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.getByText('Site A')).toBeTruthy();
  });

  it('filters projects by search query', async () => {
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        { id: 'proj-1', name: 'Alpha', siteAddress: 'Site A', status: 'active' },
        { id: 'proj-2', name: 'Beta', siteAddress: 'Site B', status: 'completed' },
      ],
      isLoading: false,
      error: null,
      filter: 'all',
      loadProjects: mockLoadProjects,
      setFilter: mockSetFilter,
    });

    render(<ProjectsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.changeText(searchInput, 'Beta');

    await waitFor(() => {
      expect(screen.queryByText('Alpha')).toBeNull();
    });
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('toggles status filter chips', async () => {
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        { id: 'proj-1', name: 'Alpha', siteAddress: 'Site A', status: 'active' },
        { id: 'proj-2', name: 'Beta', siteAddress: 'Site B', status: 'completed' },
      ],
      isLoading: false,
      error: null,
      filter: 'all',
      loadProjects: mockLoadProjects,
      setFilter: mockSetFilter,
    });

    render(<ProjectsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Completed'));
    expect(mockSetFilter).toHaveBeenCalledWith('completed');
  });

  it('navigates to new project on FAB press', async () => {
    render(<ProjectsScreen />);

    await waitFor(() => {
      expect(screen.getByLabelText('Create new project')).toBeTruthy();
    });

    const fab = screen.getByLabelText('Create new project');
    fireEvent.press(fab);

    expect(router.push).toHaveBeenCalledWith('/projects/new');
  });

  it('navigates to project detail on card press', async () => {
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [{ id: 'proj-1', name: 'Alpha', siteAddress: 'Site A', status: 'active' }],
      isLoading: false,
      error: null,
      filter: 'all',
      loadProjects: mockLoadProjects,
      setFilter: mockSetFilter,
    });

    render(<ProjectsScreen />);

    await waitFor(() => {
      expect(screen.getByLabelText('Open project Alpha')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Open project Alpha'));
    expect(router.push).toHaveBeenCalledWith('/projects/proj-1');
  });

  it('shows error banner when error exists', async () => {
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [],
      isLoading: false,
      error: 'Network error',
      filter: 'all',
      loadProjects: mockLoadProjects,
      setFilter: mockSetFilter,
    });

    render(<ProjectsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });
});
