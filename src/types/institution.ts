/**
 * Institution-Centric Team Manager Types
 * Represents institutions/schools rather than individual managers
 */

export interface Institution {
  id: string; // References the current manager's profile id
  institution_name: string;
  institution_type: 'high_school' | 'middle_school' | 'college' | 'university' | 'club' | 'academy' | 'other';
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  established_year?: number;
  description?: string;
  manager_title: string; // e.g., "Athletic Director", "Head Coach", "Team Manager"
  updated_at: string;
}

export interface InstitutionalProfile extends Institution {
  // Current manager info (for contact purposes)
  manager_first_name: string;
  manager_last_name: string;
  manager_email: string;
  manager_personal_phone?: string;
  manager_avatar?: string;
  
  // Institution statistics
  team_count: number;
  total_athletes: number;
  total_coaches: number;
}

export interface InstitutionFormData {
  institution_name: string;
  institution_type: Institution['institution_type'];
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