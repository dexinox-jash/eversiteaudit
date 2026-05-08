import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import NewProjectScreen from '@app/projects/new';
import { useProjectStore } from '@store/useProjectStore';
import { templateRepository } from '@services/db/repositories';

jest.mock('@store/useProjectStore');
jest.mock('@services/db/repositories', () => ({
  ...jest.requireActual('@services/db/repositories'),
  templateRepository: {
    getByType: jest.fn(),
  },
}));

describe('NewProject screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders template selector with loaded templates', async () => {
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      createProject: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });

    (templateRepository.getByType as jest.Mock).mockResolvedValue([
      { id: 'tpl-1', name: 'Blank Project', content: '{"sections":[]}' },
      { id: 'tpl-2', name: 'Safety Inspection', content: '{"sections":["PPE"]}' },
    ]);

    render(<NewProjectScreen />);

    await waitFor(() => {
      expect(screen.getByText('Blank Project')).toBeTruthy();
    });

    expect(screen.getByText('Safety Inspection')).toBeTruthy();
    expect(screen.getByText('Choose Template')).toBeTruthy();
  });

  it('renders form fields', async () => {
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      createProject: jest.fn(),
      error: null,
      clearError: jest.fn(),
    });

    (templateRepository.getByType as jest.Mock).mockResolvedValue([
      { id: 'tpl-1', name: 'Blank Project', content: '{"sections":[]}' },
    ]);

    render(<NewProjectScreen />);

    await waitFor(() => {
      expect(screen.getByText('Blank Project')).toBeTruthy();
    });

    expect(screen.getByText(/Project Name/)).toBeTruthy();
    expect(screen.getByText(/Site Address/)).toBeTruthy();
    expect(screen.getByText(/Client Name/)).toBeTruthy();
    expect(screen.getByText(/Description/)).toBeTruthy();
    expect(screen.getByText('Create Project')).toBeTruthy();
  });
});
