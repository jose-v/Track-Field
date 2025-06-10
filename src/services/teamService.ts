import { supabase } from '../lib/supabase';

export interface Team {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  created_by?: string;
  team_type: 'school' | 'club' | 'independent' | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  team_type: 'school' | 'club' | 'independent' | 'other';
}

export interface CreateIndependentCoachTeamRequest {
  team_name: string;
  team_description?: string;
}

export interface TeamCreationResponse {
  team: Team;
  invite_code: string;
  is_independent_coach?: boolean;
}

/**
 * Create a regular team (school, club, etc.)
 */
export async function createTeam(
  request: CreateTeamRequest,
  created_by: string
): Promise<TeamCreationResponse> {
  try {
    // Create the team
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: request.name,
        description: request.description,
        created_by: created_by,
        team_type: request.team_type
      })
      .select()
      .single();

    if (teamError) {
      throw new Error(`Failed to create team: ${teamError.message}`);
    }

    return {
      team: teamData,
      invite_code: teamData.invite_code,
      is_independent_coach: false
    };
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
}

/**
 * Create independent coach team
 */
export async function createIndependentCoachTeam(
  request: CreateIndependentCoachTeamRequest,
  coach_id: string
): Promise<TeamCreationResponse> {
  try {
    // Call the database function
    const { data, error } = await supabase
      .rpc('create_independent_coach_team', {
        coach_profile_id: coach_id,
        team_name: request.team_name,
        team_description: request.team_description
      });

    if (error) {
      throw new Error(`Failed to create independent coach team: ${error.message}`);
    }

    // Fetch the created team data
    const { data: teamData, error: teamFetchError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', data)
      .single();

    if (teamFetchError) {
      throw new Error(`Failed to fetch created team: ${teamFetchError.message}`);
    }

    return {
      team: teamData,
      invite_code: teamData.invite_code,
      is_independent_coach: true
    };
  } catch (error) {
    console.error('Error creating independent coach team:', error);
    throw error;
  }
}

/**
 * Get teams created by a team manager
 */
export async function getTeamsByManager(manager_id: string): Promise<Team[]> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('created_by', manager_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch teams: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching teams by manager:', error);
    throw error;
  }
}

/**
 * Get all teams (for admin/general viewing)
 */
export async function getAllTeams(): Promise<Team[]> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch teams: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching all teams:', error);
    throw error;
  }
}

/**
 * Get team by invite code
 */
export async function getTeamByInviteCode(invite_code: string): Promise<Team | null> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('invite_code', invite_code)
      .eq('is_active', true)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching team by invite code:', error);
    return null;
  }
} 