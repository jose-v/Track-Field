import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WorkoutProgress {
  // Map of workout IDs to progress
  [workoutId: string]: {
    currentExerciseIndex: number;
    totalExercises: number;
    lastUpdated: number;
    completed: number[];
  };
}

interface WorkoutStore {
  // All workout progress data
  workoutProgress: WorkoutProgress;
  
  // Function to update progress for a specific workout
  updateProgress: (
    workoutId: string, 
    exerciseIndex: number, 
    totalExercises: number, 
    isCompleted?: boolean
  ) => void;
  
  // Mark a specific exercise as completed
  markExerciseCompleted: (workoutId: string, exerciseIndex: number) => void;
  
  // Check if a specific exercise is completed
  isExerciseCompleted: (workoutId: string, exerciseIndex: number) => boolean;
  
  // Function to get progress for a specific workout
  getProgress: (workoutId: string) => {
    currentExerciseIndex: number;
    totalExercises: number;
    completionPercentage: number;
    completedExercises: number[];
  } | null;
  
  // Reset progress for a specific workout
  resetProgress: (workoutId: string) => void;
  
  // Debug the store
  debugStore: () => void;
}

// Create the store with persistence
export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      workoutProgress: {},
      
      updateProgress: (workoutId, exerciseIndex, totalExercises, isCompleted = false) => {
        if (!workoutId) return;
        
        set((state) => {
          // Get existing workout progress or create a new one
          const existingProgress = state.workoutProgress[workoutId] || {
            currentExerciseIndex: 0,
            totalExercises,
            lastUpdated: Date.now(),
            completed: []
          };
          
          // If totalExercises changed from what was stored, adjust the tracking
          let shouldAdjustCompletion = existingProgress.totalExercises !== totalExercises;
          
          // Update the progress
          const updatedProgress = {
            ...existingProgress,
            currentExerciseIndex: Math.min(exerciseIndex, totalExercises - 1 >= 0 ? totalExercises - 1 : 0),
            totalExercises,
            lastUpdated: Date.now(),
          };
          
          // If the exercise is completed, add it to the completed array if not already there
          if (isCompleted && !updatedProgress.completed.includes(exerciseIndex)) {
            updatedProgress.completed = [...updatedProgress.completed, exerciseIndex];
          }
          
          // If we're adjusting due to exercise count change, validate the completed array
          if (shouldAdjustCompletion) {
            // Filter out any completed exercises that are beyond the new total
            updatedProgress.completed = updatedProgress.completed.filter(idx => idx < totalExercises);
          }
          
          console.log(`[WorkoutStore] Updated progress for ${workoutId}: Exercise ${exerciseIndex}/${totalExercises}, Completed: ${updatedProgress.completed.length}, IsCompleted param: ${isCompleted}`);
          
          return {
            workoutProgress: {
              ...state.workoutProgress,
              [workoutId]: updatedProgress
            }
          };
        });
      },
      
      markExerciseCompleted: (workoutId, exerciseIndex) => {
        if (!workoutId) return;
        
        set((state) => {
          // Get existing workout progress or return
          const existingProgress = state.workoutProgress[workoutId];
          if (!existingProgress) {
            console.warn(`[WorkoutStore] Tried to mark exercise ${exerciseIndex} completed for workout ${workoutId}, but no progress record exists`);
            return state;
          }
          
          // If already completed, do nothing
          if (existingProgress.completed.includes(exerciseIndex)) {
            console.log(`[WorkoutStore] Exercise ${exerciseIndex} was already marked as completed for ${workoutId}`);
            return state;
          }
          
          // Add to completed list
          const updatedCompleted = [...existingProgress.completed, exerciseIndex];
          
          console.log(`[WorkoutStore] Marked exercise ${exerciseIndex} as completed for ${workoutId}. Total completed: ${updatedCompleted.length}/${existingProgress.totalExercises}`);
          
          return {
            workoutProgress: {
              ...state.workoutProgress,
              [workoutId]: {
                ...existingProgress,
                completed: updatedCompleted,
                lastUpdated: Date.now()
              }
            }
          };
        });
        
        // After updating the store, log the current state for debugging
        const currentProgress = get().workoutProgress[workoutId];
        console.log(`[WorkoutStore] Current progress after marking exercise as completed:`, {
          workoutId,
          exerciseIndex,
          currentProgress
        });
      },
      
      isExerciseCompleted: (workoutId, exerciseIndex) => {
        if (!workoutId) return false;
        
        const progress = get().workoutProgress[workoutId];
        if (!progress) return false;
        
        return progress.completed.includes(exerciseIndex);
      },
      
      getProgress: (workoutId) => {
        if (!workoutId) return null;
        
        const progress = get().workoutProgress[workoutId];
        if (!progress) return null;
        
        return {
          currentExerciseIndex: progress.currentExerciseIndex,
          totalExercises: progress.totalExercises,
          completionPercentage: progress.totalExercises > 0 
            ? (progress.completed.length / progress.totalExercises) * 100 
            : 0,
          completedExercises: progress.completed
        };
      },
      
      resetProgress: (workoutId) => {
        if (!workoutId) return;
        
        set((state) => {
          // If no progress exists, do nothing
          if (!state.workoutProgress[workoutId]) return state;
          
          const { totalExercises } = state.workoutProgress[workoutId];
          
          console.log(`[WorkoutStore] Reset progress for ${workoutId}`);
          
          return {
            workoutProgress: {
              ...state.workoutProgress,
              [workoutId]: {
                currentExerciseIndex: 0,
                totalExercises,
                lastUpdated: Date.now(),
                completed: []
              }
            }
          };
        });
      },
      
      debugStore: () => {
        console.log('[WorkoutStore] Current state:', get().workoutProgress);
      }
    }),
    {
      name: 'workout-progress-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
); 