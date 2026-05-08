import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { AnimatedListItem } from '@components/AnimatedListItem';

const mockUsePreferenceStore = jest.fn();

jest.mock('@store/usePreferenceStore', () => ({
  usePreferenceStore: (selector: (s: { reduceMotion: boolean }) => boolean) =>
    mockUsePreferenceStore(selector),
}));

beforeEach(() => {
  mockUsePreferenceStore.mockImplementation((selector) => selector({ reduceMotion: false }));
});

describe('AnimatedListItem', () => {
  it('renders children', () => {
    render(
      <AnimatedListItem index={0}>
        <Text testID="child">Hello</Text>
      </AnimatedListItem>
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('renders with custom style', () => {
    render(
      <AnimatedListItem index={0} style={{ marginTop: 10 }}>
        <Text testID="child">Styled</Text>
      </AnimatedListItem>
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('renders without animation when reduceMotion is enabled', () => {
    mockUsePreferenceStore.mockImplementation((selector) => selector({ reduceMotion: true }));
    render(
      <AnimatedListItem index={0}>
        <Text testID="child">Reduced Motion</Text>
      </AnimatedListItem>
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('renders without animation when animate prop is false', () => {
    render(
      <AnimatedListItem index={0} animate={false}>
        <Text testID="child">No Animation</Text>
      </AnimatedListItem>
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('renders multiple items with staggered indices', () => {
    render(
      <>
        <AnimatedListItem index={0}>
          <Text testID="item-0">First</Text>
        </AnimatedListItem>
        <AnimatedListItem index={1}>
          <Text testID="item-1">Second</Text>
        </AnimatedListItem>
        <AnimatedListItem index={2}>
          <Text testID="item-2">Third</Text>
        </AnimatedListItem>
      </>
    );
    expect(screen.getByTestId('item-0')).toBeTruthy();
    expect(screen.getByTestId('item-1')).toBeTruthy();
    expect(screen.getByTestId('item-2')).toBeTruthy();
  });
});
