/**
 * Barrel exports for meet utilities
 * This allows for clean imports like: import { formatMeetDate, generateMapsLink } from '@/utils/meets'
 */

// Map utilities
export {
  generateMapsLink,
  formatLocationString,
  hasLocationInfo
} from './mapUtils';

// Formatting utilities
export {
  formatMeetDate,
  formatEventTime,
  getStatusColor,
  getEventStatus,
  formatDateRange,
  isMultiDayEvent
} from './meetFormatters';

// General helper utilities
export {
  sortMeetsByDate,
  groupEventsByMeetId,
  countEventsByMeetId,
  deduplicateAthletes,
  formatAthleteName,
  isValidRunTime,
  getDisplayedAthletes,
  hasCompleteLocationInfo,
  abbreviateEventName
} from './meetHelpers'; 

/**
 * Determines if a meet is happening today (current meet) considering timezones
 * @param meetDate - The date of the meet (YYYY-MM-DD format)
 * @param meetTimezone - Optional timezone of the meet location
 * @returns boolean indicating if the meet is today
 */
export const isMeetToday = (meetDate: string, meetTimezone?: string): boolean => {
  try {
    const today = new Date();
    const meetDateObj = new Date(meetDate + 'T00:00:00');
    
    // If we have a meet timezone, we should ideally convert to that timezone
    // For now, we'll use local timezone comparison
    const todayString = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
    
    return meetDate === todayString;
  } catch (error) {
    console.error('Error comparing meet date:', error);
    return false;
  }
};

/**
 * Gets the local date string in YYYY-MM-DD format
 * @returns string in YYYY-MM-DD format
 */
export const getLocalDateString = (): string => {
  const today = new Date();
  return today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');
};

/**
 * Determines if a meet is current (happening today) or next (upcoming)
 * @param meets - Array of meets sorted by date
 * @returns object with nextMeet, isCurrentMeet, and categorized meets
 */
export const categorizeMeetsByDate = (meets: any[]) => {
  const localToday = getLocalDateString();
  
  // Sort meets by date
  const sortedMeets = [...meets].sort((a, b) => 
    new Date(a.meet_date).getTime() - new Date(b.meet_date).getTime()
  );

  const nextMeet = sortedMeets.find(meet => 
    meet.meet_date >= localToday
  );

  // Check if the next meet is happening today (current meet)
  const isCurrentMeet = nextMeet && isMeetToday(nextMeet.meet_date);

  const upcomingMeets = sortedMeets.filter(meet => 
    meet.meet_date > localToday
  );

  const pastMeets = sortedMeets.filter(meet => 
    meet.meet_date < localToday
  );

  return {
    nextMeet: nextMeet ? [nextMeet] : [],
    isCurrentMeet,
    upcoming: upcomingMeets,
    past: pastMeets,
    all: sortedMeets
  };
}; 