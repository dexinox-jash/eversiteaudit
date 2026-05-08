import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '@components/Button';
import * as Haptics from 'expo-haptics';
import { AlertCircle } from 'lucide-react-native';

describe('Button', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with title text', () => {
    render(<Button title="Press Me" onPress={mockOnPress} />);
    expect(screen.getByText('Press Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    render(<Button title="Press Me" onPress={mockOnPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('triggers haptic feedback on press by default', () => {
    render(<Button title="Press Me" onPress={mockOnPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('does not trigger haptic feedback when haptic is false', () => {
    render(<Button title="Press Me" onPress={mockOnPress} haptic={false} />);
    fireEvent.press(screen.getByRole('button'));
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('shows loading text and marks as disabled', () => {
    render(<Button title="Press Me" onPress={mockOnPress} loading />);
    expect(screen.getByText('Loading...')).toBeTruthy();
    expect(screen.getByRole('button').props.accessibilityState.disabled).toBe(true);
  });

  it('marks as disabled when disabled prop is true', () => {
    render(<Button title="Press Me" onPress={mockOnPress} disabled />);
    expect(screen.getByRole('button').props.accessibilityState.disabled).toBe(true);
  });

  it('uses accessibilityLabel from prop', () => {
    render(<Button title="Press Me" onPress={mockOnPress} accessibilityLabel="Custom Label" />);
    expect(screen.getByRole('button').props.accessibilityLabel).toBe('Custom Label');
  });

  it('falls back to title for accessibilityLabel', () => {
    render(<Button title="Press Me" onPress={mockOnPress} />);
    expect(screen.getByRole('button').props.accessibilityLabel).toBe('Press Me');
  });

  it('renders with an icon', () => {
    render(<Button title="Press Me" onPress={mockOnPress} icon={AlertCircle} />);
    expect(screen.getByRole('button')).toBeTruthy();
    expect(screen.getByText('Press Me')).toBeTruthy();
  });

  it('applies fullWidth style when prop is true', () => {
    render(<Button title="Press Me" onPress={mockOnPress} fullWidth />);
    const style = screen.getByRole('button').props.style;
    expect(style).toEqual(
      expect.arrayContaining([expect.objectContaining({ alignSelf: 'stretch' })])
    );
  });
});
