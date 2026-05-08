import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ActionRow } from '@components/ActionRow';
import { Settings } from 'lucide-react-native';

describe('ActionRow', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders label and icon', () => {
    render(<ActionRow icon={Settings} label="Settings" onPress={mockOnPress} />);
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    render(<ActionRow icon={Settings} label="Settings" onPress={mockOnPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders value text', () => {
    render(<ActionRow icon={Settings} label="Theme" value="Dark" onPress={mockOnPress} />);
    expect(screen.getByText('Dark')).toBeTruthy();
  });

  it('renders with switch trailing', () => {
    const onSwitch = jest.fn();
    render(
      <ActionRow
        icon={Settings}
        label="Notifications"
        trailing="switch"
        switchValue={true}
        onSwitchChange={onSwitch}
      />
    );
    expect(screen.getByText('Notifications')).toBeTruthy();
  });

  it('renders disabled state', () => {
    render(<ActionRow icon={Settings} label="Disabled" onPress={mockOnPress} disabled />);
    expect(screen.getByText('Disabled')).toBeTruthy();
  });

  it('renders destructive color', () => {
    render(<ActionRow icon={Settings} label="Delete" onPress={mockOnPress} destructive />);
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('uses custom accessibility label', () => {
    render(
      <ActionRow
        icon={Settings}
        label="Settings"
        onPress={mockOnPress}
        accessibilityLabel="App settings"
      />
    );
    expect(screen.getByRole('button').props.accessibilityLabel).toBe('App settings');
  });

  it('falls back to label for accessibilityLabel', () => {
    render(<ActionRow icon={Settings} label="Settings" onPress={mockOnPress} />);
    expect(screen.getByRole('button').props.accessibilityLabel).toBe('Settings');
  });

  it('renders without onPress as non-interactive', () => {
    render(<ActionRow icon={Settings} label="Read Only" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Read Only')).toBeTruthy();
  });

  it('renders with custom trailing element', () => {
    render(
      <ActionRow
        icon={Settings}
        label="Custom"
        onPress={mockOnPress}
        trailing={<Text testID="custom-trailing">X</Text>}
      />
    );
    expect(screen.getByTestId('custom-trailing')).toBeTruthy();
  });

  it('renders chevron when trailing is undefined and pressable', () => {
    render(<ActionRow icon={Settings} label="Chevron" onPress={mockOnPress} trailing={undefined} />);
    expect(screen.getByText('Chevron')).toBeTruthy();
  });

  it('renders switch with undefined disabled', () => {
    const onSwitch = jest.fn();
    render(
      <ActionRow
        icon={Settings}
        label="Switch"
        trailing="switch"
        switchValue={true}
        onSwitchChange={onSwitch}
      />
    );
    expect(screen.getByText('Switch')).toBeTruthy();
  });
});
