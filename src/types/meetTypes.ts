// Consolidated meet types used across the application

export interface TrackMeet {
  id: string;
  name: string;
  meet_date: string;
  city?: string;
  state?: string;
  status?: string;
  description?: string;
  coach_id?: string;
  athlete_id?: string;
  end_date?: string;
  venue_type?: string;
  venue_name?: string;
  join_link?: string;
}

export interface MeetEvent {
  id: string;
  event_name: string;
  event_day?: number;
  start_time?: string;
  meet_id: string;
  run_time?: string;
  heat?: number;
  event_type?: EventType;
}

export interface EventFormData {
  event_name: string;
  event_date: string;
  event_day: string;
  start_time: string;
  heat: string;
  event_type: string;
  run_time: string;
}

export interface AthleteWithName {
  id: string;
  first_name: string;
  last_name: string;
  name?: string; // Computed field
}

export interface Coach {
  id: string;
  name: string;
}

export interface MeetWithEvents {
  meet: TrackMeet;
  events: MeetEvent[];
  assignedByCoach?: string;
}

export interface CoachMeetWithData {
  meet: TrackMeet;
  events: MeetEvent[];
  athletes: AthleteWithName[];
}

export interface DebugInfo {
  coachCount: number;
  meetCount: number;
  eventCount: number;
  lastError: string | null;
}

export type MeetStatus = 'Completed' | 'Cancelled' | 'Upcoming' | 'Past' | 'Today';

export type VenueType = 'Indoor' | 'Outdoor';

export type EventType = 'Preliminary' | 'Qualifier' | 'Semifinal' | 'Finals'; 