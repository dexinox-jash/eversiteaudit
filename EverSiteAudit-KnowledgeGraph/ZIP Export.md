---
type: service
path: src/services/export/zipExport.ts
---

# ZIP Export

ZIP archive containing project JSON, issues CSV, and photos folder.

## Function

```ts
exportProjectToZIP(projectId, password?, onProgress?) → ExportResult
```

## Dependencies

- `jszip`
- `expo-file-system`
- repositories

## Bug Fixes

- **Path separator:** `${cacheDirectory}/${fileName}` (was missing `/`)
- **Missing photos:** `FileSystem.readAsStringAsync(photo.originalPath)` wrapped in try/catch; missing photos are skipped with a warning instead of crashing the export

## Related

- [[Export Screen]]
- [[Services Index]]
