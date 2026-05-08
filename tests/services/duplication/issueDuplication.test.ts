import { duplicateIssue } from '@services/duplication/issueDuplication';
import { issueRepository, photoRepository } from '@services/db/repositories';
import type { Issue, Photo } from '@/types/domain';

jest.mock('@services/db/repositories', () => ({
  issueRepository: {
    getById: jest.fn(),
    create: jest.fn(),
  },
  photoRepository: {
    getByIssueId: jest.fn(),
    create: jest.fn(),
  },
}));

const mockIssue: Issue = {
  id: 'issue-1',
  projectId: 'proj-1',
  title: 'Broken Rail',
  description: 'Rail is broken',
  category: 'safety',
  severity: 'critical',
  status: 'open',
  locationDescription: 'Floor 3',
  gpsLatitude: null,
  gpsLongitude: null,
  gpsAccuracy: null,
  assignedTo: 'Alice',
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
  cameraMake: null,
  cameraModel: null,
  gpsLatitude: null,
  gpsLongitude: null,
  gpsAltitude: null,
  width: 1920,
  height: 1080,
  fileSizeBytes: 300000,
  caption: null,
  checksum: null,
  tags: '[]',
  sortOrder: 0,
  createdAt: 1000,
  updatedAt: 2000,
  isDeleted: 0,
  deletedAt: null,
};

describe('duplicateIssue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when issue not found', async () => {
    (issueRepository.getById as jest.Mock).mockResolvedValue(null);
    await expect(duplicateIssue('nonexistent')).rejects.toThrow('Issue not found: nonexistent');
  });

  it('duplicates issue with (Copy) suffix', async () => {
    const duplicated = { ...mockIssue, id: 'issue-2', title: 'Broken Rail (Copy)' };
    (issueRepository.getById as jest.Mock).mockResolvedValue(mockIssue);
    (issueRepository.create as jest.Mock).mockResolvedValue(duplicated);
    (photoRepository.getByIssueId as jest.Mock).mockResolvedValue([]);

    const result = await duplicateIssue('issue-1');

    expect(result.title).toBe('Broken Rail (Copy)');
    expect(issueRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj-1',
        title: 'Broken Rail (Copy)',
        severity: 'critical',
      })
    );
  });

  it('duplicates photos with new issueId', async () => {
    const duplicated = { ...mockIssue, id: 'issue-2' };
    (issueRepository.getById as jest.Mock).mockResolvedValue(mockIssue);
    (issueRepository.create as jest.Mock).mockResolvedValue(duplicated);
    (photoRepository.getByIssueId as jest.Mock).mockResolvedValue([mockPhoto]);
    (photoRepository.create as jest.Mock).mockResolvedValue({ ...mockPhoto, id: 'photo-2' });

    await duplicateIssue('issue-1');

    expect(photoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        issueId: 'issue-2',
        originalPath: '/photos/original/photo-1.jpg',
      })
    );
  });

  it('handles issue with zero photos', async () => {
    const duplicated = { ...mockIssue, id: 'issue-2' };
    (issueRepository.getById as jest.Mock).mockResolvedValue(mockIssue);
    (issueRepository.create as jest.Mock).mockResolvedValue(duplicated);
    (photoRepository.getByIssueId as jest.Mock).mockResolvedValue([]);

    const result = await duplicateIssue('issue-1');

    expect(result.id).toBe('issue-2');
    expect(photoRepository.create).not.toHaveBeenCalled();
  });
});
