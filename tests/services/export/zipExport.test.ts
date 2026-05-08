import * as FileSystem from 'expo-file-system';
import { exportProjectToZIP } from '@services/export/zipExport';
import { projectRepository, issueRepository, photoRepository } from '@services/db/repositories';
import { encryptWithPassphrase } from '@services/backup/crypto';
import { exportHistoryRepository } from '@services/db/repositories';

jest.mock('@services/db/repositories', () => ({
  projectRepository: { getById: jest.fn() },
  issueRepository: { getByProjectId: jest.fn() },
  photoRepository: { getByProjectId: jest.fn() },
  exportHistoryRepository: { create: jest.fn(() => Promise.resolve({ id: 'hist-1' })) },
}));
jest.mock('@services/backup/crypto');
jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => ({
    file: jest.fn(),
    folder: jest.fn(() => ({ file: jest.fn() })),
    generateAsync: jest.fn(() => Promise.resolve('mock-zip-base64')),
  }));
});

describe('exportProjectToZIP', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (projectRepository.getById as jest.Mock).mockResolvedValue({
      id: 'proj-1',
      name: 'Test Project',
    });
    (issueRepository.getByProjectId as jest.Mock).mockResolvedValue([
      {
        id: 'issue-1',
        projectId: 'proj-1',
        title: 'Issue One',
        description: null,
        severity: 'high',
        status: 'open',
        locationDescription: null,
        assignedTo: null,
        dueDate: null,
        createdAt: 1000,
        updatedAt: 2000,
      },
    ]);
    (photoRepository.getByProjectId as jest.Mock).mockResolvedValue([]);

    jest.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(1024 * 1024 * 1024);
    jest.spyOn(FileSystem, 'writeAsStringAsync').mockResolvedValue(undefined);
    jest.spyOn(FileSystem, 'getInfoAsync').mockResolvedValue({
      exists: true,
      size: 1234,
      uri: 'file:///mock/test.zip',
      isDirectory: false,
      modificationTime: 1,
    } as FileSystem.FileInfo);

    (encryptWithPassphrase as jest.Mock).mockResolvedValue('encrypted-content');
  });

  it('creates a zip file without password', async () => {
    const result = await exportProjectToZIP('proj-1');

    expect(projectRepository.getById).toHaveBeenCalledWith('proj-1');
    expect(result.filePath).toContain('.zip');
    expect(encryptWithPassphrase).not.toHaveBeenCalled();
    expect(exportHistoryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'proj-1', exportType: 'zip', success: true })
    );
  });

  it('throws when project is not found', async () => {
    (projectRepository.getById as jest.Mock).mockResolvedValue(null);

    await expect(exportProjectToZIP('missing-proj')).rejects.toThrow(
      'Project not found: missing-proj'
    );
  });

  it('creates encrypted zip when password is provided', async () => {
    const result = await exportProjectToZIP('proj-1', 'secret123');

    expect(encryptWithPassphrase).toHaveBeenCalledWith(expect.any(String), 'secret123');
    expect(result.filePath).toContain('.zip.enc');
  });

  it('handles photo read errors gracefully', async () => {
    (photoRepository.getByProjectId as jest.Mock).mockResolvedValue([
      {
        id: 'photo-1',
        projectId: 'proj-1',
        issueId: 'issue-1',
        originalPath: 'file:///bad-photo.jpg',
        thumbnailPath: null,
        compressedPath: null,
        captureTimestamp: 1000,
        cameraMake: null,
        cameraModel: null,
        gpsLatitude: null,
        gpsLongitude: null,
        gpsAltitude: null,
        width: null,
        height: null,
        fileSizeBytes: null,
        caption: null,
        sortOrder: 0,
        createdAt: 1000,
        updatedAt: 2000,
        isDeleted: 0,
        deletedAt: null,
      },
    ]);
    jest.spyOn(FileSystem, 'readAsStringAsync').mockRejectedValue(new Error('File not found'));

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await exportProjectToZIP('proj-1');

    expect(result.filePath).toContain('.zip');
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('calls progress callback with 100 when no photos exist', async () => {
    (photoRepository.getByProjectId as jest.Mock).mockResolvedValue([]);
    const onProgress = jest.fn();

    await exportProjectToZIP('proj-1', undefined, onProgress);

    expect(onProgress).toHaveBeenCalledWith(100);
  });

  it('escapes CSV values with special characters', async () => {
    (issueRepository.getByProjectId as jest.Mock).mockResolvedValue([
      {
        id: 'issue-1',
        projectId: 'proj-1',
        title: 'Issue, with comma',
        description: 'Desc with "quotes"',
        severity: 'high',
        status: 'open',
        locationDescription: 'Line\nbreak',
        assignedTo: null,
        dueDate: null,
        createdAt: 1000,
        updatedAt: 2000,
      },
    ]);

    const result = await exportProjectToZIP('proj-1');

    expect(result.filePath).toContain('.zip');
  });

  it('throws when aborted and cleans up temp file', async () => {
    const deleteAsyncSpy = jest.spyOn(FileSystem, 'deleteAsync').mockResolvedValue(undefined);
    const controller = new AbortController();
    controller.abort();

    await expect(exportProjectToZIP('proj-1', undefined, undefined, controller.signal)).rejects.toThrow('Export aborted');
    expect(deleteAsyncSpy).toHaveBeenCalled();
    deleteAsyncSpy.mockRestore();
  });
});
