import type { Project, Issue, Photo, IssueSeverity, IssueStatus } from '@/types/domain';
import type { PDFBranding } from './pdfExport';

export interface ReportTemplateSettings {
  branding?: PDFBranding | undefined;
  annotationCountMap: Map<string, number>;
}

export type ReportTemplateId =
  | 'executive-summary'
  | 'detailed-technical'
  | 'photo-first'
  | 'checklist'
  | 'timeline'
  | 'severity-matrix'
  | 'location-based'
  | 'custom';

export interface ReportTemplate {
  id: ReportTemplateId;
  name: string;
  description: string;
  generate: (
    project: Project,
    issues: Issue[],
    photos: Photo[],
    settings: ReportTemplateSettings
  ) => string;
}

export const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#CA8A04',
  low: '#2563EB',
};

export const STATUS_COLORS: Record<IssueStatus, string> = {
  open: '#4B5563',
  in_progress: '#4A9EFF',
  resolved: '#06D6A0',
  closed: '#8B949E',
};

/** Escape Html. */
export function escapeHtml(text: string | null | undefined): string {
  if (text == null) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Format Date. */
export function formatDate(timestamp: number | null | undefined): string {
  if (timestamp == null) return 'N/A';
  return new Date(timestamp).toLocaleDateString();
}

function formatDateTime(timestamp: number | null | undefined): string {
  if (timestamp == null) return 'N/A';
  return new Date(timestamp).toLocaleString();
}

function commonHead(): string {
  return `
  <meta charset="utf-8" />
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: Arial, sans-serif;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
      font-size: 14px;
      line-height: 1.5;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      box-sizing: border-box;
      page-break-after: always;
    }
    .page:last-child {
      page-break-after: auto;
    }
    h1 {
      font-size: 28px;
      margin-bottom: 8px;
    }
    h2 {
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 8px;
    }
    h3 {
      font-size: 16px;
      margin-top: 0;
      margin-bottom: 6px;
    }
    .cover-meta {
      margin-top: 24px;
      color: #333;
    }
    .cover-meta p {
      margin: 4px 0;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    .summary-table th,
    .summary-table td {
      border: 1px solid #ccc;
      padding: 8px 12px;
      text-align: left;
    }
    .summary-table th {
      background: #f5f5f5;
    }
    .issue {
      border-bottom: 1px solid #ddd;
      padding: 16px 0;
    }
    .issue p {
      margin: 4px 0;
    }
    .issue:last-child {
      border-bottom: none;
    }
    .meta {
      margin-bottom: 8px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      color: #fff;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin-right: 6px;
    }
    .badge.status {
      background-color: #4b5563;
    }
    .branding-company {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .branding-header {
      font-size: 14px;
      color: #555;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #ddd;
    }
    .branding-footer {
      font-size: 12px;
      color: #666;
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #ddd;
      text-align: center;
    }
    .photo-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 2%;
      margin-top: 16px;
    }
    .photo-item {
      width: 48%;
      margin-bottom: 16px;
    }
    .photo-item img {
      width: 100%;
      height: auto;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    .photo-item-large {
      width: 100%;
      margin-bottom: 16px;
    }
    .photo-item-large img {
      width: 100%;
      height: auto;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    .checklist-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    .checklist-table th,
    .checklist-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      font-size: 13px;
    }
    .checklist-table th {
      background: #f0f0f0;
    }
    .timeline-row {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
    }
    .timeline-date {
      min-width: 100px;
      font-weight: bold;
      color: #555;
    }
    .timeline-content {
      flex: 1;
      border-left: 2px solid #ddd;
      padding-left: 16px;
    }
    .matrix-section {
      margin-bottom: 24px;
    }
    .matrix-header {
      padding: 8px 12px;
      border-radius: 4px;
      color: #fff;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .location-section {
      margin-bottom: 20px;
    }
    .location-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #ddd;
    }
  </style>
  `.trim();
}

function brandingHeader(branding?: PDFBranding): string {
  if (!branding?.companyName && !branding?.headerText) return '';
  return `
    ${branding.companyName ? `<div class="branding-company">${escapeHtml(branding.companyName)}</div>` : ''}
    ${branding.headerText ? `<div class="branding-header">${escapeHtml(branding.headerText)}</div>` : ''}
  `;
}

function brandingFooter(branding?: PDFBranding): string {
  if (!branding?.footerText) return '';
  return `<div class="branding-footer">${escapeHtml(branding.footerText)}</div>`;
}

function issueMeta(issue: Issue): string {
  return `
    <div class="meta">
      <span class="badge" style="background-color: ${SEVERITY_COLORS[issue.severity]};">${escapeHtml(issue.severity)}</span>
      <span class="badge status">${escapeHtml(issue.status)}</span>
    </div>
  `;
}

function photoItem(photo: Photo, annotationCountMap: Map<string, number>, large = false): string {
  let src = escapeHtml(photo.compressedPath ?? photo.originalPath);
  // Avoid double file:// prefix
  if (src.startsWith('file://')) {
    src = src.replace('file://', '');
  }
  const annCount = annotationCountMap.get(photo.id) ?? 0;
  const annLabel =
    annCount > 0
      ? `<p style="font-size:12px;color:#666;margin-top:4px;">${annCount} annotation${annCount === 1 ? '' : 's'}</p>`
      : '';
  const cls = large ? 'photo-item-large' : 'photo-item';
  return `<div class="${cls}"><img src="file://${src}" />${annLabel}</div>`;
}

function severityCountsHtml(issues: Issue[]): string {
  const counts: Record<IssueSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  issues.forEach((i) => {
    counts[i.severity]++;
  });
  return `
    <table class="summary-table">
      <thead><tr><th>Severity</th><th>Count</th></tr></thead>
      <tbody>
        <tr><td>Critical</td><td>${counts.critical}</td></tr>
        <tr><td>High</td><td>${counts.high}</td></tr>
        <tr><td>Medium</td><td>${counts.medium}</td></tr>
        <tr><td>Low</td><td>${counts.low}</td></tr>
      </tbody>
    </table>
  `;
}

function statusCountsHtml(issues: Issue[]): string {
  const counts: Record<IssueStatus, number> = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
  issues.forEach((i) => {
    counts[i.status]++;
  });
  return `
    <table class="summary-table" style="margin-top: 24px;">
      <thead><tr><th>Status</th><th>Count</th></tr></thead>
      <tbody>
        <tr><td>Open</td><td>${counts.open}</td></tr>
        <tr><td>In Progress</td><td>${counts.in_progress}</td></tr>
        <tr><td>Resolved</td><td>${counts.resolved}</td></tr>
        <tr><td>Closed</td><td>${counts.closed}</td></tr>
      </tbody>
    </table>
  `;
}

const executiveSummaryTemplate: ReportTemplate = {
  id: 'executive-summary',
  name: 'Executive Summary',
  description: 'High-level overview with key metrics and top issues.',
  generate(project, issues, photos, settings) {
    const topIssues = issues.filter((i) => i.severity === 'critical' || i.severity === 'high');
    const topIssuesHtml = topIssues
      .map(
        (issue) => `
        <div class="issue">
          <h3>${escapeHtml(issue.title)}</h3>
          ${issueMeta(issue)}
          <p>${escapeHtml(issue.description) || 'No description provided.'}</p>
        </div>
      `
      )
      .join('');
    const photoItems = photos
      .slice(0, 4)
      .map((p) => photoItem(p, settings.annotationCountMap))
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>${commonHead()}</head>
<body>
  <div class="page">
    ${brandingHeader(settings.branding)}
    <h1>${escapeHtml(project.name)}</h1>
    <div class="cover-meta">
      <p><strong>Site Address:</strong> ${escapeHtml(project.siteAddress) || 'N/A'}</p>
      <p><strong>Client:</strong> ${escapeHtml(project.clientName) || 'N/A'}</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Total Issues:</strong> ${issues.length}</p>
      <p><strong>Total Photos:</strong> ${photos.length}</p>
    </div>
  </div>

  <div class="page">
    <h2>Summary</h2>
    ${severityCountsHtml(issues)}
    ${statusCountsHtml(issues)}
  </div>

  <div class="page">
    <h2>Top Issues</h2>
    ${topIssuesHtml || '<p>No critical or high severity issues.</p>'}
  </div>

  <div class="page">
    <h2>Photos</h2>
    <div class="photo-grid">
      ${photoItems || '<p>No photos available.</p>'}
    </div>
    ${brandingFooter(settings.branding)}
  </div>
</body>
</html>
    `.trim();
  },
};

const detailedTechnicalTemplate: ReportTemplate = {
  id: 'detailed-technical',
  name: 'Detailed Technical',
  description: 'Comprehensive report with all issue details and photos.',
  generate(project, issues, photos, settings) {
    const issueSections = issues
      .map(
        (issue) => `
        <div class="issue">
          <h3>${escapeHtml(issue.title)}</h3>
          ${issueMeta(issue)}
          <p><strong>Category:</strong> ${escapeHtml(issue.category) || 'N/A'}</p>
          <p><strong>Description:</strong> ${escapeHtml(issue.description) || 'N/A'}</p>
          <p><strong>Location:</strong> ${escapeHtml(issue.locationDescription) || 'N/A'}</p>
          <p><strong>Assigned To:</strong> ${escapeHtml(issue.assignedTo) || 'Unassigned'}</p>
          <p><strong>Due Date:</strong> ${formatDate(issue.dueDate)}</p>
          <p><strong>Created:</strong> ${formatDateTime(issue.createdAt)}</p>
          <p><strong>Resolution Notes:</strong> ${escapeHtml(issue.resolutionNotes) || 'N/A'}</p>
          ${issue.gpsLatitude != null && issue.gpsLongitude != null ? `<p><strong>GPS:</strong> ${issue.gpsLatitude.toFixed(6)}, ${issue.gpsLongitude.toFixed(6)}</p>` : ''}
        </div>
      `
      )
      .join('');
    const photoItems = photos.map((p) => photoItem(p, settings.annotationCountMap)).join('');

    return `
<!DOCTYPE html>
<html>
<head>${commonHead()}</head>
<body>
  <div class="page">
    ${brandingHeader(settings.branding)}
    <h1>${escapeHtml(project.name)}</h1>
    <div class="cover-meta">
      <p><strong>Site Address:</strong> ${escapeHtml(project.siteAddress) || 'N/A'}</p>
      <p><strong>Client:</strong> ${escapeHtml(project.clientName) || 'N/A'}</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Total Issues:</strong> ${issues.length}</p>
      <p><strong>Total Photos:</strong> ${photos.length}</p>
    </div>
  </div>

  <div class="page">
    <h2>Issues (Detailed)</h2>
    ${issueSections || '<p>No issues recorded.</p>'}
  </div>

  <div class="page">
    <h2>Photos</h2>
    <div class="photo-grid">
      ${photoItems || '<p>No photos available.</p>'}
    </div>
    ${brandingFooter(settings.branding)}
  </div>
</body>
</html>
    `.trim();
  },
};

const photoFirstTemplate: ReportTemplate = {
  id: 'photo-first',
  name: 'Photo-First',
  description: 'Photos take center stage, followed by linked issues.',
  generate(project, issues, photos, settings) {
    const photoItems = photos.map((p) => photoItem(p, settings.annotationCountMap, true)).join('');
    const issueSections = issues
      .map((issue) => {
        const linkedPhotos = photos.filter((p) => p.issueId === issue.id);
        const thumbs = linkedPhotos.map((p) => photoItem(p, settings.annotationCountMap)).join('');
        return `
          <div class="issue">
            <h3>${escapeHtml(issue.title)}</h3>
            ${issueMeta(issue)}
            ${thumbs ? `<div class="photo-grid">${thumbs}</div>` : '<p style="font-size:12px;color:#666;">No linked photos.</p>'}
          </div>
        `;
      })
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>${commonHead()}</head>
<body>
  <div class="page">
    ${brandingHeader(settings.branding)}
    <h1>${escapeHtml(project.name)}</h1>
    <div class="cover-meta">
      <p><strong>Site Address:</strong> ${escapeHtml(project.siteAddress) || 'N/A'}</p>
      <p><strong>Client:</strong> ${escapeHtml(project.clientName) || 'N/A'}</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>
  </div>

  <div class="page">
    <h2>Photos</h2>
    ${photoItems || '<p>No photos available.</p>'}
  </div>

  <div class="page">
    <h2>Issues</h2>
    ${issueSections || '<p>No issues recorded.</p>'}
    ${brandingFooter(settings.branding)}
  </div>
</body>
</html>
    `.trim();
  },
};

const checklistTemplate: ReportTemplate = {
  id: 'checklist',
  name: 'Checklist',
  description: 'Compact table layout ideal for field reviews.',
  generate(project, issues, _photos, settings) {
    const rows = issues
      .map(
        (issue) => `
        <tr>
          <td>${escapeHtml(issue.title)}</td>
          <td><span class="badge" style="background-color: ${SEVERITY_COLORS[issue.severity]};">${escapeHtml(issue.severity)}</span></td>
          <td><span class="badge status">${escapeHtml(issue.status)}</span></td>
          <td>${escapeHtml(issue.category) || '—'}</td>
          <td>${escapeHtml(issue.locationDescription) || '—'}</td>
        </tr>
      `
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>${commonHead()}</head>
<body>
  <div class="page">
    ${brandingHeader(settings.branding)}
    <h1>${escapeHtml(project.name)}</h1>
    <div class="cover-meta">
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Total Items:</strong> ${issues.length}</p>
    </div>
  </div>

  <div class="page">
    <h2>Checklist</h2>
    <table class="checklist-table">
      <thead>
        <tr><th>Item</th><th>Severity</th><th>Status</th><th>Category</th><th>Location</th></tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="5">No items.</td></tr>'}
      </tbody>
    </table>
    ${brandingFooter(settings.branding)}
  </div>
</body>
</html>
    `.trim();
  },
};

const timelineTemplate: ReportTemplate = {
  id: 'timeline',
  name: 'Timeline',
  description: 'Issues arranged chronologically by creation date.',
  generate(project, issues, _photos, settings) {
    const sorted = [...issues].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    const rows = sorted
      .map(
        (issue) => `
        <div class="timeline-row">
          <div class="timeline-date">${formatDate(issue.createdAt)}</div>
          <div class="timeline-content">
            <strong>${escapeHtml(issue.title)}</strong>
            ${issueMeta(issue)}
            <p>Due: ${formatDate(issue.dueDate)} | Location: ${escapeHtml(issue.locationDescription) || 'N/A'}</p>
          </div>
        </div>
      `
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>${commonHead()}</head>
<body>
  <div class="page">
    ${brandingHeader(settings.branding)}
    <h1>${escapeHtml(project.name)}</h1>
    <div class="cover-meta">
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Total Issues:</strong> ${issues.length}</p>
    </div>
  </div>

  <div class="page">
    <h2>Timeline</h2>
    ${rows || '<p>No issues recorded.</p>'}
    ${brandingFooter(settings.branding)}
  </div>
</body>
</html>
    `.trim();
  },
};

const severityMatrixTemplate: ReportTemplate = {
  id: 'severity-matrix',
  name: 'Severity Matrix',
  description: 'Issues grouped into color-coded severity quadrants.',
  generate(project, issues, _photos, settings) {
    const severities: IssueSeverity[] = ['critical', 'high', 'medium', 'low'];
    const sections = severities
      .map((sev) => {
        const group = issues.filter((i) => i.severity === sev);
        const items = group
          .map(
            (issue) => `
            <div class="issue" style="border-bottom:none;padding:8px 0;">
              <strong>${escapeHtml(issue.title)}</strong>
              <span class="badge status" style="margin-left:8px;">${escapeHtml(issue.status)}</span>
              <p style="margin:2px 0;font-size:12px;color:#555;">${escapeHtml(issue.locationDescription) || 'No location'}</p>
            </div>
          `
          )
          .join('');
        return `
          <div class="matrix-section">
            <div class="matrix-header" style="background-color: ${SEVERITY_COLORS[sev]};">${escapeHtml(sev)} (${group.length})</div>
            ${items || '<p style="font-size:13px;color:#666;">No issues in this category.</p>'}
          </div>
        `;
      })
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>${commonHead()}</head>
<body>
  <div class="page">
    ${brandingHeader(settings.branding)}
    <h1>${escapeHtml(project.name)}</h1>
    <div class="cover-meta">
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Total Issues:</strong> ${issues.length}</p>
    </div>
  </div>

  <div class="page">
    <h2>Severity Matrix</h2>
    ${sections}
    ${brandingFooter(settings.branding)}
  </div>
</body>
</html>
    `.trim();
  },
};

const locationBasedTemplate: ReportTemplate = {
  id: 'location-based',
  name: 'Location-Based',
  description: 'Issues organized by site location.',
  generate(project, issues, _photos, settings) {
    const locations = new Map<string, Issue[]>();
    issues.forEach((issue) => {
      const loc = issue.locationDescription ?? 'Unspecified';
      const group = locations.get(loc) ?? [];
      group.push(issue);
      locations.set(loc, group);
    });
    const sortedLocations = Array.from(locations.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    const sections = sortedLocations
      .map(([loc, group]) => {
        const items = group
          .map(
            (issue) => `
            <div class="issue" style="padding:8px 0;">
              <strong>${escapeHtml(issue.title)}</strong>
              ${issueMeta(issue)}
            </div>
          `
          )
          .join('');
        return `
          <div class="location-section">
            <div class="location-title">${escapeHtml(loc)}</div>
            ${items}
          </div>
        `;
      })
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>${commonHead()}</head>
<body>
  <div class="page">
    ${brandingHeader(settings.branding)}
    <h1>${escapeHtml(project.name)}</h1>
    <div class="cover-meta">
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Total Issues:</strong> ${issues.length}</p>
      <p><strong>Locations:</strong> ${locations.size}</p>
    </div>
  </div>

  <div class="page">
    <h2>Issues by Location</h2>
    ${sections || '<p>No issues recorded.</p>'}
    ${brandingFooter(settings.branding)}
  </div>
</body>
</html>
    `.trim();
  },
};

const customTemplate: ReportTemplate = {
  id: 'custom',
  name: 'Custom',
  description: 'Uses your company branding settings.',
  generate(project, issues, photos, settings) {
    const issueSections = issues
      .map(
        (issue) => `
        <div class="issue">
          <h2>${escapeHtml(issue.title)}</h2>
          ${issueMeta(issue)}
          <p><strong>Description:</strong> ${escapeHtml(issue.description) || 'N/A'}</p>
          <p><strong>Location:</strong> ${escapeHtml(issue.locationDescription) || 'N/A'}</p>
          <p><strong>Assigned To:</strong> ${escapeHtml(issue.assignedTo) || 'Unassigned'}</p>
          <p><strong>Due Date:</strong> ${formatDate(issue.dueDate)}</p>
        </div>
      `
      )
      .join('');
    const photoItems = photos.map((p) => photoItem(p, settings.annotationCountMap)).join('');

    return `
<!DOCTYPE html>
<html>
<head>${commonHead()}</head>
<body>
  <div class="page">
    ${brandingHeader(settings.branding)}
    <h1>${escapeHtml(project.name)}</h1>
    <div class="cover-meta">
      <p><strong>Site Address:</strong> ${escapeHtml(project.siteAddress) || 'N/A'}</p>
      <p><strong>Client:</strong> ${escapeHtml(project.clientName) || 'N/A'}</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Total Issues:</strong> ${issues.length}</p>
      <p><strong>Total Photos:</strong> ${photos.length}</p>
    </div>
  </div>

  <div class="page">
    <h2>Summary</h2>
    ${severityCountsHtml(issues)}
    ${statusCountsHtml(issues)}
  </div>

  <div class="page">
    <h2>Issues</h2>
    ${issueSections || '<p>No issues recorded.</p>'}
  </div>

  <div class="page">
    <h2>Photos</h2>
    <div class="photo-grid">
      ${photoItems || '<p>No photos available.</p>'}
    </div>
    ${brandingFooter(settings.branding)}
  </div>
</body>
</html>
    `.trim();
  },
};

export const REPORT_TEMPLATES: ReportTemplate[] = [
  executiveSummaryTemplate,
  detailedTechnicalTemplate,
  photoFirstTemplate,
  checklistTemplate,
  timelineTemplate,
  severityMatrixTemplate,
  locationBasedTemplate,
  customTemplate,
];

/** Get Report Template. */
export function getReportTemplate(id?: string): ReportTemplate {
  return REPORT_TEMPLATES.find((t) => t.id === id) ?? customTemplate;
}
