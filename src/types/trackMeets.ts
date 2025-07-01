import { MeetFile } from './meetFiles';

// Track Meet Types
export interface TrackMeet {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  coach_id?: string;
  athlete_id?: string;
  school?: string;
  meet_type?: 'track_field' | 'multi_events';
  sanctioning_body?: string;
  host_organization?: string;
  status: string;
  registration_deadline?: string;
  entry_fee?: number;
  meet_date: string; // Start date for both single and multi-day meets
  end_date?: string; // End date for multi-day meets
  venue_type?: 'Indoor' | 'Outdoor'; // Indoor or Outdoor
  venue_name?: string; // TF Stadium/venue name
  join_link?: string; // Optional link to join the meet
  description?: string; // Additional details about the meet
  
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
  
  arrival_date?: string;
  departure_date?: string;
  transportation_modes?: string[];
  transportation_info?: string;
  lodging_type?: string;
  lodging_place_name?: string;
  lodging_address?: string;
  lodging_city?: string;
  lodging_state?: string;
  lodging_country?: string;
  lodging_zip?: string;
  lodging_phone?: string;
  lodging_email?: string;
  lodging_website?: string;
  lodging_checkin_date?: string;
  lodging_checkout_date?: string;
  lodging_checkin_time?: string;
  lodging_checkout_time?: string;
  lodging_details?: string;
  // Assistant coaches
  assistant_coach_1_name?: string;
  assistant_coach_1_phone?: string;
  assistant_coach_1_email?: string;
  assistant_coach_2_name?: string;
  assistant_coach_2_phone?: string;
  assistant_coach_2_email?: string;
  assistant_coach_3_name?: string;
  assistant_coach_3_phone?: string;
  assistant_coach_3_email?: string;
  // Assistant coach IDs for existing coaches
  assistant_coach_1_id?: string;
  assistant_coach_2_id?: string;
  assistant_coach_3_id?: string;
  // Files associated with this meet
  files?: MeetFile[];
  created_at: string;
  updated_at: string;
}

// Form data for creating/editing track meets
export interface TrackMeetFormData {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  coach_id?: string; // Only for athletes to select a coach
  school?: string;
  meet_type?: 'track_field' | 'multi_events';
  sanctioning_body?: string;
  host_organization?: string;
  status: string;
  registration_deadline?: string;
  entry_fee?: number;
  meet_date: string; // Start date for both single and multi-day meets
  end_date?: string; // End date for multi-day meets
  venue_type?: 'Indoor' | 'Outdoor'; // Indoor or Outdoor
  venue_name?: string; // TF Stadium/venue name
  join_link?: string; // Optional link to join the meet
  description?: string; // Additional details about the meet
  
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
  
  arrival_date?: string;
  departure_date?: string;
  transportation_modes?: string[];
  transportation_info?: string;
  lodging_type?: string;
  lodging_place_name?: string;
  lodging_address?: string;
  lodging_city?: string;
  lodging_state?: string;
  lodging_country?: string;
  lodging_zip?: string;
  lodging_phone?: string;
  lodging_email?: string;
  lodging_website?: string;
  lodging_checkin_date?: string;
  lodging_checkout_date?: string;
  lodging_checkin_time?: string;
  lodging_checkout_time?: string;
  lodging_details?: string;
  // Assistant coaches
  assistant_coach_1_name?: string;
  assistant_coach_1_phone?: string;
  assistant_coach_1_email?: string;
  assistant_coach_2_name?: string;
  assistant_coach_2_phone?: string;
  assistant_coach_2_email?: string;
  assistant_coach_3_name?: string;
  assistant_coach_3_phone?: string;
  assistant_coach_3_email?: string;
  // Assistant coach IDs for existing coaches
  assistant_coach_1_id?: string;
  assistant_coach_2_id?: string;
  assistant_coach_3_id?: string;
  // Files associated with this meet
  files?: MeetFile[];
}

// Meet Event Types
export interface MeetEvent {
  id: string;
  meet_id: string;
  event_id?: string;
  event_name: string;
  event_date?: string; // Specific date for this event (for multi-day meets)
  event_day?: number; // Day number (1, 2, 3, etc.)
  start_time?: string;
  heat?: number; // Heat number
  event_type?: 'Qualifier' | 'Finals' | 'Preliminary' | 'Semifinal'; // Type of event
  run_time?: string; // Actual run time (to be filled after event completion)
  created_at: string;
  updated_at: string;
  event?: {
    name: string;
    category: string;
  };
}

// Form data for creating/editing meet events
export interface MeetEventFormData {
  event_id?: string;
  event_name: string;
  event_date?: string; // Specific date for this event
  event_day?: number | string; // Can be string from form input or number for database
  start_time?: string;
  heat?: number | string; // Heat number
  event_type?: 'Qualifier' | 'Finals' | 'Preliminary' | 'Semifinal'; // Type of event
  run_time?: string; // Actual run time (to be filled after event completion)
}

// Athlete Assignment
export interface AthleteAssignment {
  id: string;
  athlete_id: string;
  meet_event_id: string;
  assigned_by?: string;
  created_at: string;
  updated_at: string;
  athlete?: {
    id: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

// Athlete with name for display
export interface AthleteWithName {
  id: string;
  name: string;
} 