import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Checkbox } from '@components/Checkbox';

describe('Checkbox', () => {
  it('renders with checkbox role', () => {
    render(<Checkbox checked={false} onPress={jest.fn()} />);
    expect(screen.getByRole('checkbox')).toBeTruthy();
  });

  it('reflects checked state in accessibilityState', () => {
    render(<Checkbox checked onPress={jest.fn()} accessibilityLabel="Select item" />);
    const cb = screen.getByLabelText('Select item');
    expect(cb.props.accessibilityState.checked).toBe(true);
  });

  it('reflects unchecked state in accessibilityState', () => {
    render(<Checkbox checked={false} onPress={jest.fn()} accessibilityLabel="Select item" />);
    const cb = screen.getByLabelText('Select item');
    expect(cb.props.accessibilityState.checked).toBe(false);
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Checkbox checked={false} onPress={onPress} />);
    fireEvent.press(screen.getByRole('checkbox'));
    expect(onPress).toHaveBeenCalled();
  });

  it('marks as disabled when no onPress is provided', () => {
    render(<Checkbox checked={false} accessibilityLabel="Static cb" />);
    const cb = screen.getByLabelText('Static cb');
    expect(cb.props.accessibilityState.disabled).toBe(true);
  });

  it('accepts custom size', () => {
    render(<Checkbox checked onPress={jest.fn()} size={32} accessibilityLabel="Big cb" />);
    const cb = screen.getByLabelText('Big cb');
    expect(cb.props.style.width).toBe(32);
    expect(cb.props.style.height).toBe(32);
  });
});
