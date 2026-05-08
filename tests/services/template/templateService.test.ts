import { projectRepository } from '@services/db/repositories/ProjectRepository';
import { issueRepository } from '@services/db/repositories/IssueRepository';
import { templateRepository } from '@services/db/repositories/TemplateRepository';
import {
  createProjectFromTemplate,
  createCustomTemplate,
  editCustomTemplate,
  deleteCustomTemplate,
  parseTemplateContent,
} from '@services/template/templateService';
import type { Project } from '@/types/domain';

jest.mock('@services/db/repositories/ProjectRepository');
jest.mock('@services/db/repositories/IssueRepository');
jest.mock('@services/db/repositories/TemplateRepository');

const mockTemplateRepositoryUpdate = jest.fn();

describe('parseTemplateContent', () => {
  it('returns sections from valid JSON', () => {
    const result = parseTemplateContent(JSON.stringify({ sections: ['A', 'B'] }));
    expect(result.sections).toEqual(['A', 'B']);
  });

  it('filters out non-string sections', () => {
    const result = parseTemplateContent(JSON.stringify({ sections: ['A', 123, null, 'B'] }));
    expect(result.sections).toEqual(['A', 'B']);
  });

  it('returns empty sections for invalid JSON', () => {
    const result = parseTemplateContent('not json');
    expect(result.sections).toEqual([]);
  });

  it('returns empty sections when sections is missing', () => {
    const result = parseTemplateContent(JSON.stringify({ other: [] }));
    expect(result.sections).toEqual([]);
  });

  it('returns empty sections when sections is not an array', () => {
    const result = parseTemplateContent(JSON.stringify({ sections: 'nope' }));
    expect(result.sections).toEqual([]);
  });
});

describe('createProjectFromTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates 1 project, 2 issues with correct titles, and returns the project', async () => {
    const templateId = 'tpl-safety-1';
    const projectId = 'proj-123';
    const projectPayload = {
      name: 'Safety Audit',
      siteAddress: 'Site A',
      clientName: 'Client A',
      description: null,
    };

    const createdProject: Project = {
      id: projectId,
      name: projectPayload.name,
      description: projectPayload.description,
      siteAddress: projectPayload.siteAddress,
      clientName: projectPayload.clientName,
      status: 'active',
      priority: 0,
      createdAt: 1000,
      updatedAt: 1000,
      completedAt: null,
      createdBy: null,
      isDeleted: 0,
      deletedAt: null,
    };

    (templateRepository.getById as jest.Mock).mockResolvedValue({
      id: templateId,
      name: 'Safety Inspection',
      description: null,
      type: 'project_structure',
      content: JSON.stringify({ sections: ['PPE', 'Electrical'] }),
      isDefault: 0,
      usageCount: 0,
      createdAt: 1000,
      updatedAt: 1000,
      isDeleted: 0,
      deletedAt: null,
    });

    (projectRepository.createProjectWithIssues as jest.Mock).mockResolvedValue(createdProject);

    const result = await createProjectFromTemplate(templateId, projectPayload);

    expect(templateRepository.getById).toHaveBeenCalledWith(templateId);
    expect(projectRepository.createProjectWithIssues).toHaveBeenCalledTimes(1);
    expect(projectRepository.createProjectWithIssues).toHaveBeenCalledWith(projectPayload, [
      { title: 'PPE', category: 'safety', severity: 'medium', status: 'open' },
      { title: 'Electrical', category: 'safety', severity: 'medium', status: 'open' },
    ]);
    expect(issueRepository.create).not.toHaveBeenCalled();
    expect(result).toEqual(createdProject);
  });

  it('creates project but no issues when template has no sections', async () => {
    const templateId = 'tpl-blank';
    const projectId = 'proj-456';
    const projectPayload = {
      name: 'Blank Project',
      siteAddress: null,
      clientName: null,
      description: null,
    };

    const createdProject: Project = {
      id: projectId,
      name: projectPayload.name,
      description: projectPayload.description,
      siteAddress: projectPayload.siteAddress,
      clientName: projectPayload.clientName,
      status: 'active',
      priority: 0,
      createdAt: 2000,
      updatedAt: 2000,
      completedAt: null,
      createdBy: null,
      isDeleted: 0,
      deletedAt: null,
    };

    (templateRepository.getById as jest.Mock).mockResolvedValue({
      id: templateId,
      name: 'Blank Project',
      description: null,
      type: 'project_structure',
      content: JSON.stringify({ sections: [] }),
      isDefault: 1,
      usageCount: 0,
      createdAt: 1000,
      updatedAt: 1000,
      isDeleted: 0,
      deletedAt: null,
    });

    (projectRepository.createProjectWithIssues as jest.Mock).mockResolvedValue(createdProject);

    const result = await createProjectFromTemplate(templateId, projectPayload);

    expect(projectRepository.createProjectWithIssues).toHaveBeenCalledTimes(1);
    expect(projectRepository.createProjectWithIssues).toHaveBeenCalledWith(projectPayload, []);
    expect(issueRepository.create).not.toHaveBeenCalled();
    expect(result).toEqual(createdProject);
  });

  it('infers compliance category from template name', async () => {
    const templateId = 'tpl-compliance-1';
    const projectPayload = {
      name: 'Compliance Audit',
      siteAddress: 'Site A',
      clientName: 'Client A',
      description: null,
    };

    (templateRepository.getById as jest.Mock).mockResolvedValue({
      id: templateId,
      name: 'Compliance Inspection',
      description: null,
      type: 'project_structure',
      content: JSON.stringify({ sections: ['Fire Safety', 'Accessibility'] }),
      isDefault: 0,
      usageCount: 0,
      createdAt: 1000,
      updatedAt: 1000,
      isDeleted: 0,
      deletedAt: null,
    });

    (projectRepository.createProjectWithIssues as jest.Mock).mockResolvedValue({ id: 'proj-1' });

    await createProjectFromTemplate(templateId, projectPayload);

    expect(projectRepository.createProjectWithIssues).toHaveBeenCalledWith(
      projectPayload,
      expect.arrayContaining([
        expect.objectContaining({ category: 'compliance' }),
      ])
    );
  });

  it('infers quality from snagging in template name', async () => {
    (templateRepository.getById as jest.Mock).mockResolvedValue({
      id: 'tpl-snag',
      name: 'Snagging List',
      description: null,
      type: 'project_structure',
      content: JSON.stringify({ sections: ['Paint', 'Tiles'] }),
      isDefault: 0,
      usageCount: 0,
      createdAt: 1000,
      updatedAt: 1000,
      isDeleted: 0,
      deletedAt: null,
    });
    (projectRepository.createProjectWithIssues as jest.Mock).mockResolvedValue({ id: 'proj-1' });

    await createProjectFromTemplate('tpl-snag', { name: 'Snag Project' });

    expect(projectRepository.createProjectWithIssues).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([expect.objectContaining({ category: 'quality' })])
    );
  });

  it('infers environmental category from template name', async () => {
    (templateRepository.getById as jest.Mock).mockResolvedValue({
      id: 'tpl-env',
      name: 'Environmental Check',
      description: null,
      type: 'project_structure',
      content: JSON.stringify({ sections: ['Waste', 'Air Quality'] }),
      isDefault: 0,
      usageCount: 0,
      createdAt: 1000,
      updatedAt: 1000,
      isDeleted: 0,
      deletedAt: null,
    });
    (projectRepository.createProjectWithIssues as jest.Mock).mockResolvedValue({ id: 'proj-1' });

    await createProjectFromTemplate('tpl-env', { name: 'Env Project' });

    expect(projectRepository.createProjectWithIssues).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([expect.objectContaining({ category: 'environmental' })])
    );
  });

  it('throws an error when template is not found', async () => {
    const templateId = 'tpl-missing';
    const projectPayload = { name: 'Test' };

    (templateRepository.getById as jest.Mock).mockResolvedValue(null);

    await expect(createProjectFromTemplate(templateId, projectPayload)).rejects.toThrow(
      `Template not found: ${templateId}`
    );
    expect(projectRepository.createProjectWithIssues).not.toHaveBeenCalled();
  });
});

