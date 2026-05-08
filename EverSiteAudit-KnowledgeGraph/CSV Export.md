---
type: service
path: src/services/export/csvExport.ts
---

# CSV Export

CSV of issues for a project with manual comma/quote/newline escaping.

## Function

```ts
exportProjectToCSV(projectId, password?, onProgress?) → ExportResult
```

## Bug Fixes

- **Path separator:** `${documentDirectory}/${fileName}` (was missing `/`)
- **mimeType:** Included in `ExportResult` for consistency

## Related

- [[Export Screen]]
- [[Services Index]]
