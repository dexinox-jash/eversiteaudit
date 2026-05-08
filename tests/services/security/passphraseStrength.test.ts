import {
  evaluatePassphraseStrength,
  MIN_PASSPHRASE_LENGTH,
} from '@services/security/passphraseStrength';

describe('evaluatePassphraseStrength', () => {
  it('exports a minimum length of 12', () => {
    expect(MIN_PASSPHRASE_LENGTH).toBe(12);
  });

  it('returns too-short for values under 12 characters', () => {
    expect(evaluatePassphraseStrength('').tier).toBe('too-short');
    expect(evaluatePassphraseStrength('abc').tier).toBe('too-short');
    expect(evaluatePassphraseStrength('eleven-char').tier).toBe('too-short'); // 11
  });

  it('crosses the 12-character boundary into weak with only one class', () => {
    // exactly 12 lowercase chars → 1 class → weak
    const r = evaluatePassphraseStrength('abcdefghijkl');
    expect(r.tier).toBe('weak');
    expect(r.score).toBe(1);
    expect(r.label).toBe('Weak');
  });

  it('returns weak for 12+ chars with 2 classes', () => {
    const r = evaluatePassphraseStrength('abcdefgh1234'); // lower + digit = 2 classes
    expect(r.tier).toBe('weak');
  });

  it('returns fair for 12+ chars with 3 classes', () => {
    const r = evaluatePassphraseStrength('Abcdefgh1234'); // upper + lower + digit
    expect(r.tier).toBe('fair');
    expect(r.score).toBe(2);
  });

  it('returns strong for 16+ chars with 3 classes', () => {
    const r = evaluatePassphraseStrength('Abcdefghij012345'); // 16, 3 classes
    expect(r.tier).toBe('strong');
    expect(r.score).toBe(3);
  });

  it('returns excellent for 20+ chars with all 4 classes', () => {
    const r = evaluatePassphraseStrength('Abcdefghij012345!@#$'); // 20, 4 classes
    expect(r.tier).toBe('excellent');
    expect(r.score).toBe(4);
    expect(r.label).toBe('Excellent');
  });

  it('does not escalate to excellent without symbols', () => {
    const r = evaluatePassphraseStrength('Abcdefghij0123456789'); // 20 chars, 3 classes
    expect(r.tier).toBe('strong');
  });

  it('does not escalate to strong without enough length', () => {
    const r = evaluatePassphraseStrength('Abcdef12345!'); // 12 chars, 4 classes
    expect(r.tier).toBe('fair');
  });

  it('counts unicode symbols as a symbol class', () => {
    const r = evaluatePassphraseStrength('Abcdefghij0123456789☂'); // 21 chars, 4 classes
    expect(r.tier).toBe('excellent');
  });
});
