---
type: governance
source: rules/architecture-rules.md
parent: [[Rules Index]]
---

# Architecture Rules

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. Offline-First Design

The app must function 100% without an internet connection. All data lives locally in SQLite. Cloud is only used for manual backup file sharing (user-initiated).

## 2. State Management

| Layer | Tool | Responsibility |
|-------|------|----------------|
| UI State | React `useState` / `useReducer` | Form inputs, modals, selection modes |
| Domain State | Zustand | Projects, issues, photos, annotations, templates |
| Persistent State | SQLite (`expo-sqlite`) | All CRUD data with soft deletes |
| Preferences | `expo-secure-store` + Zustand | Theme, biometric settings, onboarding flag |

## 3. Navigation

- Expo Router file-system-based routing.
- Group routes with `(tabs)` for tab bar screens.
- Route names in `Stack.Screen` must exactly match file paths (e.g., `templates/index`, not `templates`).

## 4. Component Architecture

- **Screen components:** Full pages, handle data fetching, navigation.
- **Shared components:** `Screen`, `ScreenHeader`, `Button`, `Card`, `TextInput`, `Badge`, `FAB`, `Toast`, `Typography`.
- **No inline styles** except for dynamic theme-derived values. Use `StyleSheet.create`.

## 5. Repository Pattern

All database access goes through repository classes:
- `ProjectRepository`
- `IssueRepository`
- `PhotoRepository`
- `AnnotationRepository`
- `TemplateRepository`
- `SettingsRepository`
- `ExportHistoryRepository`

Repositories wrap raw SQL. No SQL in screens or stores.

## 6. File Organization

```
src/
├── app/                    # Expo Router screens
├── components/             # Shared UI components
├── hooks/                  # Custom React hooks
├── services/
│   ├── db/                 # Connection, schema, migrations, repositories
│   ├── backup/             # Backup creation, extraction, crypto
│   ├── export/             # PDF, CSV, JSON, ZIP export engines
│   ├── security/           # Encryption, key store
│   ├── storage/            # Preferences, cache manager
│   └── os/                 # Haptics, shortcuts, deep links
├── store/                  # Zustand stores
├── theme/                  # Colors, spacing, typography tokens
└── types/                  # Domain types and DTOs
```

## 7. Dependency Rules

- No circular imports. Barrel files (`index.ts`) must not create cycles.
- `connection.ts` and `migrations.ts` communicate via explicit parameters, not mutual imports.
- Animation libraries are banned. See `master.md` §III.3.

---

## Related

- [[Rules Index]]
- [[Coding Standards]]
- [[Data Layer Index]]
- [[Services Index]]
