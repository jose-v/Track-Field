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

    // Build the query with team sharing support - using multiple queries approach
    let allExercises = [];
    let error = null;
    
    try {
      // Query 1: Get system exercises
      const { data: systemExercises, error: systemError } = await supabase
        .from('exercise_library')
        .select('*')
        .eq('is_system_exercise', true);
      
      if (systemError) throw systemError;
      
      // Query 2: Get user's own exercises
      const { data: userExercises, error: userError } = await supabase
        .from('exercise_library')
        .select('*')
        .eq('user_id', userId)
        .eq('is_system_exercise', false);
      
      if (userError) throw userError;
      
      // Query 3: Get public exercises
      const { data: publicExercises, error: publicError } = await supabase
        .from('exercise_library')
        .select('*')
        .eq('is_public', true)
        .eq('is_system_exercise', false);
      
      if (publicError) throw publicError;
      
             // Query 4: Get team exercises (if user has teams)
       let teamExercises = [];
       if (teamIds.length > 0) {
         // Try each team ID individually to avoid any .in() issues
         for (const teamId of teamIds) {
           const { data: teamData, error: teamError } = await supabase
             .from('exercise_library')
             .select('*')
             .eq('organization_id', teamId)
             .eq('is_system_exercise', false)
             .eq('is_public', false);
           
           if (teamError) throw teamError;
           if (teamData) {
             teamExercises.push(...teamData);
           }
         }
       }
      
      // Combine all exercises and remove duplicates
      const exerciseMap = new Map();
      
      [...(systemExercises || []), ...(userExercises || []), ...(publicExercises || []), ...teamExercises]
        .forEach(exercise => {
          exerciseMap.set(exercise.id, exercise);
        });
      
      allExercises = Array.from(exerciseMap.values());
      
             // Query completed successfully
      
    } catch (queryError) {
      error = queryError;
    }
    
         // Use allExercises as our data

    if (error) throw error;

    // Sort the data
    allExercises = allExercises.sort((a, b) => {
      // System exercises first
      if (a.is_system_exercise && !b.is_system_exercise) return -1;
      if (!a.is_system_exercise && b.is_system_exercise) return 1;
      
      // Then by created_at (newest first)
      const aDate = new Date(a.created_at || '').getTime();
      const bDate = new Date(b.created_at || '').getTime();
      return bDate - aDate;
    });

    // Data processing completed

    // Transform data to include created_by_name and sharing info
    const transformedData = allExercises.map(exercise => {
      let created_by_name = 'User';
      let sharing_info = 'Private';

      if (exercise.is_system_exercise) {
        created_by_name = 'System';
        sharing_info = 'System';
      } else if (exercise.is_public) {
        created_by_name = exercise.user_id === userId ? 'You' : 'Community';
        sharing_info = 'Public';
      } else if (exercise.organization_id && teamIds.includes(exercise.organization_id)) {
        // Team exercises - distinguish between own and others'
        created_by_name = exercise.user_id === userId ? 'You (Team)' : 'Team Member';
        sharing_info = 'Team';
        // Team exercise identified
      } else if (exercise.user_id === userId) {
        created_by_name = 'You';
        sharing_info = 'Private';
      }

      // Exercise processing completed

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

  const insertData = {
    ...exerciseData,
    user_id: userId,
    is_system_exercise: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development') {
    
  }

  const { data, error } = await supabase
    .from('exercise_library')
    .insert([insertData])
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