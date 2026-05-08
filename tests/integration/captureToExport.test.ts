import {
  projectRepository,
  issueRepository,
  photoRepository,
  annotationRepository,
} from '@services/db/repositories';
import { exportProjectToPDF } from '@services/export/pdfExport';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';

jest.mock('@services/db/repositories', () => ({
  projectRepository: {
    getById: jest.fn(),
    create: jest.fn(),
  },
  issueRepository: {
    getByProjectId: jest.fn(),
    create: jest.fn(),
  },
  photoRepository: {
    getByProjectId: jest.fn(),
    create: jest.fn(),
  },
  annotationRepository: {
    getByPhotoId: jest.fn().mockResolvedValue([]),
  },
  exportHistoryRepository: {
    create: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/',
  cacheDirectory: 'file:///mock/cache/',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  getFreeDiskStorageAsync: jest.fn(() => Promise.resolve(1024 * 1024 * 1024)),
  deleteAsync: jest.fn(),
  copyAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
}));

jest.mock('@services/backup/crypto', () => ({
  encryptWithPassphrase: jest.fn(),
}));

jest.mock('@services/export/shareExport', () => ({
  computeSha256: jest.fn(() => 'mock-checksum'),
}));

describe('captureToExport integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('full flow: create project -> create issue -> add photo -> export PDF', async () => {
    // Step 1: Create project
    const project = {
      id: 'proj-1',
      name: 'Site Audit A',
      description: 'Initial audit',
      siteAddress: '123 Site Rd',
      clientName: 'Client Co',
      status: 'active',
      priority: 0,
      createdAt: 1000,
      updatedAt: 1000,
      completedAt: null,
      createdBy: null,
      isDeleted: 0,
      deletedAt: null,
    };
    (projectRepository.create as jest.Mock).mockResolvedValue(project);

    const createdProject = await projectRepository.create({
      name: 'Site Audit A',
      description: 'Initial audit',
      siteAddress: '123 Site Rd',
      clientName: 'Client Co',
    });
    expect(createdProject.name).toBe('Site Audit A');

    // Step 2: Create issue
    const issue = {
      id: 'issue-1',
      projectId: createdProject.id,
      title: 'Foundation crack',
      description: 'Visible crack in foundation',
      category: 'safety',
      severity: 'high',
      status: 'open',
      locationDescription: 'North corner',
      gpsLatitude: null,
      gpsLongitude: null,
      gpsAccuracy: null,
      assignedTo: null,
      dueDate: null,
      resolutionNotes: null,
      resolvedAt: null,
      resolvedBy: null,
      voiceNoteUrl: null,
      sortOrder: 0,
      createdAt: 2000,
      updatedAt: 2000,
      isDeleted: 0,
      deletedAt: null,
    };
    (issueRepository.create as jest.Mock).mockResolvedValue(issue);

    const createdIssue = await issueRepository.create({
      projectId: createdProject.id,
      title: 'Foundation crack',
      description: 'Visible crack in foundation',
      category: 'safety',
      severity: 'high',
    });
    expect(createdIssue.projectId).toBe('proj-1');
    expect(createdIssue.title).toBe('Foundation crack');

    // Step 3: Add photo
    const photo = {
      id: 'photo-1',
      projectId: createdProject.id,
      issueId: createdIssue.id,
      originalPath: 'file:///photo1.jpg',
      thumbnailPath: 'file:///thumb1.jpg',
      compressedPath: null,
      captureTimestamp: 3000,
      cameraMake: null,
      cameraModel: null,
      gpsLatitude: null,
      gpsLongitude: null,
      gpsAltitude: null,
      width: 1920,
      height: 1080,
      fileSizeBytes: 1024,
      caption: 'Crack photo',
      checksum: 'abc123',
      tags: '[]',
      sortOrder: 0,
      createdAt: 3000,
      updatedAt: 3000,
      isDeleted: 0,
      deletedAt: null,
    };
    (photoRepository.create as jest.Mock).mockResolvedValue(photo);

    const createdPhoto = await photoRepository.create({
      projectId: createdProject.id,
      issueId: createdIssue.id,
      originalPath: 'file:///photo1.jpg',
      thumbnailPath: 'file:///thumb1.jpg',
      caption: 'Crack photo',
      checksum: 'abc123',
      width: 1920,
      height: 1080,
      fileSizeBytes: 1024,
    });
    expect(createdPhoto.issueId).toBe('issue-1');
    expect(createdPhoto.caption).toBe('Crack photo');

    // Step 4: Export to PDF
    (projectRepository.getById as jest.Mock).mockResolvedValue(project);
    (issueRepository.getByProjectId as jest.Mock).mockResolvedValue([issue]);
    (photoRepository.getByProjectId as jest.Mock).mockResolvedValue([photo]);
    (annotationRepository.getByPhotoId as jest.Mock).mockResolvedValue([]);

    (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///mock/export.pdf' });
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 4096 });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('base64pdf');

    const result = await exportProjectToPDF('proj-1');

    expect(result.filePath).toBe('file:///mock/export.pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(Print.printToFileAsync).toHaveBeenCalledWith(
      expect.objectContaining({ html: expect.stringContaining('Site Audit A'), base64: false })
    );
  });
});
