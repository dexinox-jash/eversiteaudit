# Security Protocols

> **Authority:** Child of `master.md`. Overrides nothing.

---

## 1. Biometric Authentication

- Supported: Fingerprint, Face ID, device PIN (fallback)
- Triggered on app launch if enabled in Settings.
- Auto-lock: Configurable timeout (default: 5 minutes of background).
- Implementation: `expo-local-authentication` via `BiometricGate` in `_layout.tsx`.

## 2. Encryption Key Management

- Key storage: `expo-secure-store` (hardware-backed where available)
- Key creation: `getOrCreateEncryptionKey()` — generates 64-char hex string
- Key rotation: Manual via Settings → Security → Reset Encryption Key
- Key escrow: Embedded in encrypted backups for cross-device recovery

## 3. Input Sanitization

- All user inputs are parameterized in SQL queries (no string concatenation).
- All file paths are validated against `FileSystem.documentDirectory`.
- Deep link URLs are parsed with `URL` constructor and regex fallbacks.

## 4. Secure Defaults

- Biometric auth: **Off** by default (opt-in)
- Auto-lock: **5 minutes** by default
- Backup reminders: **Enabled** by default
- Field encryption: **Enabled** for templates by default
- iOS file protection: `NSFileProtectionComplete`
- Android: `allowBackup: false`

## 5. No Network Attack Surface

The app has zero network-facing code:
- No API keys in source.
- No external HTTP requests.
- No analytics or telemetry.
- The only "network" activity is the OS share sheet for backup/export files.
