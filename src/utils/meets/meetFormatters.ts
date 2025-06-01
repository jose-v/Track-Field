/**
 * Formatting utilities for track meets
 */

import { format } from 'date-fns';
import type { MeetStatus } from '../../types/meetTypes';

/**
 * Formats a meet date for display
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatMeetDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMMM d, yyyy');
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
};

/**
 * Formats an event time for display
 * @param timeString - Time string in HH:MM:SS format
 * @returns Formatted time string or 'TBD'
 */
export const formatEventTime = (timeString?: string): string => {
  if (!timeString) return 'TBD';
  
  try {
    // Format time string (assuming it's in HH:MM:SS format)
    return format(new Date(`2000-01-01T${timeString}`), 'h:mm a');
  } catch (e) {
    console.error('Error formatting time:', e);
    return timeString;
  }
};

/**
 * Gets the appropriate color scheme for a status badge
 * @param status - Meet status
 * @returns Chakra UI color scheme
 */
export const getStatusColor = (status?: string): string => {
  switch (status) {
    case 'Completed': return 'green';
    case 'Cancelled': return 'red';
    case 'Upcoming': return 'blue';
    default: return 'blue';
  }
};

/**
 * Gets the computed event status based on meet date and status
 * @param meet - Track meet object
 * @returns Computed status
 */
export const getEventStatus = (meet: { meet_date: string; status?: string }): MeetStatus => {
  if (meet.status === 'Cancelled') return 'Cancelled';
  if (meet.status === 'Completed') return 'Completed';
  
  const meetDate = new Date(meet.meet_date);
  const today = new Date();
  
  // Set times to beginning of day for accurate comparison
  meetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  if (meetDate < today) {
    return 'Past';
  } else if (meetDate.getTime() === today.getTime()) {
    return 'Today';
  } else {
    return 'Upcoming';
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