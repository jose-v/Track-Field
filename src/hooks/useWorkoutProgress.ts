import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to handle workout progress with localStorage persistence
 */
export function useWorkoutProgress(workoutId: string | undefined) {
  // Initialize from localStorage if available
  const [progress, setProgressState] = useState<number>(() => {
    if (!workoutId) return 0;
    
    try {
      const savedProgress = localStorage.getItem(`workout-progress-${workoutId}`);
      if (savedProgress) {
        const parsedProgress = parseInt(savedProgress);
        if (!isNaN(parsedProgress)) {
          console.log(`[useWorkoutProgress] Loaded progress for workout ${workoutId}:`, parsedProgress);
          return parsedProgress;
        }
      }
    } catch (error) {
      console.error('[useWorkoutProgress] Error loading progress:', error);
    }
    
    return 0;
  });

  // Update progress and save to localStorage
  const setProgress = useCallback((newProgress: number) => {
    if (!workoutId) return;
    
    setProgressState(newProgress);
    try {
      localStorage.setItem(`workout-progress-${workoutId}`, newProgress.toString());
      console.log(`[useWorkoutProgress] Saved progress for workout ${workoutId}:`, newProgress);
    } catch (error) {
      console.error('[useWorkoutProgress] Error saving progress:', error);
    }
  }, [workoutId]);
  
  // Refresh progress from localStorage
  const refreshProgress = useCallback(() => {
    if (!workoutId) return;
    
    try {
      const savedProgress = localStorage.getItem(`workout-progress-${workoutId}`);
      if (savedProgress) {
        const parsedProgress = parseInt(savedProgress);
        if (!isNaN(parsedProgress)) {
          setProgressState(parsedProgress);
          console.log(`[useWorkoutProgress] Refreshed progress for workout ${workoutId}:`, parsedProgress);
          return;
        }
      }
      // If no valid progress found, reset to 0
      setProgressState(0);
    } catch (error) {
      console.error('[useWorkoutProgress] Error refreshing progress:', error);
    }
  }, [workoutId]);

  // Reset progress when workout ID changes
  useEffect(() => {
    if (!workoutId) return;
    
    try {
      const savedProgress = localStorage.getItem(`workout-progress-${workoutId}`);
      if (savedProgress) {
        const parsedProgress = parseInt(savedProgress);
        if (!isNaN(parsedProgress)) {
          setProgressState(parsedProgress);
          console.log(`[useWorkoutProgress] Workout changed, loaded progress for ${workoutId}:`, parsedProgress);
          return;
        }
      }
    } catch (error) {
      console.error('[useWorkoutProgress] Error loading progress on workout change:', error);
    }
    
    // If no saved progress exists, reset to 0
    setProgressState(0);
  }, [workoutId]);

  return { progress, setProgress, refreshProgress };
}

/**
 * Custom hook to handle completed exercises with localStorage persistence
 */
export function useCompletedExercises() {
  // Initialize from localStorage if available
  const [completed, setCompletedState] = useState<Record<string, Set<number>>>(() => {
    try {
      const savedData = localStorage.getItem('workout-completed-exercises');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        // Convert from raw object to object with Set values
        const progressWithSets: Record<string, Set<number>> = {};
        Object.keys(parsed).forEach(workoutId => {
          progressWithSets[workoutId] = new Set(parsed[workoutId]);
        });
        
        console.log('[useCompletedExercises] Loaded completed exercises:', progressWithSets);
        return progressWithSets;
      }
    } catch (error) {
      console.error('[useCompletedExercises] Error loading completed exercises:', error);
    }
    
    return {};
  });

  // Mark an exercise as completed
  const markCompleted = useCallback((workoutId: string, exerciseIdx: number) => {
    setCompletedState(prev => {
      // Create a new completed set for this workout
      const workoutSet = prev[workoutId] ? new Set(prev[workoutId]) : new Set<number>();
      workoutSet.add(exerciseIdx);
      
      // Create updated state
      const updatedState = { ...prev, [workoutId]: workoutSet };
      
      try {
        // Convert Sets to arrays for JSON serialization
        const serializable = Object.entries(updatedState).reduce((acc, [id, set]) => {
          acc[id] = Array.from(set);
          return acc;
        }, {} as Record<string, number[]>);
        
        // Save to localStorage
        localStorage.setItem('workout-completed-exercises', JSON.stringify(serializable));
        console.log(`[useCompletedExercises] Saved completion for workout ${workoutId}, exercise ${exerciseIdx}`);
      } catch (error) {
        console.error('[useCompletedExercises] Error saving completed exercises:', error);
      }
      
      return updatedState;
    });
  }, []);

  // Get completion count for a workout
  const getCompletionCount = useCallback((workoutId: string) => {
    return completed[workoutId]?.size || 0;
  }, [completed]);

  // Check if an exercise is completed
  const isCompleted = useCallback((workoutId: string, exerciseIdx: number) => {
    return completed[workoutId]?.has(exerciseIdx) || false;
  }, [completed]);

  return { 
    completed,
    markCompleted,
    getCompletionCount,
    isCompleted
  };
} 