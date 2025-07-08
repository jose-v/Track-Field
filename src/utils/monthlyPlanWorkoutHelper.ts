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
export async function getMonthlyPlanCompletionFromDB(userId: string): Promise<number[]> {
  try {
    // Get ALL current assignments to see what's available
    const { data: allAssignments, error: allError } = await supabase
      .from('training_plan_assignments')
      .select('id, completed_exercises, status, assigned_at')
      .eq('athlete_id', userId)
      .in('status', ['assigned', 'in_progress'])
      .order('assigned_at', { ascending: false });

    if (allError || !allAssignments) {
      return [];
    }

    // Get the most recent assignment
    const assignment = allAssignments[0];
    
    if (!assignment) {
      return [];
    }

    const completedExercises = assignment.completed_exercises || [];
    return completedExercises;
  } catch (error) {
    console.error('Error loading completion from DB:', error);
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
      .order('assigned_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !assignment) {
      console.error('No training plan assignment found for saving completion:', fetchError);
      return;
    }

    // Update the completed_exercises field and change status to 'in_progress' if it's still 'assigned'
    const updateData: any = { completed_exercises: completedExercises };
    if (assignment.status === 'assigned') {
      updateData.status = 'in_progress';
    }

    const { error: updateError } = await supabase
      .from('training_plan_assignments')
      .update(updateData)
      .eq('id', assignment.id);

    if (updateError) {
      console.error('Error saving completion to DB:', updateError);
    }
  } catch (error) {
    console.error('Error saving completion to DB:', error);
  }
}

/**
 * Get today's workout formatted for the execution modal
 * This function ensures both dashboard and workout page show exactly the same exercises
 */
export async function getTodaysWorkoutForExecution(userId: string) {
  try {
    // Use the same API call that TodayWorkoutsCard uses
    const workoutData = await api.monthlyPlanAssignments.getTodaysWorkout(userId);
    
    if (!workoutData || !workoutData.hasWorkout || !workoutData.primaryWorkout) {
      return null;
    }
    
    const primaryWorkout = workoutData.primaryWorkout;
    const exercises = primaryWorkout.exercises || [];
    
    if (exercises.length === 0) {
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
    
    return result;
  } catch (error) {
    console.error('Error fetching today\'s workout for execution:', error);
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
    // Get today's workout using the same logic as dashboard
    const todaysWorkout = await getTodaysWorkoutForExecution(userId);
    
    if (!todaysWorkout) {
      return false; // Indicates no workout was started
    }

    // Clear any existing progress for this workout to ensure fresh start
    workoutStore.resetProgress(todaysWorkout.id);
    
    // Load completion status from database (source of truth)
    const completedExercisesFromDB = await getMonthlyPlanCompletionFromDB(userId);
    
    // Initialize progress tracking in workout store
    workoutStore.updateProgress(todaysWorkout.id, 0, todaysWorkout.exercises.length);
    
    // Sync database completion status to local store
    if (completedExercisesFromDB.length > 0) {
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
    
    // Find the first uncompleted exercise to start from (continue from where left off)
    const updatedProgress = workoutStore.getProgress(todaysWorkout.id);
    const completedExercises = updatedProgress?.completedExercises || [];
    let startExerciseIdx = 0;
    
    // Find the first exercise that hasn't been completed
    for (let i = 0; i < todaysWorkout.exercises.length; i++) {
      if (!completedExercises.includes(i)) {
        startExerciseIdx = i;
        break;
      }
    }
    
    // If all exercises are completed, start from the beginning to allow re-doing the workout
    if (completedExercises.length >= todaysWorkout.exercises.length) {
      startExerciseIdx = 0;
    }
    
    // Open execution modal
    setExecModal({
      isOpen: true,
      workout: todaysWorkout,
      exerciseIdx: startExerciseIdx,
      timer: 0,
      running: false
    });
    
    return true; // Indicates workout was started successfully
  } catch (error) {
    console.error('Error starting today\'s workout execution:', error);
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
    // Get current completion status from database (source of truth)
    const dbCompleted = await getMonthlyPlanCompletionFromDB(userId);
    
    // Add the new exercise to the completion list if not already completed
    const mergedCompleted = [...new Set([...dbCompleted, exerciseIdx])].sort((a, b) => a - b);
    
    // Save merged completion to database
    await saveMonthlyPlanCompletionToDB(userId, mergedCompleted);
    
    // Update local store with merged completion data
    workoutStore.markExerciseCompleted(workoutId, exerciseIdx);
    
    // Also sync any other completed exercises from DB that might not be in local store
    mergedCompleted.forEach(idx => {
      if (idx !== exerciseIdx) {
        workoutStore.markExerciseCompleted(workoutId, idx);
      }
    });
  } catch (error) {
    console.error('Error marking exercise complete:', error);
  }
}

/**
 * Reset monthly plan progress by clearing completed exercises from database
 */
export async function resetMonthlyPlanProgress(userId: string): Promise<void> {
  try {
    // Get ALL current assignments and clear their completed_exercises
    const { data: assignments, error: fetchError } = await supabase
      .from('training_plan_assignments')
      .select('id, completed_exercises, status')
      .eq('athlete_id', userId)
      .in('status', ['assigned', 'in_progress'])
      .order('assigned_at', { ascending: false });

    if (fetchError || !assignments || assignments.length === 0) {
      console.error('No training plan assignments found for reset:', fetchError);
      return;
    }

    // Reset ALL assignments, not just the most recent one
    const resetPromises = assignments.map(assignment => 
      supabase
        .from('training_plan_assignments')
        .update({ 
          completed_exercises: [],
          status: 'assigned'
        })
        .eq('id', assignment.id)
    );

    const results = await Promise.all(resetPromises);
    
    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error resetting some assignments:', errors);
      throw new Error(`Failed to reset ${errors.length} assignments`);
    }

    // Add a small delay to ensure the database update is fully committed
    await new Promise(resolve => setTimeout(resolve, 100));

  } catch (error) {
    console.error('Error resetting monthly plan progress:', error);
    throw error;
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