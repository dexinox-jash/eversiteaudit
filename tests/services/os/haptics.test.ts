import * as Haptics from 'expo-haptics';
import {
  hapticLight,
  hapticMedium,
  hapticHeavy,
  hapticSuccess,
  hapticError,
  hapticWarning,
} from '@services/os/haptics';

describe('haptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('triggers light impact', () => {
    hapticLight();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('triggers medium impact', () => {
    hapticMedium();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('triggers heavy impact', () => {
    hapticHeavy();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
  });

  it('triggers success notification', () => {
    hapticSuccess();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success
    );
  });

  it('triggers error notification', () => {
    hapticError();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
  });

  it('triggers warning notification', () => {
    hapticWarning();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Warning
    );
  });
});
