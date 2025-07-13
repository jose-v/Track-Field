/**
 * Monthly Plan Workout Helper
 * 
 * Reusable functions for extracting and formatting today's workout from monthly plans
 * Used by both Dashboard (TodayWorkoutsCard) and AthleteWorkouts page to ensure consistency
 */

import { api } from '../services/api';
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
 * Get completion status for today's exercises from the database
 */
export async function getMonthlyPlanCompletionFromDB(userId: string): Promise<number[]> {
  try {
    // Get ALL current assignments to see what's available
    const { data: allAssignments, error: allError } = await supabase
      .from('training_plan_assignments')
      .select('id, completed_exercises, status, assigned_at')
      .eq('athlete_id', userId)
      .or('status.eq.assigned,status.eq.in_progress')
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
 * Get granular workout progress from the database for monthly plans
 */
export async function getMonthlyPlanProgressFromDB(userId: string): Promise<WorkoutProgress | null> {
  try {
    const { data: assignment, error } = await supabase
      .from('training_plan_assignments')
      .select('completed_exercises, current_exercise_index, current_set, current_rep')
      .eq('athlete_id', userId)
      .or('status.eq.assigned,status.eq.in_progress')
      .order('assigned_at', { ascending: false })
      .limit(1)
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
 * Save granular workout progress to the database for monthly plans
 */
export async function saveMonthlyPlanProgressToDB(
  userId: string, 
  progress: WorkoutProgress
): Promise<void> {
  try {
    // Get the current assignment ID (can be 'assigned' or 'in_progress')
    const { data: assignment, error: fetchError } = await supabase
      .from('training_plan_assignments')
      .select('id, status')
      .eq('athlete_id', userId)
      .or('status.eq.assigned,status.eq.in_progress')
      .order('assigned_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !assignment) {
      console.error('No training plan assignment found for saving progress:', fetchError);
      return;
    }

    // Update with granular progress and completion data
    const updateData: any = { 
      completed_exercises: progress.completedExercises,
      current_exercise_index: progress.currentExerciseIndex,
      current_set: progress.currentSet,
      current_rep: progress.currentRep
    };
    
    // Change status to 'in_progress' if it's still 'assigned'
    if (assignment.status === 'assigned') {
      updateData.status = 'in_progress';
    }

    const { error: updateError } = await supabase
      .from('training_plan_assignments')
      .update(updateData)
      .eq('id', assignment.id);

    if (updateError) {
      console.error('Error saving granular progress to DB:', updateError);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`💾 Saved monthly plan progress to DB: Exercise ${progress.currentExerciseIndex}, Set ${progress.currentSet}, Rep ${progress.currentRep}`);
      }
    }
  } catch (error) {
    console.error('Error saving granular progress to DB:', error);
  }
}

/**
 * Save current workout progress to database during exercise execution for monthly plans
 */
export async function saveCurrentMonthlyPlanProgressToDB(
  userId: string,
  exerciseIndex: number,
  currentSet: number,
  currentRep: number,
  workoutStore: any,
  workoutId: string
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

    await saveMonthlyPlanProgressToDB(userId, progress);
  } catch (error) {
    console.error('Error saving current monthly plan progress:', error);
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
      .or('status.eq.assigned,status.eq.in_progress')
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
    
    // Get the original weekly workout data to preserve block structure
    const originalWeeklyData = primaryWorkout.dailyResult?.originalWeeklyData;
    let workoutBlocks: any[] | null = null;
    let isBlockBased = false;
    
    // Check if the original weekly workout has block structure
    if (originalWeeklyData && Array.isArray(originalWeeklyData) && originalWeeklyData.length > 0) {
      // Check if exercises is structured as blocks (has day objects with blocks)
      const firstDay = originalWeeklyData[0];
      if (firstDay && typeof firstDay === 'object' && firstDay.blocks) {
        // This is the new block structure - extract today's blocks
        const today = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDayName = dayNames[today.getDay()];
        
        // Find today's blocks or fallback to first available day
        let todaysBlocks = null;
        const dayObject = originalWeeklyData.find((day: any) => 
          day.day && day.day.toLowerCase() === currentDayName
        );
        
        if (dayObject && dayObject.blocks) {
          todaysBlocks = dayObject.blocks;
        } else {
          // Fallback to first day with blocks
          const firstDayWithBlocks = originalWeeklyData.find((day: any) => 
            day.blocks && Array.isArray(day.blocks) && day.blocks.length > 0
          );
          if (firstDayWithBlocks) {
            todaysBlocks = firstDayWithBlocks.blocks;
          }
        }
        
        if (todaysBlocks && Array.isArray(todaysBlocks) && todaysBlocks.length > 0) {
          workoutBlocks = todaysBlocks;
          isBlockBased = true;
        }
      }
    }
    
    // If we couldn't find block structure from dailyResult, try to get it from the weekly workout directly
    if (!isBlockBased && primaryWorkout.weeklyWorkout?.id) {
      try {
        const allWorkouts = await api.workouts.getAll();
        const weeklyWorkout = allWorkouts.find(w => w.id === primaryWorkout.weeklyWorkout.id);
        
        if (weeklyWorkout?.is_block_based && weeklyWorkout.blocks) {
          // Parse blocks data if it's a string
          let blocks = weeklyWorkout.blocks;
          if (typeof blocks === 'string') {
            blocks = JSON.parse(blocks);
          }
          
          if (blocks && typeof blocks === 'object' && !Array.isArray(blocks)) {
            // This is a daily blocks structure (monday, tuesday, etc.)
            const today = new Date();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const currentDayName = dayNames[today.getDay()];
            
            const todaysBlocks = blocks[currentDayName];
            if (todaysBlocks && Array.isArray(todaysBlocks) && todaysBlocks.length > 0) {
              workoutBlocks = todaysBlocks;
              isBlockBased = true;
            } else {
              // Fallback to first day with blocks
              const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
              for (const dayName of dayOrder) {
                const dayBlocks = blocks[dayName];
                if (dayBlocks && Array.isArray(dayBlocks) && dayBlocks.length > 0) {
                  workoutBlocks = dayBlocks;
                  isBlockBased = true;
                  break;
                }
              }
            }
          } else if (Array.isArray(blocks)) {
            // Single day blocks
            workoutBlocks = blocks;
            isBlockBased = true;
          }
        }
      } catch (error) {
        console.error('Error fetching weekly workout for block structure:', error);
      }
    }
    
    const result = {
      id: workoutId,
      name: primaryWorkout.title || 'Today\'s Training',
      exercises: exercises,
      description: primaryWorkout.description || 'Your training for today',
      type: 'Daily Training',
      duration: '45 mins',
      // Preserve block structure for execution modal
      is_block_based: isBlockBased,
      blocks: workoutBlocks,
      // Include original data for reference
      originalData: workoutData
    };
    
    console.log('🏗️ Created workout for execution:', {
      id: result.id,
      isBlockBased: result.is_block_based,
      blocksCount: workoutBlocks ? workoutBlocks.length : 0,
      exercisesCount: result.exercises.length,
      blockNames: workoutBlocks ? workoutBlocks.map((b: any) => b.name || 'Unnamed') : []
    });
    
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
    if (completedExercisesFromDB && completedExercisesFromDB.length > 0) {
      completedExercisesFromDB.forEach((exerciseIdx: number) => {
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
 * Clear all localStorage keys related to monthly plan workout progress and execution
 */
export function clearMonthlyPlanLocalStorage(): void {
  try {
    // Clear workout store data (Zustand persist)
    localStorage.removeItem('workout-progress-storage');
    
    // Clear athlete execution modal state
    localStorage.removeItem('athlete-exec-modal-state');
    
    // Clear completed exercises
    localStorage.removeItem('workout-completed-exercises');
    
    // Clear execution state for all daily workouts
    // Since monthly plans use daily- prefixed IDs, we'll clear all matching patterns
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('workout-execution-state-daily-') ||
        key.startsWith('workout-progress-daily-')
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Remove the found keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🧹 Cleared localStorage for monthly plan, removed ${keysToRemove.length} execution state keys`);
    }
  } catch (error) {
    console.error('Error clearing monthly plan localStorage:', error);
  }
}

/**
 * Reset monthly plan progress by clearing completed exercises from database
 */
export async function resetMonthlyPlanProgress(userId: string): Promise<void> {
  try {
    // Clear localStorage first
    clearMonthlyPlanLocalStorage();
    
    // Get ALL current assignments and clear their completed_exercises
    const { data: assignments, error: fetchError } = await supabase
      .from('training_plan_assignments')
      .select('id, completed_exercises, status')
      .eq('athlete_id', userId)
      .or('status.eq.assigned,status.eq.in_progress')
      .order('assigned_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching training plan assignments for reset:', fetchError);
      return;
    }

    if (!assignments || assignments.length === 0) {
      console.log('No training plan assignments to reset');
      return;
    }

    // Reset ALL assignments, not just the most recent one
    const resetPromises = assignments.map(assignment => 
      supabase
        .from('training_plan_assignments')
        .update({ 
          completed_exercises: [],
          current_exercise_index: 0,
          current_set: 1,
          current_rep: 1,
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