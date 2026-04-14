# database.md — Data Architecture & Storage Standards

> **Parent:** `master.md`  
> **Read this for:** Any data model, schema change, local storage implementation, API integration, or sync strategy.

---

## 1. Data Architecture Principles

### 1.1 Offline-First by Default
This mobile application must function gracefully without a constant network connection.
- All critical user data is cached locally.
- API calls queue when offline and sync when connectivity returns.
- UI reflects local state immediately; server reconciliation happens in the background.

### 1.2 Data Sovereignty & Privacy
- Personal data is stored encrypted at rest on the device.
- Minimize data sent to servers; prefer edge computation where possible.
- Compliance targets: GDPR (right to erasure), CCPA (data transparency).

### 1.3 Immutable Data Patterns
- Treat stored data as immutable where feasible.
- Use versioning for records that change over time.
- Append-only logs for audit-sensitive operations.

---

## 2. Local Storage Stack

### 2.1 Recommended Technologies
| Use Case | Technology | Rationale |
|----------|------------|-----------|
| Structured relational data | `sqlite` (via `expo-sqlite` or `react-native-sqlite-storage`) | ACID, queryable, well-supported |
| Key-value pairs (tokens, flags) | `expo-secure-store` / `react-native-keychain` | Encrypted, OS-backed |
| Large binary data (images, docs) | File system (`expo-file-system`) | Avoid bloating the database |
| Caching (ephemeral) | `AsyncStorage` (non-sensitive only) | Simple, fast, but **never** for secrets |

### 2.2 Security Requirements for Local Storage
- **Secrets:** Must use `expo-secure-store` (iOS Keychain / Android Keystore).
- **Database:** Enable SQLCipher encryption for SQLite if storing PII.
- **Backups:** Exclude sensitive databases from cloud backups (Android `allowBackup=false`, iOS `com.apple.developer.default-data-protection`).
- **Sanitization:** All values written to SQLite must use parameterized queries.

---

## 3. Schema Design Standards

### 3.1 Naming Conventions
- Tables: `snake_case`, plural (`users`, `audit_logs`)
- Columns: `snake_case` (`created_at`, `user_id`)
- TypeScript interfaces: `PascalCase` (`UserProfile`, `AuditLogEntry`)

### 3.2 Required Columns
Every table must include:
| Column | Type | Purpose |
|--------|------|---------|
| `id` | TEXT (UUID) | Primary key |
| `created_at` | INTEGER (Unix ms) | Creation timestamp |
| `updated_at` | INTEGER (Unix ms) | Last modification timestamp |
| `sync_status` | TEXT | `synced`, `pending`, `conflict` |
| `version` | INTEGER | Optimistic locking / conflict resolution |

### 3.3 Relationships
- Use foreign keys with `ON DELETE CASCADE` where appropriate.
- Many-to-many relationships require a join table.
- Avoid nullable foreign keys unless semantically necessary.

### 3.4 Mobile-Specific Optimizations
- Normalize to 3NF for writes; denormalize read-only views if query performance demands it.
- Index columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses.
- Pagination at the database level (`LIMIT` / `OFFSET` or cursor-based).

---

## 4. API & Backend Integration

### 4.1 API Client Architecture
- All API calls go through a single `ApiClient` adapter (deep module).
- The adapter handles: base URL, auth headers, retries, timeouts, error mapping.
- Services consume the adapter; they never call `fetch` directly.

### 4.2 Request/Response Patterns
- Use typed DTOs for all API contracts (zod or io-ts validation).
- Map DTOs to domain models at the adapter boundary.
- All network errors must be mapped to domain error types.

### 4.3 Sync Strategy
- **Bidirectional Sync:** Server is the source of truth; local changes queue for upload.
- **Conflict Resolution:**
  1. Last-write-wins for non-critical data.
  2. Three-way merge for structured documents.
  3. User prompt for irreconcilable conflicts.
- **Sync Triggers:** App foreground, pull-to-refresh, and background fetch.

---

## 5. Data Security & Safety

### 5.1 Input Validation
- Validate all data before it reaches storage (zod schemas, length limits, allowlists).
- Sanitize any user-generated content that might be rendered later.

### 5.2 SQL Injection Prevention
```typescript
// UNSAFE
const query = `SELECT * FROM users WHERE id = ${userId}`;

// SAFE
db.runAsync('SELECT * FROM users WHERE id = ?', [userId]);
```

### 5.3 Secret Management
- No secrets in source code.
- No secrets in `AsyncStorage`.
- Rotate API keys per release cycle where possible.
- Use certificate pinning for production API endpoints.

---

## 6. Testing Data Layers

### 6.1 Unit Tests
- Mock the database and API client.
- Test repository methods in isolation.
- Target: 90%+ coverage.

### 6.2 Integration Tests
- Use an in-memory SQLite instance.
- Test sync logic end-to-end with a mock server.

### 6.3 Migration Tests
- Every schema migration must have a test verifying data integrity.
- Maintain a `migrations/` directory with versioned migration scripts.

---

## 7. Data File Organization

```
src/
├── services/
│   ├── api/
│   │   ├── api-client.ts
│   │   ├── interceptors.ts
│   │   └── adapters/
│   ├── db/
│   │   ├── connection.ts
│   │   ├── migrations/
│   │   ├── repositories/
│   │   └── schemas/
│   ├── storage/
│   │   ├── secure-store.ts
│   │   ├── file-store.ts
│   │   └── cache-store.ts
│   └── sync/
│       ├── sync-engine.ts
│       ├── conflict-resolver.ts
│       └── queue.ts
├── types/
│   ├── domain/
│   │   ├── user.ts
│   │   └── audit.ts
│   └── dto/
│       ├── api-requests.ts
│       └── api-responses.ts
```

---

## 8. Database Change Checklist

Before any schema or data-layer change:
- [ ] Migration script written and tested
- [ ] DTOs and domain types updated
- [ ] Repository methods updated
- [ ] API adapter updated (if contract changes)
- [ ] Sync logic evaluated for impact
- [ ] Security review passed (parameterized queries, no secrets)
- [ ] Tests added or updated
- [ ] Truth score ≥ 0.95

---

**End of database.md**
