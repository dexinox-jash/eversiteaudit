import { issueRepository, photoRepository } from '@services/db/repositories';
import type { Issue } from '@/types/domain';

/**
 * Duplicates an issue and links all its photos to the new issue.
 * Photos are referenced (same file paths) rather than physically duplicated on disk.
 */
export async function duplicateIssue(issueId: string): Promise<Issue> {
  const originalIssue = await issueRepository.getById(issueId);
  if (!originalIssue) {
    throw new Error(`Issue not found: ${issueId}`);
  }

  const duplicatedIssue = await issueRepository.create({
    projectId: originalIssue.projectId,
    title: `${originalIssue.title} (Copy)`,
    description: originalIssue.description,
    category: originalIssue.category,
    severity: originalIssue.severity,
    status: originalIssue.status,
    locationDescription: originalIssue.locationDescription,
    assignedTo: originalIssue.assignedTo,
    dueDate: originalIssue.dueDate,
  });

  const originalPhotos = await photoRepository.getByIssueId(issueId);
  for (const photo of originalPhotos) {
    await photoRepository.create({
      projectId: photo.projectId,
      issueId: duplicatedIssue.id,
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

  return duplicatedIssue;
}
