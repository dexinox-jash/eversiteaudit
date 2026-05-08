export type DeepLinkRoute =
  | { type: 'projects'; projectId?: string }
  | { type: 'issues'; issueId?: string }
  | { type: 'photos'; photoId: string }
  | { type: 'settings' }
  | { type: 'export' }
  | { type: 'unknown' };

const APP_SCHEME = 'eversiteaudit';
const WEB_HOST = 'eversiteaudit.app';

/**
 * Parse a deep link URL into a structured route.
 * Supports both custom scheme (eversiteaudit://) and web URLs (https://eversiteaudit.app).
 */
export function parseDeepLink(url: string): DeepLinkRoute | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  let path: string | null = null;

  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol.replace(':', '');

    if (protocol === APP_SCHEME) {
      // Custom scheme: eversiteaudit://path
      // The URL parser treats the first segment as the host for custom schemes,
      // so we reconstruct the full path from host + pathname.
      path = parsed.host ? `/${parsed.host}${parsed.pathname || ''}` : parsed.pathname || '/';
    } else if (protocol === 'https' || protocol === 'http') {
      // Web URL: https://eversiteaudit.app/path
      if (parsed.host === WEB_HOST || parsed.host === `www.${WEB_HOST}`) {
        path = parsed.pathname || '/';
      }
    }
  } catch {
    // Fallback for URLs that may not parse correctly in some environments
    const schemeMatch = url.match(new RegExp(`^${APP_SCHEME}://(.+)$`));
    if (schemeMatch?.[1]) {
      path = `/${schemeMatch[1]}`;
    } else {
      const webMatch = url.match(new RegExp(`^https?://(?:www\\.)?${WEB_HOST}/(.+)$`));
      if (webMatch?.[1]) {
        path = `/${webMatch[1]}`;
      }
    }
  }

  if (!path) {
    return null;
  }

  // Normalize path: remove trailing slash and ensure leading slash
  path = path.replace(/\/+$/, '');
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  const segments = path.split('/').filter(Boolean);

  if (segments.length === 0) {
    return { type: 'projects' };
  }

  const [resource, id] = segments;

  switch (resource) {
    case 'projects':
      return id ? { type: 'projects', projectId: id } : { type: 'projects' };
    case 'issues':
      return id ? { type: 'issues', issueId: id } : { type: 'issues' };
    case 'photos':
      return id ? { type: 'photos', photoId: id } : { type: 'unknown' };
    case 'settings':
      return { type: 'settings' };
    case 'export':
      return { type: 'export' };
    default:
      return { type: 'unknown' };
  }
}

/**
 * Convert a deep link route into a navigable Expo Router path.
 */
export function deepLinkRouteToPath(route: DeepLinkRoute): string | null {
  switch (route.type) {
    case 'projects':
      return route.projectId ? `/projects/${route.projectId}` : '/';
    case 'issues':
      return route.issueId ? `/issues/${route.issueId}` : '/issues';
    case 'photos':
      return `/photos/${route.photoId}`;
    case 'settings':
      return '/settings';
    case 'export':
      return '/export';
    case 'unknown':
    default:
      return null;
  }
}
