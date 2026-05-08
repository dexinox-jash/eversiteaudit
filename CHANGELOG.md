# Changelog

## [1.0.0] — 2026-04-17

### Added
- Full project, issue, photo, and annotation CRUD
- 8 PDF report templates with company branding
- AES-256-GCM field encryption + PBKDF2 backup encryption
- Biometric authentication with auto-lock
- Device migration wizard with encrypted backups
- 4 pre-loaded project templates + custom template CRUD
- Offline-native architecture — zero cloud dependency
- 85 test suites, 676 tests
- Linear-inspired dark-first design system
- Deep linking + OS Quick Actions

### Security
- OWASP-aligned input validation
- Parameterized SQL queries (zero SQL injection risk)
- SHA-256 photo integrity verification
- Soft-delete data retention
- Excluded from OS cloud backups

### Technical
- React Native 0.76 + Expo SDK 52 + TypeScript 5.6
- SQLite WAL mode with foreign keys
- Zustand state management
- Tailwind CSS v4 + native StyleSheet hybrid
- FlashList virtualization for large datasets
