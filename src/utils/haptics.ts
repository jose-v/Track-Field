/**
 * Haptic Feedback Utility for Web/React
 * Uses the Web Vibration API for mobile haptic feedback
 */

// Check if vibration is supported
const isVibrationSupported = (): boolean => {
  return 'vibrate' in navigator;
};

// Haptic feedback patterns (in milliseconds)
const HapticPatterns = {
  // Light feedback patterns
  LIGHT: [50],
  MEDIUM: [100],
  HEAVY: [150],
  
  // Success/completion patterns
  SUCCESS: [50, 50, 100],
  ACHIEVEMENT: [100, 50, 100, 50, 200],
  
  // Error/warning patterns
  ERROR: [200, 100, 200],
  WARNING: [100, 50, 100],
  
  // Action patterns
  SELECTION: [30],
  BUTTON_PRESS: [75],
  START_ACTION: [150, 50, 150],
  
  // Workout specific patterns
  REP_COMPLETE: [50, 30, 50],
  SET_COMPLETE: [100, 50, 100],
  WORKOUT_COMPLETE: [200, 100, 200, 100, 300],
  REST_START: [75, 50, 75],
  COUNTDOWN: [100],
  
  // Navigation patterns
  PAGE_CHANGE: [40],
  MODAL_OPEN: [60],
  MODAL_CLOSE: [40],
} as const;

export type HapticType = keyof typeof HapticPatterns;

/**
 * Trigger haptic feedback with the specified pattern
 * @param type - The type of haptic feedback to trigger
 * @param options - Optional configuration
 */
export const triggerHaptic = (
  type: HapticType,
  options: {
    enabled?: boolean;
    fallbackToConsole?: boolean;
  } = {}
): void => {
  const { 
    enabled = true, 
    fallbackToConsole = false 
  } = options;

  // Return early if haptics are disabled
  if (!enabled) return;

  // Check if vibration is supported
  if (!isVibrationSupported()) {
    if (fallbackToConsole) {
      console.log(`🔊 Haptic feedback (${type}): Vibration API not supported`);
    }
    return;
  }

  try {
    const pattern = HapticPatterns[type];
    navigator.vibrate(pattern);
    
    if (fallbackToConsole) {
      console.log(`📱 Haptic feedback triggered: ${type} - Pattern: [${pattern.join(', ')}]ms`);
    }
  } catch (error) {
    console.warn('Failed to trigger haptic feedback:', error);
  }
};

/**
 * Cancel any ongoing vibration
 */
export const cancelHaptic = (): void => {
  if (isVibrationSupported()) {
    navigator.vibrate(0);
  }
};

/**
 * Check if haptic feedback is available
 */
export const isHapticAvailable = (): boolean => {
  return isVibrationSupported();
};

/**
 * Convenience functions for common haptic patterns
 */
export const haptics = {
  // Light interactions
  light: () => triggerHaptic('LIGHT'),
  medium: () => triggerHaptic('MEDIUM'),
  heavy: () => triggerHaptic('HEAVY'),
  
  // User actions
  selection: () => triggerHaptic('SELECTION'),
  buttonPress: () => triggerHaptic('BUTTON_PRESS'),
  
  // Feedback
  success: () => triggerHaptic('SUCCESS'),
  error: () => triggerHaptic('ERROR'),
  warning: () => triggerHaptic('WARNING'),
  achievement: () => triggerHaptic('ACHIEVEMENT'),
  
  // Workout specific
  repComplete: () => triggerHaptic('REP_COMPLETE'),
  setComplete: () => triggerHaptic('SET_COMPLETE'),
  workoutComplete: () => triggerHaptic('WORKOUT_COMPLETE'),
  restStart: () => triggerHaptic('REST_START'),
  countdown: () => triggerHaptic('COUNTDOWN'),
  startAction: () => triggerHaptic('START_ACTION'),
  
  // Navigation
  pageChange: () => triggerHaptic('PAGE_CHANGE'),
  modalOpen: () => triggerHaptic('MODAL_OPEN'),
  modalClose: () => triggerHaptic('MODAL_CLOSE'),
  
  // Utilities
  cancel: cancelHaptic,
  isAvailable: isHapticAvailable,
};

export default haptics; 