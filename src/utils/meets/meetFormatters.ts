/**
 * Formatting utilities for track meets
 */

import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import type { MeetStatus } from '../../types/meetTypes';

/**
 * Format meet date with enhanced error handling and internationalization support
 */
export const formatMeetDate = (dateString: string | Date, includeYear = true): string => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    if (!isValid(date)) {
      console.warn('Invalid date provided to formatMeetDate:', dateString);
      return 'Invalid Date';
    }
    
    const formatString = includeYear ? 'MMMM d, yyyy' : 'MMMM d';
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting meet date:', error);
    return 'Date Error';
  }
};

/**
 * Format event date without timezone conversion issues
 * Specifically handles YYYY-MM-DD format strings
 */
export const formatEventDate = (dateString: string | Date): string => {
  try {
    if (typeof dateString === 'string') {
      // Parse date manually to avoid timezone issues
      // Assuming dateString is in format YYYY-MM-DD
      const [year, month, day] = dateString.split('-').map(Number);
      if (year && month && day) {
        const date = new Date(year, month - 1, day); // month is 0-indexed
        return format(date, 'EEEE d, yyyy');
      }
    }
    
    // Fallback to regular date handling
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    if (!isValid(date)) {
      console.warn('Invalid date provided to formatEventDate:', dateString);
      return 'Invalid Date';
    }
    
    return format(date, 'EEEE d, yyyy');
  } catch (error) {
    console.error('Error formatting event date:', error);
    return 'Date Error';
  }
};

/**
 * Format event time for display with enhanced validation for both HH:MM and HH:MM:SS formats
 * @param timeString - Time string in HH:MM or HH:MM:SS format
 * @param timeFormat - Optional time format preference ('12' or '24')
 */
export const formatEventTime = (timeString: string, timeFormat: '12' | '24' = '12'): string => {
  try {
    // Handle empty/null input gracefully
    if (!timeString || typeof timeString !== 'string') {
      return 'Time TBD';
    }
    
    // Validate time format (HH:MM or HH:MM:SS)
    const timePattern = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$/;
    if (!timePattern.test(timeString.trim())) {
      console.warn('Invalid time format provided:', timeString);
      return 'Invalid Time';
    }
    
    // Split and parse time components
    const timeParts = timeString.trim().split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    // Ignore seconds if present - we only need hours and minutes for display
    
    // Explicit NaN checks to avoid hidden NaNs
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      console.warn('Time parsing resulted in NaN:', timeString);
      return 'Invalid Time';
    }
    
    // Create a date object with today's date and the provided time
    const today = new Date();
    today.setHours(hours, minutes, 0, 0);
    
    // Format based on preference
    if (timeFormat === '24') {
      return format(today, 'HH:mm');
    } else {
      return format(today, 'h:mm a');
    }
  } catch (error) {
    console.error('Error formatting event time:', error);
    return 'Time Error';
  }
};

/**
 * Calculate and format meet duration for multi-day events with DST-safe calculations
 */
export const formatMeetDuration = (startDate: string | Date, endDate?: string | Date): string => {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    
    if (!isValid(start)) {
      return 'Single day';
    }
    
    if (!endDate) {
      return 'Single day';
    }
    
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    if (!isValid(end)) {
      return 'Single day';
    }
    
    // Use calendar day difference to avoid DST issues
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const daysDifference = Math.round((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference <= 0) {
      return 'Single day';
    }
    
    const totalDays = daysDifference + 1; // Include both start and end days
    
    // Clearer messaging based on duration
    if (totalDays === 2) {
      return '2-day meet';
    } else if (totalDays <= 7) {
      return `${totalDays}-day meet`;
    } else {
      return `${totalDays}-day competition`;
    }
  } catch (error) {
    console.error('Error calculating meet duration:', error);
    return 'Duration unknown';
  }
};

/**
 * Get status color for consistent theming across components - SINGLE SOURCE OF TRUTH
 */
