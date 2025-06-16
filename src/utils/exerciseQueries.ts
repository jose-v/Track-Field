import { supabase } from '../lib/supabase';

/**
 * Build exercise library query with team-level sharing support
 * @param userId - Current user ID
 * @returns Promise with exercise data including team exercises
 */
export async function getExercisesWithTeamSharing(userId: string) {
  if (!userId) return [];

  try {
    // First, get user's team IDs
    const { data: userTeams, error: teamsError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (teamsError) throw teamsError;

    const teamIds = userTeams?.map(tm => tm.team_id) || [];

    // Build the query with team sharing support
    let query = supabase
      .from('exercise_library')
      .select('*');

    if (teamIds.length > 0) {
      // Include: system exercises, user's own exercises, public exercises, and team exercises
      query = query.or(
        `is_system_exercise.eq.true,` +
        `and(user_id.eq.${userId}),` +
        `and(is_public.eq.true,is_system_exercise.eq.false),` +
        `organization_id.in.(${teamIds.join(',')})`
      );
    } else {
      // Fallback to original query if user has no teams
      query = query.or(
        `is_system_exercise.eq.true,` +
        `and(user_id.eq.${userId}),` +
        `and(is_public.eq.true,is_system_exercise.eq.false)`
      );
    }

    const { data, error } = await query
      .order('is_system_exercise', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to include created_by_name and sharing info
    const transformedData = (data || []).map(exercise => {
      let created_by_name = 'User';
      let sharing_info = 'Private';

      if (exercise.is_system_exercise) {
        created_by_name = 'System';
        sharing_info = 'System';
      } else if (exercise.is_public) {
        created_by_name = exercise.user_id === userId ? 'You' : 'Community';
        sharing_info = 'Public';
      } else if (exercise.organization_id && teamIds.includes(exercise.organization_id)) {
        created_by_name = exercise.user_id === userId ? 'You' : 'Team Member';
        sharing_info = 'Team';
      } else if (exercise.user_id === userId) {
        created_by_name = 'You';
        sharing_info = 'Private';
      }

      return {
        ...exercise,
        created_by_name,
        sharing_info
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Error loading exercises with team sharing:', error);
    throw error;
  }
}

/**
 * Create exercise with proper sharing settings
 * @param exerciseData - Exercise data including sharing settings
 * @param userId - Current user ID
 * @returns Promise with created exercise data
 */
export async function createExerciseWithSharing(
  exerciseData: any,
  userId: string
) {
  if (!userId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('exercise_library')
    .insert([{
      ...exerciseData,
      user_id: userId,
      is_system_exercise: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select('*')
    .single();

  if (error) throw error;

  // Transform data to include created_by_name
  const transformedData = {
    ...data,
    created_by_name: 'You',
    sharing_info: data.is_public ? 'Public' : (data.organization_id ? 'Team' : 'Private')
  };

  return transformedData;
}

/**
 * Update exercise with proper sharing settings
 * @param id - Exercise ID
 * @param exerciseData - Updated exercise data
 * @param userId - Current user ID
 * @returns Promise with updated exercise data
 */
export async function updateExerciseWithSharing(
  id: string,
  exerciseData: any,
  userId: string
) {
  const { data, error } = await supabase
    .from('exercise_library')
    .update({
      ...exerciseData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;

  // Transform data to include created_by_name
  const transformedData = {
    ...data,
    created_by_name: data.user_id === userId ? 'You' : 'Team Member',
    sharing_info: data.is_public ? 'Public' : (data.organization_id ? 'Team' : 'Private')
  };

  return transformedData;
} 