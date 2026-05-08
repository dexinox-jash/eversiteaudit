import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '@components/EmptyState';
import { AlertCircle } from 'lucide-react-native';

describe('EmptyState', () => {
  const mockAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders icon, title, and subtitle', () => {
    render(
      <EmptyState
        icon={AlertCircle}
        title="No Items"
        subtitle="There is nothing to display here."
      />
    );
    expect(screen.getByText('No Items')).toBeTruthy();
    expect(screen.getByText('There is nothing to display here.')).toBeTruthy();
  });

  it('renders without subtitle when not provided', () => {
    render(<EmptyState icon={AlertCircle} title="No Items" />);
    expect(screen.getByText('No Items')).toBeTruthy();
    expect(screen.queryByText('There is nothing to display here.')).toBeNull();
  });

  it('renders action button and calls onAction when pressed', () => {
    render(
      <EmptyState
        icon={AlertCircle}
        title="No Items"
        actionTitle="Add Item"
        onAction={mockAction}
      />
    );
    const actionButton = screen.getByRole('button');
    expect(actionButton).toBeTruthy();
    expect(screen.getByText('Add Item')).toBeTruthy();
    fireEvent.press(actionButton);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('uses accessibilityLabel from prop', () => {
    render(
      <EmptyState
        icon={AlertCircle}
        title="No Items"
        accessibilityLabel="Custom Accessibility Label"
      />
    );
    expect(screen.getByLabelText('Custom Accessibility Label')).toBeTruthy();
  });

  it('falls back to title for accessibilityLabel', () => {
    render(<EmptyState icon={AlertCircle} title="No Items" />);
    expect(screen.getByLabelText('No Items')).toBeTruthy();
  });
});
