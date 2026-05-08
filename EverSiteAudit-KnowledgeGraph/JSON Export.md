---
type: service
path: src/services/export/jsonExport.ts
---

# JSON Export

Plain JSON dump of project + issues + photos.

## Function

```ts
exportProjectToJSON(projectId, password?, onProgress?) → ExportResult
```

## Bug Fixes

- **Path separator:** `${documentDirectory}/${fileName}` (was missing `/`)
- **mimeType:** Included in `ExportResult` for consistency

## Related

- [[Export Screen]]
- [[Services Index]]
