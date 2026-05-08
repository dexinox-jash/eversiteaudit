import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Camera } from 'expo-camera';
import { usePreferenceStore } from '@store/usePreferenceStore';
import { useProjectStore } from '@store/useProjectStore';
import OnboardingScreen from '@app/onboarding';
import { createProjectFromTemplate } from '@services/template/templateService';

jest.mock('@store/usePreferenceStore');
jest.mock('@store/useProjectStore');
jest.mock('@services/template/templateService');
jest.mock('expo-camera');

jest.mock('@services/db/repositories', () => ({
  templateRepository: {
    getByType: jest.fn().mockResolvedValue([
      {
        id: 'tmpl-blank',
        name: 'Blank Project',
        description: 'Start with a clean slate',
        type: 'project_structure',
        content: '{"sections":[]}',
        isDefault: 1,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      },
      {
        id: 'tmpl-safety',
        name: 'Safety Inspection',
        description: 'OSHA safety checklist',
        type: 'project_structure',
        content: '{"sections":["Fall Protection","Electrical Safety","PPE"]}',
        isDefault: 0,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      },
    ]),
  },
}));

describe('Onboarding screen', () => {
  const mockSetHasCompletedOnboarding = jest.fn();
  const mockSetInspectorName = jest.fn();
  const mockSetInspectorCompany = jest.fn();
  const mockCreateProject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      setHasCompletedOnboarding: mockSetHasCompletedOnboarding,
      setInspectorName: mockSetInspectorName,
      setInspectorCompany: mockSetInspectorCompany,
    });

    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      createProject: mockCreateProject,
      loadProjects: jest.fn().mockResolvedValue(undefined),
    });

    mockSetHasCompletedOnboarding.mockResolvedValue(undefined);
    mockSetInspectorName.mockResolvedValue(undefined);
    mockSetInspectorCompany.mockResolvedValue(undefined);
    mockCreateProject.mockResolvedValue({ id: 'proj-1' });
    (createProjectFromTemplate as jest.Mock).mockResolvedValue({ id: 'proj-1' });
  });

  it('renders welcome screen on first page', () => {
    render(<OnboardingScreen />);
    expect(screen.getByText('Welcome to EverSiteAudit')).toBeTruthy();
    expect(screen.getByText('Privacy-First Design')).toBeTruthy();
    expect(screen.getByText('Capture with Confidence')).toBeTruthy();
  });

  it('navigates through pages when Next is pressed', () => {
    render(<OnboardingScreen />);

    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeTruthy();

    fireEvent.press(nextButton);

    // After pressing next once, we're still on onboarding (FlatList scrolls)
    // The button should still exist
    expect(screen.getByText('Next')).toBeTruthy();
  });

  it('shows profile setup after camera permission is granted', async () => {
    render(<OnboardingScreen />);

    const nextButton = screen.getByText('Next');
    // Press next to advance through pages (3 presses) + 1 for camera permission
    fireEvent.press(nextButton);
    fireEvent.press(nextButton);
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalled();
    });

    // Press Next again to move from camera permission to profile setup
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Set Up Your Profile')).toBeTruthy();
    });
  });

  it('shows template selection after profile setup', async () => {
    render(<OnboardingScreen />);

    const nextButton = screen.getByText('Next');
    fireEvent.press(nextButton);
    fireEvent.press(nextButton);
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalled();
    });

    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Set Up Your Profile')).toBeTruthy();
    });

    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Choose a Starting Template')).toBeTruthy();
    });
  });

  it('allows selecting a template', async () => {
    render(<OnboardingScreen />);

    const nextButton = screen.getByText('Next');
    fireEvent.press(nextButton);
    fireEvent.press(nextButton);
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalled();
    });

    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Set Up Your Profile')).toBeTruthy();
    });

    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Choose a Starting Template')).toBeTruthy();
    });

    const safetyTemplate = screen.getByText('Safety Inspection');
    fireEvent.press(safetyTemplate);

    // Template should be selected and Get Started button visible
    await waitFor(() => {
      expect(screen.getByText('Get Started')).toBeTruthy();
    });
  });

  it('creates project from selected template and finishes onboarding', async () => {
    render(<OnboardingScreen />);

    const nextButton = screen.getByText('Next');
    fireEvent.press(nextButton);
    fireEvent.press(nextButton);
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalled();
    });

    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Set Up Your Profile')).toBeTruthy();
    });

    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Choose a Starting Template')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Safety Inspection'));

    await waitFor(() => {
      expect(screen.getByText('Get Started')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(createProjectFromTemplate).toHaveBeenCalledWith(
        'tmpl-safety',
        expect.objectContaining({ name: 'My First Project' })
      );
      expect(mockSetHasCompletedOnboarding).toHaveBeenCalledWith(true);
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('creates blank project when blank template is selected', async () => {
    render(<OnboardingScreen />);

    const nextButton = screen.getByText('Next');
    fireEvent.press(nextButton);
    fireEvent.press(nextButton);
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalled();
    });

    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Set Up Your Profile')).toBeTruthy();
    });

    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Choose a Starting Template')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Blank Project'));

    await waitFor(() => {
      expect(screen.getByText('Get Started')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'My First Project' })
      );
      expect(createProjectFromTemplate).not.toHaveBeenCalled();
    });
  });

  it('saves profile info when provided', async () => {
    render(<OnboardingScreen />);

    const nextButton = screen.getByText('Next');
    fireEvent.press(nextButton);
    fireEvent.press(nextButton);
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalled();
    });

    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Set Up Your Profile')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByLabelText('Inspector name'), 'Jane Doe');
    fireEvent.changeText(screen.getByLabelText('Company name'), 'Doe Inspections');

    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Choose a Starting Template')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Blank Project'));
    fireEvent.press(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(mockSetInspectorName).toHaveBeenCalledWith('Jane Doe');
      expect(mockSetInspectorCompany).toHaveBeenCalledWith('Doe Inspections');
      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({ clientName: 'Doe Inspections' })
      );
    });
  });

  it('skips onboarding when Skip is pressed', async () => {
    render(<OnboardingScreen />);

    const skipButton = screen.getByText('Skip');
    fireEvent.press(skipButton);

    await waitFor(() => {
      expect(mockSetHasCompletedOnboarding).toHaveBeenCalledWith(true);
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });
});
