---
type: hook
path: src/hooks/useDeepLink.ts
---

# useDeepLink Hook

Listens for incoming deep links and navigates via Expo Router.

## Behavior

1. Calls `Linking.getInitialURL()` once on mount
2. Subscribes to `Linking.addEventListener('url', ...)`
3. Filters URLs by scheme: `eversiteaudit://` or hosts containing `eversiteaudit.app`
4. Delegates parsing to `parseDeepLink()` and routing to `deepLinkRouteToPath()`

## Callbacks

- `onSuccess(path)`
- `onError(url, reason)`

## Used By

- [[Root Layout]]

## Related

- [[Deep Link Handler]]
- [[App Navigation Index]]
