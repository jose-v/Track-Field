/**
 * Regular Workout Helper
 * 
 * Database sync functions for regular workout exercise completion
 * Prevents data integrity issues by using database as source of truth
 */

import { supabase } from '../lib/supabase';

/**
 * Get completion status for workout exercises from the database
 */
export async function getRegularWorkoutCompletionFromDB(userId: string, workoutId: string): Promise<number[]> {
  try {
    const { data: assignment, error } = await supabase
      .from('athlete_workouts')
      .select('completed_exercises')
      .eq('athlete_id', userId)
      .eq('workout_id', workoutId)
      .single();

    if (error || !assignment) {
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
 * Save completion status for workout exercises to the database
 */
export async function saveRegularWorkoutCompletionToDB(userId: string, workoutId: string, completedExercises: number[]): Promise<void> {
  try {
    // Update the completed_exercises field and change status if needed
    const updateData: any = { completed_exercises: completedExercises };
    
    // If exercises are completed, update status to in_progress (or completed if all done)
    if (completedExercises.length > 0) {
      updateData.status = 'in_progress';
    }

    const { error: updateError } = await supabase
      .from('athlete_workouts')
      .update(updateData)
      .eq('athlete_id', userId)
      .eq('workout_id', workoutId);

    if (updateError) {
      console.error('Error saving completion to DB:', updateError);
    }
  } catch (error) {
    console.error('Error saving completion to DB:', error);
  }
}

/**
 * Mark an exercise as completed and sync to database for regular workouts
 */
export async function markRegularWorkoutExerciseCompletedWithSync(
  userId: string,
  workoutId: string,
  exerciseIdx: number,
  workoutStore: any
): Promise<void> {
  try {
    // Get current completion status from database (source of truth)
    const dbCompleted = await getRegularWorkoutCompletionFromDB(userId, workoutId);
    
    // Add the new exercise to the completion list if not already completed
    const mergedCompleted = [...new Set([...dbCompleted, exerciseIdx])].sort((a, b) => a - b);
    
    // Save merged completion to database
    await saveRegularWorkoutCompletionToDB(userId, workoutId, mergedCompleted);
    
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
 * Sync workout completion data from database to local store
 * Call this when initializing a workout to ensure database is source of truth
 */
export async function syncRegularWorkoutCompletionFromDB(
  userId: string,
  workoutId: string,
  workoutStore: any,
  totalExercises: number
): Promise<void> {
  try {
    // Load completion status from database (source of truth)
    const completedExercisesFromDB = await getRegularWorkoutCompletionFromDB(userId, workoutId);
    
    // Initialize progress tracking in workout store if needed
    const progress = workoutStore.getProgress(workoutId);
    if (!progress && totalExercises > 0) {
      workoutStore.updateProgress(workoutId, 0, totalExercises);
    }
    
    // Sync database completion status to local store
    if (completedExercisesFromDB.length > 0) {
      completedExercisesFromDB.forEach(exerciseIdx => {
        workoutStore.markExerciseCompleted(workoutId, exerciseIdx);
      });
      workoutStore.updateProgress(
        workoutId, 
        completedExercisesFromDB.length, 
        totalExercises,
        completedExercisesFromDB.length >= totalExercises
      );
    }
    
  } catch (error) {
    console.error('Error syncing completion from DB:', error);
  }
}

/**
 * Mark workout as fully completed in database
 */
export async function markRegularWorkoutAsCompleted(userId: string, workoutId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('athlete_workouts')
      .update({ status: 'completed' })
      .eq('athlete_id', userId)
      .eq('workout_id', workoutId);

    if (error) {
      console.error('Error marking workout as completed:', error);
    }
  } catch (error) {
    console.error('Error marking workout as completed:', error);
  }
} 