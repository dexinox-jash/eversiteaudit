---
type: screen
path: src/app/export/index.tsx
---

# Export Screen

Export progress tracker, template picker, and share sheet.

## State

- `state` — `preparing` | `exporting` | `success` | `error`
- `progress`
- `result`
- `selectedTemplateId`

## Behavior

- Exports to PDF, ZIP, JSON, or CSV with branded output
- Password-protected ZIP support
- Company branding in PDFs via `REPORT_TEMPLATES`
- All export services use guaranteed `/` separator: `${cacheDirectory}/${fileName}`
- ZIP export skips missing photos with warning instead of crashing
- PDF `photoItem()` prevents double `file://` prefix
- PDF progress fires after `Print.printToFileAsync()` completes
- All export results include `mimeType` for consistency

## Components

- `Screen`, `Typography`, `Card`, `Button`

## Services

- `exportProjectToPDF/ZIP/JSON/CSV`
- `shareFile`
- `REPORT_TEMPLATES`
- `hapticSuccess`

## Stores

- `usePreferenceStore`

## Related

- [[PDF Export]]
- [[ZIP Export]]
- [[JSON Export]]
- [[CSV Export]]
- [[Report Templates]]
- [[App Navigation Index]]
