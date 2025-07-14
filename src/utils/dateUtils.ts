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