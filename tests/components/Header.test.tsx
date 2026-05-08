import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { Header } from '@components/Header';

describe('Header', () => {
  it('renders with title', () => {
    render(<Header title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeTruthy();
  });

  it('renders left icon and calls onLeftPress', () => {
    const onLeftPress = jest.fn();
    render(<Header title="T" leftIcon={ArrowLeft} onLeftPress={onLeftPress} />);

    const backBtn = screen.getByLabelText('Go back');
    fireEvent.press(backBtn);
    expect(onLeftPress).toHaveBeenCalled();
  });

  it('renders right icon and calls onRightPress', () => {
    const onRightPress = jest.fn();
    render(<Header title="T" rightIcon={Plus} onRightPress={onRightPress} />);

    const actionBtn = screen.getByLabelText('Action');
    fireEvent.press(actionBtn);
    expect(onRightPress).toHaveBeenCalled();
  });

  it('uses custom accessibility labels when provided', () => {
    render(
      <Header
        title="T"
        leftIcon={ArrowLeft}
        onLeftPress={jest.fn()}
        rightIcon={Plus}
        onRightPress={jest.fn()}
        leftAccessibilityLabel="Back to home"
        rightAccessibilityLabel="Create new"
      />
    );

    expect(screen.getByLabelText('Back to home')).toBeTruthy();
    expect(screen.getByLabelText('Create new')).toBeTruthy();
  });

  it('renders rightElement when provided', () => {
    render(<Header title="T" rightElement={<Text>Custom</Text>} />);
    expect(screen.getByText('Custom')).toBeTruthy();
  });

  it('renders without any icons', () => {
    render(<Header title="Bare" />);
    expect(screen.getByText('Bare')).toBeTruthy();
    expect(screen.queryByLabelText('Go back')).toBeNull();
    expect(screen.queryByLabelText('Action')).toBeNull();
  });
});
