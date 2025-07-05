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
    // Use the same API call that TodayWorkoutsCard uses
    const workoutData = await api.monthlyPlanAssignments.getTodaysWorkout(userId);
    
    if (!workoutData || !workoutData.hasWorkout || !workoutData.primaryWorkout) {
      console.log('🔍 No workout data returned from getTodaysWorkout API');
      return null;
    }
    
    const primaryWorkout = workoutData.primaryWorkout;
    const exercises = primaryWorkout.exercises || [];
    
    if (exercises.length === 0) {
      console.log('🔍 No exercises in today\'s workout');
      return null;
    }
    
    // Create workout object compatible with execution modal
    const workoutId = primaryWorkout.weeklyWorkout?.id 
      ? `daily-${primaryWorkout.weeklyWorkout.id}` 
      : `daily-${Date.now()}`;
    
    return {
      id: workoutId,
      name: primaryWorkout.title || 'Today\'s Training',
      exercises: exercises,
      description: primaryWorkout.description || 'Your training for today',
      type: 'Daily Training',
      duration: '45 mins',
      // Include original data for reference
      originalData: workoutData
    };
  } catch (error) {
    console.error('Error fetching today\'s workout for execution:', error);
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
    // Get today's workout using the same logic as dashboard
    const todaysWorkout = await getTodaysWorkoutForExecution(userId);
    
    if (!todaysWorkout) {
      console.log('🔍 No workout available for today');
      return false; // Indicates no workout was started
    }
    
    // Initialize progress tracking in workout store
    const progress = workoutStore.getProgress(todaysWorkout.id);
    if (!progress && todaysWorkout.exercises.length > 0) {
      workoutStore.updateProgress(todaysWorkout.id, 0, todaysWorkout.exercises.length);
      console.log(`🔍 Initialized progress tracking for: ${todaysWorkout.id}`);
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
    
    // Open execution modal
    setExecModal({
      isOpen: true,
      workout: todaysWorkout,
      exerciseIdx: startExerciseIdx,
      timer: 0,
      running: false
    });
    
    console.log(`🔍 Started workout execution: ${todaysWorkout.name} at exercise ${startExerciseIdx}`);
    return true; // Indicates workout was started successfully
  } catch (error) {
    console.error('Error starting today\'s workout execution:', error);
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