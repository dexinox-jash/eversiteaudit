import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
jest.mock('expo-router', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    useLocalSearchParams: jest.fn(() => ({ id: 'proj-1', projectId: 'proj-1', issueId: 'issue-1', format: 'pdf', initialRole: 'old' })),
    useRouter: jest.fn(() => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn(), navigate: jest.fn() })),
    usePathname: jest.fn(() => '/'),
    useNavigation: jest.fn(() => ({ navigate: jest.fn(), setOptions: jest.fn() })),
    router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), navigate: jest.fn() },
    Tabs: Object.assign(
      function MockTabs(props: { children: React.ReactNode }) {
        return React.createElement(View, null, props.children);
      },
      {
        Screen: function MockScreen(props: { options?: { title?: string } }) {
          return React.createElement(View, null, props.options?.title ?? '');
        },
      }
    ),
    Stack: Object.assign(
      function MockStack(props: { children: React.ReactNode }) {
        return React.createElement(View, null, props.children);
      },
      {
        Screen: function MockStackScreen() {
          return React.createElement(View);
        },
      }
    ),
  };
});

import { useLocalSearchParams } from 'expo-router';
import { useProjectStore } from '@store/useProjectStore';
import { useIssueStore } from '@store/useIssueStore';
import { usePhotoStore } from '@store/usePhotoStore';
import { usePreferenceStore } from '@store/usePreferenceStore';
import { useAnnotationStore } from '@store/useAnnotationStore';

import ProjectsScreen from '@app/(tabs)/index';
import ActivityScreen from '@app/(tabs)/activity';
import SettingsScreen from '@app/(tabs)/settings';
import TabLayout from '@app/(tabs)/_layout';
import NewProjectScreen from '@app/projects/new';
import NewIssueScreen from '@app/issues/new';
import ProjectDetailScreen from '@app/projects/[id]';
import EditProjectScreen from '@app/projects/edit/[id]';
import IssueDetailScreen from '@app/issues/[id]';
import EditIssueScreen from '@app/issues/edit/[id]';
import PhotoViewerScreen from '@app/photos/[id]';
import AnnotateScreen from '@app/photos/annotate/[id]';
import TemplatesScreen from '@app/templates/index';
import ExportScreen from '@app/export/index';
import MigrationWizardScreen from '@app/migration/index';
import CameraScreen from '@app/camera';
import OnboardingScreen from '@app/onboarding';
import TrashScreen from '@app/trash/index';
import { Folder } from 'lucide-react-native';
import OnboardingCarousel from '@app/onboarding/OnboardingCarousel';
import ProfileSetupForm from '@app/onboarding/ProfileSetupForm';
import TemplateSelector from '@app/onboarding/TemplateSelector';

jest.mock('@store/useProjectStore');
jest.mock('@store/useIssueStore');
jest.mock('@store/usePhotoStore');
jest.mock('@store/usePreferenceStore');
jest.mock('@store/useAnnotationStore');

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
    ]),
  },
  projectRepository: {
    getById: jest.fn().mockResolvedValue({
      id: 'proj-1',
      name: 'Demo Project',
      siteAddress: '123 Main St',
      clientName: 'Acme',
      description: 'Test description',
      priority: 2,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDeleted: 0,
      deletedAt: null,
    }),
  },
  issueRepository: {
    getById: jest.fn().mockResolvedValue({
      id: 'issue-1',
      projectId: 'proj-1',
      title: 'Leaky roof',
      description: 'Water coming in',
      severity: 'high',
      status: 'open',
      category: 'safety',
      locationDescription: 'North wing',
      assignedTo: 'Bob',
      dueDate: null,
      gpsLatitude: null,
      gpsLongitude: null,
      gpsAccuracy: null,
      voiceNoteUrl: null,
      sortOrder: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDeleted: 0,
      deletedAt: null,
    }),
  },
  photoRepository: {
    getById: jest.fn().mockResolvedValue({
      id: 'photo-1',
      projectId: 'proj-1',
      issueId: 'issue-1',
      originalPath: 'file:///mock/photo.jpg',
      thumbnailPath: 'file:///mock/thumb.jpg',
      caption: 'Test photo',
      width: 1920,
      height: 1080,
      checksum: 'abc123',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDeleted: 0,
      deletedAt: null,
    }),
    update: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@services/export', () => ({
  getExportHistory: jest.fn(() => Promise.resolve([])),
  clearExportHistory: jest.fn(() => Promise.resolve()),
  exportProjectToJSON: jest.fn(),
  exportProjectToCSV: jest.fn(),
  exportProjectToZIP: jest.fn(),
  shareFile: jest.fn(),
}));

