import * as FileSystem from 'expo-file-system';
import { exportProjectToCSV } from '@services/export/csvExport';
import { projectRepository } from '@services/db/repositories/ProjectRepository';
import { issueRepository } from '@services/db/repositories/IssueRepository';
import { exportHistoryRepository } from '@services/db/repositories/ExportHistoryRepository';

jest.mock('@services/db/repositories/ProjectRepository');
jest.mock('@services/db/repositories/IssueRepository');
jest.mock('@services/db/repositories/ExportHistoryRepository', () => ({
  ExportHistoryRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn(() => Promise.resolve({ id: 'hist-1' })),
  })),
  exportHistoryRepository: {
    create: jest.fn(() => Promise.resolve({ id: 'hist-1' })),
  },
}));

describe('exportProjectToCSV', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a CSV file with expected headers and row data', async () => {
    const projectId = 'proj-456';
    const project = {
      id: projectId,
      name: 'CSV Test Project',
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
    const issues = [
      {
        id: 'issue-2',
        projectId,
        title: 'Issue Two',
        description: 'Description, with comma',
        category: 'quality' as const,
        severity: 'medium' as const,
        status: 'in_progress' as const,
        locationDescription: 'Floor 1',
        gpsLatitude: null,
        gpsLongitude: null,
        gpsAccuracy: null,
        assignedTo: 'worker@example.com',
        dueDate: 3000,
        resolutionNotes: null,
        resolvedAt: null,
        resolvedBy: null,
        createdAt: 1000,
        updatedAt: 2000,
        isDeleted: 0,
        deletedAt: null,
      },
    ];

    (projectRepository.getById as jest.Mock).mockResolvedValue(project);
    (issueRepository.getByProjectId as jest.Mock).mockResolvedValue(issues);

    jest.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(1024 * 1024 * 1024);
    const writeAsStringAsyncSpy = jest
      .spyOn(FileSystem, 'writeAsStringAsync')
      .mockResolvedValue(undefined);
    jest
      .spyOn(FileSystem, 'getInfoAsync')
      .mockResolvedValue({
        exists: true,
        size: 567,
        uri: `${FileSystem.documentDirectory}project-${projectId}-567.csv`,
      } as FileSystem.FileInfo);
    const subtleDigestMock = jest.fn().mockResolvedValue(new Uint8Array([0xab, 0xcd]).buffer);
    Object.defineProperty(global, 'crypto', {
      value: { subtle: { digest: subtleDigestMock } },
      writable: true,
      configurable: true,
    });

    const result = await exportProjectToCSV(projectId);

    expect(projectRepository.getById).toHaveBeenCalledWith(projectId);
    expect(issueRepository.getByProjectId).toHaveBeenCalledWith(projectId);

    expect(writeAsStringAsyncSpy).toHaveBeenCalledTimes(1);
    const [writtenPath, writtenContent] = writeAsStringAsyncSpy.mock.calls[0]!;
    expect(writtenPath).toEqual(
      expect.stringMatching(
        new RegExp(`^${FileSystem.documentDirectory}project-${projectId}-\\d+\\.csv$`)
      )
    );
    expect(result.filePath).toBe(writtenPath);

    const lines = (writtenContent as string).split('\n');
    expect(lines[0]).toBe(
      'id,projectId,title,description,category,severity,status,locationDescription,assignedTo,dueDate,createdAt,updatedAt'
    );
    expect(lines[1]).toContain('issue-2');
    expect(lines[1]).toContain('"Description, with comma"');
    expect(lines[1]).toContain('quality');
    expect(lines[1]).toContain('medium');
    expect(lines[1]).toContain('in_progress');
    expect(lines[1]).toContain('worker@example.com');
    expect(result.fileSize).toBe(567);
    expect(typeof result.checksum).toBe('string');
    expect(exportHistoryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: projectId, exportType: 'csv', success: true })
    );
  });

  it('throws an error when project is not found', async () => {
    const projectId = 'missing-proj';
    (projectRepository.getById as jest.Mock).mockResolvedValue(null);

    await expect(exportProjectToCSV(projectId)).rejects.toThrow(`Project not found: ${projectId}`);
    expect(projectRepository.getById).toHaveBeenCalledWith(projectId);
  });

  it('creates encrypted CSV when password is provided', async () => {
    const projectId = 'proj-encrypted';
    const project = {
      id: projectId,
      name: 'Encrypted CSV Project',
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

    jest.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(1024 * 1024 * 1024);
    jest.spyOn(FileSystem, 'writeAsStringAsync').mockResolvedValue(undefined);
    jest.spyOn(FileSystem, 'getInfoAsync').mockResolvedValue({
      exists: true,
      size: 256,
      uri: `${FileSystem.documentDirectory}project-${projectId}-123.csv.enc`,
    } as FileSystem.FileInfo);

    const result = await exportProjectToCSV(projectId, 'secret123');

    expect(result.filePath).toContain('.csv.enc');
    expect(exportHistoryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ passwordProtected: true })
    );
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

    jest.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(1024 * 1024 * 1024);
    jest.spyOn(FileSystem, 'writeAsStringAsync').mockResolvedValue(undefined);
    jest.spyOn(FileSystem, 'getInfoAsync').mockResolvedValue({
      exists: true,
      uri: `${FileSystem.documentDirectory}project-${projectId}-123.csv`,
    } as FileSystem.FileInfo);

    const result = await exportProjectToCSV(projectId);

    expect(result.fileSize).toBe(0);
  });

  it('throws when aborted and cleans up temp file', async () => {
    const projectId = 'proj-abort';
    const project = {
      id: projectId,
      name: 'Abort CSV Project',
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

    jest.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(1024 * 1024 * 1024);
    const deleteAsyncSpy = jest.spyOn(FileSystem, 'deleteAsync').mockResolvedValue(undefined);

    const controller = new AbortController();
    controller.abort();

    await expect(exportProjectToCSV(projectId, undefined, undefined, controller.signal)).rejects.toThrow('Export aborted');
    expect(deleteAsyncSpy).toHaveBeenCalled();
    deleteAsyncSpy.mockRestore();
  });
});
