import { Share } from 'react-native';

const APP_SCHEME = 'eversiteaudit';

function buildShareMessage(entityType: string, url: string): string {
  return `Check out this ${entityType} on EverSiteAudit: ${url}`;
}

function buildDeepLink(path: string): string {
  return `${APP_SCHEME}://${path}`;
}

/**
 * Share a project via the native share sheet.
 * Generates a deep link that opens the project detail screen.
 */
export async function shareProject(projectId: string): Promise<void> {
  const url = buildDeepLink(`projects/${projectId}`);
  const message = buildShareMessage('site audit project', url);
  try {
    await Share.share({ message });
  } catch {
    // Ignore share cancellation or errors
  }
}

/**
 * Share an issue via the native share sheet.
 * Generates a deep link that opens the issue detail screen.
 */
export async function shareIssue(issueId: string): Promise<void> {
  const url = buildDeepLink(`issues/${issueId}`);
  const message = buildShareMessage('issue', url);
  try {
    await Share.share({ message });
  } catch {
    // Ignore share cancellation or errors
  }
}

/**
 * Share a photo via the native share sheet.
 * Generates a deep link that opens the photo viewer screen.
 */
export async function sharePhoto(photoId: string, photoPath?: string): Promise<void> {
  const url = buildDeepLink(`photos/${photoId}`);
  const message = buildShareMessage('photo', url);
  try {
    await Share.share({
      message,
      url: photoPath,
    });
  } catch {
    // Ignore share cancellation or errors
  }
}
