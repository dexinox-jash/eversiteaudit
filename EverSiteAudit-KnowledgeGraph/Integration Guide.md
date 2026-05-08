---
type: documentation
source: .documentation/INTEGRATIONS.md
---

# Integration Guide

> **Source:** `.documentation/INTEGRATIONS.md`

---

## Integration Philosophy

| Principle | Description |
|-----------|-------------|
| **Privacy-First** | User data never leaves device without explicit action |
| **Performance-Critical** | Camera operations must be responsive |
| **Platform-Native Experience** | Use OS-native share sheets and pickers |
| **Graceful Degradation** | App functions with limited permissions |
| **Battery Conscious** | Efficient background operations |

## Camera Integration

The actual implementation uses `expo-camera` (Expo SDK 52), not the native platform APIs documented here. The guide covers:
- iOS AVFoundation burst capture architecture
- Android CameraX UseCase-based architecture
- Memory management strategies
- Permission requirements

## File Sharing & Export

- iOS: `UIActivityViewController` via `expo-sharing`
- Android: Sharesheet via `Intent.ACTION_SEND`
- Large file handling: ZIP first for 100+ photos

## Storage Access & File Operations

- iOS: Documents directory with atomic writes, file coordination
- Android: Scoped Storage (API 29+) with app-specific directories
- All file operations use `expo-file-system` APIs

## PDF Generation

- Cross-platform: `expo-print` HTML-to-PDF
- No external native dependency required
- Professional layouts rendered from HTML/CSS templates

## ZIP Archive Creation

- Uses `jszip` for ZIP creation
- Password protection reuses backup crypto (PBKDF2 + AES)

## OS-Level Integrations

- Quick Actions: `expo-quick-actions` (home-screen shortcuts)
- Deep Linking: `eversiteaudit://` scheme
- Haptics: `expo-haptics` for contextual feedback
- Share Extension: OS-native share sheet

## Encryption Integration

- Field-level: Web Crypto API via `expo-crypto` extensions
- Backup: PBKDF2 key derivation + AES-256-GCM
- Key storage: `expo-secure-store` (hardware-backed)

## Location Services

- GPS capture for issues and photos
- Automatic latitude/longitude/accuracy recording

## Audio/Voice Recording

- Uses `expo-av` for audio recording
- Voice notes attached to issues

---

## Related

- [[EverSiteAudit Master Governance]]
- [[Architecture Specification]]
- [[Camera Screen]]
- [[Share Extension]]
- [[PDF Export]]
- [[ZIP Export]]
