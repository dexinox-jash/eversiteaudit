import { projectRepository, issueRepository, photoRepository } from '@services/db/repositories';
import type { Project } from '@/types/domain';

/**
 * Duplicates a project including all its issues and photos.
 * Photos are linked (same file paths) rather than physically duplicated on disk.
 */
export async function duplicateProject(projectId: string): Promise<Project> {
  const originalProject = await projectRepository.getById(projectId);
  if (!originalProject) {
    throw new Error(`Project not found: ${projectId}`);
  }

  // Duplicate project row
  const duplicatedProject = await projectRepository.create({
    name: `${originalProject.name} (Copy)`,
    description: originalProject.description,
    siteAddress: originalProject.siteAddress,
    clientName: originalProject.clientName,
    status: originalProject.status,
    priority: originalProject.priority,
  });

  // Get all issues for the original project and duplicate them
  const originalIssues = await issueRepository.getByProjectId(projectId);
  const issueIdMap = new Map<string, string>();

  for (const issue of originalIssues) {
    const duplicatedIssue = await issueRepository.create({
      projectId: duplicatedProject.id,
      title: `${issue.title} (Copy)`,
      description: issue.description,
      category: issue.category,
      severity: issue.severity,
      status: issue.status,
      locationDescription: issue.locationDescription,
      assignedTo: issue.assignedTo,
      dueDate: issue.dueDate,
    });
    issueIdMap.set(issue.id, duplicatedIssue.id);
  }

  // Duplicate photos: same file paths, linked to new project/issues
  const originalPhotos = await photoRepository.getByProjectId(projectId);
  for (const photo of originalPhotos) {
    await photoRepository.create({
      projectId: duplicatedProject.id,
      issueId: photo.issueId ? (issueIdMap.get(photo.issueId) ?? null) : null,
      originalPath: photo.originalPath,
      thumbnailPath: photo.thumbnailPath,
      compressedPath: photo.compressedPath,
      captureTimestamp: photo.captureTimestamp,
      cameraMake: photo.cameraMake,
      cameraModel: photo.cameraModel,
      gpsLatitude: photo.gpsLatitude,
      gpsLongitude: photo.gpsLongitude,
      gpsAltitude: photo.gpsAltitude,
      width: photo.width,
      height: photo.height,
      fileSizeBytes: photo.fileSizeBytes,
      caption: photo.caption,
      checksum: photo.checksum,
      tags: photo.tags,
    });
  }

  return duplicatedProject;
}
