/**
 * Monthly Plan Workout Helper
 * 
 * Reusable functions for extracting and formatting today's workout from monthly plans
 * Used by both Dashboard (TodayWorkoutsCard) and AthleteWorkouts page to ensure consistency
 */

import { api } from '../services/api';

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
 * Start today's workout execution modal
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
    
    // Initialize progress tracking in workout store
    const progress = workoutStore.getProgress(todaysWorkout.id);
    if (!progress && todaysWorkout.exercises.length > 0) {
      workoutStore.updateProgress(todaysWorkout.id, 0, todaysWorkout.exercises.length);
      console.log(`🔍 [monthlyPlanWorkoutHelper] Initialized progress tracking for: ${todaysWorkout.id}`);
    }
    
    // Find the first uncompleted exercise to start from
    const completedExercises = progress?.completedExercises || [];
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
      totalExercises: todaysWorkout.exercises.length
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