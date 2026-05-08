import { z } from 'zod';
import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import { projectRepository, issueRepository, photoRepository } from '@services/db/repositories';
import type { Project } from '@/types/domain';
import { joinPath } from '@services/export/shareExport';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().nullable().optional(),
  siteAddress: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  priority: z.number().int().min(0).max(3).optional(),
});

const issueSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Issue title is required'),
  description: z.string().nullable().optional(),
  category: z
    .enum(['safety', 'quality', 'compliance', 'environmental', 'other'])
    .nullable()
    .optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  locationDescription: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
  dueDate: z.number().nullable().optional(),
});

const photoSchema = z.object({
  originalPath: z.string().min(1, 'Photo path is required'),
  thumbnailPath: z.string().optional(),
  compressedPath: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  checksum: z.string().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  fileSizeBytes: z.number().nullable().optional(),
  gpsLatitude: z.number().nullable().optional(),
  gpsLongitude: z.number().nullable().optional(),
  gpsAltitude: z.number().nullable().optional(),
  cameraMake: z.string().nullable().optional(),
  cameraModel: z.string().nullable().optional(),
  captureTimestamp: z.number().nullable().optional(),
  tags: z.string().optional(),
  issueId: z.string().nullable().optional(),
});

const exportDataSchema = z.object({
  project: projectSchema,
  issues: z.array(issueSchema).default([]),
  photos: z.array(photoSchema).default([]),
  exportedAt: z.string().optional(),
});

const zipProjectSchema = z.object({
  project: projectSchema,
  issues: z
    .array(
      issueSchema.extend({
        id: z.string().optional(),
        photos: z.array(photoSchema).default([]),
      })
    )
    .default([]),
});

export interface ImportPreview {
  projectName: string;
  issueCount: number;
  photoCount: number;
}

export interface ImportResult {
  project: Project;
  issuesCreated: number;
  photosCreated: number;
}

function generateId(): string {
  return crypto.randomUUID();
}

async function ensureUniqueProjectName(name: string): Promise<string> {
  const existing = await projectRepository.getAll();
  const names = new Set(existing.map((p) => p.name));
  let uniqueName = name;
  let suffix = 1;
  while (names.has(uniqueName)) {
    uniqueName = `${name} (Imported${suffix > 1 ? ` ${suffix}` : ''})`;
    suffix++;
  }
  return uniqueName;
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/\.{2,}/g, '_')
    .replace(/[/\\]/g, '_')
    .replace(/^\.+/, '_');
}

async function copyPhotoToAppDirectory(
  sourceBase64: string,
  fileName: string
): Promise<{ originalPath: string; thumbnailPath: string }> {
  const photoDir = joinPath(FileSystem.documentDirectory, 'photos');
  const dirInfo = await FileSystem.getInfoAsync(photoDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(photoDir, { intermediates: true });
  }

  const safeName = sanitizeFileName(fileName);
  const uniqueName = `${Date.now()}_${safeName}`;
  const originalPath = joinPath(photoDir, uniqueName);
  await FileSystem.writeAsStringAsync(originalPath, sourceBase64, {
    encoding: 'base64',
  });

  // Use original as thumbnail for imported photos
  const thumbnailPath = originalPath;

  return { originalPath, thumbnailPath };
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function parseImportPreview(jsonString: string): Promise<ImportPreview> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON: could not parse file');
  }

  const validation = exportDataSchema.safeParse(parsed);
  if (!validation.success) {
    const zipValidation = zipProjectSchema.safeParse(parsed);
    if (!zipValidation.success) {
      throw new Error(
        `Schema validation failed: ${validation.error.errors.map((e) => e.message).join(', ')}`
      );
    }
    const data = zipValidation.data;
    const photoCount = data.issues.reduce((sum, issue) => sum + (issue.photos?.length ?? 0), 0);
    return {
      projectName: data.project.name,
      issueCount: data.issues.length,
      photoCount,
    };
  }

  const data = validation.data;
  return {
    projectName: data.project.name,
    issueCount: data.issues.length,
    photoCount: data.photos.length,
  };
}

