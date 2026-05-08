import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useProjectStore } from '@store/useProjectStore';
import ProjectsScreen from '@app/(tabs)/index';

jest.mock('@store/useProjectStore');

describe('Projects list screen', () => {
  const mockLoadProjects = jest.fn();
  const mockSetFilter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders projects and filter chips', () => {
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        {
          id: 'proj-1',
          name: 'Active Project',
          siteAddress: '123 Main St',
          status: 'active',
          priority: 0,
          createdAt: 1000,
          updatedAt: 2000,
          completedAt: null,
          createdBy: null,
          isDeleted: 0,
          deletedAt: null,
        },
        {
          id: 'proj-2',
          name: 'Archived Project',
          siteAddress: null,
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
      isLoading: false,
      error: null,
      filter: 'all',
      setFilter: mockSetFilter,
      loadProjects: mockLoadProjects,
    });

    render(<ProjectsScreen />);
    expect(screen.getByText('Active Project')).toBeTruthy();
    expect(screen.getByText('Archived Project')).toBeTruthy();
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('Archived')).toBeTruthy();
  });

  it('shows archived projects with lower opacity indicator via badge', () => {
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        {
          id: 'proj-2',
          name: 'Archived Project',
          siteAddress: null,
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
      isLoading: false,
      error: null,
      filter: 'all',
      setFilter: mockSetFilter,
      loadProjects: mockLoadProjects,
    });

    render(<ProjectsScreen />);
    expect(screen.getByText('Archived Project')).toBeTruthy();
    expect(screen.getByText('archived')).toBeTruthy();
  });

  it('calls setFilter when a filter chip is pressed', () => {
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [],
      isLoading: false,
      error: null,
      filter: 'all',
      setFilter: mockSetFilter,
      loadProjects: mockLoadProjects,
    });

    render(<ProjectsScreen />);
    fireEvent.press(screen.getByText('Archived'));
    expect(mockSetFilter).toHaveBeenCalledWith('archived');
  });
});
