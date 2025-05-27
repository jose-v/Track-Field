// Track Meet Types
export interface TrackMeet {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  coach_id?: string;
  athlete_id?: string;
  school?: string;
  meet_type?: string;
  sanctioning_body?: string;
  host_organization?: string;
  status: string;
  registration_deadline?: string;
  entry_fee?: number;
  meet_date: string;
  arrival_date?: string;
  departure_date?: string;
  transportation_modes?: string[];
  transportation_info?: string;
  lodging_type?: string;
  lodging_details?: string;
  created_at: string;
  updated_at: string;
}

// Form data for creating/editing track meets
export interface TrackMeetFormData {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  coach_id?: string; // Only for athletes to select a coach
  school?: string;
  meet_type?: string;
  sanctioning_body?: string;
  host_organization?: string;
  status: string;
  registration_deadline?: string;
  entry_fee?: number;
  meet_date: string;
  arrival_date?: string;
  departure_date?: string;
  transportation_modes?: string[];
  transportation_info?: string;
  lodging_type?: string;
  lodging_details?: string;
}

// Meet Event Types
export interface MeetEvent {
  id: string;
  meet_id: string;
  event_id?: string;
  event_name: string;
  event_day?: number;
  start_time?: string;
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
  event_day?: number;
  start_time?: string;
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