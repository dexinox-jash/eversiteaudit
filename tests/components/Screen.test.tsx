import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Screen } from '@components/Screen';
import { Header } from '@components/Header';

describe('Screen', () => {
  it('renders children', () => {
    render(
      <Screen>
        <Text>Content</Text>
      </Screen>
    );
    expect(screen.getByText('Content')).toBeTruthy();
  });

  it('renders header from HeaderProps', () => {
    render(
      <Screen header={{ title: 'My Screen' }}>
        <Text>Body</Text>
      </Screen>
    );
    expect(screen.getByText('My Screen')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
  });

  it('renders header from React element', () => {
    render(
      <Screen header={<Header title="Element Header" />}>
        <Text>Body</Text>
      </Screen>
    );
    expect(screen.getByText('Element Header')).toBeTruthy();
  });

  it('renders without header when not provided', () => {
    render(
      <Screen>
        <Text>No Header</Text>
      </Screen>
    );
    expect(screen.getByText('No Header')).toBeTruthy();
  });

  it('renders in non-scrollable mode', () => {
    render(
      <Screen scrollable={false}>
        <Text>Plain</Text>
      </Screen>
    );
    expect(screen.getByText('Plain')).toBeTruthy();
  });

  it('renders without padding when pad is false', () => {
    render(
      <Screen pad={false}>
        <Text>Unpadded</Text>
      </Screen>
    );
    expect(screen.getByText('Unpadded')).toBeTruthy();
  });
});
