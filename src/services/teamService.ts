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

/**
 * Join a team using invite code
 */
export async function joinTeamByInviteCode(
  invite_code: string, 
  user_id: string, 
  user_role: 'athlete' | 'coach' | 'team_manager'
): Promise<{ success: boolean; team?: Team; error?: string }> {
  try {
    // First, verify the invite code exists and get team info
    const team = await getTeamByInviteCode(invite_code);
    if (!team) {
      return { success: false, error: 'Invalid invite code' };
    }

    // Check if user is already part of this team
    if (user_role === 'athlete') {
      const { data: existingAthlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('id', user_id)
        .eq('team_id', team.id)
        .single();
      
      if (existingAthlete) {
        return { success: false, error: 'You are already a member of this team' };
      }

      // Add athlete to team
      const { error: updateError } = await supabase
        .from('athletes')
        .update({ team_id: team.id })
        .eq('id', user_id);

      if (updateError) {
        throw updateError;
      }
    } else if (user_role === 'coach') {
      // Check if coach is already assigned to this team
      const { data: existingCoach } = await supabase
        .from('team_coaches')
        .select('id')
        .eq('coach_id', user_id)
        .eq('team_id', team.id)
        .single();
      
      if (existingCoach) {
        return { success: false, error: 'You are already a coach for this team' };
      }

      // Add coach to team
      const { error: insertError } = await supabase
        .from('team_coaches')
        .insert({
          team_id: team.id,
          coach_id: user_id,
          assigned_by: team.created_by,
          role: 'assistant_coach'
        });

      if (insertError) {
        throw insertError;
      }
    } else {
      return { success: false, error: 'Team managers cannot join teams using invite codes' };
    }

    return { success: true, team };
  } catch (error) {
    console.error('Error joining team:', error);
    return { success: false, error: 'Failed to join team. Please try again.' };
  }
}

/**
 * Send email invitation to join team
 */
export async function sendTeamInvitation(
  team_id: string,
  invitee_email: string,
  invitee_role: 'athlete' | 'coach' | 'team_manager',
  invited_by: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get team info for the invite code
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', team_id)
      .single();

    if (teamError || !team) {
      return { success: false, error: 'Team not found' };
    }

    // Check if invitation already exists and is pending
    const { data: existingInvite } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('team_id', team_id)
      .eq('invitee_email', invitee_email)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return { success: false, error: 'An invitation has already been sent to this email' };
    }

    // Create the invitation
    const { error: insertError } = await supabase
      .from('team_invitations')
      .insert({
        team_id,
        invited_by,
        invitee_email,
        invitee_role,
        invite_code: team.invite_code
      });

    if (insertError) {
      throw insertError;
    }

    // TODO: Send actual email notification
    // For now, we'll just create the database record

    return { success: true };
  } catch (error) {
    console.error('Error sending team invitation:', error);
    return { success: false, error: 'Failed to send invitation. Please try again.' };
  }
} 