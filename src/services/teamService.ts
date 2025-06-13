import { supabase } from '../lib/supabase';

/**
 * Generate a 6-digit invite code that matches the database constraint
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
    // Generate a 6-digit invite code
    const inviteCode = generateInviteCode();
    
    // Create the team
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: request.name,
        description: request.description,
        created_by: created_by,
        team_type: request.team_type,
        invite_code: inviteCode
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
    console.log('🔍 Looking up invite code:', invite_code);
    
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('invite_code', invite_code.toUpperCase().trim())  // Exact match for 6-digit codes
      .eq('is_active', true)
      .single();

    console.log('🔍 Supabase response:', { data, error });

    if (error) {
      console.log('❌ Error details:', error);
      return null;
    }

    console.log('✅ Found team:', data);
    return data;
  } catch (error) {
    console.error('Error fetching team by invite code:', error);
    return null;
  }
}

/**
 * Join a team using invite code (unified system)
 */
export async function joinTeamByInviteCode(
  invite_code: string, 
  user_id: string, 
  user_role: 'athlete' | 'coach' | 'team_manager'
): Promise<{ success: boolean; team?: Team; error?: string }> {
  try {
    console.log('🚀 joinTeamByInviteCode called with:', { invite_code, user_id, user_role });
    
    // Normalize the invite code (uppercase, trim whitespace)
    const normalizedCode = invite_code.trim().toUpperCase();
    console.log('🔧 Normalized code:', normalizedCode);
    
    // Validate code format (6 digits)
    if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      return { success: false, error: 'Invalid invite code format. Must be 6 characters.' };
    }
    
    // First, verify the invite code exists and get team info
    const team = await getTeamByInviteCode(normalizedCode);
    if (!team) {
      console.log('❌ No team found for code:', normalizedCode);
      return { success: false, error: 'Invalid invite code' };
    }
    
    console.log('✅ Team found:', team.name);

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', team.id)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single();

    if (existingMembership) {
      return { success: false, error: 'You are already a member of this team' };
    }

    // Add user to team_members using UPSERT to handle reactivating inactive members
    const memberRole = user_role === 'team_manager' ? 'manager' : user_role;
    const { error: memberError } = await supabase
      .from('team_members')
      .upsert({
        team_id: team.id,
        user_id: user_id,
        role: memberRole,
        status: 'active',
        joined_at: new Date().toISOString()
      }, {
        onConflict: 'team_id,user_id',
        ignoreDuplicates: false  // Allow updating inactive records to active
      });

    if (memberError) {
      console.error('❌ Error adding to team_members:', memberError);
      return { success: false, error: 'Failed to join team. Please try again.' };
    }

    // For backward compatibility, also update legacy tables if needed
    if (user_role === 'athlete' && team.team_type === 'school') {
      // Update athletes.team_id for school teams (legacy support)
      const { data: athlete } = await supabase
        .from('athletes')
        .select('team_id')
        .eq('id', user_id)
        .single();

      if (athlete && !athlete.team_id) {
        await supabase
          .from('athletes')
          .update({ team_id: team.id })
          .eq('id', user_id);
      }
    }

    console.log('✅ Successfully joined team:', team.name);
    return { success: true, team };

  } catch (error) {
    console.error('❌ Error in joinTeamByInviteCode:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
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

/**
 * Get teams that a coach is assigned to
 */
export async function getCoachTeams(coach_id: string): Promise<Team[]> {
  try {
    const { data, error } = await supabase
      .from('team_coaches')
      .select(`
        team_id,
        role,
        teams (*)
      `)
      .eq('coach_id', coach_id)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch coach teams: ${error.message}`);
    }

    // Extract the teams from the joined data
    return data?.map((item: any) => item.teams as Team).filter(Boolean) || [];
  } catch (error) {
    console.error('Error fetching coach teams:', error);
    throw error;
  }
}

/**
 * Coach leaves a team
 */
export async function leaveTeam(
  team_id: string,
  coach_id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('team_coaches')
      .delete()
      .eq('team_id', team_id)
      .eq('coach_id', coach_id);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error leaving team:', error);
    return { success: false, error: 'Failed to leave team. Please try again.' };
  }
}

/**
 * Remove athlete from team
 */
export async function removeAthleteFromTeam(
  athlete_id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update team_members status to inactive (soft delete)
    const { error: teamMembersError } = await supabase
      .from('team_members')
      .update({ status: 'inactive' })
      .eq('user_id', athlete_id)
      .eq('status', 'active');

    if (teamMembersError) {
      throw teamMembersError;
    }

    // Legacy support: also clear athletes.team_id
    const { error: athletesError } = await supabase
      .from('athletes')
      .update({ team_id: null })
      .eq('id', athlete_id);

    // Don't throw on athletes error since it's legacy support
    if (athletesError) {
      console.warn('Could not update legacy athletes.team_id:', athletesError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing athlete from team:', error);
    return { success: false, error: 'Failed to remove athlete from team. Please try again.' };
  }
}

/**
 * Remove coach from team (by team manager)
 */
export async function removeCoachFromTeam(
  team_id: string,
  coach_id: string,
  removed_by: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the remover is the team manager
    const { data: team } = await supabase
      .from('teams')
      .select('created_by')
      .eq('id', team_id)
      .single();

    if (!team || team.created_by !== removed_by) {
      return { success: false, error: 'Only team managers can remove coaches' };
    }

    const { error } = await supabase
      .from('team_coaches')
      .delete()
      .eq('team_id', team_id)
      .eq('coach_id', coach_id);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing coach from team:', error);
    return { success: false, error: 'Failed to remove coach from team. Please try again.' };
  }
}

/**
 * Delete team (soft delete - marks as inactive)
 */
export async function deleteTeam(
  team_id: string,
  deleted_by: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the deleter is the team creator
    const { data: team } = await supabase
      .from('teams')
      .select('created_by, name')
      .eq('id', team_id)
      .eq('is_active', true)
      .single();

    if (!team) {
      return { success: false, error: 'Team not found or already deleted' };
    }

    if (team.created_by !== deleted_by) {
      return { success: false, error: 'Only team creators can delete teams' };
    }

    // First, mark all team members as inactive (soft delete)
    const { error: membersError } = await supabase
      .from('team_members')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('team_id', team_id)
      .eq('status', 'active');

    if (membersError) throw membersError;

    // Then mark the team as inactive (soft delete)
    const { error: teamError } = await supabase
      .from('teams')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', team_id);

    if (teamError) throw teamError;

    return { success: true };
  } catch (error) {
    console.error('Error deleting team:', error);
    return { success: false, error: 'Failed to delete team. Please try again.' };
  }
}

/**
 * Get coaches assigned to a team
 */
export async function getTeamCoaches(team_id: string): Promise<any[]> {
  try {
    // First get team_coaches records
    const { data: teamCoaches, error: teamCoachesError } = await supabase
      .from('team_coaches')
      .select('id, role, created_at, coach_id')
      .eq('team_id', team_id)
      .eq('is_active', true);

    if (teamCoachesError) {
      throw new Error(`Failed to fetch team coaches: ${teamCoachesError.message}`);
    }

    if (!teamCoaches || teamCoaches.length === 0) {
      return [];
    }

    // Then get profile data for each coach
    const coachIds = teamCoaches.map(tc => tc.coach_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .in('id', coachIds);

    if (profilesError) {
      throw new Error(`Failed to fetch coach profiles: ${profilesError.message}`);
    }

    // Combine the data
    const result = teamCoaches.map(teamCoach => {
      const profile = profiles?.find(p => p.id === teamCoach.coach_id);
      return {
        ...teamCoach,
        profiles: profile
      };
    }).filter(coach => coach.profiles); // Only include coaches with valid profiles

    return result;
  } catch (error) {
    console.error('Error fetching team coaches:', error);
    throw error;
  }
}

/**
 * Get athletes assigned to a team (for team managers)
 */
export async function getTeamAthletes(team_id: string): Promise<any[]> {
  try {
    // Get team members who are athletes (without the problematic join)
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select('user_id, joined_at')
      .eq('team_id', team_id)
      .eq('role', 'athlete')
      .eq('status', 'active');

    if (membersError) {
      throw new Error(`Failed to fetch team members: ${membersError.message}`);
    }

    if (!teamMembers || teamMembers.length === 0) {
      return [];
    }

    // Get profile data separately to avoid relationship conflicts
    const athleteIds = teamMembers.map(tm => tm.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .in('id', athleteIds);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    // Get athlete-specific data
    const { data: athleteData, error: athleteError } = await supabase
      .from('athletes')
      .select('id, gender, events, date_of_birth, created_at')
      .in('id', athleteIds);

    if (athleteError) {
      console.warn('Could not fetch athlete data:', athleteError);
    }

    // Combine the data manually
    const result = teamMembers.map(member => {
      const profile = profiles?.find(p => p.id === member.user_id);
      const athleteInfo = athleteData?.find(a => a.id === member.user_id);
      
      if (!profile) {
        console.warn(`Profile not found for user_id: ${member.user_id}`);
        return null;
      }
      
      return {
        id: member.user_id,
        gender: athleteInfo?.gender,
        events: athleteInfo?.events,
        date_of_birth: athleteInfo?.date_of_birth,
        created_at: member.joined_at, // Use team join date instead of athlete creation
        profiles: profile
      };
    }).filter(Boolean); // Remove any null entries

    return result;
  } catch (error) {
    console.error('Error fetching team athletes:', error);
    throw error;
  }
}

/**
 * Get total member count for a team (all members from team_members table)
 */
export async function getTeamMemberCount(team_id: string): Promise<number> {
  try {
    // Count all active team members
    const { count, error } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team_id)
      .eq('status', 'active');

    if (error) {
      console.error('Error counting team members:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting team member count:', error);
    return 0;
  }
} 