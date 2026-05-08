---
type: service
path: src/services/deepLink/deepLinkHandler.ts
---

# Deep Link Handler

URL parser and route mapper for deep links.

## Supported Patterns

| URL Pattern | Route Result |
|-------------|--------------|
| `eversiteaudit://projects/:id` | `/projects/:id` |
| `eversiteaudit://issues/:id` | `/issues/:id` |
| `eversiteaudit://photos/:id` | `/photos/:id` |
| `eversiteaudit://settings` | `/settings` |
| `eversiteaudit://export` | `/export` |
| `https://eversiteaudit.app/...` | Same mappings |

## Behavior

Unknown paths return `{ type: 'unknown' }` and do not navigate.

## Related

- [[useDeepLink Hook]]
- [[Root Layout]]
- [[App Navigation Index]]
