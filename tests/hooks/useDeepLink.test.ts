import { renderHook } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { useDeepLink } from '@hooks/useDeepLink';
import { parseDeepLink, deepLinkRouteToPath } from '@services/deepLink/deepLinkHandler';

jest.mock('@services/deepLink/deepLinkHandler', () => ({
  parseDeepLink: jest.fn(),
  deepLinkRouteToPath: jest.fn(),
}));

describe('useDeepLink', () => {
  let addEventListenerSpy: jest.SpyInstance;
  const mockRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (Linking.getInitialURL as jest.Mock) = jest.fn(() => Promise.resolve(null));
    addEventListenerSpy = jest.spyOn(Linking, 'addEventListener').mockReturnValue({
      remove: mockRemove,
    } as unknown as ReturnType<typeof Linking.addEventListener>);
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
  });

  it('checks for initial URL on mount', async () => {
    (Linking.getInitialURL as jest.Mock).mockResolvedValue(null);

    renderHook(() => useDeepLink());

    // Flush promises
    await jest.runAllTimersAsync();

    expect(Linking.getInitialURL).toHaveBeenCalled();
  });

  it('subscribes to URL events', () => {
    renderHook(() => useDeepLink());

    expect(addEventListenerSpy).toHaveBeenCalledWith('url', expect.any(Function));
  });

  it('removes listener on unmount', () => {
    const { unmount } = renderHook(() => useDeepLink());

    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });

  it('navigates and calls onSuccess when deep link is valid', async () => {
    const onSuccess = jest.fn();
    (Linking.getInitialURL as jest.Mock).mockResolvedValue('eversiteaudit://projects/proj-1');
    (parseDeepLink as jest.Mock).mockReturnValue({ type: 'projects', projectId: 'proj-1' });
    (deepLinkRouteToPath as jest.Mock).mockReturnValue('/projects/proj-1');

    renderHook(() => useDeepLink({ onSuccess }));
    await jest.runAllTimersAsync();

    expect(router.push).toHaveBeenCalledWith('/projects/proj-1');
    expect(onSuccess).toHaveBeenCalledWith('/projects/proj-1');
  });

  it('calls onError when URL cannot be parsed and is an app deep link', async () => {
    const onError = jest.fn();
    (Linking.getInitialURL as jest.Mock).mockResolvedValue('eversiteaudit://invalid/path');
    (parseDeepLink as jest.Mock).mockReturnValue(null);

    renderHook(() => useDeepLink({ onError }));
    await jest.runAllTimersAsync();

    expect(onError).toHaveBeenCalledWith(
      'eversiteaudit://invalid/path',
      'Unable to parse deep link'
    );
  });

  it('calls onError when route has no matching path', async () => {
    const onError = jest.fn();
    (Linking.getInitialURL as jest.Mock).mockResolvedValue('eversiteaudit://unknown');
    (parseDeepLink as jest.Mock).mockReturnValue({ type: 'unknown' });
    (deepLinkRouteToPath as jest.Mock).mockReturnValue(null);

    renderHook(() => useDeepLink({ onError }));
    await jest.runAllTimersAsync();

    expect(onError).toHaveBeenCalledWith(
      'eversiteaudit://unknown',
      'No matching route for deep link'
    );
  });

  it('ignores non-app URLs silently', async () => {
    const onError = jest.fn();
    (Linking.getInitialURL as jest.Mock).mockResolvedValue('exp://192.168.1.1:8081');
    (parseDeepLink as jest.Mock).mockReturnValue(null);

    renderHook(() => useDeepLink({ onError }));
    await jest.runAllTimersAsync();

    expect(onError).not.toHaveBeenCalled();
  });

  it('handles null initial URL', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    (Linking.getInitialURL as jest.Mock).mockResolvedValue(null);

    renderHook(() => useDeepLink({ onSuccess, onError }));
    await jest.runAllTimersAsync();

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