export async function importFromJSON(jsonString: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON: could not parse file');
  }

  const validation = exportDataSchema.safeParse(parsed);
  if (!validation.success) {
    throw new Error(
      `Schema validation failed: ${validation.error.errors.map((e) => e.message).join(', ')}`
    );
  }

  const data = validation.data;
  const projectName = await ensureUniqueProjectName(data.project.name);

  const project = await projectRepository.create({
    name: projectName,
    description: data.project.description ?? null,
    siteAddress: data.project.siteAddress ?? null,
    clientName: data.project.clientName ?? null,
    status: data.project.status ?? 'active',
    priority: (data.project.priority ?? 0) as Project['priority'],
  });

  // Create issues and map old issue IDs to new ones
  const oldIssueIdToNew = new Map<string, string>();
  for (const issueData of data.issues) {
    const newIssue = await issueRepository.create({
      projectId: project.id,
      title: issueData.title,
      description: issueData.description ?? null,
      category: issueData.category ?? null,
      severity: issueData.severity ?? 'medium',
      status: issueData.status ?? 'open',
      locationDescription: issueData.locationDescription ?? null,
      assignedTo: issueData.assignedTo ?? null,
      dueDate: issueData.dueDate ?? null,
    });
    const oldId = issueData.id ?? generateId();
    oldIssueIdToNew.set(oldId, newIssue.id);
  }

  let photosCreated = 0;
  for (const photoData of data.photos) {
    const mappedIssueId = photoData.issueId
      ? (oldIssueIdToNew.get(photoData.issueId) ?? null)
      : null;

    await photoRepository.create({
      projectId: project.id,
      issueId: mappedIssueId,
      originalPath: photoData.originalPath,
      thumbnailPath: photoData.thumbnailPath ?? photoData.originalPath,
      compressedPath: photoData.compressedPath ?? null,
      caption: photoData.caption ?? null,
      checksum: photoData.checksum ?? null,
      width: photoData.width ?? null,
      height: photoData.height ?? null,
      fileSizeBytes: photoData.fileSizeBytes ?? null,
      gpsLatitude: photoData.gpsLatitude ?? null,
      gpsLongitude: photoData.gpsLongitude ?? null,
      gpsAltitude: photoData.gpsAltitude ?? null,
      cameraMake: photoData.cameraMake ?? null,
      cameraModel: photoData.cameraModel ?? null,
      captureTimestamp: photoData.captureTimestamp ?? null,
      tags: photoData.tags ?? '[]',
    });
    photosCreated++;
  }

  return {
    project,
    issuesCreated: data.issues.length,
    photosCreated,
  };
}

