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