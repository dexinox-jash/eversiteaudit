/**
 * Domain model type definitions.
 * Source: .documentation/ARCHITECTURE.md — Data Architecture
 */

export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface SoftDeletable {
  isDeleted: number; // 0 = false, 1 = true
  deletedAt: number | null;
}

// ------------------------------------------------------------------
// Project
// ------------------------------------------------------------------
export type ProjectStatus = 'active' | 'completed' | 'archived';
export type ProjectPriority = 0 | 1 | 2 | 3; // low, medium, high, critical

export interface Project extends BaseEntity, SoftDeletable {
  name: string;
  description: string | null;
  siteAddress: string | null;
  clientName: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  completedAt: number | null;
  createdBy: string | null;
}

// ------------------------------------------------------------------
// Issue
// ------------------------------------------------------------------
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type IssueCategory = 'safety' | 'quality' | 'compliance' | 'environmental' | 'other';

export interface Issue extends BaseEntity, SoftDeletable {
  projectId: string;
  title: string;
  description: string | null;
  category: IssueCategory | null;
  severity: IssueSeverity;
  status: IssueStatus;
  locationDescription: string | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsAccuracy: number | null;
  assignedTo: string | null;
  dueDate: number | null;
  resolutionNotes: string | null;
  resolvedAt: number | null;
  resolvedBy: string | null;
}

// ------------------------------------------------------------------
// Photo
// ------------------------------------------------------------------
export interface Photo extends BaseEntity, SoftDeletable {
  projectId: string;
  issueId: string | null;
  originalPath: string;
  thumbnailPath: string;
  compressedPath: string | null;
  captureTimestamp: number | null;
  cameraMake: string | null;
  cameraModel: string | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsAltitude: number | null;
  width: number | null;
  height: number | null;
  fileSizeBytes: number | null;
  caption: string | null;
  tags: string; // JSON array string
}

// ------------------------------------------------------------------
// Annotation (Photo Markup)
// ------------------------------------------------------------------
export type AnnotationType = 'arrow' | 'circle' | 'rectangle' | 'text' | 'highlight';

export interface Annotation extends BaseEntity, SoftDeletable {
  photoId: string;
  type: AnnotationType;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  rotation: number;
  color: string;
  strokeWidth: number;
  textContent: string | null;
  fontSize: number | null;
}

// ------------------------------------------------------------------
// Template
// ------------------------------------------------------------------
export type TemplateType = 'project_structure' | 'issue_categories' | 'export_format';

export interface Template extends BaseEntity, SoftDeletable {
  name: string;
  description: string | null;
  type: TemplateType;
  content: string; // JSON
  isDefault: number; // 0 = false, 1 = true
  usageCount: number;
}

// ------------------------------------------------------------------
// Setting (Key-Value Store)
// ------------------------------------------------------------------
export type SettingValueType = 'string' | 'int' | 'double' | 'bool' | 'json';

export interface Setting {
  key: string;
  value: string | null;
  valueType: SettingValueType;
  updatedAt: number;
}

// ------------------------------------------------------------------
// Export History
// ------------------------------------------------------------------
export type ExportType = 'pdf' | 'zip' | 'json';

export interface ExportHistory {
  id: string;
  projectId: string;
  exportType: ExportType;
  fileName: string;
  fileSizeBytes: number | null;
  exportTimestamp: number;
  passwordProtected: number; // 0 = false, 1 = true
  success: number; // 0 = false, 1 = true
  errorMessage: string | null;
}