describe('createCustomTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a custom template via repository', async () => {
    const created = {
      id: 'tpl-1',
      name: 'Custom',
      description: 'Desc',
      type: 'project_structure',
      content: JSON.stringify({ sections: ['A', 'B'] }),
      isDefault: 0,
      usageCount: 0,
      createdAt: 1000,
      updatedAt: 1000,
      isDeleted: 0,
      deletedAt: null,
    };
    (templateRepository.create as jest.Mock).mockResolvedValue(created);

    const result = await createCustomTemplate('Custom', 'Desc', ['A', 'B']);

    expect(templateRepository.create).toHaveBeenCalledWith({
      name: 'Custom',
      description: 'Desc',
      type: 'project_structure',
      content: JSON.stringify({ sections: ['A', 'B'] }),
    });
    expect(result).toEqual(created);
  });
});

describe('deleteCustomTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes a custom template via repository', async () => {
    (templateRepository.delete as jest.Mock).mockResolvedValue(undefined);

    await deleteCustomTemplate('tpl-1');

    expect(templateRepository.delete).toHaveBeenCalledWith('tpl-1');
  });
});

describe('editCustomTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (templateRepository.update as jest.Mock).mockImplementation(mockTemplateRepositoryUpdate);
  });

  it('updates template name, description, and categories via repository', async () => {
    const updatedTemplate = {
      id: 'custom-abc',
      name: 'Updated Name',
      description: 'Updated Desc',
      type: 'project_structure',
      content: JSON.stringify({ sections: ['A', 'B'] }),
      isDefault: 0,
      usageCount: 0,
      createdAt: 1000,
      updatedAt: 2000,
      isDeleted: 0,
      deletedAt: null,
    };

    mockTemplateRepositoryUpdate.mockResolvedValue(updatedTemplate);

    const result = await editCustomTemplate('custom-abc', 'Updated Name', 'Updated Desc', [
      'A',
      'B',
    ]);

    expect(templateRepository.update).toHaveBeenCalledWith('custom-abc', {
      name: 'Updated Name',
      description: 'Updated Desc',
      content: JSON.stringify({ sections: ['A', 'B'] }),
    });
    expect(result).toEqual(updatedTemplate);
  });

  it('passes empty string description when empty string provided', async () => {
    mockTemplateRepositoryUpdate.mockResolvedValue({ id: 'custom-abc', name: 'Name' });

    await editCustomTemplate('custom-abc', 'Name', '', ['X']);

    expect(templateRepository.update).toHaveBeenCalledWith('custom-abc', {
      name: 'Name',
      description: '',
      content: JSON.stringify({ sections: ['X'] }),
    });
  });
});
