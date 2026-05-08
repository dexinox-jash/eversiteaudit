import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useProjectStore } from '@store/useProjectStore';
import EditProjectScreen from '@app/projects/edit/[id]';

jest.mock('@store/useProjectStore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

describe('EditProject screen', () => {
  const mockUpdateProject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with project data pre-filled', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'proj-1' });

    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        {
          id: 'proj-1',
          name: 'Test Project',
          description: 'A test description',
          siteAddress: '123 Main St',
          clientName: 'Acme Corp',
          status: 'active',
          priority: 2,
          createdAt: 1000,
          updatedAt: 2000,
          completedAt: null,
          createdBy: null,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      updateProject: mockUpdateProject,
      error: null,
      clearError: jest.fn(),
    });

    render(<EditProjectScreen />);

    expect(screen.getByText('Edit Project')).toBeTruthy();
    expect(screen.getByDisplayValue('Test Project')).toBeTruthy();
    expect(screen.getByDisplayValue('123 Main St')).toBeTruthy();
    expect(screen.getByDisplayValue('Acme Corp')).toBeTruthy();
    expect(screen.getByDisplayValue('A test description')).toBeTruthy();
  });

  it('shows not found when project does not exist', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({ id: 'missing' });

    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [],
      updateProject: mockUpdateProject,
      error: null,
      clearError: jest.fn(),
    });

    render(<EditProjectScreen />);

    expect(screen.getByText('Project not found')).toBeTruthy();
  });

  it('shows inline error when name is empty on submit', async () => {
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
      error: null,
      clearError: jest.fn(),
    });

    render(<EditProjectScreen />);

    const nameInput = screen.getByDisplayValue('Test Project');
    fireEvent.changeText(nameInput, '');

    const saveButton = screen.getByText('Save Changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Project name is required')).toBeTruthy();
    });

    expect(mockUpdateProject).not.toHaveBeenCalled();
  });

  it('calls updateProject with correct payload on save', async () => {
    mockUpdateProject.mockResolvedValue({
      id: 'proj-1',
      name: 'Updated Project',
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
      error: null,
      clearError: jest.fn(),
    });

    render(<EditProjectScreen />);

    const nameInput = screen.getByDisplayValue('Test Project');
    fireEvent.changeText(nameInput, 'Updated Project');

    const saveButton = screen.getByText('Save Changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith('proj-1', {
        name: 'Updated Project',
        siteAddress: null,
        clientName: null,
        description: null,
        priority: 0,
      });
    });
  });

  it('allows changing priority', () => {
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
      error: null,
      clearError: jest.fn(),
    });

    render(<EditProjectScreen />);

    expect(screen.getByLabelText('Select Low priority')).toBeTruthy();
    expect(screen.getByLabelText('Select Medium priority')).toBeTruthy();
    expect(screen.getByLabelText('Select High priority')).toBeTruthy();
    expect(screen.getByLabelText('Select Critical priority')).toBeTruthy();
  });
});
