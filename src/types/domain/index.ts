/**
 * Domain model type definitions.
 * These represent the core entities of the application.
 */

export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
  version: number;
}

export interface UserProfile extends BaseEntity {
  email: string;
  displayName: string;
  avatarUrl?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  language: string;
}

export interface AuditSession extends BaseEntity {
  userId: string;
  siteUrl: string;
  startedAt: number;
  completedAt?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  score?: number;
  findings: AuditFinding[];
}

export interface AuditFinding extends BaseEntity {
  sessionId: string;
  category: 'security' | 'performance' | 'accessibility' | 'seo';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
}
