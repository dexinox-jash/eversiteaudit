import React from 'react';
import { render } from '@testing-library/react-native';
import ErrorBanner from '@app/onboarding/ErrorBanner';

describe('ErrorBanner', () => {
  it('renders error message when error is provided', () => {
    const { getByText } = render(<ErrorBanner error="Something went wrong" />);
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('returns null when error is null', () => {
    const { toJSON } = render(<ErrorBanner error={null} />);
    expect(toJSON()).toBeNull();
  });
});
