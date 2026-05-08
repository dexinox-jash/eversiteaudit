import * as FileSystem from 'expo-file-system';
import { exportProjectToJSON } from '@services/export/jsonExport';
import { projectRepository } from '@services/db/repositories/ProjectRepository';
import { issueRepository } from '@services/db/repositories/IssueRepository';
import { photoRepository } from '@services/db/repositories/PhotoRepository';
import { exportHistoryRepository } from '@services/db/repositories/ExportHistoryRepository';

jest.mock('@services/db/repositories/ProjectRepository');
jest.mock('@services/db/repositories/IssueRepository');
jest.mock('@services/db/repositories/PhotoRepository');
jest.mock('@services/db/repositories/ExportHistoryRepository', () => ({
  ExportHistoryRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn(() => Promise.resolve({ id: 'hist-1' })),
  })),
  exportHistoryRepository: {
    create: jest.fn(() => Promise.resolve({ id: 'hist-1' })),
  },
}));

describe('exportProjectToJSON', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a JSON file with correct structure', async () => {
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

    jest.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(1024 * 1024 * 1024);
    const writeAsStringAsyncSpy = jest
      .spyOn(FileSystem, 'writeAsStringAsync')
      .mockResolvedValue(undefined);
    jest
      .spyOn(FileSystem, 'getInfoAsync')
      .mockResolvedValue({
        exists: true,
        size: 1234,
        uri: `${FileSystem.documentDirectory}project-${projectId}-1234.json`,
      } as FileSystem.FileInfo);
    const subtleDigestMock = jest.fn().mockResolvedValue(new Uint8Array([0xab, 0xcd]).buffer);
    Object.defineProperty(global, 'crypto', {
      value: { subtle: { digest: subtleDigestMock } },
      writable: true,
      configurable: true,
    });

    const result = await exportProjectToJSON(projectId);

    expect(projectRepository.getById).toHaveBeenCalledWith(projectId);
    expect(issueRepository.getByProjectId).toHaveBeenCalledWith(projectId);
    expect(photoRepository.getByProjectId).toHaveBeenCalledWith(projectId);

    expect(writeAsStringAsyncSpy).toHaveBeenCalledTimes(1);
    const [writtenPath, writtenContent] = writeAsStringAsyncSpy.mock.calls[0]!;
    expect(writtenPath).toEqual(
      expect.stringMatching(
        new RegExp(`^${FileSystem.documentDirectory}project-${projectId}-\\d+\\.json$`)
      )
    );
    expect(result.filePath).toBe(writtenPath);

    const parsed = JSON.parse(writtenContent as string);
    expect(parsed.project).toEqual(project);
    expect(parsed.issues).toEqual(issues);
    expect(parsed.photos).toEqual(photos);
    expect(typeof parsed.exportedAt).toBe('string');
    expect(result.fileSize).toBe(1234);
    expect(typeof result.checksum).toBe('string');
    expect(exportHistoryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: projectId, exportType: 'json', success: true })
    );
  });

  it('throws an error when project is not found', async () => {
    const projectId = 'missing-proj';
    (projectRepository.getById as jest.Mock).mockResolvedValue(null);

    await expect(exportProjectToJSON(projectId)).rejects.toThrow(`Project not found: ${projectId}`);
    expect(projectRepository.getById).toHaveBeenCalledWith(projectId);
  });

  it('creates encrypted JSON when password is provided', async () => {
    const projectId = 'proj-encrypted';
    const project = {
      id: projectId,
      name: 'Encrypted JSON Project',
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

    jest.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(1024 * 1024 * 1024);
    jest.spyOn(FileSystem, 'writeAsStringAsync').mockResolvedValue(undefined);
    jest.spyOn(FileSystem, 'getInfoAsync').mockResolvedValue({
      exists: true,
      size: 256,
      uri: `${FileSystem.documentDirectory}project-${projectId}-123.json.enc`,
    } as FileSystem.FileInfo);

    const result = await exportProjectToJSON(projectId, 'secret123');

    expect(result.filePath).toContain('.json.enc');
    expect(exportHistoryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ passwordProtected: true })
    );
  });

  it('calls progress callback during export', async () => {
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

    jest.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(1024 * 1024 * 1024);
    jest.spyOn(FileSystem, 'writeAsStringAsync').mockResolvedValue(undefined);
    jest.spyOn(FileSystem, 'getInfoAsync').mockResolvedValue({
      exists: true,
      size: 100,
      uri: `${FileSystem.documentDirectory}project-${projectId}-123.json`,
    } as FileSystem.FileInfo);

    const onProgress = jest.fn();
    await exportProjectToJSON(projectId, undefined, onProgress);

    expect(onProgress).toHaveBeenCalledWith(0);
    expect(onProgress).toHaveBeenCalledWith(66);
    expect(onProgress).toHaveBeenCalledWith(100);
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

    jest.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(1024 * 1024 * 1024);
    jest.spyOn(FileSystem, 'writeAsStringAsync').mockResolvedValue(undefined);
    jest.spyOn(FileSystem, 'getInfoAsync').mockResolvedValue({
      exists: true,
      uri: `${FileSystem.documentDirectory}project-${projectId}-123.json`,
    } as FileSystem.FileInfo);

    const result = await exportProjectToJSON(projectId);

    expect(result.fileSize).toBe(0);
  });

  it('throws when aborted and cleans up temp file', async () => {
    const projectId = 'proj-abort';
    const project = {
      id: projectId,
      name: 'Abort Project',
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

    jest.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(1024 * 1024 * 1024);
    const deleteAsyncSpy = jest.spyOn(FileSystem, 'deleteAsync').mockResolvedValue(undefined);

    const controller = new AbortController();
    controller.abort();

    await expect(exportProjectToJSON(projectId, undefined, undefined, controller.signal)).rejects.toThrow('Export aborted');
    expect(deleteAsyncSpy).toHaveBeenCalled();
  });
});
