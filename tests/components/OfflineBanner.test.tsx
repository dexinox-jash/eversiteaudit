import React from 'react';
import { render, screen } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { usePreferenceStore } from '@store/usePreferenceStore';
import { OfflineBanner } from '@components/OfflineBanner';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(),
}));

jest.mock('@store/usePreferenceStore', () => ({
  usePreferenceStore: Object.assign(
    jest.fn((selector: (s: { reduceMotion: boolean }) => unknown) => selector({ reduceMotion: false })),
    { getState: jest.fn(), setState: jest.fn(), subscribe: jest.fn() }
  ),
}));

describe('OfflineBanner', () => {
  it('renders when offline', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
    render(<OfflineBanner />);
    expect(
      await screen.findByLabelText("No internet connection. You are working offline.")
    ).toBeTruthy();
  });

  it('does not render when online', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    render(<OfflineBanner />);
    expect(
      screen.queryByLabelText("No internet connection. You are working offline.")
    ).toBeNull();
  });

  it('respects reduceMotion preference', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
    (usePreferenceStore as unknown as jest.Mock).mockImplementation((selector: (s: { reduceMotion: boolean }) => unknown) =>
      selector({ reduceMotion: true })
    );

    render(<OfflineBanner />);
    expect(
      await screen.findByLabelText("No internet connection. You are working offline.")
    ).toBeTruthy();
  });
});
