import { setItems, initial, isSupported, addListener } from 'expo-quick-actions';
import type { Action } from 'expo-quick-actions';

export type QuickActionType = 'new-project' | 'new-issue' | 'open-camera' | 'start-new-audit';

/**
 * OS Shortcuts Service
 *
 * iOS Siri Shortcuts and Android App Widgets are NOT implemented because they
 * require custom native modules (Swift/Obj-C for Siri Shortcuts, Java/Kotlin
 * for AppWidgetProvider) that are not available in the Expo managed workflow
 * without ejecting or using unsupported config plugins.
 *
 * As the best possible alternative within managed Expo, we expand the set of
 * home-screen Quick Actions (expo-quick-actions) to cover the most common
 * entry points, including "Start New Audit".
 */

const QUICK_ACTIONS: Action[] = [
  {
    id: 'new-project',
    title: 'New Project',
    icon: 'compose',
  },
  {
    id: 'new-issue',
    title: 'New Issue',
    icon: 'compose',
  },
  {
    id: 'open-camera',
    title: 'Open Camera',
    icon: 'camera',
  },
  {
    id: 'start-new-audit',
    title: 'Start New Audit',
    icon: 'compose',
  },
];

/** Setup Quick Actions. */
export function setupQuickActions(): void {
  void isSupported().then((available) => {
    if (available) {
      void setItems(QUICK_ACTIONS);
    }
  });
}

/** Clear Quick Actions. */
export function clearQuickActions(): void {
  void isSupported().then((available) => {
    if (available) {
      void setItems([]);
    }
  });
}

/** Get Initial Quick Action. */
export function getInitialQuickAction(): Action | null {
  return initial ?? null;
}

/** Subscribe To Quick Actions. */
export function subscribeToQuickActions(handler: (action: Action) => void): () => void {
  const subscription = addListener((action) => {
    handler(action);
  });
  return () => subscription.remove();
}
