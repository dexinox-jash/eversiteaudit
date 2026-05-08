export type PassphraseStrengthTier = 'too-short' | 'weak' | 'fair' | 'strong' | 'excellent';

export interface PassphraseStrength {
  tier: PassphraseStrengthTier;
  label: string;
  score: 0 | 1 | 2 | 3 | 4;
}

const MIN_LENGTH = 12;

function countCharacterClasses(value: string): number {
  let classes = 0;
  if (/[a-z]/.test(value)) classes += 1;
  if (/[A-Z]/.test(value)) classes += 1;
  if (/[0-9]/.test(value)) classes += 1;
  if (/[^a-zA-Z0-9]/.test(value)) classes += 1;
  return classes;
}

/**
 * Evaluate a passphrase against a 5-tier rule-based strength rubric.
 *
 * Tiers (length and character-class diversity):
 *   - too-short (< 12 chars)                           → score 0
 *   - weak      (>= 12 chars, 1–2 classes)             → score 1
 *   - fair      (>= 12 chars, 3 classes)               → score 2
 *   - strong    (>= 16 chars, 3 classes)               → score 3
 *   - excellent (>= 20 chars, 4 classes)               → score 4
 *
 * Character classes counted: lowercase, uppercase, digit, symbol.
 *
 * This is a deliberately lightweight heuristic — it meets the project's goal
 * of enforcing a safe passphrase floor without the bundle cost of a full
 * entropy estimator like zxcvbn. Dictionary-attack resistance is NOT covered
 * here; length + diversity is treated as a sufficient signal for users who
 * pick multi-word passphrases.
 */
export function evaluatePassphraseStrength(value: string): PassphraseStrength {
  if (value.length < MIN_LENGTH) {
    return { tier: 'too-short', label: 'Too short', score: 0 };
  }

  const classes = countCharacterClasses(value);

  if (value.length >= 20 && classes >= 4) {
    return { tier: 'excellent', label: 'Excellent', score: 4 };
  }
  if (value.length >= 16 && classes >= 3) {
    return { tier: 'strong', label: 'Strong', score: 3 };
  }
  if (classes >= 3) {
    return { tier: 'fair', label: 'Fair', score: 2 };
  }
  return { tier: 'weak', label: 'Weak', score: 1 };
}

/**
 * The minimum passphrase length enforced across the app. Exported so UI copy
 * stays in sync with the enforced rule.
 */
export const MIN_PASSPHRASE_LENGTH = MIN_LENGTH;
