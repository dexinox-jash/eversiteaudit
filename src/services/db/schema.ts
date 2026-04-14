/**
 * Database schema definitions.
 * Source: .documentation/ARCHITECTURE.md — Data Architecture
 */

export const CURRENT_SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
-- Schema version: ${CURRENT_SCHEMA_VERSION}

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    site_address TEXT,
    client_name TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    priority INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    completed_at INTEGER,
    created_by TEXT,
    is_deleted INTEGER DEFAULT 0,
    deleted_at INTEGER
) STRICT;

CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    severity TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    location_description TEXT,
    gps_latitude REAL,
    gps_longitude REAL,
    gps_accuracy REAL,
    assigned_to TEXT,
    due_date INTEGER,
    resolution_notes TEXT,
    resolved_at INTEGER,
    resolved_by TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    deleted_at INTEGER,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    issue_id TEXT,
    original_path TEXT NOT NULL,
    thumbnail_path TEXT NOT NULL,
    compressed_path TEXT,
    capture_timestamp INTEGER,
    camera_make TEXT,
    camera_model TEXT,
    gps_latitude REAL,
    gps_longitude REAL,
    gps_altitude REAL,
    width INTEGER,
    height INTEGER,
    file_size_bytes INTEGER,
    caption TEXT,
    tags TEXT DEFAULT '[]',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    deleted_at INTEGER,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE SET NULL
) STRICT;

CREATE TABLE IF NOT EXISTS annotations (
    id TEXT PRIMARY KEY,
    photo_id TEXT NOT NULL,
    type TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL,
    height REAL,
    rotation REAL DEFAULT 0,
    color TEXT DEFAULT '#FF0000',
    stroke_width REAL DEFAULT 2.0,
    text_content TEXT,
    font_size REAL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    deleted_at INTEGER,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    deleted_at INTEGER
) STRICT;

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    value_type TEXT DEFAULT 'string',
    updated_at INTEGER NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS export_history (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    export_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes INTEGER,
    export_timestamp INTEGER NOT NULL,
    password_protected INTEGER DEFAULT 0,
    success INTEGER DEFAULT 1,
    error_message TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) STRICT;
`;

export const CREATE_INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_deleted ON projects(is_deleted) WHERE is_deleted = 0;

CREATE INDEX IF NOT EXISTS idx_issues_project ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_updated ON issues(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_deleted ON issues(is_deleted) WHERE is_deleted = 0;

CREATE INDEX IF NOT EXISTS idx_photos_project ON photos(project_id);
CREATE INDEX IF NOT EXISTS idx_photos_issue ON photos(issue_id) WHERE issue_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photos_created ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_deleted ON photos(is_deleted) WHERE is_deleted = 0;

CREATE INDEX IF NOT EXISTS idx_annotations_photo ON annotations(photo_id);
CREATE INDEX IF NOT EXISTS idx_annotations_deleted ON annotations(is_deleted) WHERE is_deleted = 0;

CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_default ON templates(is_default) WHERE is_default = 1;

CREATE INDEX IF NOT EXISTS idx_export_history_project ON export_history(project_id);
CREATE INDEX IF NOT EXISTS idx_export_history_timestamp ON export_history(export_timestamp DESC);
`;

export const SEED_DEFAULT_TEMPLATES_SQL = `
INSERT OR IGNORE INTO templates (id, name, description, type, content, is_default, usage_count, created_at, updated_at)
VALUES
  ('tmpl-blank', 'Blank Project', 'Start from scratch', 'project_structure', '{"sections":[]}', 1, 0, ?1, ?1),
  ('tmpl-safety', 'Safety Inspection', 'Standard safety checklist', 'project_structure', '{"sections":["PPE","Fall Protection","Electrical","Fire Safety"]}', 0, 0, ?1, ?1),
  ('tmpl-snagging', 'Snagging List', 'New build defect tracking', 'project_structure', '{"sections":["Finishes","M&E","External","Internal"]}', 0, 0, ?1, ?1),
  ('tmpl-quality', 'Quality Control', 'QA review template', 'project_structure', '{"sections":["Materials","Workmanship","Compliance","Documentation"]}', 0, 0, ?1, ?1);
`;
