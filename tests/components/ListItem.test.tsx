import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ListItem } from '@components/ListItem';
import { Folder, ChevronRight } from 'lucide-react-native';

describe('ListItem', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title', () => {
    render(<ListItem title="Project A" onPress={mockOnPress} />);
    expect(screen.getByText('Project A')).toBeTruthy();
  });

  it('renders with subtitle', () => {
    render(<ListItem title="Project A" subtitle="123 Main St" onPress={mockOnPress} />);
    expect(screen.getByText('Project A')).toBeTruthy();
    expect(screen.getByText('123 Main St')).toBeTruthy();
  });

  it('renders with icon', () => {
    render(<ListItem title="Project A" icon={Folder} onPress={mockOnPress} />);
    expect(screen.getByText('Project A')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    render(<ListItem title="Project A" onPress={mockOnPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders severity tint', () => {
    render(<ListItem title="Issue 1" severity="critical" onPress={mockOnPress} />);
    expect(screen.getByText('Issue 1')).toBeTruthy();
  });

  it('renders selected state', () => {
    render(<ListItem title="Item" selected onPress={mockOnPress} />);
    expect(screen.getByRole('button').props.accessibilityState.selected).toBe(true);
  });

  it('renders disabled state', () => {
    render(<ListItem title="Item" onPress={mockOnPress} disabled />);
    expect(screen.getByLabelText('Item').props.accessibilityState.disabled).toBe(true);
  });

  it('renders custom right element', () => {
    render(
      <ListItem
        title="Project A"
        onPress={mockOnPress}
        rightElement={<ChevronRight size={18} color="#fff" />}
      />
    );
    expect(screen.getByText('Project A')).toBeTruthy();
  });

  it('renders non-pressable when no onPress', () => {
    render(<ListItem title="Static" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Static')).toBeTruthy();
  });

  it('uses custom accessibility label', () => {
    render(<ListItem title="Project A" onPress={mockOnPress} accessibilityLabel="Custom label" />);
    expect(screen.getByRole('button').props.accessibilityLabel).toBe('Custom label');
  });
});
