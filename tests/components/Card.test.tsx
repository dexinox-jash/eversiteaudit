import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '@components/Card';

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <Text testID="child-text">Hello</Text>
      </Card>
    );
    expect(screen.getByTestId('child-text')).toBeTruthy();
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('renders with default elevation variant', () => {
    render(
      <Card>
        <Text>Content</Text>
      </Card>
    );
    expect(screen.getByTestId('card')).toBeTruthy();
    expect(screen.getByText('Content')).toBeTruthy();
  });

  it('renders with higher elevation', () => {
    render(
      <Card elevation="4">
        <Text>Content</Text>
      </Card>
    );
    expect(screen.getByTestId('card')).toBeTruthy();
  });

  it('applies custom padding when specified', () => {
    render(
      <Card padding="2">
        <Text>Content</Text>
      </Card>
    );
    const cardStyle = screen.getByTestId('card').props.style;
    expect(cardStyle).toEqual(
      expect.arrayContaining([expect.objectContaining({ padding: expect.any(Number) })])
    );
  });
});
