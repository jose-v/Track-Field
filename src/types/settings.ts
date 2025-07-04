// TODO: REMOVE DUMMY DATA - Replace with real database types when ready

export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  units: 'metric' | 'imperial';
  timeFormat: '12' | '24';
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  workout_reminders: boolean;
  meet_updates: boolean;
  coach_messages: boolean;
  team_updates: boolean;
  performance_alerts: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  quiet_hours_start: string; // HH:MM format
  quiet_hours_end: string; // HH:MM format
  created_at: string;
  updated_at: string;
}

export interface PrivacySettings {
  id: string;
  user_id: string;
  profile_visibility: 'public' | 'team_only' | 'private';
  performance_data_visibility: 'public' | 'coaches_only' | 'private';
  allow_coach_contact: boolean;
  allow_team_invites: boolean;
  share_workout_data: boolean;
  share_performance_data: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicalInformation {
  id: string;
  user_id: string;
  allergies: string[];
  medications: string[];
  medical_conditions: string[];
  emergency_notes: string;
  blood_type?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  created_at: string;
  updated_at: string;
}

// Combined settings interface for UI
export interface UserSettingsComplete {
  settings: UserSettings;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  emergencyContacts: EmergencyContact[];
  medicalInfo?: MedicalInformation;
}

// Settings form data interfaces
export interface SettingsFormData {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  units: 'metric' | 'imperial';
  timeFormat: '12' | '24';
}

export interface NotificationFormData {
  workout_reminders: boolean;
  meet_updates: boolean;
  coach_messages: boolean;
  team_updates: boolean;
  performance_alerts: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export interface PrivacyFormData {
  profile_visibility: 'public' | 'team_only' | 'private';
  performance_data_visibility: 'public' | 'coaches_only' | 'private';
  allow_coach_contact: boolean;
  allow_team_invites: boolean;
  share_workout_data: boolean;
  share_performance_data: boolean;
} 