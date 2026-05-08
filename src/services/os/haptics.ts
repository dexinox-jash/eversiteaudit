import * as Haptics from 'expo-haptics';

/** Haptic Light. */
export function hapticLight(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Haptic Medium. */
export function hapticMedium(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Haptic Heavy. */
export function hapticHeavy(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Haptic Success. */
export function hapticSuccess(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Haptic Error. */
export function hapticError(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** Haptic Warning. */
export function hapticWarning(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