export const getStatusColor = (status?: MeetStatus | string): string => {
  const statusColors: Record<string, string> = {
    'Completed': 'green',
    'Cancelled': 'red',
    'Postponed': 'orange',
    'In Progress': 'orange',
    'Upcoming': 'blue',
    'Draft': 'gray',
    'Today': 'orange',
    'Past': 'gray',
    'This Week': 'blue',
    'This Month': 'blue'
  };
  
  return statusColors[status || 'Upcoming'] || 'blue';
};

/**
 * Enhanced event status calculation with case-insensitive status & calendar-day differences
 */
export const getEventStatus = (meetDate: string | Date, meetStatus?: MeetStatus | string): string => {
  try {
    // Case-insensitive status checking for explicit statuses
    const normalizedStatus = meetStatus?.toLowerCase();
    if (normalizedStatus === 'cancelled') return 'Cancelled';
    if (normalizedStatus === 'completed') return 'Completed';
    if (normalizedStatus === 'postponed') return 'Postponed';
    if (normalizedStatus === 'in progress') return 'In Progress';
    
    const date = typeof meetDate === 'string' ? parseISO(meetDate) : meetDate;
    
    if (!isValid(date)) {
      return 'Unknown';
    }
    
    // Use calendar-day differences to avoid time-of-day issues
    const today = new Date();
    const todayCalendar = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const meetCalendar = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = meetCalendar.getTime() - todayCalendar.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Past';
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays <= 7) {
      return 'This Week';
    } else if (diffDays <= 30) {
      return 'This Month';
    } else {
      return 'Upcoming';
    }
  } catch (error) {
    console.error('Error calculating event status:', error);
    return 'Unknown';
  }
};

/**
 * Format athlete name with fallback handling
 */
export const formatAthleteName = (athlete: { first_name?: string; last_name?: string } | null): string => {
  if (!athlete) {
    return 'Unknown Athlete';
  }
  
  const { first_name = '', last_name = '' } = athlete;
  
  if (!first_name && !last_name) {
    return 'Unknown Athlete';
  }
  
  if (!first_name) {
    return last_name;
  }
  
  if (!last_name) {
    return first_name;
  }
  
  return `${first_name} ${last_name}`;
};

/**
 * NEW: Format time ago/until for meet dates
 */
export const formatTimeUntilMeet = (meetDate: string | Date): string => {
  try {
    const date = typeof meetDate === 'string' ? parseISO(meetDate) : meetDate;
    
    if (!isValid(date)) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffInDays = differenceInDays(date, now);
    
    if (diffInDays < 0) {
      const pastDays = Math.abs(diffInDays);
      if (pastDays === 1) return '1 day ago';
      if (pastDays < 7) return `${pastDays} days ago`;
      if (pastDays < 30) return `${Math.floor(pastDays / 7)} weeks ago`;
      return `${Math.floor(pastDays / 30)} months ago`;
    } else if (diffInDays === 0) {
      return 'Today';
    } else {
      if (diffInDays === 1) return 'Tomorrow';
      if (diffInDays < 7) return `In ${diffInDays} days`;
      if (diffInDays < 30) return `In ${Math.floor(diffInDays / 7)} weeks`;
      return `In ${Math.floor(diffInDays / 30)} months`;
    }
  } catch (error) {
    console.error('Error calculating time until meet:', error);
    return 'Unknown';
  }
};

/**
 * Formats a date range for multi-day events
 * @param startDate - Start date string
 * @param endDate - End date string (optional)
 * @returns Formatted date range string
 */
export const formatDateRange = (startDate: string, endDate?: string): string => {
  const formattedStart = formatMeetDate(startDate);
  
  if (!endDate || endDate === startDate) {
    return formattedStart;
  }
  
  const formattedEnd = formatMeetDate(endDate);
  return `${formattedStart} → ${formattedEnd}`;
};

/**
 * Checks if a meet is a multi-day event
 * @param startDate - Start date string
 * @param endDate - End date string (optional)
 * @returns True if the meet spans multiple days
 */
export const isMultiDayEvent = (startDate: string, endDate?: string): boolean => {
  return Boolean(endDate && endDate !== startDate);
}; 