/**
 * General helper utilities for track meets
 */

import type { TrackMeet, MeetEvent, AthleteWithName } from '../../types/meetTypes';

/**
 * Sorts meets by date (ascending order - upcoming first)
 * @param meets - Array of track meets
 * @returns Sorted array of meets
 */
export const sortMeetsByDate = <T extends { meet_date: string }>(meets: T[]): T[] => {
  return [...meets].sort((a, b) => {
    const dateA = new Date(a.meet_date).getTime();
    const dateB = new Date(b.meet_date).getTime();
    return dateA - dateB;
  });
};

/**
 * Groups events by meet ID
 * @param events - Array of meet events
 * @returns Record mapping meet IDs to their events
 */
export const groupEventsByMeetId = (events: MeetEvent[]): Record<string, MeetEvent[]> => {
  return events.reduce((acc, event) => {
    if (!acc[event.meet_id]) {
      acc[event.meet_id] = [];
    }
    acc[event.meet_id].push(event);
    return acc;
  }, {} as Record<string, MeetEvent[]>);
};

/**
 * Counts events by meet ID
 * @param events - Array of meet events
 * @returns Record mapping meet IDs to event counts
 */
export const countEventsByMeetId = (events: MeetEvent[]): Record<string, number> => {
  return events.reduce((acc, event) => {
    acc[event.meet_id] = (acc[event.meet_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Deduplicates athletes by ID
 * @param athletes - Array of athletes (may contain duplicates)
 * @returns Array of unique athletes
 */
export const deduplicateAthletes = (athletes: AthleteWithName[]): AthleteWithName[] => {
  const seen = new Set<string>();
  return athletes.filter(athlete => {
    if (seen.has(athlete.id)) {
      return false;
    }
    seen.add(athlete.id);
    return true;
  });
};

/**
 * Formats athlete full name
 * @param athlete - Athlete object with first_name and last_name
 * @returns Formatted full name
 */
export const formatAthleteName = (athlete: { first_name: string; last_name: string }): string => {
  return `${athlete.first_name} ${athlete.last_name}`;
};

/**
 * Validates run time format
 * @param runTime - Run time string to validate
 * @returns True if format is valid
 */
export const isValidRunTime = (runTime: string): boolean => {
  if (!runTime.trim()) return false;
  
  // Allow formats like: 10.85, 2:05.43, 15:30.12
  const timePattern = /^(\d+:)?(\d+\.?\d*)$/;
  return timePattern.test(runTime.trim());
};

/**
 * Gets the first N athletes with overflow indicator
 * @param athletes - Array of athletes
 * @param maxDisplay - Maximum number to display
 * @returns Object with displayed athletes and overflow count
 */
export const getDisplayedAthletes = (athletes: AthleteWithName[], maxDisplay: number = 3) => {
  return {
    displayed: athletes.slice(0, maxDisplay),
    overflow: Math.max(0, athletes.length - maxDisplay)
  };
};

/**
 * Checks if a meet has complete location information
 * @param meet - Track meet object
 * @returns True if meet has city and state information
 */
export const hasCompleteLocationInfo = (meet: TrackMeet): boolean => {
  return Boolean(meet.city && meet.state);
};

/**
 * Gets abbreviated event name for display in limited space
 * @param eventName - Full event name
 * @param maxLength - Maximum length for abbreviation
 * @returns Abbreviated event name
 */
export const abbreviateEventName = (eventName: string, maxLength: number = 20): string => {
  if (eventName.length <= maxLength) return eventName;
  
  // Common abbreviations for track events
  const abbreviations: Record<string, string> = {
    'meters': 'm',
    'meter': 'm',
    'hurdles': 'H',
    'relay': 'R',
    'steeplechase': 'SC',
    'javelin': 'Jav',
    'shot put': 'SP',
    'discus': 'Disc',
    'hammer': 'Ham',
    'pole vault': 'PV',
    'high jump': 'HJ',
    'long jump': 'LJ',
    'triple jump': 'TJ'
  };
  
  let abbreviated = eventName;
  Object.entries(abbreviations).forEach(([full, abbr]) => {
    const regex = new RegExp(full, 'gi');
    abbreviated = abbreviated.replace(regex, abbr);
  });
  
  if (abbreviated.length <= maxLength) return abbreviated;
  
  // If still too long, truncate with ellipsis
  return abbreviated.substring(0, maxLength - 3) + '...';
}; 