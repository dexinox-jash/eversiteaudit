import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useProjectStore } from '@store/useProjectStore';
import { useIssueStore } from '@store/useIssueStore';
import { usePhotoStore } from '@store/usePhotoStore';
import { usePreferenceStore } from '@store/usePreferenceStore';
import ProjectsScreen from '@app/(tabs)/index';
import ActivityScreen from '@app/(tabs)/activity';
import SettingsScreen from '@app/(tabs)/settings';
import CameraScreen from '@app/camera';

jest.mock('@store/useProjectStore');
jest.mock('@store/useIssueStore');
jest.mock('@store/usePhotoStore');
jest.mock('@store/usePreferenceStore');

jest.mock('@services/export/exportHistory', () => ({
  __esModule: true,
  getExportHistory: jest.fn(async () => []),
  clearExportHistory: jest.fn(),
  recordExport: jest.fn(),
}));

jest.mock('@services/storage/cacheManager', () => ({
  __esModule: true,
  calculateCacheSize: jest.fn(async () => 0),
  runFullCleanup: jest.fn(),
}));

jest.mock('@services/export', () => ({
  getExportHistory: jest.fn(() => Promise.resolve([])),
  clearExportHistory: jest.fn(() => Promise.resolve()),
  exportProjectToJSON: jest.fn(),
  exportProjectToCSV: jest.fn(),
  exportProjectToZIP: jest.fn(),
  shareFile: jest.fn(),
}));

jest.mock('@services/storage/cacheManager', () => ({
  calculateCacheSize: jest.fn(() => Promise.resolve(0)),
  runFullCleanup: jest.fn(() => Promise.resolve({ bytesFreed: 0 })),
}));

jest.mock('lucide-react-native', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const mockIcon = React.forwardRef(
    (props: { color?: string; size?: number }, ref: React.Ref<unknown>) =>
      React.createElement(View, { ref, ...props })
  );
  mockIcon.displayName = 'MockIcon';
  return new Proxy(
    {
      __esModule: true,
      Folder: mockIcon,
      Plus: mockIcon,
      Search: mockIcon,
      AlertTriangle: mockIcon,
      ListFilter: mockIcon,
      X: mockIcon,
      Check: mockIcon,
      Trash2: mockIcon,
      Camera: mockIcon,
      ImageIcon: mockIcon,
      SwitchCamera: mockIcon,
      Grid3x3: mockIcon,
      Zap: mockIcon,
      ZapOff: mockIcon,
      Share2: mockIcon,
      Database: mockIcon,
      Upload: mockIcon,
      Download: mockIcon,
      Bell: mockIcon,
      Lock: mockIcon,
      Accessibility: mockIcon,
      ChevronRight: mockIcon,
      CheckCircle: mockIcon,
      RefreshCw: mockIcon,
      AlertCircle: mockIcon,
      ClipboardList: mockIcon,
      FileArchive: mockIcon,
      ArrowLeft: mockIcon,
      Timer: mockIcon,
      Globe: mockIcon,
      HardDrive: mockIcon,
      Clock: mockIcon,
      Moon: mockIcon,
      Sun: mockIcon,
      Smartphone: mockIcon,
      FileJson: mockIcon,
      FileSpreadsheet: mockIcon,
      FileText: mockIcon,
      Shield: mockIcon,
      Package: mockIcon,
      FileCode: mockIcon,
      Table: mockIcon,
      ChevronLeft: mockIcon,
      ChevronUp: mockIcon,
      ChevronDown: mockIcon,
      Pencil: mockIcon,
      MapPin: mockIcon,
      Mic: mockIcon,
      Square: mockIcon,
      GripVertical: mockIcon,
      Info: mockIcon,
      Tag: mockIcon,
      ShieldCheck: mockIcon,
      Play: mockIcon,
      Pause: mockIcon,
      ArrowRight: mockIcon,
      Circle: mockIcon,
      Type: mockIcon,
      Undo2: mockIcon,
      Redo2: mockIcon,
      Save: mockIcon,
    },
    {
      get(target, prop) {
        return (target as Record<string, unknown>)[prop as string] ?? mockIcon;
      },
    }
  );
});

describe('Accessibility screen labels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Project list screen has accessible buttons for create and search', () => {
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [{ id: '1', name: 'Demo Project', siteAddress: '123 Main St', status: 'active' }],
      isLoading: false,
      loadProjects: jest.fn(),
      filter: 'all',
      setFilter: jest.fn(),
    });

    render(<ProjectsScreen />);

    expect(screen.getByLabelText('Search projects')).toBeTruthy();
    expect(screen.getByLabelText('Create new project')).toBeTruthy();
    expect(screen.getByLabelText('Open project Demo Project')).toBeTruthy();
  });

  it('Activity screen has accessible list items', () => {
    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        {
          id: '1',
          name: 'Demo Project',
          siteAddress: '123 Main St',
          status: 'active',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      loadProjects: jest.fn(),
    });
    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [
        {
          id: 'i1',
          title: 'Leaky roof',
          severity: 'high',
          status: 'open',
          projectId: '1',
          description: null,
          category: null,
          locationDescription: null,
          assignedTo: null,
          dueDate: null,
          gpsLatitude: null,
          gpsLongitude: null,
          gpsAccuracy: null,
          voiceNoteUrl: null,
          sortOrder: 0,
          createdAt: 2,
          updatedAt: 2,
          isDeleted: 0,
          deletedAt: null,
        },
      ],
      loadIssues: jest.fn(),
    });
    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotos: jest.fn(),
    });

    render(<ActivityScreen />);

    expect(screen.getByLabelText('project: Demo Project')).toBeTruthy();
    expect(screen.getByLabelText('issue: Leaky roof')).toBeTruthy();
  });

  it('Settings screen toggles have labels', async () => {
    (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
      reduceMotion: false,
      highContrast: false,
      biometricAuthEnabled: false,
      backupRemindersEnabled: true,
      companyName: null,
      reportHeaderText: null,
      reportFooterText: null,
      setReduceMotion: jest.fn(),
      setHighContrast: jest.fn(),
      setBiometricAuthEnabled: jest.fn(),
      setBackupRemindersEnabled: jest.fn(),
      setCompanyName: jest.fn(),
      setReportHeaderText: jest.fn(),
      setReportFooterText: jest.fn(),
    });

    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [],
      loadProjects: jest.fn(),
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      issues: [],
      loadIssues: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      loadPhotos: jest.fn(),
    });

    render(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByLabelText('Reduce Motion')).toBeTruthy();
      expect(screen.getByLabelText('High Contrast')).toBeTruthy();
      expect(screen.getByLabelText('Biometric Unlock')).toBeTruthy();
      expect(screen.getByLabelText('Backup Reminders')).toBeTruthy();
    });
  });

  it('Camera screen controls have labels', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: undefined,
      issueId: undefined,
    });

    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [{ id: 'proj-1', name: 'Test Project' }],
      loadProjects: jest.fn(),
    });

    (usePhotoStore as unknown as jest.Mock).mockReturnValue({
      photos: [],
      createPhoto: jest.fn(),
      updatePhoto: jest.fn(),
    });

    (useIssueStore as unknown as jest.Mock).mockReturnValue({
      createIssue: jest.fn(),
      updateIssue: jest.fn(),
    });

    render(<CameraScreen />);

    expect(screen.getByLabelText('Close camera')).toBeTruthy();
    expect(screen.getByLabelText('Take photo')).toBeTruthy();
    expect(screen.getByLabelText('Switch camera')).toBeTruthy();
  });
});
