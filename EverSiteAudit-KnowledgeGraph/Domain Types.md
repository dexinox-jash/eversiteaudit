---
type: types
path: src/types/domain/index.ts
---

# Domain Types

Core domain models. All extend `BaseEntity` and `SoftDeletable` where applicable.

## Base Types

- `BaseEntity` — `id`, `createdAt`, `updatedAt`
- `SoftDeletable` — `isDeleted` (0|1), `deletedAt`

## Entities

| Type | Key Fields |
|------|------------|
| `Project` | `name`, `siteAddress`, `clientName`, `status`, `priority`, `completedAt` |
| `Issue` | `projectId`, `title`, `severity`, `status`, `gpsLatitude`, `gpsLongitude`, `voiceNoteUrl`, `sortOrder` |
| `Photo` | `projectId`, `issueId`, `originalPath`, `thumbnailPath`, `compressedPath`, `caption`, `checksum`, `sortOrder` |
| `Annotation` | `photoId`, `type`, `x`, `y`, `width`, `height`, `color`, `strokeWidth`, `textContent` |
| `Template` | `name`, `description`, `type`, `content`, `isDefault`, `usageCount` |
| `Setting` | `key`, `value`, `valueType`, `updatedAt` |
| `ExportHistory` | `projectId`, `exportType`, `fileName`, `passwordProtected`, `success` |

## DTOs

`src/types/dto/` is **empty**. Repository payload interfaces serve double duty as DTOs.

## Related

- [[Data Layer Index]]
