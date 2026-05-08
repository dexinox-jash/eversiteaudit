import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Switch } from '@components/Switch';
import * as Haptics from 'expo-haptics';

describe('Switch', () => {
  const mockOnValueChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with accessibility role switch', () => {
    render(
      <Switch value={false} onValueChange={mockOnValueChange} accessibilityLabel="Airplane Mode" />
    );
    const switchEl = screen.getByRole('switch');
    expect(switchEl.props.accessibilityRole).toBe('switch');
    expect(switchEl.props.accessibilityLabel).toBe('Airplane Mode');
  });

  it('reflects checked accessibility state when value is true', () => {
    render(
      <Switch value={true} onValueChange={mockOnValueChange} accessibilityLabel="Airplane Mode" />
    );
    expect(screen.getByRole('switch').props.accessibilityState.checked).toBe(true);
    expect(screen.getByRole('switch').props.accessibilityState.disabled).toBe(false);
  });

  it('reflects unchecked accessibility state when value is false', () => {
    render(
      <Switch value={false} onValueChange={mockOnValueChange} accessibilityLabel="Airplane Mode" />
    );
    expect(screen.getByRole('switch').props.accessibilityState.checked).toBe(false);
  });

  it('calls onValueChange with true when toggled on', () => {
    render(
      <Switch value={false} onValueChange={mockOnValueChange} accessibilityLabel="Airplane Mode" />
    );
    fireEvent(screen.getByRole('switch'), 'onValueChange', true);
    expect(mockOnValueChange).toHaveBeenCalledWith(true);
  });

  it('calls onValueChange with false when toggled off', () => {
    render(
      <Switch value={true} onValueChange={mockOnValueChange} accessibilityLabel="Airplane Mode" />
    );
    fireEvent(screen.getByRole('switch'), 'onValueChange', false);
    expect(mockOnValueChange).toHaveBeenCalledWith(false);
  });

  it('triggers haptic feedback on toggle by default', () => {
    render(
      <Switch value={false} onValueChange={mockOnValueChange} accessibilityLabel="Airplane Mode" />
    );
    fireEvent(screen.getByRole('switch'), 'onValueChange', true);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('does not trigger haptic feedback when haptic is false', () => {
    render(
      <Switch
        value={false}
        onValueChange={mockOnValueChange}
        accessibilityLabel="Airplane Mode"
        haptic={false}
      />
    );
    fireEvent(screen.getByRole('switch'), 'onValueChange', true);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('does not call onValueChange when disabled', () => {
    render(
      <Switch
        value={false}
        onValueChange={mockOnValueChange}
        accessibilityLabel="Airplane Mode"
        disabled
      />
    );
    fireEvent(screen.getByRole('switch'), 'onValueChange', true);
    expect(mockOnValueChange).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(screen.getByRole('switch').props.accessibilityState.disabled).toBe(true);
  });
});
