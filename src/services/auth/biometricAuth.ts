import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Check whether the device supports and has enrolled biometric authentication.
 * Returns `true` only if hardware is present AND biometrics are enrolled.
 */
export async function isBiometricAvailableAsync(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

/**
 * Prompt the user for biometric authentication (Face ID, Touch ID, or Fingerprint).
 *
 * @param promptMessage - Message shown in the system biometric prompt.
 * @returns `true` if authentication succeeded, `false` if unavailable or cancelled.
 */
export async function authenticateWithBiometricsAsync(
  promptMessage = 'Authenticate to access EverSiteAudit'
): Promise<boolean> {
  const available = await isBiometricAvailableAsync();
  if (!available) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: 'Use passcode',
    disableDeviceFallback: false,
  });

  return result.success;
}
