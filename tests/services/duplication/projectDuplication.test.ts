import { duplicateProject } from '@services/duplication/projectDuplication';
import { projectRepository, issueRepository, photoRepository } from '@services/db/repositories';
import type { Project, Issue, Photo } from '@/types/domain';

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
}));

const mockProject: Project = {
  id: 'proj-1',
  name: 'Test Project',
  description: 'A test project',
  siteAddress: '123 Main St',
  clientName: 'Client A',
  status: 'active',
  priority: 2,
  createdAt: 1000,
  updatedAt: 2000,
  completedAt: null,
  createdBy: null,
  isDeleted: 0,
  deletedAt: null,
};

const mockIssue: Issue = {
  id: 'issue-1',
  projectId: 'proj-1',
  title: 'Test Issue',
  description: 'An issue',
  category: 'safety',
  severity: 'high',
  status: 'open',
  locationDescription: 'Floor 2',
  gpsLatitude: null,
  gpsLongitude: null,
  gpsAccuracy: null,
  assignedTo: 'Bob',
  dueDate: null,
  resolutionNotes: null,
  resolvedAt: null,
  resolvedBy: null,
  voiceNoteUrl: null,
  sortOrder: 0,
  createdAt: 1000,
  updatedAt: 2000,
  isDeleted: 0,
  deletedAt: null,
};

const mockPhoto: Photo = {
  id: 'photo-1',
  projectId: 'proj-1',
  issueId: 'issue-1',
  originalPath: '/photos/original/photo-1.jpg',
  thumbnailPath: '/photos/thumb/photo-1.jpg',
  compressedPath: null,
  captureTimestamp: 1000,
  cameraMake: 'Apple',
  cameraModel: 'iPhone 13',
  gpsLatitude: 40.7128,
  gpsLongitude: -74.006,
  gpsAltitude: null,
  width: 1920,
  height: 1080,
  fileSizeBytes: 500000,
  caption: 'A photo',
  checksum: 'abc123',
  tags: '["tag1"]',
  sortOrder: 0,
  createdAt: 1000,
  updatedAt: 2000,
  isDeleted: 0,
  deletedAt: null,
};

describe('duplicateProject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when project not found', async () => {
    (projectRepository.getById as jest.Mock).mockResolvedValue(null);
    await expect(duplicateProject('nonexistent')).rejects.toThrow('Project not found: nonexistent');
  });

  it('duplicates project with (Copy) suffix', async () => {
    const duplicated = { ...mockProject, id: 'proj-2', name: 'Test Project (Copy)' };
    (projectRepository.getById as jest.Mock).mockResolvedValue(mockProject);
    (projectRepository.create as jest.Mock).mockResolvedValue(duplicated);
    (issueRepository.getByProjectId as jest.Mock).mockResolvedValue([]);
    (photoRepository.getByProjectId as jest.Mock).mockResolvedValue([]);

    const result = await duplicateProject('proj-1');

    expect(result.name).toBe('Test Project (Copy)');
    expect(projectRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test Project (Copy)' })
    );
  });

  it('duplicates child issues with new projectId', async () => {
    const duplicatedProject = { ...mockProject, id: 'proj-2' };
    const duplicatedIssue = { ...mockIssue, id: 'issue-2', projectId: 'proj-2' };

    (projectRepository.getById as jest.Mock).mockResolvedValue(mockProject);
    (projectRepository.create as jest.Mock).mockResolvedValue(duplicatedProject);
    (issueRepository.getByProjectId as jest.Mock).mockResolvedValue([mockIssue]);
    (issueRepository.create as jest.Mock).mockResolvedValue(duplicatedIssue);
    (photoRepository.getByProjectId as jest.Mock).mockResolvedValue([]);

    await duplicateProject('proj-1');

    expect(issueRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj-2',
        title: 'Test Issue (Copy)',
      })
    );
  });

  it('remaps photo issueId via issue ID map', async () => {
    const duplicatedProject = { ...mockProject, id: 'proj-2' };
    const duplicatedIssue = { ...mockIssue, id: 'issue-new', projectId: 'proj-2' };

    (projectRepository.getById as jest.Mock).mockResolvedValue(mockProject);
    (projectRepository.create as jest.Mock).mockResolvedValue(duplicatedProject);
    (issueRepository.getByProjectId as jest.Mock).mockResolvedValue([mockIssue]);
    (issueRepository.create as jest.Mock).mockResolvedValue(duplicatedIssue);
    (photoRepository.getByProjectId as jest.Mock).mockResolvedValue([mockPhoto]);
    (photoRepository.create as jest.Mock).mockResolvedValue({ ...mockPhoto, id: 'photo-2' });

    await duplicateProject('proj-1');

    expect(photoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj-2',
        issueId: 'issue-new',
      })
    );
  });

  it('passes null issueId through for project-level photos', async () => {
    const projectPhoto = { ...mockPhoto, issueId: null };
    const duplicatedProject = { ...mockProject, id: 'proj-2' };

    (projectRepository.getById as jest.Mock).mockResolvedValue(mockProject);
    (projectRepository.create as jest.Mock).mockResolvedValue(duplicatedProject);
    (issueRepository.getByProjectId as jest.Mock).mockResolvedValue([]);
    (photoRepository.getByProjectId as jest.Mock).mockResolvedValue([projectPhoto]);
    (photoRepository.create as jest.Mock).mockResolvedValue({ ...projectPhoto, id: 'photo-2' });

    await duplicateProject('proj-1');

    expect(photoRepository.create).toHaveBeenCalledWith(expect.objectContaining({ issueId: null }));
  });

  it('falls back to null when original issueId is not in map', async () => {
    const orphanPhoto = { ...mockPhoto, issueId: 'orphan-issue' };
    const duplicatedProject = { ...mockProject, id: 'proj-2' };

    (projectRepository.getById as jest.Mock).mockResolvedValue(mockProject);
    (projectRepository.create as jest.Mock).mockResolvedValue(duplicatedProject);
    (issueRepository.getByProjectId as jest.Mock).mockResolvedValue([]);
    (photoRepository.getByProjectId as jest.Mock).mockResolvedValue([orphanPhoto]);
    (photoRepository.create as jest.Mock).mockResolvedValue({ ...orphanPhoto, id: 'photo-2' });

    await duplicateProject('proj-1');

    expect(photoRepository.create).toHaveBeenCalledWith(expect.objectContaining({ issueId: null }));
  });

  it('handles empty issues and photos arrays', async () => {
    const duplicatedProject = { ...mockProject, id: 'proj-2' };

    (projectRepository.getById as jest.Mock).mockResolvedValue(mockProject);
    (projectRepository.create as jest.Mock).mockResolvedValue(duplicatedProject);
    (issueRepository.getByProjectId as jest.Mock).mockResolvedValue([]);
    (photoRepository.getByProjectId as jest.Mock).mockResolvedValue([]);

    const result = await duplicateProject('proj-1');

    expect(result.id).toBe('proj-2');
    expect(issueRepository.create).not.toHaveBeenCalled();
    expect(photoRepository.create).not.toHaveBeenCalled();
  });
});
