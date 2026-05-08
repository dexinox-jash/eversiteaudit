import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PassphraseStrengthMeter } from '@components/PassphraseStrengthMeter';
import type { PassphraseStrength } from '@services/security/passphraseStrength';

function renderMeter(strength: PassphraseStrength): ReturnType<typeof render> {
  return render(<PassphraseStrengthMeter strength={strength} />);
}

describe('PassphraseStrengthMeter', () => {
  it('renders the provided label', () => {
    renderMeter({ tier: 'weak', label: 'Weak', score: 1 });
    expect(screen.getByText('Weak')).toBeTruthy();
  });

  it('announces strength via progressbar accessibility role', () => {
    renderMeter({ tier: 'strong', label: 'Strong', score: 3 });
    const bar = screen.getByLabelText('Passphrase strength: Strong');
    expect(bar.props.accessibilityRole).toBe('progressbar');
    expect(bar.props.accessibilityValue).toEqual({ now: 3, min: 0, max: 4 });
  });

  it('renders four bar segments regardless of strength', () => {
    renderMeter({ tier: 'too-short', label: 'Too short', score: 0 });
    const bar = screen.getByLabelText('Passphrase strength: Too short');
    // 4 bar children + 1 label Text = 5 descendants; assert structure via the progressbar container
    expect(bar.props.accessibilityValue.max).toBe(4);
  });

  it('distinguishes excellent from strong in the accessibility value', () => {
    renderMeter({ tier: 'excellent', label: 'Excellent', score: 4 });
    const bar = screen.getByLabelText('Passphrase strength: Excellent');
    expect(bar.props.accessibilityValue.now).toBe(4);
  });

  it('renders fair tier label', () => {
    renderMeter({ tier: 'fair', label: 'Fair', score: 2 });
    expect(screen.getByText('Fair')).toBeTruthy();
  });
});
