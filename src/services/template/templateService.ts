import { projectRepository, templateRepository } from '@services/db/repositories';
import type { CreateProjectPayload } from '@services/db/repositories';
import type { Project, IssueCategory, Template } from '@/types/domain';

/** Parse Template Content. */
export function parseTemplateContent(content: string): { sections: string[] } {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'sections' in parsed &&
      Array.isArray((parsed as { sections: unknown }).sections)
    ) {
      return {
        sections: (parsed as { sections: unknown[] }).sections.filter(
          (s): s is string => typeof s === 'string'
        ),
      };
    }
  } catch {
    // fall through to default
  }
  return { sections: [] };
}

function inferCategoryFromTemplateName(name: string): IssueCategory {
  const lower = name.toLowerCase();
  if (lower.includes('safety')) return 'safety';
  if (lower.includes('quality') || lower.includes('snagging')) return 'quality';
  if (lower.includes('compliance')) return 'compliance';
  if (lower.includes('environmental')) return 'environmental';
  return 'other';
}

/** Create Project From Template. */
export async function createProjectFromTemplate(
  templateId: string,
  projectPayload: CreateProjectPayload
): Promise<Project> {
  const template = await templateRepository.getById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const { sections } = parseTemplateContent(template.content);
  const category = inferCategoryFromTemplateName(template.name);

  const issues = sections.map((section) => ({
    title: section,
    category,
    severity: 'medium' as const,
    status: 'open' as const,
  }));

  return projectRepository.createProjectWithIssues(projectPayload, issues);
}

/** Create Custom Template. */
export async function createCustomTemplate(
  name: string,
  description: string | null,
  categories: string[]
): Promise<Template> {
  const content = JSON.stringify({ sections: categories });
  return templateRepository.create({
    name,
    description,
    type: 'project_structure',
    content,
  });
}

/** Edit Custom Template. */
export async function editCustomTemplate(
  id: string,
  name: string,
  description: string | null,
  categories: string[]
): Promise<Template> {
  const content = JSON.stringify({ sections: categories });
  return templateRepository.update(id, {
    name,
    description,
    content,
  });
}

/** Delete Custom Template. */
export async function deleteCustomTemplate(id: string): Promise<void> {
  return templateRepository.delete(id);
}
