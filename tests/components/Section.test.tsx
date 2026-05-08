import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Section } from '@components/Section';

describe('Section', () => {
  it('renders title and children', () => {
    render(
      <Section title="Appearance">
        <Text testID="child">Content</Text>
      </Section>
    );
    expect(screen.getByText('Appearance')).toBeTruthy();
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('renders action button', () => {
    const onAction = jest.fn();
    render(
      <Section title="Data" action={{ label: 'Clear', onPress: onAction }}>
        <Text>Content</Text>
      </Section>
    );
    expect(screen.getByText('Clear')).toBeTruthy();
    fireEvent.press(screen.getByText('Clear'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
