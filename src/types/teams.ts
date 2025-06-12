/**
 * Team Management Types
 * Supports both institutional teams and independent coaches
 */

// Core team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  created_by?: string;  // team_manager id
  team_type: 'school' | 'club' | 'independent' | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Team coach relationship
export interface TeamCoach {
  id: string;
  team_id: string;
  coach_id: string;
  assigned_by?: string;  // team_manager id
  role: 'head_coach' | 'assistant_coach' | 'specialist' | 'volunteer';
  specialties?: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Team invitation management
export interface TeamInvitation {
  id: string;
  team_id: string;
  invited_by: string;  // profile id
  invitee_email: string;
  invitee_role: 'athlete' | 'coach' | 'team_manager';
  invite_code: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  declined_at?: string;
}

// Enhanced view types
export interface TeamCoachView {
  team_id: string;
  team_name: string;
  team_description?: string;
  team_type: string;
  invite_code: string;
  team_active: boolean;
  team_coach_id?: string;
  coach_role?: string;
  coach_specialties?: string[];
  coach_active?: boolean;
  coach_id?: string;
  coach_name?: string;
  coach_email?: string;
  coach_avatar?: string;
  coach_all_specialties?: string[];
  coach_certifications?: string[];
}

export interface TeamManagementView {
  team_id: string;
  team_name: string;
  description?: string;
  team_type: string;
  invite_code: string;
  team_created: string;
  manager_id?: string;
  manager_name?: string;
  manager_email?: string;
  organization?: string;
  coach_count: number;
  athlete_count: number;
  pending_invites: number;
}

// Request/Response types for API
export interface CreateTeamRequest {
  name: string;
  description?: string;
  team_type: 'school' | 'club' | 'independent' | 'other';
}

export interface CreateIndependentCoachTeamRequest {
  team_name: string;
  team_description?: string;
}

export interface InviteToTeamRequest {
  team_id: string;
  invitee_email: string;
  invitee_role: 'athlete' | 'coach' | 'team_manager';
  personal_message?: string;
}

export interface JoinTeamRequest {
  invite_code: string;
}

export interface AssignCoachRequest {
  team_id: string;
  coach_id: string;
  role: 'head_coach' | 'assistant_coach' | 'specialist' | 'volunteer';
  specialties?: string[];
}

export interface AssignAthleteToCoachRequest {
  athlete_id: string;
  coach_id: string;
  notes?: string;
}

// Response types
export interface TeamCreationResponse {
  team: Team;
  invite_code: string;
  is_independent_coach?: boolean;
}

export interface TeamJoinResponse {
  success: boolean;
  team: Team;
  role: string;
  message: string;
}

// Dashboard/UI types
export interface TeamDashboardData {
  teams: TeamManagementView[];
  pending_invitations: TeamInvitation[];
  total_athletes: number;
  total_coaches: number;
}

export interface CoachDashboardData {
  assigned_teams: TeamCoachView[];
  independent_team?: Team;
  assigned_athletes: any[]; // Will reference athlete types
  pending_requests: any[]; // Coach-athlete requests
}

export interface AthleteDashboardData {
  current_team?: Team;
  assigned_coach?: any; // Will reference coach types
  available_teams: Team[]; // Teams athlete can discover/join
}

// Utility types
export type TeamRole = 'team_manager' | 'head_coach' | 'assistant_coach' | 'specialist' | 'volunteer' | 'athlete';

export interface TeamMember {
  profile_id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatar_url?: string;
  specialties?: string[];
  joined_at: string;
  is_active: boolean;
}

export interface TeamStats {
  total_members: number;
  athletes: number;
  coaches: number;
  managers: number;
  active_workouts: number;
  completed_workouts: number;
  avg_wellness_score?: number;
}

// Form validation types
export interface TeamFormValidation {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  description: {
    maxLength: number;
  };
  invite_code: {
    format: RegExp;
    length: number;
  };
}

// Constants for validation and UI
export const TEAM_VALIDATION: TeamFormValidation = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  description: {
    maxLength: 500
  },
  invite_code: {
    format: /^[A-Z0-9]{6}$/,
    length: 6
  }
};

export const TEAM_TYPES = [
  { value: 'school', label: 'School Team', description: 'High school or college team' },
  { value: 'club', label: 'Club Team', description: 'Local running club or track club' },
  { value: 'independent', label: 'Independent Coach', description: 'Private coaching business' },
  { value: 'other', label: 'Other', description: 'Other type of organization' }
] as const;

export const COACH_ROLES = [
  { value: 'head_coach', label: 'Head Coach', description: 'Primary team coach with full authority' },
  { value: 'assistant_coach', label: 'Assistant Coach', description: 'Supporting coach role' },
  { value: 'specialist', label: 'Specialist Coach', description: 'Specialist in specific events (sprints, distance, etc.)' },
  { value: 'volunteer', label: 'Volunteer Coach', description: 'Volunteer helping with team activities' }
] as const; 