import { format, formatDistanceToNow } from 'date-fns'

export const dateUtils = {
  format(date: string | Date, pattern = 'MMM d, yyyy'): string {
    return format(new Date(date), pattern)
  },

  formatTime(date: string | Date): string {
    return format(new Date(date), 'h:mm a')
  },

  formatDateTime(date: string | Date): string {
    return format(new Date(date), 'MMM d, yyyy h:mm a')
  },

  formatRelative(date: string | Date): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  },

  isSameDay(date1: string | Date, date2: string | Date): boolean {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    )
  },
  
  /**
   * Get local date in YYYY-MM-DD format without timezone shifting
   * Prevents the "off by one day" issue caused by UTC conversion
   */
  localDateString(date: Date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },
  
  /**
   * Parse a date string and return a date object set to local timezone
   * This prevents timezone issues when displaying dates
   */
  parseLocalDate(dateStr: string | Date): Date {
    if (!dateStr) return new Date();
    
    // If it's already a date object, return it
    if (dateStr instanceof Date) return dateStr;
    
    // Split the date string into parts
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Create a date with local timezone
    return new Date(year, month - 1, day);
  }
} 