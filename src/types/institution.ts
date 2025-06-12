/**
 * Institution-Centric Team Manager Types
 * Uses unified teams + team_members system (NO team_managers table)
 */

export interface InstitutionalTeam {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  created_by: string; // References profiles.id (team_manager)
  team_type: 'school' | 'club' | 'independent' | 'other' | 'coach';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Institutional fields (stored in teams table)
  institution_name?: string;
  institution_type?: 'high_school' | 'middle_school' | 'college' | 'university' | 'club' | 'academy' | 'other';
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  established_year?: number;
  manager_title?: string;
}

export interface InstitutionalProfile {
  id: string; // Manager's profile id
  institution_name?: string;
  institution_type?: InstitutionalTeam['institution_type'];
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  established_year?: number;
  manager_title?: string;
  updated_at: string;
  
  // Current manager info (from profiles)
  manager_first_name: string;
  manager_last_name: string;
  manager_email: string;
  manager_personal_phone?: string;
  manager_avatar?: string;
  
  // Institution statistics (from team_members)
  team_count: number;
  total_athletes: number;
  total_coaches: number;
}

export interface InstitutionFormData {
  institution_name: string;
  institution_type: InstitutionalTeam['institution_type'];
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  website?: string;
  established_year?: number;
  description?: string;
  manager_title: string;
}

export interface ManagerTransferRequest {
  old_manager_id: string;
  new_manager_id: string;
  new_manager_email: string;
  transfer_reason?: string;
}

// Form validation constants
export const INSTITUTION_VALIDATION = {
  institution_name: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  manager_title: {
    required: true,
    minLength: 2,
    maxLength: 50
  },
  website: {
    pattern: /^https?:\/\/.+/
  },
  established_year: {
    min: 1800,
    max: new Date().getFullYear()
  }
} as const;

export const INSTITUTION_TYPES = [
  { value: 'high_school', label: 'High School' },
  { value: 'middle_school', label: 'Middle School' },
  { value: 'college', label: 'College' },
  { value: 'university', label: 'University' },
  { value: 'club', label: 'Athletic Club' },
  { value: 'academy', label: 'Sports Academy' },
  { value: 'other', label: 'Other' }
] as const; 