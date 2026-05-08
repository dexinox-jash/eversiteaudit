import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { CheckCircle } from 'lucide-react-native';
import { Toast } from '@components/Toast';

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with the message', () => {
    render(<Toast message="Saved!" />);
    expect(screen.getByText('Saved!')).toBeTruthy();
  });

  it('has accessibilityRole "alert"', () => {
    render(<Toast message="Alert message" />);
    const node = screen.getByLabelText('Alert message');
    expect(node.props.accessibilityRole).toBe('alert');
  });

  it('uses message as default accessibilityLabel', () => {
    render(<Toast message="Default label" />);
    expect(screen.getByLabelText('Default label')).toBeTruthy();
  });

  it('uses custom accessibilityLabel when provided', () => {
    render(<Toast message="Msg" accessibilityLabel="Custom A11y" />);
    expect(screen.getByLabelText('Custom A11y')).toBeTruthy();
  });

  it('renders icon when provided', () => {
    render(<Toast message="With icon" icon={CheckCircle} />);
    expect(screen.getByText('With icon')).toBeTruthy();
  });

  it('calls onDismiss after duration elapses', () => {
    const onDismiss = jest.fn();
    render(<Toast message="Fading" duration={1500} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(1600);
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  it('hides itself after the duration', () => {
    const { queryByText } = render(<Toast message="Vanish" duration={500} />);

    expect(queryByText('Vanish')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(queryByText('Vanish')).toBeNull();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Toast message="V" variant="success" />);
    expect(screen.getByText('V')).toBeTruthy();

    rerender(<Toast message="V" variant="error" />);
    expect(screen.getByText('V')).toBeTruthy();

    rerender(<Toast message="V" variant="warning" />);
    expect(screen.getByText('V')).toBeTruthy();
  });

  it('animates entry with opacity and translateY', () => {
    const { getByLabelText } = render(<Toast message="Animated" />);
    const node = getByLabelText('Animated');
    expect(node).toBeTruthy();
    const style = node.props.style;
    expect(style).toBeDefined();
    expect(style.opacity).toBeDefined();
    expect(style.transform).toBeDefined();
    expect(style.transform).toEqual(expect.any(Array));
  });
});
