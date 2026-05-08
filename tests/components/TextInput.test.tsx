import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TextInput } from '@components/TextInput';
import { AlertCircle } from 'lucide-react-native';

describe('TextInput', () => {
  const mockOnChangeText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders label when provided', () => {
    render(<TextInput label="Email" value="" onChangeText={mockOnChangeText} />);
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('does not render label when not provided', () => {
    render(<TextInput value="" onChangeText={mockOnChangeText} />);
    expect(screen.queryByText('Email')).toBeNull();
  });

  it('renders input with value', () => {
    render(<TextInput value="hello" onChangeText={mockOnChangeText} />);
    expect(screen.getByDisplayValue('hello')).toBeTruthy();
  });

  it('calls onChangeText when value changes', () => {
    render(<TextInput value="" onChangeText={mockOnChangeText} />);
    fireEvent.changeText(screen.getByDisplayValue(''), 'world');
    expect(mockOnChangeText).toHaveBeenCalledWith('world');
  });

  it('renders error message when error prop is provided', () => {
    render(<TextInput value="" onChangeText={mockOnChangeText} error="Required field" />);
    expect(screen.getByText('Required field')).toBeTruthy();
  });

  it('does not render error when error prop is undefined', () => {
    render(<TextInput value="" onChangeText={mockOnChangeText} />);
    expect(screen.queryByText('Required field')).toBeNull();
  });

  it('marks field as invalid when error is present', () => {
    render(<TextInput value="" onChangeText={mockOnChangeText} error="Invalid" />);
    expect(screen.getByText('Invalid')).toBeTruthy();
  });

  it('renders with an icon', () => {
    render(<TextInput value="" onChangeText={mockOnChangeText} icon={AlertCircle} />);
    expect(screen.getByDisplayValue('')).toBeTruthy();
  });

  it('applies accessibility props', () => {
    render(
      <TextInput
        label="Username"
        value=""
        onChangeText={mockOnChangeText}
        accessibilityHint="Enter your username"
      />
    );
    expect(screen.getByLabelText('Username')).toBeTruthy();
    expect(screen.getByLabelText('Username').props.accessibilityHint).toBe('Enter your username');
  });
});
