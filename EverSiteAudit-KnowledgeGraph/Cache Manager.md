---
type: service
path: src/services/storage/cacheManager.ts
---

# Cache Manager

Disk cache cleanup utilities.

## Functions

- `calculateCacheSize()`
- `clearOldExports(maxAgeDays?)`
- `clearOrphanedThumbnails()` — **no-op placeholder** (circular dependency avoidance)
- `clearTempCache()`
- `runFullCleanup(maxAgeDays?)` → `CleanupResult`

## Related

- [[Settings Screen]]
- [[Services Index]]
