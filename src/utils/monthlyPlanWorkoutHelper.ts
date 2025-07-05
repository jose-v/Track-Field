/**
 * Monthly Plan Workout Helper
 * 
 * Reusable functions for extracting and formatting today's workout from monthly plans
 * Used by both Dashboard (TodayWorkoutsCard) and AthleteWorkouts page to ensure consistency
 */

import { api } from '../services/api';
import { supabase } from '../lib/supabase';

/**
 * Get completion status for today's exercises from the database
 */
async function getMonthlyPlanCompletionFromDB(userId: string): Promise<number[]> {
  try {
    // Get the current assignment (can be 'assigned' or 'in_progress')
    const { data: assignment, error } = await supabase
      .from('training_plan_assignments')
      .select('completed_exercises')
      .eq('athlete_id', userId)
      .in('status', ['assigned', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !assignment) {
      console.log('🔍 [monthlyPlanWorkoutHelper] No training plan assignment found in database');
      return [];
    }

    const completedExercises = assignment.completed_exercises || [];
    console.log('🔍 [monthlyPlanWorkoutHelper] Loaded completion from DB:', completedExercises);
    return completedExercises;
  } catch (error) {
    console.error('🔥 [monthlyPlanWorkoutHelper] Error loading completion from DB:', error);
    return [];
  }
}

/**
 * Save completion status for today's exercises to the database
 */
async function saveMonthlyPlanCompletionToDB(userId: string, completedExercises: number[]): Promise<void> {
  try {
    // Get the current assignment ID (can be 'assigned' or 'in_progress')
    const { data: assignment, error: fetchError } = await supabase
      .from('training_plan_assignments')
      .select('id, status')
      .eq('athlete_id', userId)
      .in('status', ['assigned', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !assignment) {
      console.error('🔥 [monthlyPlanWorkoutHelper] No training plan assignment found for saving completion:', fetchError);
      return;
    }

    console.log('✅ [monthlyPlanWorkoutHelper] Found assignment for completion sync:', {
      id: assignment.id,
      status: assignment.status,
      completedExercises: completedExercises
    });

    // Update the completed_exercises field and change status to 'in_progress' if it's still 'assigned'
    const updateData: any = { completed_exercises: completedExercises };
    if (assignment.status === 'assigned') {
      updateData.status = 'in_progress';
      console.log('🔄 [monthlyPlanWorkoutHelper] Changing status from assigned to in_progress');
    }

    const { error: updateError } = await supabase
      .from('training_plan_assignments')
      .update(updateData)
      .eq('id', assignment.id);

    if (updateError) {
      console.error('🔥 [monthlyPlanWorkoutHelper] Error saving completion to DB:', updateError);
    } else {
      console.log('✅ [monthlyPlanWorkoutHelper] Saved completion to DB:', completedExercises);
    }
  } catch (error) {
    console.error('🔥 [monthlyPlanWorkoutHelper] Error saving completion to DB:', error);
  }
}

/**
 * Get today's workout formatted for the execution modal
 * This function ensures both dashboard and workout page show exactly the same exercises
 */
export async function getTodaysWorkoutForExecution(userId: string) {
  try {
    console.log('🔍 [monthlyPlanWorkoutHelper] Starting getTodaysWorkoutForExecution for user:', userId);
    
    // Use the same API call that TodayWorkoutsCard uses
    const workoutData = await api.monthlyPlanAssignments.getTodaysWorkout(userId);
    
    console.log('🔍 [monthlyPlanWorkoutHelper] API returned workoutData:', {
      hasWorkout: workoutData?.hasWorkout,
      primaryWorkoutExists: !!workoutData?.primaryWorkout,
      exercisesCount: workoutData?.primaryWorkout?.exercises?.length || 0,
      exercises: workoutData?.primaryWorkout?.exercises?.map(ex => ex.name) || [],
      fullData: workoutData
    });
    
    if (!workoutData || !workoutData.hasWorkout || !workoutData.primaryWorkout) {
      console.log('🔍 [monthlyPlanWorkoutHelper] No workout data returned from getTodaysWorkout API');
      return null;
    }
    
    const primaryWorkout = workoutData.primaryWorkout;
    const exercises = primaryWorkout.exercises || [];
    
    console.log('🔍 [monthlyPlanWorkoutHelper] Processing exercises:', {
      exercisesCount: exercises.length,
      exerciseNames: exercises.map(ex => ex.name),
      currentDay: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      currentDayOfWeek: new Date().getDay() // 0=Sunday, 6=Saturday
    });
    
    if (exercises.length === 0) {
      console.log('🔍 [monthlyPlanWorkoutHelper] No exercises in today\'s workout');
      return null;
    }
    
    // Create workout object compatible with execution modal
    const workoutId = primaryWorkout.weeklyWorkout?.id 
      ? `daily-${primaryWorkout.weeklyWorkout.id}` 
      : `daily-${Date.now()}`;
    
    const result = {
      id: workoutId,
      name: primaryWorkout.title || 'Today\'s Training',
      exercises: exercises,
      description: primaryWorkout.description || 'Your training for today',
      type: 'Daily Training',
      duration: '45 mins',
      // Include original data for reference
      originalData: workoutData
    };
    
    console.log('🔍 [monthlyPlanWorkoutHelper] Returning workout:', {
      id: result.id,
      name: result.name,
      exercisesCount: result.exercises.length,
      exerciseNames: result.exercises.map(ex => ex.name)
    });
    
    return result;
  } catch (error) {
    console.error('🔥 [monthlyPlanWorkoutHelper] Error fetching today\'s workout for execution:', error);
    return null;
  }
}

/**
 * Start today's workout execution modal with proper database sync
 * Common function that both dashboard and workout page can use
 */
export async function startTodaysWorkoutExecution(
  userId: string,
  workoutStore: any,
  setExecModal: (modal: any) => void
) {
  try {
    console.log('🔍 [monthlyPlanWorkoutHelper] Starting workout execution for user:', userId);
    
    // Get today's workout using the same logic as dashboard
    const todaysWorkout = await getTodaysWorkoutForExecution(userId);
    
    if (!todaysWorkout) {
      console.log('🔍 [monthlyPlanWorkoutHelper] No workout available for today');
      return false; // Indicates no workout was started
    }
    
    console.log('🔍 [monthlyPlanWorkoutHelper] Got today\'s workout:', {
      workoutName: todaysWorkout.name,
      exercisesCount: todaysWorkout.exercises.length,
      exerciseNames: todaysWorkout.exercises.map(ex => ex.name)
    });
    
    // Load completion status from database (source of truth)
    const completedExercisesFromDB = await getMonthlyPlanCompletionFromDB(userId);
    
    // Initialize progress tracking in workout store
    const progress = workoutStore.getProgress(todaysWorkout.id);
    if (!progress && todaysWorkout.exercises.length > 0) {
      workoutStore.updateProgress(todaysWorkout.id, 0, todaysWorkout.exercises.length);
      console.log(`🔍 [monthlyPlanWorkoutHelper] Initialized progress tracking for: ${todaysWorkout.id}`);
    }
    
    // Sync database completion status to local store
    if (completedExercisesFromDB.length > 0) {
      console.log('🔍 [monthlyPlanWorkoutHelper] Syncing DB completion to local store:', completedExercisesFromDB);
      completedExercisesFromDB.forEach(exerciseIdx => {
        workoutStore.markExerciseCompleted(todaysWorkout.id, exerciseIdx);
      });
      workoutStore.updateProgress(
        todaysWorkout.id, 
        completedExercisesFromDB.length, 
        todaysWorkout.exercises.length,
        completedExercisesFromDB.length >= todaysWorkout.exercises.length
      );
    }
    
    // Find the first uncompleted exercise to start from (now using synced data)
    const updatedProgress = workoutStore.getProgress(todaysWorkout.id);
    const completedExercises = updatedProgress?.completedExercises || [];
    let startExerciseIdx = 0;
    
    for (let i = 0; i < todaysWorkout.exercises.length; i++) {
      if (!completedExercises.includes(i)) {
        startExerciseIdx = i;
        break;
      }
    }
    
    const startingExercise = todaysWorkout.exercises[startExerciseIdx];
    console.log('🔍 [monthlyPlanWorkoutHelper] Starting with exercise:', {
      index: startExerciseIdx,
      name: startingExercise?.name,
      totalExercises: todaysWorkout.exercises.length,
      completedFromDB: completedExercisesFromDB,
      localCompleted: completedExercises
    });
    
    // Open execution modal
    setExecModal({
      isOpen: true,
      workout: todaysWorkout,
      exerciseIdx: startExerciseIdx,
      timer: 0,
      running: false
    });
    
    console.log(`✅ [monthlyPlanWorkoutHelper] Started workout execution: ${todaysWorkout.name} at exercise ${startExerciseIdx} (${startingExercise?.name})`);
    return true; // Indicates workout was started successfully
  } catch (error) {
    console.error('🔥 [monthlyPlanWorkoutHelper] Error starting today\'s workout execution:', error);
    return false;
  }
}

/**
 * Mark an exercise as completed and sync to database
 */
export async function markExerciseCompletedWithSync(
  userId: string,
  workoutId: string,
  exerciseIdx: number,
  workoutStore: any
): Promise<void> {
  try {
    // Mark in local store first
    workoutStore.markExerciseCompleted(workoutId, exerciseIdx);
    
    // Get updated local completion status
    const progress = workoutStore.getProgress(workoutId);
    const localCompleted = progress?.completedExercises || [];
    
    // Save to database
    await saveMonthlyPlanCompletionToDB(userId, localCompleted);
    
    console.log(`✅ [monthlyPlanWorkoutHelper] Marked exercise ${exerciseIdx} complete and synced to DB`);
  } catch (error) {
    console.error('🔥 [monthlyPlanWorkoutHelper] Error marking exercise complete:', error);
  }
}

/**
 * Check if user has a workout available for today
 */
export async function hasTodaysWorkout(userId: string): Promise<boolean> {
  try {
    const workoutData = await api.monthlyPlanAssignments.getTodaysWorkout(userId);
    return !!(workoutData && workoutData.hasWorkout && workoutData.primaryWorkout?.exercises?.length > 0);
  } catch (error) {
    console.error('Error checking for today\'s workout:', error);
    return false;
  }
} 