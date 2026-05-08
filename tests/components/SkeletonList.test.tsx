import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SkeletonList } from '@components/SkeletonList';

describe('SkeletonList', () => {
  it('renders default count of skeleton cards', () => {
    render(<SkeletonList />);
    const items = screen.getAllByLabelText('Loading');
    expect(items.length).toBe(3);
  });

  it('renders custom count', () => {
    render(<SkeletonList count={5} />);
    const items = screen.getAllByLabelText('Loading');
    expect(items.length).toBe(5);
  });

  it('renders with custom lines', () => {
    render(<SkeletonList count={2} lines={1} />);
    const items = screen.getAllByLabelText('Loading');
    expect(items.length).toBe(2);
  });

  it('renders with showImage', () => {
    render(<SkeletonList count={1} showImage />);
    const items = screen.getAllByLabelText('Loading');
    expect(items.length).toBe(1);
  });
});
