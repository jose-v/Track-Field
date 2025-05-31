// Utility functions for exercise-related operations

/**
 * Determines if an exercise is a running/timing exercise based on its name
 */
export const isRunExercise = (exerciseName: string): boolean => {
  if (!exerciseName) return false;
  
  const name = exerciseName.toLowerCase();
  
  // Common running exercise patterns
  const runPatterns = [
    'sprint', 'run', 'dash', 'jog', 'meter', 'mile', 'km', 'yard',
    '100m', '200m', '400m', '800m', '1500m', '5k', '10k',
    'marathon', 'relay', 'hurdles', 'steeplechase'
  ];
  
  return runPatterns.some(pattern => name.includes(pattern));
};

/**
 * Formats time from components to display string (MM:SS.HH)
 */
export const formatTime = (
  minutes: number, 
  seconds: number, 
  hundredths: number
): string => {
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
};

/**
 * Converts time components to total milliseconds
 */
export const timeToMilliseconds = (
  minutes: number, 
  seconds: number, 
  hundredths: number
): number => {
  return (minutes * 60 * 1000) + (seconds * 1000) + (hundredths * 10);
};

/**
 * Converts milliseconds back to time components
 */
export const millisecondsToTime = (totalMs: number): {
  minutes: number;
  seconds: number;
  hundredths: number;
} => {
  const minutes = Math.floor(totalMs / (60 * 1000));
  const remainingMs = totalMs % (60 * 1000);
  const seconds = Math.floor(remainingMs / 1000);
  const hundredths = Math.floor((remainingMs % 1000) / 10);
  
  return { minutes, seconds, hundredths };
};

/**
 * Validates if time values are reasonable for athletic performance
 */
export const validateTime = (
  minutes: number, 
  seconds: number, 
  hundredths: number
): { isValid: boolean; error?: string } => {
  // Check for negative values
  if (minutes < 0 || seconds < 0 || hundredths < 0) {
    return { isValid: false, error: 'Time values cannot be negative' };
  }
  
  // Check for zero time (likely a mistake)
  if (minutes === 0 && seconds === 0 && hundredths === 0) {
    return { isValid: false, error: 'Please enter a valid time' };
  }
  
  // Check for unreasonably fast times (sub-human performance)
  const totalMs = timeToMilliseconds(minutes, seconds, hundredths);
  if (totalMs < 1000) { // Less than 1 second
    return { isValid: false, error: 'Time seems too fast. Please check your entry.' };
  }
  
  // Check for unreasonably slow times (over 1 hour)
  if (totalMs > 60 * 60 * 1000) {
    return { isValid: false, error: 'Time seems too slow. Please check your entry.' };
  }
  
  return { isValid: true };
}; 