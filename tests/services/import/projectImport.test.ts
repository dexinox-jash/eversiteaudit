import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import {
  importFromJSON,
  importFromZIP,
  parseImportPreview,
} from '@services/import/projectImport';
import { projectRepository } from '@services/db/repositories/ProjectRepository';
import { issueRepository } from '@services/db/repositories/IssueRepository';
import { photoRepository } from '@services/db/repositories/PhotoRepository';

jest.mock('@services/db/repositories/ProjectRepository');
jest.mock('@services/db/repositories/IssueRepository');
jest.mock('@services/db/repositories/PhotoRepository');

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  cacheDirectory: 'file:///mock/cache/',
  readAsStringAsync: jest.fn().mockResolvedValue(''),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => ({
    file: jest.fn(() => null),
    folder: jest.fn(() => ({ file: jest.fn() })),
    loadAsync: jest.fn().mockResolvedValue({
      file: jest.fn(() => null),
      folder: jest.fn(() => ({ file: jest.fn() })),
    }),
  }));
});

describe('parseImportPreview', () => {
  it('returns preview for valid flat JSON', async () => {
    const json = JSON.stringify({
      project: { name: 'Test Project' },
      issues: [{ title: 'Issue 1' }, { title: 'Issue 2' }],
      photos: [{ originalPath: 'photo1.jpg' }],
    });

    const preview = await parseImportPreview(json);
    expect(preview.projectName).toBe('Test Project');
    expect(preview.issueCount).toBe(2);
    expect(preview.photoCount).toBe(1);
  });

  it('returns preview for valid nested JSON', async () => {
    const json = JSON.stringify({
      project: { name: 'ZIP Project' },
      issues: [
        { title: 'Issue 1', photos: [{ originalPath: 'p1.jpg' }] },
        { title: 'Issue 2', photos: [{ originalPath: 'p2.jpg' }] },
      ],
    });

    const preview = await parseImportPreview(json);
    expect(preview.projectName).toBe('ZIP Project');
    expect(preview.issueCount).toBe(2);
    expect(preview.photoCount).toBe(2);
  });

  it('throws for invalid JSON', async () => {
    await expect(parseImportPreview('not json')).rejects.toThrow('Invalid JSON');
  });

  it('throws for schema validation failure', async () => {
    const json = JSON.stringify({ project: {} });
    await expect(parseImportPreview(json)).rejects.toThrow('Schema validation failed');
  });
});

describe('importFromJSON', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (projectRepository.getAll as jest.Mock).mockResolvedValue([]);
    (projectRepository.create as jest.Mock).mockImplementation((payload) =>
      Promise.resolve({
        id: 'proj-1',
        ...payload,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDeleted: 0,
        deletedAt: null,
        completedAt: null,
        createdBy: null,
      })
    );
    (issueRepository.create as jest.Mock).mockImplementation((payload) =>
      Promise.resolve({
        id: 'issue-1',
        ...payload,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDeleted: 0,
        deletedAt: null,
        resolutionNotes: null,
        resolvedAt: null,
        resolvedBy: null,
        voiceNoteUrl: null,
        sortOrder: 0,
        gpsLatitude: null,
        gpsLongitude: null,
        gpsAccuracy: null,
      })
    );
    (photoRepository.create as jest.Mock).mockImplementation((payload) =>
      Promise.resolve({
        id: 'photo-1',
        ...payload,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDeleted: 0,
        deletedAt: null,
      })
    );
  });

  it('creates project with issues and photos', async () => {
    const json = JSON.stringify({
      project: { name: 'Imported Project', description: 'Desc' },
      issues: [
        { id: 'old-issue-1', title: 'Issue 1', severity: 'high' },
        { id: 'old-issue-2', title: 'Issue 2' },
      ],
      photos: [
        { originalPath: 'file:///photo1.jpg', issueId: 'old-issue-1' },
        { originalPath: 'file:///photo2.jpg' },
      ],
    });

    const result = await importFromJSON(json);
    expect(result.issuesCreated).toBe(2);
    expect(result.photosCreated).toBe(2);
    expect(projectRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Imported Project' })
    );
  });

  it('appends (Imported) for duplicate names', async () => {
    (projectRepository.getAll as jest.Mock).mockResolvedValue([
      { name: 'Existing Project' },
    ]);

    const json = JSON.stringify({
      project: { name: 'Existing Project' },
      issues: [],
      photos: [],
    });

    const result = await importFromJSON(json);
    expect(result.project.name).toBe('Existing Project (Imported)');
  });

  it('throws for invalid JSON', async () => {
    await expect(importFromJSON('bad json')).rejects.toThrow('Invalid JSON');
  });

  it('throws for schema validation failure', async () => {
    const json = JSON.stringify({ project: { name: '' }, issues: [] });
    await expect(importFromJSON(json)).rejects.toThrow('Schema validation failed');
  });
});

