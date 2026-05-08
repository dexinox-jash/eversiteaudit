import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SkeletonCard } from '@components/SkeletonCard';

describe('SkeletonCard', () => {
  it('renders with default accessibility label', () => {
    render(<SkeletonCard />);
    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('renders with default lines', () => {
    const { getByLabelText } = render(<SkeletonCard />);
    const card = getByLabelText('Loading');
    expect(card).toBeTruthy();
  });

  it('renders with showImage', () => {
    const { getByLabelText } = render(<SkeletonCard showImage />);
    expect(getByLabelText('Loading')).toBeTruthy();
  });

  it('renders with custom lines', () => {
    const { getByLabelText } = render(<SkeletonCard lines={4} />);
    expect(getByLabelText('Loading')).toBeTruthy();
  });
});