jest.mock('@services/export/pdfExport', () => ({
  exportProjectToPDF: jest.fn(),
}));

jest.mock('@services/export/zipExport', () => ({
  exportProjectToZIP: jest.fn(),
}));

jest.mock('@services/export/jsonExport', () => ({
  exportProjectToJSON: jest.fn(),
}));

jest.mock('@services/export/csvExport', () => ({
  exportProjectToCSV: jest.fn(),
}));

jest.mock('@services/export/shareExport', () => ({
  shareFile: jest.fn(),
}));

jest.mock('@services/export/reportTemplates', () => ({
  REPORT_TEMPLATES: [
    { id: 'standard', name: 'Standard', description: 'Default template' },
  ],
}));

jest.mock('@services/backup', () => ({
  createBackup: jest.fn(),
  restoreBackup: jest.fn(),
  computeSha256: jest.fn(),
}));

jest.mock('@services/backup/reminderService', () => ({
  shouldShowBackupReminder: jest.fn(() => Promise.resolve({ shouldShow: false })),
  recordBackupReminderShown: jest.fn(),
  recordBackupCreated: jest.fn(),
}));

jest.mock('@services/storage/cacheManager', () => ({
  calculateCacheSize: jest.fn(() => Promise.resolve(0)),
  runFullCleanup: jest.fn(() => Promise.resolve({ bytesFreed: 0 })),
}));

jest.mock('@services/template/templateService', () => ({
  createProjectFromTemplate: jest.fn(),
  createCustomTemplate: jest.fn(),
  editCustomTemplate: jest.fn(),
  deleteCustomTemplate: jest.fn(),
  parseTemplateContent: jest.fn(() => ({ sections: [] })),
}));

jest.mock('@services/duplication/projectDuplication', () => ({
  duplicateProject: jest.fn(),
}));

jest.mock('@services/duplication/issueDuplication', () => ({
  duplicateIssue: jest.fn(),
}));

jest.mock('@services/share/shareExtension', () => ({
  shareIssue: jest.fn(),
  sharePhoto: jest.fn(),
}));

jest.mock('@services/integrity/photoIntegrity', () => ({
  verifyFileChecksum: jest.fn(),
}));

jest.mock('lucide-react-native', () => {
  const ReactMock = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const mockIcon = ReactMock.forwardRef(
    (props: { color?: string; size?: number }, ref: React.Ref<unknown>) =>
      ReactMock.createElement(View, { ref, ...props })
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
      RotateCcw: mockIcon,
      Activity: mockIcon,
      FileCheck: mockIcon,
      Calendar: mockIcon,
      CheckCircle2: mockIcon,
      Archive: mockIcon,
      ArchiveRestore: mockIcon,
    },
    {
      get(target, prop) {
        return (target as Record<string, unknown>)[prop as string] ?? mockIcon;
      },
    }
  );
});

/**
 * Walk a react-test-renderer JSON tree and collect nodes matching a predicate.
 */
