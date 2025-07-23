/**
 * Date utilities that handle local timezone properly to prevent timezone conversion issues
 */

/**
 * Get today's date in YYYY-MM-DD format using local timezone
 * This prevents the common issue where dates shift due to UTC conversion
 */
export const getTodayLocalDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get yesterday's date in YYYY-MM-DD format using local timezone
 * Useful for timezone-flexible date matching
 */
export const getYesterdayLocalDate = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format a Date object to YYYY-MM-DD using local timezone
 * Replacement for date.toISOString().split('T')[0] to prevent UTC conversion
 */
export const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if a date string matches today or yesterday (for timezone flexibility)
 * Useful when dates might be off by one day due to timezone differences
 */
export const isDateTodayOrYesterday = (dateStr: string): boolean => {
  const today = getTodayLocalDate();
  const yesterday = getYesterdayLocalDate();
  return dateStr === today || dateStr === yesterday;
};

/**
 * Parse a date string (YYYY-MM-DD) and return a Date object in local timezone
 * This prevents the timezone conversion issue where "2024-07-21" becomes July 20th in local time
 */
export const parseDateLocal = (dateString: string): Date => {
  if (!dateString) {
    return new Date();
  }
  
  // Handle both YYYY-MM-DD and YYYY-MM-DDTHH:MM:SS formats
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(num => parseInt(num, 10));
  
  // Create date in local timezone (month is 0-indexed)
  return new Date(year, month - 1, day);
};

/**
 * Format a date string for display without timezone conversion issues
 * Handles common date formats and returns a user-friendly display format
 */
export const formatDateDisplay = (dateString: string, options?: {
  month: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day: 'numeric' | '2-digit';
  year: 'numeric' | '2-digit';
}): string => {
  if (!dateString) return 'Not set';
  
  const date = parseDateLocal(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric', 
    year: '2-digit',
    ...options
  });
};

/**
 * Format function for date display - standardized format
 * Replacement for problematic new Date(dateString).toLocaleDateString() calls
 */
export const format = (dateString: string, formatStr?: string): string => {
  if (!dateString) return 'Not set';
  
  const date = parseDateLocal(dateString);
  
  // Handle different format strings
  if (formatStr === 'MMM d, yyyy') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  // Default format
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit'
  });
}; 