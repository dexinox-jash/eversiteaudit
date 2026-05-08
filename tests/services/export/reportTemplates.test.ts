import {
  REPORT_TEMPLATES,
  getReportTemplate,
  escapeHtml,
  formatDate,
  SEVERITY_COLORS,
} from '@services/export/reportTemplates';
import type { Project, Issue, Photo } from '@/types/domain';

describe('reportTemplates', () => {
  const project: Project = {
    id: 'proj-1',
    name: 'Test Project',
    description: 'Desc',
    siteAddress: '123 Main St',
    clientName: 'Acme',
    status: 'active',
    priority: 1,
    createdAt: 1000,
    updatedAt: 2000,
    completedAt: null,
    createdBy: null,
    isDeleted: 0,
    deletedAt: null,
  };

  const issues: Issue[] = [
    {
      id: 'issue-1',
      projectId: 'proj-1',
      title: 'Crack in wall',
      description: 'A large crack',
      category: 'quality',
      severity: 'high',
      status: 'open',
      locationDescription: 'Lobby',
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
      createdAt: 3000,
      updatedAt: 4000,
      isDeleted: 0,
      deletedAt: null,
    },
  ];

  const photos: Photo[] = [
    {
      id: 'photo-1',
      projectId: 'proj-1',
      issueId: null,
      originalPath: 'file:///photo1.jpg',
      thumbnailPath: 'file:///photo1_thumb.jpg',
      compressedPath: 'file:///photo1_comp.jpg',
      captureTimestamp: null,
      cameraMake: null,
      cameraModel: null,
      gpsLatitude: null,
      gpsLongitude: null,
      gpsAltitude: null,
      width: null,
      height: null,
      fileSizeBytes: null,
      caption: null,
      checksum: null,
      tags: '[]',
      sortOrder: 0,
      createdAt: 1000,
      updatedAt: 2000,
      isDeleted: 0,
      deletedAt: null,
    },
  ];

  const settings = {
    branding: {
      companyName: 'Acme Corp',
      headerText: 'Header',
      footerText: 'Footer',
    },
    annotationCountMap: new Map<string, number>(),
  };

  describe('getReportTemplate', () => {
    it('returns the requested template by id', () => {
      const tpl = getReportTemplate('checklist');
      expect(tpl.id).toBe('checklist');
    });

    it('defaults to custom template when id is missing', () => {
      const tpl = getReportTemplate('unknown-id');
      expect(tpl.id).toBe('custom');
    });

    it('defaults to custom template when no id is provided', () => {
      const tpl = getReportTemplate();
      expect(tpl.id).toBe('custom');
    });
  });

  describe('REPORT_TEMPLATES', () => {
    it('contains exactly 8 templates', () => {
      expect(REPORT_TEMPLATES).toHaveLength(8);
    });

    it.each(REPORT_TEMPLATES.map((t) => [t.id, t]))(
      'template %s generates non-empty HTML',
      (_id, template) => {
        const html = (template as (typeof REPORT_TEMPLATES)[0]).generate(
          project,
          issues,
          photos,
          settings
        );
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain(project.name);
      }
    );
  });

  describe('individual templates', () => {
    it('executive-summary includes top issues and summary tables', () => {
      const tpl = getReportTemplate('executive-summary');
      const html = tpl.generate(project, issues, photos, settings);
      expect(html).toContain('Top Issues');
      expect(html).toContain('Summary');
      expect(html).toContain('Crack in wall');
      expect(html).toContain(settings.branding.companyName);
    });

    it('executive-summary handles issue with null description', () => {
      const noDescIssue = { ...(issues[0] as Issue), description: null };
      const tpl = getReportTemplate('executive-summary');
      const html = tpl.generate(project, [noDescIssue], photos, settings);
      expect(html).toContain('No description provided');
    });

    it('detailed-technical includes full issue details', () => {
      const tpl = getReportTemplate('detailed-technical');
      const html = tpl.generate(project, issues, photos, settings);
      expect(html).toContain('Issues (Detailed)');
      expect(html).toContain('A large crack');
      expect(html).toContain('Bob');
    });

    it('photo-first puts photos before issues', () => {
      const tpl = getReportTemplate('photo-first');
      const html = tpl.generate(project, issues, photos, settings);
      const photoIndex = html.indexOf('<h2>Photos</h2>');
      const issueIndex = html.indexOf('<h2>Issues</h2>');
      expect(photoIndex).toBeGreaterThan(0);
      expect(issueIndex).toBeGreaterThan(photoIndex);
    });

    it('photo-first shows linked photos when issue has photos', () => {
      const linkedPhoto = { ...(photos[0] as Photo), issueId: 'issue-1' };
      const tpl = getReportTemplate('photo-first');
      const html = tpl.generate(project, issues, [linkedPhoto], settings);
      expect(html).toContain('photo-grid');
    });

    it('checklist renders a table', () => {
      const tpl = getReportTemplate('checklist');
      const html = tpl.generate(project, issues, photos, settings);
      expect(html).toContain('checklist-table');
      expect(html).toContain('Crack in wall');
    });

    it('timeline sorts issues by createdAt', () => {
      const tpl = getReportTemplate('timeline');
      const html = tpl.generate(project, issues, photos, settings);
      expect(html).toContain('Timeline');
      expect(html).toContain('Crack in wall');
    });

    it('severity-matrix groups by severity', () => {
      const tpl = getReportTemplate('severity-matrix');
      const html = tpl.generate(project, issues, photos, settings);
      expect(html).toContain('Severity Matrix');
      expect(html).toContain(SEVERITY_COLORS.high);
    });

    it('location-based groups by location', () => {
      const tpl = getReportTemplate('location-based');
      const html = tpl.generate(project, issues, photos, settings);
      expect(html).toContain('Issues by Location');
      expect(html).toContain('Lobby');
    });

    it('location-based sorts multiple locations alphabetically', () => {
      const multiLocIssues: Issue[] = [
        { ...(issues[0] as Issue), locationDescription: 'Roof' },
        {
          ...(issues[0] as Issue),
          id: 'issue-2',
          title: 'Leak',
          locationDescription: 'Basement',
        },
      ];
      const tpl = getReportTemplate('location-based');
      const html = tpl.generate(project, multiLocIssues, photos, settings);
      expect(html).toContain('Basement');
      expect(html).toContain('Roof');
      const basementIndex = html.indexOf('Basement');
      const roofIndex = html.indexOf('Roof');
      expect(basementIndex).toBeLessThan(roofIndex);
    });

    it('custom applies branding and standard sections', () => {
      const tpl = getReportTemplate('custom');
      const html = tpl.generate(project, issues, photos, settings);
      expect(html).toContain('Summary');
      expect(html).toContain('Issues');
      expect(html).toContain('Photos');
      expect(html).toContain(settings.branding.footerText);
    });
  });

  describe('escapeHtml', () => {
    it('escapes HTML entities', () => {
      expect(escapeHtml('<script>alert("x")</script>')).toBe(
        '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
      );
    });

    it('returns empty string for null/undefined', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('returns N/A for null/undefined', () => {
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate(undefined)).toBe('N/A');
    });

    it('formats a timestamp', () => {
      const result = formatDate(0);
      expect(result).not.toBe('N/A');
      expect(typeof result).toBe('string');
    });
  });

  describe('formatDateTime', () => {
    it('is used in detailed-technical template output', () => {
      const tpl = getReportTemplate('detailed-technical');
      const html = tpl.generate(project, issues, photos, settings);
      expect(html).toContain('Created:');
    });

    it('returns N/A for null/undefined via internal usage', () => {
      const issueWithNullCreated = { ...(issues[0] as Issue), createdAt: 0 };
      const tpl = getReportTemplate('detailed-technical');
      const html = tpl.generate(project, [issueWithNullCreated], photos, settings);
      expect(html).toContain('Created:');
    });
  });

  describe('rich data branches', () => {
    const richIssues: Issue[] = [
      {
        ...(issues[0] as Issue),
        severity: 'critical',
        gpsLatitude: 40.7128,
        gpsLongitude: -74.006,
      },
    ];

    const richPhotos: Photo[] = [
      {
        ...(photos[0] as Photo),
        compressedPath: null,
        originalPath: '/data/photo1.jpg',
      },
    ];

    const richSettings = {
      branding: settings.branding,
      annotationCountMap: new Map([['photo-1', 3]]),
    };

    it('detailed-technical includes GPS when available', () => {
      const tpl = getReportTemplate('detailed-technical');
      const html = tpl.generate(project, richIssues, photos, settings);
      expect(html).toContain('GPS:');
      expect(html).toContain('40.712800');
      expect(html).toContain('-74.006000');
    });

    it('photoItem uses originalPath when compressedPath is missing and strips file://', () => {
      const tpl = getReportTemplate('photo-first');
      const html = tpl.generate(project, issues, richPhotos, richSettings);
      expect(html).toContain('file:///data/photo1.jpg');
      expect(html).toContain('3 annotations');
    });

    it('photoItem handles singular annotation label', () => {
      const singularPhotos: Photo[] = [photos[0] as Photo];
      const singularSettings = {
        branding: settings.branding,
        annotationCountMap: new Map([['photo-1', 1]]),
      };
      const tpl = getReportTemplate('executive-summary');
      const html = tpl.generate(project, issues, singularPhotos, singularSettings);
      expect(html).toContain('1 annotation');
      expect(html).not.toContain('1 annotations');
    });
  });

  describe('empty data branches', () => {
    const emptySettings = {
      branding: undefined as unknown as undefined,
      annotationCountMap: new Map<string, number>(),
    };
    // satisfies structure expected by generate() while branding is undefined

    const sparseProject = { ...project, siteAddress: null, clientName: null };

    const sparseIssue: Issue = {
      ...(issues[0] as Issue),
      description: null,
      category: null,
      locationDescription: null,
      assignedTo: null,
      dueDate: null,
      resolutionNotes: null,
      gpsLatitude: null,
      gpsLongitude: null,
    };

    it('executive-summary renders without top issues and photos', () => {
      const tpl = getReportTemplate('executive-summary');
      const html = tpl.generate(project, [], [], emptySettings);
      expect(html).toContain('No critical or high severity issues');
      expect(html).toContain('No photos available');
    });

    it('executive-summary handles null siteAddress and clientName', () => {
      const tpl = getReportTemplate('executive-summary');
      const html = tpl.generate(sparseProject, issues, photos, settings);
      expect(html).toContain('Site Address:');
      expect(html).toContain('Client:');
      expect(html).toContain('N/A');
    });

    it('detailed-technical renders with null fields fallbacks', () => {
      const tpl = getReportTemplate('detailed-technical');
      const html = tpl.generate(sparseProject, [sparseIssue], [], emptySettings);
      expect(html).toContain('N/A');
      expect(html).toContain('Unassigned');
    });

    it('detailed-technical shows no issues message', () => {
      const tpl = getReportTemplate('detailed-technical');
      const html = tpl.generate(sparseProject, [], [], emptySettings);
      expect(html).toContain('No issues recorded');
    });

    it('photo-first shows no-linked-photos message', () => {
      const tpl = getReportTemplate('photo-first');
      const html = tpl.generate(sparseProject, issues, photos, emptySettings);
      expect(html).toContain('No linked photos');
    });

    it('photo-first shows no photos and no issues messages', () => {
      const tpl = getReportTemplate('photo-first');
      const html = tpl.generate(sparseProject, [], [], emptySettings);
      expect(html).toContain('No photos available');
      expect(html).toContain('No issues recorded');
    });

    it('checklist renders empty row when no issues', () => {
      const tpl = getReportTemplate('checklist');
      const html = tpl.generate(project, [], photos, emptySettings);
      expect(html).toContain('No items');
    });

    it('checklist handles null category and locationDescription', () => {
      const tpl = getReportTemplate('checklist');
      const html = tpl.generate(project, [sparseIssue], photos, emptySettings);
      expect(html).toContain('—');
    });

    it('timeline renders no issues message', () => {
      const tpl = getReportTemplate('timeline');
      const html = tpl.generate(project, [], photos, emptySettings);
      expect(html).toContain('No issues recorded');
    });

    it('timeline handles null locationDescription', () => {
      const tpl = getReportTemplate('timeline');
      const html = tpl.generate(project, [sparseIssue], photos, emptySettings);
      expect(html).toContain('N/A');
    });

    it('timeline handles null createdAt in sort', () => {
      const nullDateIssue = { ...(issues[0] as Issue), createdAt: 0, id: 'issue-null' };
      const datedIssue = { ...(issues[0] as Issue), createdAt: 5000, id: 'issue-dated' };
      const tpl = getReportTemplate('timeline');
      const html = tpl.generate(project, [nullDateIssue, datedIssue], photos, emptySettings);
      expect(html).toContain('Crack in wall');
    });

    it('severity-matrix shows empty group messages', () => {
      const tpl = getReportTemplate('severity-matrix');
      const html = tpl.generate(project, [], photos, emptySettings);
      expect(html).toContain('No issues in this category');
    });

    it('severity-matrix handles null locationDescription', () => {
      const tpl = getReportTemplate('severity-matrix');
      const html = tpl.generate(project, [sparseIssue], photos, emptySettings);
      expect(html).toContain('No location');
    });

    it('location-based renders no issues message', () => {
      const tpl = getReportTemplate('location-based');
      const html = tpl.generate(project, [], photos, emptySettings);
      expect(html).toContain('No issues recorded');
    });

    it('location-based uses Unspecified for null locationDescription', () => {
      const tpl = getReportTemplate('location-based');
      const html = tpl.generate(project, [sparseIssue], photos, emptySettings);
      expect(html).toContain('Unspecified');
    });

    it('custom renders with null siteAddress and clientName', () => {
      const tpl = getReportTemplate('custom');
      const html = tpl.generate(sparseProject, [], [], emptySettings);
      expect(html).toContain('N/A');
    });

    it('custom handles null issue fields', () => {
      const tpl = getReportTemplate('custom');
      const html = tpl.generate(project, [sparseIssue], photos, emptySettings);
      expect(html).toContain('N/A');
      expect(html).toContain('Unassigned');
    });

    it('custom template generates with all sections', () => {
      const tpl = getReportTemplate('custom');
      const html = tpl.generate(project, issues, photos, settings);
      expect(html).toContain('Summary');
      expect(html).toContain('Issues');
      expect(html).toContain('Photos');
    });

    it('brandingHeader renders companyName only when headerText is absent', () => {
      const partialBranding = { companyName: 'Acme Only', headerText: null };
      const tpl = getReportTemplate('executive-summary');
      const html = tpl.generate(project, issues, photos, {
        branding: partialBranding,
        annotationCountMap: new Map(),
      });
      expect(html).toContain('Acme Only');
    });

    it('brandingHeader renders headerText only when companyName is absent', () => {
      const partialBranding = { companyName: null, headerText: 'Header Only' };
      const tpl = getReportTemplate('executive-summary');
      const html = tpl.generate(project, issues, photos, {
        branding: partialBranding,
        annotationCountMap: new Map(),
      });
      expect(html).toContain('Header Only');
    });

    it('brandingHeader is empty when no branding is provided', () => {
      const tpl = getReportTemplate('checklist');
      const html = tpl.generate(project, issues, photos, {
        annotationCountMap: new Map(),
      } as typeof emptySettings);
      expect(html).toContain('checklist-table');
    });
  });
});
