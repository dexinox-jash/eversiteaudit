import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { exportProjectToPDF } from '@services/export/pdfExport';
import { projectRepository } from '@services/db/repositories/ProjectRepository';
import { issueRepository } from '@services/db/repositories/IssueRepository';
import { photoRepository } from '@services/db/repositories/PhotoRepository';
import { annotationRepository } from '@services/db/repositories/AnnotationRepository';
import { encryptWithPassphrase } from '@services/backup/crypto';
jest.mock('@services/db/repositories/ProjectRepository');
jest.mock('@services/db/repositories/IssueRepository');
jest.mock('@services/db/repositories/PhotoRepository');
jest.mock('@services/db/repositories/AnnotationRepository');
jest.mock('@services/backup/crypto');
jest.mock('@services/db/repositories/ExportHistoryRepository', () => ({
  ExportHistoryRepository: jest.fn(),
  exportHistoryRepository: {
    create: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('exportProjectToPDF', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates HTML containing the project name and issue titles', async () => {
    const projectId = 'proj-123';
    const project = {
      id: projectId,
      name: 'Test Project',
      description: 'A test project',
      siteAddress: '123 Main St',
      clientName: 'Acme Corp',
      status: 'active' as const,
      priority: 1 as const,
      createdAt: 1000,
      updatedAt: 2000,
      completedAt: null,
      createdBy: null,
      isDeleted: 0,
      deletedAt: null,
    };
    const issues = [
      {
        id: 'issue-1',
        projectId,
        title: 'Issue One',
        description: 'Description one',
        category: 'safety' as const,
        severity: 'high' as const,
        status: 'open' as const,
        locationDescription: null,
        gpsLatitude: null,
        gpsLongitude: null,
        gpsAccuracy: null,
        assignedTo: null,
        dueDate: null,
        resolutionNotes: null,
        resolvedAt: null,
        resolvedBy: null,
        createdAt: 1000,
        updatedAt: 2000,
        isDeleted: 0,
        deletedAt: null,
      },
    ];
    const photos = [
      {
        id: 'photo-1',
        projectId,
        issueId: null,
        originalPath: 'file:///photo1.jpg',
        thumbnailPath: 'file:///photo1_thumb.jpg',
        compressedPath: null,
        captureTimestamp: null,
        cameraMake: null,
        cameraModel: null,
        gpsLatitude: null,
        gpsLongitude: null,
        gpsAltitude: null,
        width: null,
        height: null,
        fileSizeBytes: null,
        caption: null,
        tags: '[]',
        createdAt: 1000,
        updatedAt: 2000,
        isDeleted: 0,
        deletedAt: null,
      },
    ];

    (projectRepository.getById as jest.Mock).mockResolvedValue(project);
    (issueRepository.getByProjectId as jest.Mock).mockResolvedValue(issues);
    (photoRepository.getByProjectId as jest.Mock).mockResolvedValue(photos);
    (annotationRepository.getByPhotoId as jest.Mock).mockResolvedValue([]);

    const printToFileAsyncSpy = jest
      .spyOn(Print, 'printToFileAsync')
      .mockResolvedValue({
        uri: 'file:///mock/test.pdf',
        numberOfPages: 1,
      } as Print.FilePrintResult);
    jest.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(1024 * 1024 * 1024);
    jest.spyOn(FileSystem, 'getInfoAsync').mockResolvedValue({
      exists: true,
      size: 1234,
      uri: 'file:///mock/test.pdf',
      isDirectory: false,
      modificationTime: 1,
    } as FileSystem.FileInfo);

    const result = await exportProjectToPDF(projectId);

    expect(projectRepository.getById).toHaveBeenCalledWith(projectId);
    expect(issueRepository.getByProjectId).toHaveBeenCalledWith(projectId);
    expect(photoRepository.getByProjectId).toHaveBeenCalledWith(projectId);

    expect(printToFileAsyncSpy).toHaveBeenCalledTimes(1);
    const options = printToFileAsyncSpy.mock.calls[0]![0] as { html: string };
    expect(options.html).toContain('Test Project');
    expect(options.html).toContain('Issue One');

    expect(result.mimeType).toBe('application/pdf');
    expect(result.filePath).toBe('file:///mock/test.pdf');
    const {
      exportHistoryRepository,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require('@services/db/repositories/ExportHistoryRepository');
    expect(exportHistoryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: projectId, exportType: 'pdf', success: true })
    );
  });

  it('throws when project is not found', async () => {
    const projectId = 'missing-proj';
    (projectRepository.getById as jest.Mock).mockResolvedValue(null);

    await expect(exportProjectToPDF(projectId)).rejects.toThrow(`Project not found: ${projectId}`);
    expect(projectRepository.getById).toHaveBeenCalledWith(projectId);
  });

  it('creates encrypted PDF when password is provided', async () => {
    const projectId = 'proj-123';
    const project = {
      id: projectId,
      name: 'Test Project',
      description: 'A test project',
      siteAddress: '123 Main St',
      clientName: 'Acme Corp',
      status: 'active' as const,
      priority: 1 as const,
      createdAt: 1000,
      updatedAt: 2000,
      completedAt: null,
      createdBy: null,
      isDeleted: 0,
      deletedAt: null,
    };

    (projectRepository.getById as jest.Mock).mockResolvedValue(project);
    (issueRepository.getByProjectId as jest.Mock).mockResolvedValue([]);
    (photoRepository.getByProjectId as jest.Mock).mockResolvedValue([]);
    (annotationRepository.getByPhotoId as jest.Mock).mockResolvedValue([]);

    jest
      .spyOn(Print, 'printToFileAsync')
      .mockResolvedValue({
        uri: 'file:///mock/test.pdf',
        numberOfPages: 1,
      } as Print.FilePrintResult);

    (encryptWithPassphrase as jest.Mock).mockResolvedValue('encrypted-content');
    jest.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(1024 * 1024 * 1024);

    const result = await exportProjectToPDF(projectId, 'secret123');

    expect(encryptWithPassphrase).toHaveBeenCalledWith(expect.any(String), 'secret123');
    expect(result.filePath).toContain('.pdf.enc');
    expect(result.mimeType).toBe('application/pdf');
  });

  it('handles fileInfo without size property', async () => {
    const projectId = 'proj-nosize';
    const project = {
      id: projectId,
      name: 'No Size Project',
      description: null,
      siteAddress: null,
      clientName: null,
      status: 'active' as const,
      priority: 0 as const,
      createdAt: 1000,
      updatedAt: 2000,
      completedAt: null,
      createdBy: null,
      isDeleted: 0,
      deletedAt: null,
    };

    (projectRepository.getById as jest.Mock).mockResolvedValue(project);
    (issueRepository.getByProjectId as jest.Mock).mockResolvedValue([]);
    (photoRepository.getByProjectId as jest.Mock).mockResolvedValue([]);
    (annotationRepository.getByPhotoId as jest.Mock).mockResolvedValue([]);

    jest
      .spyOn(Print, 'printToFileAsync')
      .mockResolvedValue({
        uri: 'file:///mock/test.pdf',
        numberOfPages: 1,
      } as Print.FilePrintResult);

    jest.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(1024 * 1024 * 1024);
    jest.spyOn(FileSystem, 'getInfoAsync').mockResolvedValue({
      exists: true,
      uri: 'file:///mock/test.pdf',
    } as FileSystem.FileInfo);

    const result = await exportProjectToPDF(projectId);

    expect(result.fileSize).toBe(0);
  });

  it('calls progress callback when provided', async () => {
    const projectId = 'proj-progress';
    const project = {
      id: projectId,
      name: 'Progress Project',
      description: null,
      siteAddress: null,
      clientName: null,
      status: 'active' as const,
      priority: 0 as const,
      createdAt: 1000,
      updatedAt: 2000,
      completedAt: null,
      createdBy: null,
      isDeleted: 0,
      deletedAt: null,
    };

    (projectRepository.getById as jest.Mock).mockResolvedValue(project);
    (issueRepository.getByProjectId as jest.Mock).mockResolvedValue([]);
    (photoRepository.getByProjectId as jest.Mock).mockResolvedValue([]);
    (annotationRepository.getByPhotoId as jest.Mock).mockResolvedValue([]);

    jest
      .spyOn(Print, 'printToFileAsync')
      .mockResolvedValue({
        uri: 'file:///mock/test.pdf',
        numberOfPages: 1,
      } as Print.FilePrintResult);

    jest.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(1024 * 1024 * 1024);
    jest.spyOn(FileSystem, 'getInfoAsync').mockResolvedValue({
      exists: true,
      size: 100,
      uri: 'file:///mock/test.pdf',
    } as FileSystem.FileInfo);

    const onProgress = jest.fn();
    await exportProjectToPDF(projectId, undefined, undefined, undefined, onProgress);

    expect(onProgress).toHaveBeenCalledWith(100);
  });

  it('throws when aborted and cleans up temp file', async () => {
    const deleteAsyncSpy = jest.spyOn(FileSystem, 'deleteAsync').mockResolvedValue(undefined);
    const controller = new AbortController();
    controller.abort();

    await expect(exportProjectToPDF('proj-1', undefined, undefined, undefined, undefined, controller.signal)).rejects.toThrow('Export aborted');
    expect(deleteAsyncSpy).toHaveBeenCalled();
    deleteAsyncSpy.mockRestore();
  });
});
