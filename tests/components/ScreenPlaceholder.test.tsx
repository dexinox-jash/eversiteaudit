import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ScreenPlaceholder } from '@components/ScreenPlaceholder';

describe('ScreenPlaceholder', () => {
  it('renders the title', () => {
    render(<ScreenPlaceholder title="Coming Soon" />);
    expect(screen.getByText('Coming Soon')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(<ScreenPlaceholder title="Title" subtitle="Details go here" />);
    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('Details go here')).toBeTruthy();
  });

  it('does not render subtitle when absent', () => {
    render(<ScreenPlaceholder title="T" />);
    expect(screen.queryByText('Details')).toBeNull();
  });
});
