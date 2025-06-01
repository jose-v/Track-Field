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
 * Format event time with 12-hour format and enhanced validation
 */
export const formatEventTime = (timeString: string): string => {
  try {
    if (!timeString || typeof timeString !== 'string') {
      return 'Time TBD';
    }
    
    // Create a date object with today's date and the provided time
    const today = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn('Invalid time format provided:', timeString);
      return 'Invalid Time';
    }
    
    today.setHours(hours, minutes, 0, 0);
    return format(today, 'h:mm a');
  } catch (error) {
    console.error('Error formatting event time:', error);
    return 'Time Error';
  }
};

/**
 * NEW: Calculate and format meet duration for multi-day events
 */
export const formatMeetDuration = (startDate: string | Date, endDate?: string | Date): string => {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    
    if (!isValid(start)) {
      return 'Single day event';
    }
    
    if (!endDate) {
      return 'Single day event';
    }
    
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    if (!isValid(end)) {
      return 'Single day event';
    }
    
    const daysDifference = differenceInDays(end, start);
    
    if (daysDifference <= 0) {
      return 'Single day event';
    }
    
    const totalDays = daysDifference + 1; // Include both start and end days
    return `${totalDays}-day event`;
  } catch (error) {
    console.error('Error calculating meet duration:', error);
    return 'Duration unknown';
  }
};

/**
 * Get status color for consistent theming across components
 */
export const getStatusColor = (status?: string): string => {
  const statusColors: Record<string, string> = {
    'Completed': 'green',
    'Cancelled': 'red',
    'Postponed': 'orange',
    'In Progress': 'orange',
    'Upcoming': 'blue',
    'Draft': 'gray'
  };
  
  return statusColors[status || 'Upcoming'] || 'blue';
};

/**
 * Enhanced event status calculation with time-aware logic
 */
export const getEventStatus = (meetDate: string | Date, meetStatus?: string): string => {
  try {
    // If meet has explicit status, use it for cancelled/completed
    if (meetStatus === 'Cancelled') return 'Cancelled';
    if (meetStatus === 'Completed') return 'Completed';
    if (meetStatus === 'Postponed') return 'Postponed';
    if (meetStatus === 'In Progress') return 'In Progress';
    
    const date = typeof meetDate === 'string' ? parseISO(meetDate) : meetDate;
    
    if (!isValid(date)) {
      return 'Unknown';
    }
    
    const today = new Date();
    const meetDateTime = new Date(date);
    
    // Set times to beginning of day for accurate comparison
    meetDateTime.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = meetDateTime.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
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