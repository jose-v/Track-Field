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
    // Parse the meet date as a local date (not UTC)
    const [year, month, day] = meetDate.split('-').map(Number);
    const meetDateObj = new Date(year, month - 1, day); // month is 0-indexed
    
    // Get today's date in local timezone
    const today = new Date();
    const todayObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return meetDateObj.getTime() === todayObj.getTime();
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
  // Get today's date as a Date object for proper comparison
  const today = new Date();
  const todayObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayTime = todayObj.getTime();
  
  // Sort meets by date
  const sortedMeets = [...meets].sort((a, b) => {
    const dateA = new Date(a.meet_date + 'T00:00:00').getTime();
    const dateB = new Date(b.meet_date + 'T00:00:00').getTime();
    return dateA - dateB;
  });

  // Helper function to parse meet date properly
  const parseMeetDate = (meetDate: string) => {
    const [year, month, day] = meetDate.split('-').map(Number);
    return new Date(year, month - 1, day).getTime(); // month is 0-indexed
  };

  // Helper function to check if a meet is currently active (for multi-day meets)
  const isMeetActive = (meet: any) => {
    const startTime = parseMeetDate(meet.meet_date);
    
    // If no end_date, it's a single-day meet
    if (!meet.end_date) {
      return startTime === todayTime; // Only active on the exact day
    }
    
    // For multi-day meets, check if today is between start and end dates (inclusive)
    const endTime = parseMeetDate(meet.end_date);
    return todayTime >= startTime && todayTime <= endTime;
  };

  // Helper function to check if a meet is upcoming (starts in the future)
  const isMeetUpcoming = (meet: any) => {
    const startTime = parseMeetDate(meet.meet_date);
    return startTime > todayTime;
  };

  // Helper function to check if a meet is past (completely finished)
  const isMeetPast = (meet: any) => {
    // If no end_date, use start_date
    const endTime = meet.end_date ? parseMeetDate(meet.end_date) : parseMeetDate(meet.meet_date);
    return endTime < todayTime;
  };

  // Find the next meet (either currently active or upcoming)
  const nextMeet = sortedMeets.find(meet => 
    isMeetActive(meet) || isMeetUpcoming(meet)
  );

  // Check if the next meet is currently active (happening today)
  const isCurrentMeet = nextMeet && isMeetActive(nextMeet);

  const upcomingMeets = sortedMeets.filter(meet => isMeetUpcoming(meet));
  const pastMeets = sortedMeets.filter(meet => isMeetPast(meet));

  return {
    nextMeet: nextMeet ? [nextMeet] : [],
    isCurrentMeet,
    upcoming: upcomingMeets,
    past: pastMeets,
    all: sortedMeets
  };
}; 