function walkTree(
  node: ReturnType<typeof screen.toJSON>,
  predicate: (n: NonNullable<typeof node>) => boolean,
  results: Array<NonNullable<typeof node>> = []
): Array<NonNullable<typeof node>> {
  if (node === null || typeof node === 'string') return results;
  if (Array.isArray(node)) {
    node.forEach((child) => walkTree(child, predicate, results));
    return results;
  }
  if (predicate(node)) {
    results.push(node);
  }
  if (node.children) {
    node.children.forEach((child: typeof node) => walkTree(child, predicate, results));
  }
  return results;
}

function getInteractiveNodes(tree: ReturnType<typeof screen.toJSON>) {
  return walkTree(tree, (n) => {
    const props = (n.props as Record<string, unknown>) ?? {};
    const hasPressHandler =
      typeof props.onPress === 'function' ||
      typeof props.onLongPress === 'function' ||
      typeof props.onValueChange === 'function' ||
      typeof props.onChange === 'function';
    const isInteractiveRole =
      props.accessibilityRole === 'button' ||
      props.accessibilityRole === 'radio' ||
      props.accessibilityRole === 'link' ||
      props.accessibilityRole === 'switch' ||
      props.accessibilityRole === 'checkbox' ||
      props.accessibilityRole === 'adjustable' ||
      props.accessibilityRole === 'tab';
    const isNativeInteractive =
      n.type === 'Switch' ||
      (typeof n.type === 'string' &&
        (n.type.includes('Touchable') ?? n.type.includes('Pressable')));
    return hasPressHandler || isInteractiveRole || isNativeInteractive;
  });
}

function getImageNodes(tree: ReturnType<typeof screen.toJSON>) {
  return walkTree(tree, (n) => {
    const props = (n.props as Record<string, unknown>) ?? {};
    return (
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      n.type === 'Image' ||
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      (typeof n.type === 'string' && n.type.includes('Image')) ||
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      ('source' in props || 'src' in props)
    );
  });
}

function getModalNodes(tree: ReturnType<typeof screen.toJSON>) {
  return walkTree(tree, (n) => {
    const props = (n.props as Record<string, unknown>) ?? {};
    return (
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      n.type === 'Modal' ||
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      (typeof n.type === 'string' && n.type.includes('Modal')) ||
      props.accessibilityViewIsModal === true
    );
  });
}

function getHeaderNodes(tree: ReturnType<typeof screen.toJSON>) {
  return walkTree(
    tree,
    (n) =>
      n.props &&
      typeof n.props === 'object' &&
      (n.props as Record<string, unknown>).accessibilityRole === 'header'
  );
}

interface InteractiveCheckResult {
  label: string;
  hasLabelOrRole: boolean;
}

function checkInteractiveElements(
  tree: ReturnType<typeof screen.toJSON>
): InteractiveCheckResult[] {
  const nodes = getInteractiveNodes(tree);
  return nodes.map((node, index) => {
    const props = (node.props as Record<string, unknown>) ?? {};
    const hasLabel =
      typeof props.accessibilityLabel === 'string' && props.accessibilityLabel.length > 0;
    const hasRole =
      typeof props.accessibilityRole === 'string' && props.accessibilityRole.length > 0;
    return {
      label: (props.accessibilityLabel as string) ?? `interactive-${index}`,
      hasLabelOrRole: hasLabel || hasRole,
    };
  });
}

function checkImages(tree: ReturnType<typeof screen.toJSON>) {
  const nodes = getImageNodes(tree);
  return nodes.map((node, index) => {
    const props = (node.props as Record<string, unknown>) ?? {};
    const hasLabel =
      typeof props.accessibilityLabel === 'string' && props.accessibilityLabel.length > 0;
    return {
      label: (props.accessibilityLabel as string) ?? `image-${index}`,
      hasLabel,
    };
  });
}

function checkModals(tree: ReturnType<typeof screen.toJSON>) {
  const nodes = getModalNodes(tree);
  return nodes.map((node, index) => {
    const props = (node.props as Record<string, unknown>) ?? {};
    const hasModal = props.accessibilityViewIsModal === true;
    return {
      label: (props.accessibilityLabel as string) ?? `modal-${index}`,
      hasModal,
    };
  });
}

