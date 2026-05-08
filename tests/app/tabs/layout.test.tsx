import React from 'react';
import { render } from '@testing-library/react-native';
import TabLayout from '@app/(tabs)/_layout';

jest.mock('expo-router', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const Tabs = ({
    children,
    screenOptions,
  }: {
    children: React.ReactNode;
    screenOptions: unknown;
  }) => React.createElement(View, { testID: 'tabs', screenOptions }, children);
  const Screen = ({ name, options }: { name: string; options: Record<string, unknown> }) =>
    React.createElement(View, {
      testID: `tab-${name}`,
      tabTitle: options?.title,
    });
  Tabs.Screen = Screen;
  return {
    Tabs,
    router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  };
});

describe('TabLayout', () => {
  it('renders the two main tab screens', () => {
    const { getByTestId } = render(<TabLayout />);

    expect(getByTestId('tabs')).toBeTruthy();
    expect(getByTestId('tab-index')).toBeTruthy();
    expect(getByTestId('tab-activity')).toBeTruthy();
  });

  it('sets titles on each tab', () => {
    const { getByTestId } = render(<TabLayout />);

    expect(getByTestId('tab-index').props.tabTitle).toBe('Projects');
    expect(getByTestId('tab-activity').props.tabTitle).toBe('Activity');
  });

  it('configures tab bar style from theme colors', () => {
    const { getByTestId } = render(<TabLayout />);
    const tabs = getByTestId('tabs');

    const opts = tabs.props.screenOptions as {
      tabBarStyle: { height: number };
      headerShown: boolean;
    };
    expect(opts.headerShown).toBe(false);
    expect(opts.tabBarStyle.height).toBe(64);
  });
});
