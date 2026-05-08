---
type: service
path: src/services/integrity/photoIntegrity.ts
---

# Photo Integrity

SHA-256 checksums for photos via `expo-crypto`.

## Functions

- `computeFileChecksum(uri)`
- `verifyFileChecksum(uri, expectedChecksum)`
- `verifyPhotosIntegrity(photos)` → `IntegrityResult`

## Known Limitation

Loads entire image into JS heap (no streaming digest).

## Related

- [[Photo Viewer Screen]]
- [[Security Index]]