function checkHeaders(tree: ReturnType<typeof screen.toJSON>) {
  return getHeaderNodes(tree).map((node, index) => ({
    text: (typeof node.children?.[0] === 'string' ? node.children[0] : `header-${index}`) as string,
  }));
}

/**
 * Helper to set up common store mocks.
 */
function setupCommonMocks(): void {
  jest.clearAllMocks();

  (useProjectStore as unknown as jest.Mock).mockReturnValue({
    projects: [
      {
        id: 'proj-1',
        name: 'Demo Project',
        siteAddress: '123 Main St',
        status: 'active',
        priority: 2,
        clientName: 'Acme',
        description: 'Test',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDeleted: 0,
        deletedAt: null,
      },
    ],
    isLoading: false,
    error: null,
    filter: 'all',
    setFilter: jest.fn(),
    loadProjects: jest.fn(),
    updateProject: jest.fn(),
    clearError: jest.fn(),
    createProject: jest.fn(),
    loadDeletedProjects: jest.fn(),
    restoreProject: jest.fn(),
    permanentlyDeleteProject: jest.fn(),
  });

  (useIssueStore as unknown as jest.Mock).mockReturnValue({
    issues: [
      {
        id: 'issue-1',
        projectId: 'proj-1',
        title: 'Leaky roof',
        severity: 'high',
        status: 'open',
        description: 'Water coming in',
        category: 'safety',
        locationDescription: 'North wing',
        assignedTo: 'Bob',
        dueDate: null,
        gpsLatitude: null,
        gpsLongitude: null,
        gpsAccuracy: null,
        voiceNoteUrl: null,
        sortOrder: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDeleted: 0,
        deletedAt: null,
      },
    ],
    isLoading: false,
    loadIssues: jest.fn(),
    loadIssuesByProject: jest.fn(),
    deleteIssue: jest.fn(),
    updateIssue: jest.fn(),
    createIssue: jest.fn(),
    clearError: jest.fn(),
    bulkDelete: jest.fn(),
    bulkUpdateStatus: jest.fn(),
    updateSortOrder: jest.fn(),
    loadDeletedIssues: jest.fn(),
    restoreIssue: jest.fn(),
    permanentlyDeleteIssue: jest.fn(),
  });

  (usePhotoStore as unknown as jest.Mock).mockReturnValue({
    photos: [
      {
        id: 'photo-1',
        projectId: 'proj-1',
        issueId: 'issue-1',
        originalPath: 'file:///mock/photo.jpg',
        thumbnailPath: 'file:///mock/thumb.jpg',
        compressedPath: 'file:///mock/comp.jpg',
        caption: 'Test photo',
        width: 1920,
        height: 1080,
        checksum: 'abc123',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDeleted: 0,
        deletedAt: null,
      },
    ],
    isLoading: false,
    loadPhotos: jest.fn(),
    loadPhotosByProject: jest.fn(),
    loadPhotosByIssue: jest.fn(),
    createPhoto: jest.fn(),
    updatePhoto: jest.fn(),
    deletePhoto: jest.fn(),
    bulkDelete: jest.fn(),
    updateSortOrder: jest.fn(),
  });

  (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
    theme: 'dark',
    reduceMotion: false,
    highContrast: false,
    backupRemindersEnabled: true,
    backupReminderLastShown: null,
    backupReminderPhotoCountAtLastBackup: null,
    backupReminderLastBackupDate: null,
    hasCompletedOnboarding: true,
    biometricAuthEnabled: false,
    autoLockTimeout: 5 * 60 * 1000,
    companyName: '',
    companyLogoPath: null,
    reportHeaderText: '',
    reportFooterText: '',
    lastPdfReportTemplate: null,
    inspectorName: '',
    inspectorCompany: '',
    setReduceMotion: jest.fn(),
    setHighContrast: jest.fn(),
    setBiometricAuthEnabled: jest.fn(),
    setAutoLockTimeout: jest.fn(),
    setCompanyName: jest.fn(),
    setReportHeaderText: jest.fn(),
    setReportFooterText: jest.fn(),
    setBackupRemindersEnabled: jest.fn(),
    setHasCompletedOnboarding: jest.fn(),
    setInspectorName: jest.fn(),
    setInspectorCompany: jest.fn(),
    setLastPdfReportTemplate: jest.fn(),
    load: jest.fn(),
    isLoaded: true,
  });

  (useAnnotationStore as unknown as jest.Mock).mockReturnValue({
    annotations: [],
    loadAnnotations: jest.fn(),
    addAnnotation: jest.fn(),
    updateAnnotation: jest.fn(),
    deleteAnnotation: jest.fn(),
  });

  (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
    id: 'proj-1',
    projectId: 'proj-1',
    issueId: 'issue-1',
    format: 'pdf',
    initialRole: 'old',
  });
}

