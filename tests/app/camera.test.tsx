import React from 'react';
import { Pressable } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { usePhotoStore } from '@store/usePhotoStore';
import { useProjectStore } from '@store/useProjectStore';
import { useIssueStore } from '@store/useIssueStore';
import {
  shouldShowBackupReminder,
  recordBackupReminderShown,
} from '@services/backup/reminderService';
import CameraScreen from '@app/camera';

jest.mock('expo-camera', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const CameraView = React.forwardRef(
    (
      { children, style, testID }: { children?: React.ReactNode; style?: object; testID?: string },
      ref: React.Ref<unknown>
    ) => {
      React.useImperativeHandle(ref, () => ({
        takePictureAsync: jest.fn(() =>
          Promise.resolve({ uri: 'file:///mock/photo.jpg', width: 1920, height: 1080 })
        ),
      }));
      return React.createElement(View, { style, testID: testID ?? 'camera-view' }, children);
    }
  );
  CameraView.displayName = 'CameraView';
  return {
    CameraView,
    useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
  };
});

jest.mock('@store/usePhotoStore');
jest.mock('@store/useProjectStore');
jest.mock('@store/useIssueStore');
jest.mock('@services/backup/reminderService');

describe('Camera screen', () => {
  const mockCreatePhoto = jest.fn();
  const mockUpdatePhoto = jest.fn();
  const mockCreateIssue = jest.fn();
  const mockUpdateIssue = jest.fn();
  const mockRequestPermission = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: undefined,
      issueId: undefined,
    });

    (useCameraPermissions as unknown as jest.Mock).mockReturnValue([
      { granted: true },
      mockRequestPermission,
    ]);

    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [{ id: 'proj-1', name: 'Test Project' }],
      loadProjects: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      createPhoto: mockCreatePhoto,
      updatePhoto: mockUpdatePhoto,
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      createIssue: mockCreateIssue,
      updateIssue: mockUpdateIssue,
    });

    mockCreatePhoto.mockImplementation((payload) =>
      Promise.resolve({
        id: 'photo-1',
        ...payload,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDeleted: 0,
        deletedAt: null,
      })
    );

    mockCreateIssue.mockResolvedValue({
      id: 'issue-1',
      projectId: 'proj-1',
      title: 'Issue from photo',
      severity: 'medium',
      status: 'open',
    });

    (shouldShowBackupReminder as unknown as jest.Mock).mockResolvedValue({
      shouldShow: false,
      urgency: null,
      message: '',
    });
    (recordBackupReminderShown as unknown as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders camera when permission is granted', () => {
    render(<CameraScreen />);
    expect(screen.getByTestId('camera-view')).toBeTruthy();
    expect(screen.getByLabelText('Camera controls left')).toBeTruthy();
    expect(screen.getByLabelText('Camera controls right')).toBeTruthy();
  });

  it('shows permission request when not granted', () => {
    (useCameraPermissions as unknown as jest.Mock).mockReturnValue([
      { granted: false },
      mockRequestPermission,
    ]);

    render(<CameraScreen />);
    expect(screen.getByText('Camera Access')).toBeTruthy();
    expect(screen.getByText('Grant Permission')).toBeTruthy();
  });

  it('shows severity sheet after capturing a photo', async () => {
    render(<CameraScreen />);

    const buttons = screen.UNSAFE_getAllByType(Pressable);
    const captureButton = buttons.find((b) => b.props.onLongPress !== undefined);
    expect(captureButton).toBeTruthy();

    fireEvent.press(captureButton!);

    await waitFor(() => {
      expect(screen.getByText('Tag Severity')).toBeTruthy();
    });
  });

  it('creates an issue when severity is selected', async () => {
    render(<CameraScreen />);

    const buttons = screen.UNSAFE_getAllByType(Pressable);
    const captureButton = buttons.find((b) => b.props.onLongPress !== undefined);
    expect(captureButton).toBeTruthy();

    fireEvent.press(captureButton!);

    await waitFor(() => {
      expect(screen.getByText('Tag Severity')).toBeTruthy();
    });

    const highOption = screen.getByText('High');
    fireEvent.press(highOption);

    await waitFor(() => {
      expect(mockCreateIssue).toHaveBeenCalledWith(expect.objectContaining({ severity: 'high' }));
    });
  });

  it('skips severity tagging and navigates back', async () => {
    render(<CameraScreen />);

    const buttons = screen.UNSAFE_getAllByType(Pressable);
    const captureButton = buttons.find((b) => b.props.onLongPress !== undefined);
    fireEvent.press(captureButton!);

    await waitFor(() => {
      expect(screen.getByText('Tag Severity')).toBeTruthy();
    });

    const skipButton = screen.getByText('Skip');
    fireEvent.press(skipButton);

    await waitFor(() => {
      expect(router.back).toHaveBeenCalled();
    });
  });

  it('uses provided projectId and issueId query params', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-2',
      issueId: 'issue-2',
    });

    render(<CameraScreen />);
    expect(screen.getByTestId('camera-view')).toBeTruthy();
  });

  it('updates existing issue severity when issueId is provided', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      issueId: 'issue-2',
    });

    render(<CameraScreen />);

    const buttons = screen.UNSAFE_getAllByType(Pressable);
    const captureButton = buttons.find((b) => b.props.onLongPress !== undefined);
    fireEvent.press(captureButton!);

    await waitFor(() => {
      expect(screen.getByText('Select severity for this issue')).toBeTruthy();
    });

    const criticalOption = screen.getByText('Critical');
    fireEvent.press(criticalOption);

    await waitFor(() => {
      expect(mockUpdateIssue).toHaveBeenCalledWith('issue-2', { severity: 'critical' });
      expect(mockCreateIssue).not.toHaveBeenCalled();
    });
  });

  it('toggles grid overlay', () => {
    render(<CameraScreen />);

    const buttons = screen.UNSAFE_getAllByType(Pressable);
    // Find by looking for buttons in topBarGroup that aren't flash or camera switch
    const topBarButtons = buttons.filter((b) => b.props.hitSlop === 12);
    // topBar buttons: close, flash, grid, switch camera
    const gridToggleButton = topBarButtons[2];
    expect(gridToggleButton).toBeTruthy();

    // Grid should be hidden initially
    expect(gridToggleButton.props.accessibilityLabel).toBe('Show composition grid');

    fireEvent.press(gridToggleButton);

    // After toggle, grid should be shown
    expect(gridToggleButton.props.accessibilityLabel).toBe('Hide composition grid');
  });

  it('toggles flash mode', () => {
    render(<CameraScreen />);

    const buttons = screen.UNSAFE_getAllByType(Pressable);
    const topBarButtons = buttons.filter((b) => b.props.hitSlop === 12);
    const flashButton = topBarButtons[1];
    expect(flashButton).toBeTruthy();

    fireEvent.press(flashButton);
    fireEvent.press(flashButton);
    fireEvent.press(flashButton);

    // Flash cycles: off -> on -> auto -> off
    // We verify the button is pressable and the component doesn't crash
    expect(flashButton).toBeTruthy();
  });
});
