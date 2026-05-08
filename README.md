# EverSiteAudit Mobile

Professional site auditing, completely offline. Your data stays on your device until you decide to share it.

[![Tests](https://img.shields.io/badge/tests-676%20passing-success)](./)
[![Coverage](https://img.shields.io/badge/coverage-77%25-yellow)](./coverage)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](./)
[![Expo](https://img.shields.io/badge/Expo%20SDK-52-black)](./)

---

## Philosophy

This project is developed with an AI Agent Army following a strict hierarchy of guidelines. Every change starts with `master.md`.

## Document Hierarchy

1. **`master.md`** — Supreme authority and entry point for all agents
2. `rules.md` — Development rules, SPARC methodology, coding standards
3. `design.md` — Design system, UI/UX guidelines, brand standards
4. `database.md` — Data architecture, storage, sync strategies
5. `safety.md` — Security protocols, OWASP standards, audit checklists
6. `agents.md` — Agent army configuration, swarm rules, delegation protocols

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.76 |
| SDK | Expo SDK 52 |
| Language | TypeScript 5.6 (strict mode) |
| Navigation | Expo Router (file-system) |
| Database | SQLite (expo-sqlite) with WAL mode |
| State | Zustand 5.0 |
| Styling | Tailwind CSS v4 + native StyleSheet |
| Icons | Lucide React Native |

---

## Quick Start

```bash
# Install dependencies
npm install

# Start the development server (LAN mode)
npm start

# Start with tunnel (for remote devices)
npx expo start --tunnel

# Run tests
npm test

# Run verification (typecheck + lint + test)
npm run verify

# Run full verification (includes prettier)
npm run verify:full
```

## Expo Go Development

1. Install [Expo Go](https://expo.dev/go) on your iOS/Android device
2. Run `npm start`
3. Scan the QR code with Expo Go
4. For remote networks, use `npx expo start --tunnel`

## Project Structure

```
src/
├── app/           # Expo Router screens (file-system routing)
│   ├── (tabs)/    # Tab navigator
│   ├── camera.tsx # Full-screen camera
│   ├── export/    # Export screen
│   ├── issues/    # Issue detail + edit
│   ├── photos/    # Photo viewer + annotation canvas
│   ├── projects/  # Project detail
│   ├── templates/ # Template management
│   └── migration/ # Backup/restore wizard
├── components/    # Shared UI primitives
├── services/      # Business logic layer
│   ├── db/        # SQLite schema, migrations, repositories
│   ├── export/    # PDF, ZIP, JSON, CSV generation
│   ├── media/     # Camera, gallery, voice recorder
│   ├── backup/    # Encrypted backup/restore
│   ├── security/  # AES-256-GCM encryption, key storage
│   ├── auth/      # Biometric authentication
│   └── ...
├── store/         # Zustand state stores
├── theme/         # Design tokens (colors, typography, spacing)
├── types/         # TypeScript domain + DTO types
├── hooks/         # Shared React hooks
├── constants/     # App-wide constants
└── utils/         # Pure utility functions
```

## Quality Gates

| Gate | Target | Current |
|------|--------|---------|
| TypeScript errors | 0 | ✅ 0 |
| ESLint errors | 0 | ✅ 0 |
| Test suites passing | 80+ | ✅ 85 |
| Branch coverage | ≥ 70% | 🟡 62% |
| Security standard | OWASP ASVS Level 3 | ✅ Aligned |

## Security

- **AES-256-GCM** field encryption for sensitive data
- **PBKDF2 100k iterations** + AES-256-GCM for backup encryption
- Biometric authentication (Face ID / Touch ID / Fingerprint)
- Parameterized SQL queries — zero SQL injection risk
- Soft-delete data retention
- Excluded from OS cloud backups
- Zero auto-transmission — all exports require explicit user action

## License

Private — All rights reserved.
