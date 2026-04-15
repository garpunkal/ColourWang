/**
 * Haptic feedback utility for mobile devices
 * Provides vibration feedback for user interactions
 */

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
    return 'vibrate' in navigator;
}

/**
 * Trigger a light haptic feedback (selection/tap)
 */
export function hapticLight() {
    if (isHapticSupported()) {
        navigator.vibrate(10);
    }
}

/**
 * Trigger a medium haptic feedback (button press)
 */
export function hapticMedium() {
    if (isHapticSupported()) {
        navigator.vibrate(20);
    }
}

/**
 * Trigger a heavy haptic feedback (success/error)
 */
export function hapticHeavy() {
    if (isHapticSupported()) {
        navigator.vibrate(40);
    }
}

/**
 * Trigger a double tap haptic pattern (special actions)
 */
export function hapticDoubleTap() {
    if (isHapticSupported()) {
        navigator.vibrate([15, 30, 15]);
    }
}

/**
 * Trigger a success haptic pattern
 */
export function hapticSuccess() {
    if (isHapticSupported()) {
        navigator.vibrate([20, 50, 30]);
    }
}

/**
 * Trigger an error haptic pattern
 */
export function hapticError() {
    if (isHapticSupported()) {
        navigator.vibrate([50, 30, 50, 30, 50]);
    }
}

/**
 * Trigger a warning haptic pattern
 */
export function hapticWarning() {
    if (isHapticSupported()) {
        navigator.vibrate([30, 20, 30]);
    }
}

/**
 * Cancel any ongoing vibration
 */
export function hapticCancel() {
    if (isHapticSupported()) {
        navigator.vibrate(0);
    }
}

export const hapticFeedback = {
    light: hapticLight,
    medium: hapticMedium,
    heavy: hapticHeavy,
    doubleTap: hapticDoubleTap,
    success: hapticSuccess,
    error: hapticError,
    warning: hapticWarning,
    cancel: hapticCancel,
    isSupported: isHapticSupported
};
