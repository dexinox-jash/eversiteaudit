import { parseDeepLink, deepLinkRouteToPath } from '@services/deepLink/deepLinkHandler';

describe('parseDeepLink', () => {
  it('returns null for empty or invalid URLs', () => {
    expect(parseDeepLink('')).toBeNull();
    expect(parseDeepLink('not-a-url')).toBeNull();
    expect(parseDeepLink('https://other-app.com/projects/1')).toBeNull();
  });

  it('parses custom scheme root to projects list', () => {
    expect(parseDeepLink('eversiteaudit://')).toEqual({ type: 'projects' });
    expect(parseDeepLink('eversiteaudit://projects')).toEqual({ type: 'projects' });
  });

  it('parses custom scheme project detail', () => {
    expect(parseDeepLink('eversiteaudit://projects/proj-123')).toEqual({
      type: 'projects',
      projectId: 'proj-123',
    });
  });

  it('parses custom scheme issue detail', () => {
    expect(parseDeepLink('eversiteaudit://issues/issue-456')).toEqual({
      type: 'issues',
      issueId: 'issue-456',
    });
  });

  it('parses custom scheme photo viewer', () => {
    expect(parseDeepLink('eversiteaudit://photos/photo-789')).toEqual({
      type: 'photos',
      photoId: 'photo-789',
    });
  });

  it('parses custom scheme settings', () => {
    expect(parseDeepLink('eversiteaudit://settings')).toEqual({ type: 'settings' });
  });

  it('parses custom scheme export', () => {
    expect(parseDeepLink('eversiteaudit://export')).toEqual({ type: 'export' });
  });

  it('parses web URL project detail', () => {
    expect(parseDeepLink('https://eversiteaudit.app/projects/proj-abc')).toEqual({
      type: 'projects',
      projectId: 'proj-abc',
    });
  });

  it('parses web URL with www subdomain', () => {
    expect(parseDeepLink('https://www.eversiteaudit.app/issues/issue-xyz')).toEqual({
      type: 'issues',
      issueId: 'issue-xyz',
    });
  });

  it('returns unknown for unrecognized paths', () => {
    expect(parseDeepLink('eversiteaudit://unknown/path')).toEqual({ type: 'unknown' });
  });

  it('returns unknown for photos without an id', () => {
    expect(parseDeepLink('eversiteaudit://photos')).toEqual({ type: 'unknown' });
  });

  it('falls back to regex parsing when URL constructor throws', () => {
    expect(parseDeepLink('eversiteaudit://[bad')).toEqual({ type: 'unknown' });
  });

  it('falls back to web regex parsing when URL constructor throws', () => {
    expect(parseDeepLink('https://eversiteaudit.app/[bad')).toEqual({ type: 'unknown' });
  });
});

describe('deepLinkRouteToPath', () => {
  it('converts projects list to root path', () => {
    expect(deepLinkRouteToPath({ type: 'projects' })).toBe('/');
  });

  it('converts project detail to project path', () => {
    expect(deepLinkRouteToPath({ type: 'projects', projectId: 'p1' })).toBe('/projects/p1');
  });

  it('converts issues list to issues path', () => {
    expect(deepLinkRouteToPath({ type: 'issues' })).toBe('/issues');
  });

  it('converts issue detail to issue path', () => {
    expect(deepLinkRouteToPath({ type: 'issues', issueId: 'i1' })).toBe('/issues/i1');
  });

  it('converts photos to photo path', () => {
    expect(deepLinkRouteToPath({ type: 'photos', photoId: 'ph1' })).toBe('/photos/ph1');
  });

  it('converts settings to settings path', () => {
    expect(deepLinkRouteToPath({ type: 'settings' })).toBe('/settings');
  });

  it('converts export to export path', () => {
    expect(deepLinkRouteToPath({ type: 'export' })).toBe('/export');
  });

  it('returns null for unknown routes', () => {
    expect(deepLinkRouteToPath({ type: 'unknown' })).toBeNull();
  });
});
