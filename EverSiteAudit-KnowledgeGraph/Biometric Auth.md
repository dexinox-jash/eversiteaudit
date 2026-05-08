---
type: service
path: src/services/auth/biometricAuth.ts
---

# Biometric Auth

FaceID/TouchID lock-screen gating via `expo-local-authentication`.

## Functions

- `isBiometricAvailableAsync()` — Hardware + enrollment check
- `authenticateWithBiometricsAsync(promptMessage?)` — Prompt with fallback to passcode

## Usage

- Optional; enabled via `biometricAuthEnabled` preference
- Used in [[Root Layout]] `BiometricGate`
- Auto-locks after app backgrounded > `autoLockTimeout`

## Related

- [[Root Layout]]
- [[usePreferenceStore]]
- [[Security Index]]