export async function importFromZIP(zipPath: string): Promise<ImportResult> {
  const zipBase64 = await FileSystem.readAsStringAsync(zipPath, {
    encoding: 'base64',
  });

  const zip = await JSZip.loadAsync(zipBase64, { base64: true });

  const projectJsonFile = zip.file('project.json');
  if (!projectJsonFile) {
    throw new Error('Invalid ZIP: project.json not found');
  }

  const projectJsonString = await projectJsonFile.async('string');
  let parsed: unknown;
  try {
    parsed = JSON.parse(projectJsonString);
  } catch {
    throw new Error('Invalid JSON in ZIP: could not parse project.json');
  }

  // Try flat format first, then nested format
  let projectData: z.infer<typeof projectSchema>;
  let issuesData: Array<z.infer<typeof issueSchema> & { photos: z.infer<typeof photoSchema>[] }> =
    [];
  let photosData: z.infer<typeof photoSchema>[] = [];

  const flatValidation = exportDataSchema.safeParse(parsed);
  if (flatValidation.success) {
    projectData = flatValidation.data.project;
    issuesData = flatValidation.data.issues.map((i) => ({
      ...i,
      photos: [] as z.infer<typeof photoSchema>[],
    }));
    photosData = flatValidation.data.photos;
  } else {
    const zipValidation = zipProjectSchema.safeParse(parsed);
    if (!zipValidation.success) {
      throw new Error(
        `Schema validation failed: ${zipValidation.error.errors.map((e) => e.message).join(', ')}`
      );
    }
    projectData = zipValidation.data.project;
    issuesData = zipValidation.data.issues;
    photosData = [];
  }

  const projectName = await ensureUniqueProjectName(projectData.name);

  const project = await projectRepository.create({
    name: projectName,
    description: projectData.description ?? null,
    siteAddress: projectData.siteAddress ?? null,
    clientName: projectData.clientName ?? null,
    status: projectData.status ?? 'active',
    priority: (projectData.priority ?? 0) as Project['priority'],
  });

  // Create issues and map old issue IDs to new ones
  const oldIssueIdToNew = new Map<string, string>();
  for (const issueData of issuesData) {
    const newIssue = await issueRepository.create({
      projectId: project.id,
      title: issueData.title,
      description: issueData.description ?? null,
      category: issueData.category ?? null,
      severity: issueData.severity ?? 'medium',
      status: issueData.status ?? 'open',
      locationDescription: issueData.locationDescription ?? null,
      assignedTo: issueData.assignedTo ?? null,
      dueDate: issueData.dueDate ?? null,
    });
    const oldId = issueData.id ?? generateId();
    oldIssueIdToNew.set(oldId, newIssue.id);
  }

  // Collect all photos with their target issue IDs
  const allPhotos: Array<{ photo: z.infer<typeof photoSchema>; issueId: string | null }> = [];

  if (photosData.length > 0) {
    // Flat format
    for (const photo of photosData) {
      const mappedIssueId = photo.issueId ? (oldIssueIdToNew.get(photo.issueId) ?? null) : null;
      allPhotos.push({ photo, issueId: mappedIssueId });
    }
  } else {
    // Nested format: issues have photos array
    for (const issueData of issuesData) {
      const newIssueId = oldIssueIdToNew.get(issueData.id ?? '') ?? null;
      const issuePhotos = issueData.photos ?? [];
      for (const photo of issuePhotos) {
        allPhotos.push({ photo, issueId: newIssueId });
      }
    }
  }

  const photosFolder = zip.folder('photos');
  let photosCreated = 0;

  for (const { photo, issueId } of allPhotos) {
    const fileName = photo.originalPath.split(/[/\\]/).pop() ?? photo.originalPath;
    const zipPhotoFile = photosFolder?.file(fileName);

    let originalPath = photo.originalPath;
    let thumbnailPath = photo.thumbnailPath ?? photo.originalPath;

    if (zipPhotoFile) {
      const photoBase64 = await zipPhotoFile.async('base64');
      const paths = await copyPhotoToAppDirectory(photoBase64, fileName);
      originalPath = paths.originalPath;
      thumbnailPath = paths.thumbnailPath;
    }

    await photoRepository.create({
      projectId: project.id,
      issueId,
      originalPath,
      thumbnailPath,
      compressedPath: photo.compressedPath ?? null,
      caption: photo.caption ?? null,
      checksum: photo.checksum ?? null,
      width: photo.width ?? null,
      height: photo.height ?? null,
      fileSizeBytes: photo.fileSizeBytes ?? null,
      gpsLatitude: photo.gpsLatitude ?? null,
      gpsLongitude: photo.gpsLongitude ?? null,
      gpsAltitude: photo.gpsAltitude ?? null,
      cameraMake: photo.cameraMake ?? null,
      cameraModel: photo.cameraModel ?? null,
      captureTimestamp: photo.captureTimestamp ?? null,
      tags: photo.tags ?? '[]',
    });
    photosCreated++;
  }

  return {
    project,
    issuesCreated: issuesData.length,
    photosCreated,
  };
}