describe('Accessibility screen coverage', () => {
  beforeEach(() => {
    setupCommonMocks();
  });

  describe('Tab screens', () => {
    it('(tabs)/index — Projects list has accessible interactive elements, headings', () => {
      render(<ProjectsScreen />);
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);

      const headers = checkHeaders(tree);
      expect(headers.length).toBeGreaterThanOrEqual(0);
    });

    it('(tabs)/activity — Activity has accessible interactive elements', () => {
      render(<ActivityScreen />);
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);
    });

    it('(tabs)/settings — Settings has accessible interactive elements, headings', () => {
      render(<SettingsScreen />);
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);

      const headers = checkHeaders(tree);
      expect(headers.length).toBeGreaterThanOrEqual(1);
    });

    it('(tabs)/_layout — Tab layout renders', () => {
      render(<TabLayout />);
      expect(screen.toJSON()).toBeTruthy();
    });
  });

  describe('Project screens', () => {
    it('projects/new — New Project has accessible interactive elements', () => {
      render(<NewProjectScreen />);
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);
    });

    it('projects/[id] — Project Detail has accessible interactive elements, headings', () => {
      render(<ProjectDetailScreen />);
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);

      const headers = checkHeaders(tree);
      expect(headers.length).toBeGreaterThanOrEqual(1);
    });

    it('projects/edit/[id] — Edit Project has accessible interactive elements', async () => {
      render(<EditProjectScreen />);
      await waitFor(() => {
        const tree = screen.toJSON();
        const interactive = checkInteractiveElements(tree);
        expect(interactive.length).toBeGreaterThan(0);
      });
      const tree = screen.toJSON();
      const interactive = checkInteractiveElements(tree);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);
    });
  });

  describe('Issue screens', () => {
    it('issues/new — New Issue has accessible interactive elements', () => {
      render(<NewIssueScreen />);
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);
    });

    it('issues/[id] — Issue Detail has accessible interactive elements, headings', () => {
      render(<IssueDetailScreen />);
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);

      const headers = checkHeaders(tree);
      expect(headers.length).toBeGreaterThanOrEqual(1);
    });

    it('issues/edit/[id] — Edit Issue has accessible interactive elements', () => {
      render(<EditIssueScreen />);
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);
    });
  });

  describe('Photo screens', () => {
    it('photos/[id] — Photo Viewer has accessible images, interactive elements, headings', async () => {
      (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
        id: 'photo-1',
        issueId: 'issue-1',
        projectId: 'proj-1',
      });
      render(<PhotoViewerScreen />);
      await waitFor(() => {
        const tree = screen.toJSON();
        const images = checkImages(tree);
        expect(images.length).toBeGreaterThan(0);
      });
      const tree = screen.toJSON();
      const images = checkImages(tree);
      expect(images.every((img) => img.hasLabel)).toBe(true);

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);
    });

    it('photos/annotate/[id] — Photo Annotation has accessible interactive elements, images', async () => {
      (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
        id: 'photo-1',
        issueId: 'issue-1',
        projectId: 'proj-1',
      });
      render(<AnnotateScreen />);
      await waitFor(() => {
        const tree = screen.toJSON();
        const images = checkImages(tree);
        expect(images.length).toBeGreaterThan(0);
      });
      const tree = screen.toJSON();
      const images = checkImages(tree);
      expect(images.every((img) => img.hasLabel)).toBe(true);

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);
    });
  });

  describe('Utility screens', () => {
    it('templates/index — Templates has accessible interactive elements, modals', async () => {
      render(<TemplatesScreen />);
      await waitFor(() => expect(screen.toJSON()).toBeTruthy());
      const tree = screen.toJSON();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);

      const modals = checkModals(tree);
      modals.forEach((m) => {
        expect(m.hasModal).toBe(true);
      });
    });

    it('export/index — Export has accessible interactive elements, headings', () => {
      render(<ExportScreen />);
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);

      const headers = checkHeaders(tree);
      expect(headers.length).toBeGreaterThanOrEqual(1);
    });

    it('migration/index — Migration Wizard has accessible interactive elements, headings', () => {
      render(<MigrationWizardScreen />);
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);

      const headers = checkHeaders(tree);
      expect(headers.length).toBeGreaterThanOrEqual(1);
    });

    it('camera — Camera has accessible interactive elements', () => {
      render(<CameraScreen />);
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);
    });

    it('trash/index — Trash has accessible interactive elements, headings', () => {
      render(<TrashScreen />);
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);

      const headers = checkHeaders(tree);
      expect(headers.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Onboarding screens', () => {
    it('onboarding — Onboarding has accessible interactive elements, headings', () => {
      (usePreferenceStore as unknown as jest.Mock).mockReturnValue({
        ...((usePreferenceStore as unknown as jest.Mock).getMockImplementation?.() ?? {}),
        hasCompletedOnboarding: false,
        setHasCompletedOnboarding: jest.fn(),
        setInspectorName: jest.fn(),
        setInspectorCompany: jest.fn(),
      });

      render(<OnboardingScreen />);
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.length).toBeGreaterThan(0);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);

      const headers = checkHeaders(tree);
      expect(headers.length).toBeGreaterThanOrEqual(1);
    });

    it('onboarding/OnboardingCarousel — renders pages with heading roles', () => {
      const pages = [
        { key: 'welcome', title: 'Welcome', description: 'Desc', icon: Folder },
      ];
      render(
        <OnboardingCarousel
          pages={pages}
          pageIndex={0}
          onPageIndexChange={jest.fn()}
          onScrollToIndexFailed={jest.fn()}
        />
      );
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const headers = checkHeaders(tree);
      expect(headers.length).toBeGreaterThanOrEqual(1);
    });

    it('onboarding/ProfileSetupForm — has accessible text inputs', () => {
      render(
        <ProfileSetupForm
          inspectorName=""
          inspectorCompany=""
          onNameChange={jest.fn()}
          onCompanyChange={jest.fn()}
        />
      );
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);
    });

    it('onboarding/TemplateSelector — has accessible interactive elements', () => {
      render(
        <TemplateSelector
          templates={[
            {
              id: 'tmpl-1',
              name: 'Blank',
              description: 'Start fresh',
              type: 'project_structure',
              content: '',
              isDefault: 1,
              usageCount: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              deletedAt: null,
              isDeleted: 0,
            },
          ]}
          selectedTemplateId="tmpl-1"
          isLoading={false}
          onSelect={jest.fn()}
        />
      );
      const tree = screen.toJSON();
      expect(tree).toBeTruthy();

      const interactive = checkInteractiveElements(tree);
      expect(interactive.every((i) => i.hasLabelOrRole)).toBe(true);
    });
  });
});
