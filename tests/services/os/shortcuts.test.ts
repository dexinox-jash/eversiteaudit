import { isSupported, setItems, addListener } from 'expo-quick-actions';
import {
  setupQuickActions,
  clearQuickActions,
  getInitialQuickAction,
  subscribeToQuickActions,
} from '@services/os/shortcuts';

jest.mock('expo-quick-actions', () => ({
  isSupported: jest.fn(() => Promise.resolve(true)),
  setItems: jest.fn(() => Promise.resolve()),
  getInitialAction: jest.fn(() => null),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  initial: undefined,
}));

describe('shortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isSupported as jest.Mock).mockResolvedValue(true);
  });

  describe('setupQuickActions', () => {
    it('registers 3 quick actions when supported', async () => {
      setupQuickActions();
      await Promise.resolve();
      await Promise.resolve();
      expect(setItems).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'new-project', title: 'New Project', icon: 'compose' }),
          expect.objectContaining({ id: 'new-issue', title: 'New Issue', icon: 'compose' }),
          expect.objectContaining({ id: 'open-camera', title: 'Open Camera', icon: 'camera' }),
        ])
      );
    });

    it('does nothing when quick actions are not supported', async () => {
      (isSupported as jest.Mock).mockResolvedValue(false);
      setupQuickActions();
      await Promise.resolve();
      await Promise.resolve();
      expect(setItems).not.toHaveBeenCalled();
    });
  });

  describe('clearQuickActions', () => {
    it('clears items when supported', async () => {
      clearQuickActions();
      await Promise.resolve();
      await Promise.resolve();
      expect(setItems).toHaveBeenCalledWith([]);
    });

    it('does nothing when not supported', async () => {
      (isSupported as jest.Mock).mockResolvedValue(false);
      clearQuickActions();
      await Promise.resolve();
      await Promise.resolve();
      expect(setItems).not.toHaveBeenCalled();
    });
  });

  describe('getInitialQuickAction', () => {
    it('returns null when no initial action', () => {
      expect(getInitialQuickAction()).toBeNull();
    });
  });

  describe('subscribeToQuickActions', () => {
    it('subscribes to quick action events and calls handler', () => {
      const handler = jest.fn();
      const mockAction = { id: 'new-issue', title: 'New Issue' };
      (addListener as jest.Mock).mockImplementation((cb: (action: unknown) => void) => {
        cb(mockAction);
        return { remove: jest.fn() };
      });

      const unsubscribe = subscribeToQuickActions(handler);
      expect(handler).toHaveBeenCalledWith(mockAction);
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
