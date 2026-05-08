import { useEffect, useRef, useCallback } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { parseDeepLink, deepLinkRouteToPath } from '@services/deepLink/deepLinkHandler';

export interface UseDeepLinkOptions {
  /** Called when a deep link is successfully handled */
  onSuccess?: (path: string) => void;
  /** Called when a deep link cannot be parsed or routed */
  onError?: (url: string, reason: string) => void;
}

/**
 * Hook that listens for incoming deep links and navigates to the appropriate screen.
 * Handles both the initial launch URL and URLs received while the app is running.
 */
export function useDeepLink(options: UseDeepLinkOptions = {}): void {
  const { onSuccess, onError } = options;
  const hasHandledInitialUrl = useRef(false);

  const isAppDeepLink = useCallback((url: string): boolean => {
    return url.startsWith('eversiteaudit://') || url.includes('eversiteaudit.app');
  }, []);

  const handleUrl = useCallback(
    (url: string | null): void => {
      if (!url) return;

      const route = parseDeepLink(url);
      if (!route) {
        // Only surface errors for URLs that are clearly intended for our app.
        // System URLs (exp://, referrers, etc.) are silently ignored.
        if (isAppDeepLink(url)) {
          onError?.(url, 'Unable to parse deep link');
        }
        return;
      }

      const path = deepLinkRouteToPath(route);
      if (!path) {
        onError?.(url, 'No matching route for deep link');
        return;
      }

      try {
        router.push(path as never);
        onSuccess?.(path);
      } catch {
        onError?.(url, 'Navigation failed');
      }
    },
    [onSuccess, onError, isAppDeepLink]
  );

  useEffect(() => {
    // Handle initial URL (app was opened from a deep link)
    if (!hasHandledInitialUrl.current) {
      hasHandledInitialUrl.current = true;
      void Linking.getInitialURL().then((url) => {
        handleUrl(url);
      });
    }

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return (): void => {
      subscription.remove();
    };
  }, [handleUrl]);
}