describe('importFromZIP', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (projectRepository.getAll as jest.Mock).mockResolvedValue([]);
    (projectRepository.create as jest.Mock).mockImplementation((payload) =>
      Promise.resolve({
        id: 'proj-zip',
        ...payload,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDeleted: 0,
        deletedAt: null,
        completedAt: null,
        createdBy: null,
      })
    );
    (issueRepository.create as jest.Mock).mockImplementation((payload) =>
      Promise.resolve({
        id: 'issue-zip',
        ...payload,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDeleted: 0,
        deletedAt: null,
        resolutionNotes: null,
        resolvedAt: null,
        resolvedBy: null,
        voiceNoteUrl: null,
        sortOrder: 0,
        gpsLatitude: null,
        gpsLongitude: null,
        gpsAccuracy: null,
      })
    );
    (photoRepository.create as jest.Mock).mockImplementation((payload) =>
      Promise.resolve({
        id: 'photo-zip',
        ...payload,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDeleted: 0,
        deletedAt: null,
      })
    );

    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('mock-zip-base64');
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
  });

  it('creates project from flat ZIP format', async () => {
    const projectJson = JSON.stringify({
      project: { name: 'ZIP Project' },
      issues: [{ title: 'Issue 1' }],
      photos: [{ originalPath: 'photos/photo1.jpg' }],
    });

    const mockZipFile = {
      async: jest.fn().mockResolvedValue(projectJson),
    };
    const mockPhotoFile = {
      async: jest.fn().mockResolvedValue('base64photo'),
    };
    const mockPhotosFolder = {
      file: jest.fn((name: string) => (name === 'photo1.jpg' ? mockPhotoFile : null)),
    };

    (JSZip as unknown as jest.Mock).mockImplementation(() => ({
      loadAsync: jest.fn().mockResolvedValue({
        file: jest.fn((name: string) => (name === 'project.json' ? mockZipFile : null)),
        folder: jest.fn((name: string) => (name === 'photos' ? mockPhotosFolder : null)),
      }),
    }));

    const result = await importFromZIP('file:///mock/import.zip');
    expect(result.project.name).toBe('ZIP Project');
    expect(result.issuesCreated).toBe(1);
    expect(result.photosCreated).toBe(1);
  });

  it('creates project from nested ZIP format', async () => {
    const projectJson = JSON.stringify({
      project: { name: 'Nested ZIP Project' },
      issues: [
        { id: 'issue-a', title: 'Issue 1', photos: [{ originalPath: 'photos/p1.jpg' }] },
      ],
    });

    const mockZipFile = {
      async: jest.fn().mockResolvedValue(projectJson),
    };
    const mockPhotoFile = {
      async: jest.fn().mockResolvedValue('base64photo'),
    };
    const mockPhotosFolder = {
      file: jest.fn((name: string) => (name === 'p1.jpg' ? mockPhotoFile : null)),
    };

    (JSZip as unknown as jest.Mock).mockImplementation(() => ({
      loadAsync: jest.fn().mockResolvedValue({
        file: jest.fn((name: string) => (name === 'project.json' ? mockZipFile : null)),
        folder: jest.fn((name: string) => (name === 'photos' ? mockPhotosFolder : null)),
      }),
    }));

    const result = await importFromZIP('file:///mock/import.zip');
    expect(result.project.name).toBe('Nested ZIP Project');
    expect(result.issuesCreated).toBe(1);
    expect(result.photosCreated).toBe(1);
  });

  it('throws when ZIP is missing project.json', async () => {
    (JSZip as unknown as jest.Mock).mockImplementation(() => ({
      loadAsync: jest.fn().mockResolvedValue({
        file: jest.fn(() => null),
        folder: jest.fn(() => null),
      }),
    }));

    await expect(importFromZIP('file:///mock/bad.zip')).rejects.toThrow(
      'Invalid ZIP: project.json not found'
    );
  });
});
