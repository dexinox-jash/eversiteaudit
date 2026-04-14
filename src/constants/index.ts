/**
 * Application-wide constants.
 * Keep this file focused on immutable values that do not change at runtime.
 */

export const APP_NAME = 'EverSiteAudit' as const;
export const APP_VERSION = '0.0.1' as const;

export const API_TIMEOUT_MS = 30000 as const;
export const MAX_RETRY_ATTEMPTS = 3 as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  LAST_SYNC_TIMESTAMP: 'last_sync_timestamp',
} as const;

export const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
