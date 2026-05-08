import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Badge } from '@components/Badge';
import { AlertCircle } from 'lucide-react-native';

describe('Badge', () => {
  it('renders text', () => {
    render(<Badge title="Critical" />);
    expect(screen.getByText('Critical')).toBeTruthy();
  });

  it('renders with critical severity', () => {
    render(<Badge title="Critical" variant="critical" />);
    expect(screen.getByLabelText('Critical')).toBeTruthy();
    expect(screen.getByText('Critical')).toBeTruthy();
  });

  it('renders with high severity', () => {
    render(<Badge title="High" variant="high" />);
    expect(screen.getByText('High')).toBeTruthy();
  });

  it('renders with medium severity', () => {
    render(<Badge title="Medium" variant="medium" />);
    expect(screen.getByText('Medium')).toBeTruthy();
  });

  it('renders with low severity', () => {
    render(<Badge title="Low" variant="low" />);
    expect(screen.getByText('Low')).toBeTruthy();
  });

  it('renders with default variant', () => {
    render(<Badge title="Default" />);
    expect(screen.getByText('Default')).toBeTruthy();
  });

  it('renders with info variant', () => {
    render(<Badge title="Info" variant="info" />);
    expect(screen.getByText('Info')).toBeTruthy();
  });

  it('renders with success variant', () => {
    render(<Badge title="Success" variant="success" />);
    expect(screen.getByText('Success')).toBeTruthy();
  });

  it('renders with an icon', () => {
    render(<Badge title="Alert" variant="critical" icon={AlertCircle} />);
    expect(screen.getByLabelText('Alert with icon')).toBeTruthy();
    expect(screen.getByText('Alert')).toBeTruthy();
  });

  it('has correct accessibility props', () => {
    render(<Badge title="Warning" />);
    const chip = screen.getByLabelText('Warning');
    expect(chip.props.accessibilityLabel).toBe('Warning');
    expect(chip.props.accessibilityRole).toBe('text');
  });
});
