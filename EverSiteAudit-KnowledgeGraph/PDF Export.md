---
type: service
path: src/services/export/pdfExport.ts
---

# PDF Export

HTML-to-PDF export via `expo-print` with 8 built-in report templates.

## Function

```ts
exportProjectToPDF(
  projectId,
  password?,
  branding?,
  templateId?,
  onProgress?
) → ExportResult
```

## Flow

1. Fetch project, issues, photos, annotations from repositories
2. Generate HTML via `getReportTemplate(templateId).generate(html)`
3. `expo-print.printToFileAsync({ html })`
4. Optional: `encryptWithPassphrase(pdfBase64, password)`
5. Log to `exportHistoryRepository`
6. Share via `expo-sharing`

## Bug Fixes

- **Path separator:** `${cacheDirectory}/${fileName}` (was missing `/`)
- **Progress callback:** `onProgress?.(100)` fired after `printToFileAsync()` completes (was before)
- **Double `file://` prefix:** `reportTemplates.ts` `photoItem()` checks if path already starts with `file://`

## Branding

- `companyName`, `headerText`, `footerText`
- Injected into report templates

## Related

- [[Report Templates]]
- [[Export Screen]]
- [[Export History Repository]]
- [[Services Index]]
