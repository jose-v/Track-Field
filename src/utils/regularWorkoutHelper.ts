/**
 * Regular Workout Helper
 * 
 * Database sync functions for regular workout exercise completion
 * Prevents data integrity issues by using database as source of truth
 */

import { supabase } from '../lib/supabase';

/**
 * Interface for granular workout progress
 */
interface WorkoutProgress {
  currentExerciseIndex: number;
  currentSet: number;
  currentRep: number;
  completedExercises: number[];
}

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
 * Get granular workout progress from the database (current exercise, set, rep)
 */
export async function getWorkoutProgressFromDB(userId: string, workoutId: string): Promise<WorkoutProgress | null> {
  try {
    const { data: assignment, error } = await supabase
      .from('athlete_workouts')
      .select('completed_exercises, current_exercise_index, current_set, current_rep')
      .eq('athlete_id', userId)
      .eq('workout_id', workoutId)
      .single();

    if (error || !assignment) {
      return null;
    }

    // Return granular progress if available, otherwise default values
    return {
      currentExerciseIndex: assignment.current_exercise_index || 0,
      currentSet: assignment.current_set || 1,
      currentRep: assignment.current_rep || 1,
      completedExercises: assignment.completed_exercises || []
    };
  } catch (error) {
    console.error('Error loading granular progress from DB:', error);
    return null;
  }
}

/**
 * Save granular workout progress to the database (current exercise, set, rep + completed exercises)
 * This saves progress immediately, not just when exercises are completed
 */
export async function saveWorkoutProgressToDB(
  userId: string, 
  workoutId: string, 
  progress: WorkoutProgress
): Promise<void> {
  try {
    // Update with granular progress and completion data
    const updateData: any = { 
      completed_exercises: progress.completedExercises,
      current_exercise_index: progress.currentExerciseIndex,
      current_set: progress.currentSet,
      current_rep: progress.currentRep
    };
    
    // If exercises are completed, update status to in_progress (or completed if all done)
    if (progress.completedExercises.length > 0) {
      updateData.status = 'in_progress';
    }

    // Use upsert to handle cases where assignment doesn't exist yet
    const { error: upsertError } = await supabase
      .from('athlete_workouts')
      .upsert({
        athlete_id: userId,
        workout_id: workoutId,
        ...updateData,
        assigned_at: new Date().toISOString()
      }, {
        onConflict: 'athlete_id,workout_id'
      });

    if (upsertError) {
      console.error('Error saving granular progress to DB:', upsertError);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`💾 Saved progress to DB: Exercise ${progress.currentExerciseIndex}, Set ${progress.currentSet}, Rep ${progress.currentRep}`);
      }
    }
  } catch (error) {
    console.error('Error saving granular progress to DB:', error);
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
 * Save current workout progress to database during exercise execution
 * Call this frequently to ensure progress is not lost
 */
export async function saveCurrentProgressToDB(
  userId: string,
  workoutId: string,
  exerciseIndex: number,
  currentSet: number,
  currentRep: number,
  workoutStore: any
): Promise<void> {
  try {
    // Get completed exercises from the store
    const storeProgress = workoutStore.getProgress(workoutId);
    const completedExercises = storeProgress?.completedExercises || [];

    const progress: WorkoutProgress = {
      currentExerciseIndex: exerciseIndex,
      currentSet,
      currentRep,
      completedExercises
    };

    await saveWorkoutProgressToDB(userId, workoutId, progress);
  } catch (error) {
    console.error('Error saving current progress:', error);
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

/**
 * Clear all localStorage keys related to workout progress and execution
 */
export function clearWorkoutLocalStorage(workoutId: string): void {
  try {
    // Clear workout store data (Zustand persist)
    localStorage.removeItem('workout-progress-storage');
    
    // Clear athlete execution modal state
    localStorage.removeItem('athlete-exec-modal-state');
    
    // Clear individual workout progress
    localStorage.removeItem(`workout-progress-${workoutId}`);
    
    // Clear completed exercises
    localStorage.removeItem('workout-completed-exercises');
    
    // Clear execution state for all exercises of this workout
    // Since we don't know the specific exercise indices, we'll clear all matching patterns
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`workout-execution-state-${workoutId}-`)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove the found keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🧹 Cleared localStorage for workout ${workoutId}, removed ${keysToRemove.length} execution state keys`);
    }
  } catch (error) {
    console.error('Error clearing workout localStorage:', error);
  }
}

/**
 * Reset regular workout progress by clearing completed exercises and granular progress from database
 */
export async function resetRegularWorkoutProgress(userId: string, workoutId: string): Promise<void> {
  try {
    // Clear localStorage first
    clearWorkoutLocalStorage(workoutId);
    
    // Reset the workout progress by clearing all granular data
    const { error: updateError } = await supabase
      .from('athlete_workouts')
      .update({ 
        completed_exercises: [],
        current_exercise_index: 0,
        current_set: 1,
        current_rep: 1,
        status: 'assigned'
      })
      .eq('athlete_id', userId)
      .eq('workout_id', workoutId);

    if (updateError) {
      console.error('Error resetting regular workout progress:', updateError);
      throw updateError;
    }

    // Add a small delay to ensure the database update is fully committed
    await new Promise(resolve => setTimeout(resolve, 100));

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Reset regular workout progress for ${workoutId}`);
    }
  } catch (error) {
    console.error('Error resetting regular workout progress:', error);
    throw error;
  }
} 