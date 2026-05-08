---
type: governance
source: ANDROID_RUN_GUIDE.md
parent: [[EverSiteAudit Master Governance]]
---

# Android Run Guide

Developer setup guide for running EverSiteAudit on Android.

---

## Prerequisites

1. **Node.js 20 LTS** (v20.18.1 or v20.19.0)
   - Node 22+ and Node 25 are **not compatible** with `expo-modules-core@2.2.3`
2. **Android Device** with Android 8.0+ (API 26+) and USB Debugging enabled
3. **USB Cable**
4. **Expo Go** from Google Play Store
5. **Android Studio** (optional, for native dev builds)

## Quick Start

```bash
npm install
npm run verify        # Must pass before starting
npx expo start --clear
```

Then scan the QR code with Expo Go.

## Verification Gate Expected Output

- TypeScript: 0 errors
- ESLint: 0 errors (23 warnings pre-existing)
- Jest: 63 suites passed, 452 tests passed

## Known Issues

| Issue | Fix |
|-------|-----|
| `ERR_UNKNOWN_FILE_EXTENSION` (Node 22+) | Downgrade to Node 20 LTS |
| `expo-asset` cannot be found | `npm install expo-asset` |
| `expo-quick-actions` plugin error | Ensure plugin is listed as plain string in `app.json` |
| `expo-sharing` plugin error | Remove from `plugins` array (used in code only) |
| Ngrok tunnel fails | Use `--lan` instead of `--tunnel` |
| Metro bundle resolution errors | `npx expo start --clear` or delete `.expo/` |

## Commands

| Goal | Command |
|------|---------|
| Verify build | `npm run verify` |
| Start dev server | `npx expo start --clear` |
| Start on LAN | `npx expo start --lan --clear` |
| Android dev build | `npx expo run:android` |
| Run tests | `npm run test` |

---

## Related

- [[EverSiteAudit Master Governance]]
- [[Dependency Policy]]
- [[Deployment Rules]]
