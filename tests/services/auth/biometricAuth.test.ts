import * as LocalAuthentication from 'expo-local-authentication';
import {
  isBiometricAvailableAsync,
  authenticateWithBiometricsAsync,
} from '@services/auth/biometricAuth';

jest.mock('expo-local-authentication');

describe('biometricAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isBiometricAvailableAsync', () => {
    it('returns true when hardware is compatible and enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

      const result = await isBiometricAvailableAsync();

      expect(result).toBe(true);
      expect(LocalAuthentication.hasHardwareAsync).toHaveBeenCalled();
      expect(LocalAuthentication.isEnrolledAsync).toHaveBeenCalled();
    });

    it('returns false when hardware is not compatible', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

      const result = await isBiometricAvailableAsync();

      expect(result).toBe(false);
    });

    it('returns false when not enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

      const result = await isBiometricAvailableAsync();

      expect(result).toBe(false);
    });
  });

  describe('authenticateWithBiometricsAsync', () => {
    it('returns false when biometrics are not available', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);

      const result = await authenticateWithBiometricsAsync();

      expect(result).toBe(false);
      expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
    });

    it('authenticates successfully with default prompt', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

      const result = await authenticateWithBiometricsAsync();

      expect(result).toBe(true);
      expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          promptMessage: 'Authenticate to access EverSiteAudit',
          fallbackLabel: 'Use passcode',
          disableDeviceFallback: false,
        })
      );
    });

    it('authenticates with custom prompt message', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

      const result = await authenticateWithBiometricsAsync('Custom prompt');

      expect(result).toBe(true);
      expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          promptMessage: 'Custom prompt',
        })
      );
    });

    it('returns false when authentication fails', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: false });

      const result = await authenticateWithBiometricsAsync();

      expect(result).toBe(false);
    });
  });
});
