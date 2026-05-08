import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { FAB } from '@components/FAB';
import * as Haptics from 'expo-haptics';
import { Plus } from 'lucide-react-native';

describe('FAB', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with icon and accessibility label', () => {
    render(<FAB icon={Plus} onPress={mockOnPress} accessibilityLabel="Add new item" />);
    expect(screen.getByLabelText('Add new item')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    render(<FAB icon={Plus} onPress={mockOnPress} accessibilityLabel="Add new item" />);
    fireEvent.press(screen.getByLabelText('Add new item'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('triggers haptic feedback on press by default', () => {
    render(<FAB icon={Plus} onPress={mockOnPress} accessibilityLabel="Add new item" />);
    fireEvent.press(screen.getByLabelText('Add new item'));
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('does not trigger haptic feedback when haptic is false', () => {
    render(
      <FAB icon={Plus} onPress={mockOnPress} accessibilityLabel="Add new item" haptic={false} />
    );
    fireEvent.press(screen.getByLabelText('Add new item'));
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('does not call onPress when disabled', () => {
    render(<FAB icon={Plus} onPress={mockOnPress} accessibilityLabel="Add new item" disabled />);
    fireEvent.press(screen.getByLabelText('Add new item'));
    expect(mockOnPress).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('applies accessibility hint when provided', () => {
    render(
      <FAB
        icon={Plus}
        onPress={mockOnPress}
        accessibilityLabel="Add new item"
        accessibilityHint="Double tap to create"
      />
    );
    expect(screen.getByLabelText('Add new item').props.accessibilityHint).toBe(
      'Double tap to create'
    );
  });

  it('positions absolutely with bottom/right spacing', () => {
    render(<FAB icon={Plus} onPress={mockOnPress} accessibilityLabel="Add new item" />);
    const fab = screen.getByLabelText('Add new item');
    const style = Array.isArray(fab.props.style)
      ? fab.props.style.reduce((acc: object, s: object) => ({ ...acc, ...s }), {})
      : fab.props.style;
    expect(style.position).toBe('absolute');
    expect(style.right).toBeDefined();
    expect(style.bottom).toBeDefined();
  });

  it('triggers pressIn state', () => {
    render(<FAB icon={Plus} onPress={mockOnPress} accessibilityLabel="Add new item" />);
    const fab = screen.getByLabelText('Add new item');
    fireEvent(fab, 'pressIn');
    expect(mockOnPress).not.toHaveBeenCalled();
  });
});
