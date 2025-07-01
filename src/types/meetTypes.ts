// Consolidated meet types used across the application

export interface TrackMeet {
  id: string;
  name: string;
  meet_date: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  status?: string;
  description?: string;
  coach_id?: string;
  athlete_id?: string;
  end_date?: string;
  venue_type?: string;
  venue_name?: string;
  join_link?: string;
  
  // New date fields for Multi Events and Track & Field
  multi_events_start_date?: string;
  multi_events_end_date?: string;
  track_field_start_date?: string;
  track_field_end_date?: string;
  
  // Registration information  
  registration_fee?: number;
  processing_fee?: number;
  entry_deadline_date?: string;
  entry_deadline_time?: string;
  
  // Packet pickup information
  packet_pickup_date?: string;
  packet_pickup_location?: string;
  packet_pickup_address?: string;
  packet_pickup_city?: string;
  packet_pickup_state?: string;
  packet_pickup_country?: string;
  packet_pickup_zip?: string;
  
  // Web links
  tickets_link?: string;
  visitor_guide_link?: string;
  
  // Lodging information
  lodging_type?: string;
  lodging_place_name?: string;
  lodging_address?: string;
  lodging_city?: string;
  lodging_state?: string;
  lodging_country?: string;
  lodging_zip?: string;
  lodging_phone?: string;
  lodging_website?: string;
  lodging_checkin_date?: string;
  lodging_checkout_date?: string;
  lodging_checkin_time?: string;
  lodging_checkout_time?: string;
}

export interface MeetEvent {
  id: string;
  event_name: string;
  event_date?: string;
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