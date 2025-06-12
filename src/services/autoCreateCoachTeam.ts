import { supabase } from '../lib/supabase';

interface AutoCreateResult {
  success: boolean;
  teamId?: string;
  teamName?: string;
  inviteCode?: string;
  error?: string;
}

/**
 * Auto-create a coach team for a coach who has athletes but no team
 */
export async function autoCreateCoachTeam(
  coachId: string,
  coachName: string
): Promise<AutoCreateResult> {
  try {
    // Check if coach already has a coach team
    const { data: existingTeam } = await supabase
      .from('team_members')
      .select(`
        team_id,
        teams!inner (
          id,
          name,
          team_type,
          invite_code
        )
      `)
      .eq('user_id', coachId)
      .eq('role', 'coach')
      .eq('status', 'active')
      .eq('teams.team_type', 'coach')
      .single();

    if (existingTeam) {
      const team = existingTeam.teams as any;
      return {
        success: true,
        teamId: team.id,
        teamName: team.name,
        inviteCode: team.invite_code
      };
    }

    // Generate invite code
    const generateInviteCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const inviteCode = generateInviteCode();
    const teamName = `${coachName}'s Team`;

    // Create the coach team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: teamName,
        description: `Auto-created team for coach ${coachName}`,
        team_type: 'coach',
        invite_code: inviteCode,
        created_by: coachId
      })
      .select()
      .single();

    if (teamError) throw teamError;

    // Add coach as team member
    const { error: coachMemberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: coachId,
        role: 'coach',
        status: 'active',
        joined_at: new Date().toISOString()
      });

    if (coachMemberError) throw coachMemberError;

    // Get coach's athletes from coach_athletes table
    const { data: coachAthletes, error: athletesError } = await supabase
      .from('coach_athletes')
      .select('athlete_id, created_at')
      .eq('coach_id', coachId);

    if (athletesError) throw athletesError;

    // Add athletes to the team
    if (coachAthletes && coachAthletes.length > 0) {
      const athleteMembers = coachAthletes.map(ca => ({
        team_id: team.id,
        user_id: ca.athlete_id,
        role: 'athlete' as const,
        status: 'active' as const,
        joined_at: ca.created_at || new Date().toISOString()
      }));

      const { error: athleteMemberError } = await supabase
        .from('team_members')
        .insert(athleteMembers);

      if (athleteMemberError) throw athleteMemberError;

      // Update athletes.team_id for legacy compatibility
      const athleteIds = coachAthletes.map(ca => ca.athlete_id);
      const { error: legacyUpdateError } = await supabase
        .from('athletes')
        .update({ team_id: team.id })
        .in('id', athleteIds)
        .is('team_id', null); // Only update if they don't already have a team

      // Don't throw on legacy update error, just log it
      if (legacyUpdateError) {
        console.warn('Could not update legacy athletes.team_id:', legacyUpdateError);
      }
    }

    return {
      success: true,
      teamId: team.id,
      teamName: team.name,
      inviteCode: team.invite_code
    };

  } catch (error) {
    console.error('Error auto-creating coach team:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create coach team'
    };
  }
}

/**
 * Check if a coach needs an auto-created team and create it if needed
 */
export async function ensureCoachHasTeam(
  coachId: string,
  coachName: string
): Promise<AutoCreateResult> {
  try {
    // Check if coach has athletes
    const { data: hasAthletes } = await supabase
      .from('coach_athletes')
      .select('athlete_id')
      .eq('coach_id', coachId)
      .limit(1)
      .single();

    if (!hasAthletes) {
      return {
        success: true,
        error: 'No athletes to create team for'
      };
    }

    // Auto-create team if coach has athletes
    return await autoCreateCoachTeam(coachId, coachName);

  } catch (error) {
    console.error('Error ensuring coach has team:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ensure coach team'
    };
  }
} 