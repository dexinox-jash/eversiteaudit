import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import ImportScreen from '@app/import/index';
import {
  importFromJSON,
  parseImportPreview,
} from '@services/import/projectImport';

jest.mock('@services/import/projectImport');
jest.mock('expo-document-picker');
jest.mock('@store/useProjectStore', () => ({
  useProjectStore: jest.fn(() => ({
    loadProjects: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('ImportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial state', () => {
    render(<ImportScreen />);
    expect(screen.getByText('Import Project')).toBeTruthy();
    expect(screen.getByLabelText('Select import file')).toBeTruthy();
    expect(screen.getByLabelText('Cancel import')).toBeTruthy();
  });

  it('shows preview after selecting JSON file', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///mock/project.json', name: 'project.json' }],
    });
    (parseImportPreview as jest.Mock).mockResolvedValue({
      projectName: 'Test Project',
      issueCount: 2,
      photoCount: 3,
    });

    render(<ImportScreen />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Select import file'));
    });

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeTruthy();
      expect(screen.getByText('2 issues • 3 photos')).toBeTruthy();
    });

    expect(screen.getByLabelText('Import project')).toBeTruthy();
  });

  it('shows success after importing JSON', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///mock/project.json', name: 'project.json' }],
    });
    (parseImportPreview as jest.Mock).mockResolvedValue({
      projectName: 'Test Project',
      issueCount: 1,
      photoCount: 0,
    });
    (importFromJSON as jest.Mock).mockResolvedValue({
      project: { id: 'proj-1', name: 'Test Project' },
      issuesCreated: 1,
      photosCreated: 0,
    });

    render(<ImportScreen />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Select import file'));
    });

    await waitFor(() => expect(screen.getByLabelText('Import project')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Import project'));
    });

    await waitFor(() => {
      expect(screen.getByText('Import Complete')).toBeTruthy();
    });
  });

  it('shows error when import fails', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///mock/project.json', name: 'project.json' }],
    });
    (parseImportPreview as jest.Mock).mockResolvedValue({
      projectName: 'Bad Project',
      issueCount: 0,
      photoCount: 0,
    });
    (importFromJSON as jest.Mock).mockRejectedValue(new Error('Corrupted data'));

    render(<ImportScreen />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Select import file'));
    });

    await waitFor(() => expect(screen.getByLabelText('Import project')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Import project'));
    });

    await waitFor(() => {
      expect(screen.getByText('Import Failed')).toBeTruthy();
      expect(screen.getByText('Corrupted data')).toBeTruthy();
    });
  });

  it('navigates back when Done is pressed', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///mock/project.json', name: 'project.json' }],
    });
    (parseImportPreview as jest.Mock).mockResolvedValue({
      projectName: 'Test Project',
      issueCount: 1,
      photoCount: 0,
    });
    (importFromJSON as jest.Mock).mockResolvedValue({
      project: { id: 'proj-1', name: 'Test Project' },
      issuesCreated: 1,
      photosCreated: 0,
    });

    render(<ImportScreen />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Select import file'));
    });

    await waitFor(() => expect(screen.getByLabelText('Import project')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Import project'));
    });

    await waitFor(() => expect(screen.getByLabelText('Done')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Done'));
    expect(router.back).toHaveBeenCalled();
  });

  it('allows retry after error', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///mock/project.json', name: 'project.json' }],
    });
    (parseImportPreview as jest.Mock).mockResolvedValue({
      projectName: 'Bad Project',
      issueCount: 0,
      photoCount: 0,
    });
    (importFromJSON as jest.Mock).mockRejectedValue(new Error('Corrupted data'));

    render(<ImportScreen />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Select import file'));
    });

    await waitFor(() => expect(screen.getByLabelText('Import project')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Import project'));
    });

    await waitFor(() => expect(screen.getByText('Import Failed')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Try import again'));
    expect(screen.getByLabelText('Select import file')).toBeTruthy();
  });
});
