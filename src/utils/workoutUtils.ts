// Utility functions for workout operations

export interface Exercise {
  id?: string;
  name: string;
  sets?: number | string;
  reps?: number | string;
  weight?: number | string;
  rest?: number | string;
  distance?: number | string;
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  exercises?: Exercise[] | any[];
  blocks?: any[];
  is_block_based?: boolean;
  template_type?: 'single' | 'weekly' | 'monthly';
  [key: string]: any;
}

/**
 * Extracts blocks from a workout, handling both daily and weekly structures
 */
export function getBlocksFromWorkout(workout: Workout): any[] {
  if (!(workout as any).is_block_based || !(workout as any).blocks) {
    return [];
  }

  try {
    const blocks = (workout as any).blocks;
    
    // If blocks is a string, parse it
    if (typeof blocks === 'string') {
      const parsedBlocks = JSON.parse(blocks);
      
      // Check if it's a weekly structure (object with day keys)
      if (typeof parsedBlocks === 'object' && !Array.isArray(parsedBlocks)) {
        // Extract blocks from all days
        const allBlocks: any[] = [];
        Object.values(parsedBlocks).forEach((dayBlocks: any) => {
          if (Array.isArray(dayBlocks)) {
            allBlocks.push(...dayBlocks);
          }
        });
        return allBlocks;
      }
      
      // If it's already an array, return it
      if (Array.isArray(parsedBlocks)) {
        return parsedBlocks;
      }
    }
    
    // If blocks is already an array
    if (Array.isArray(blocks)) {
      return blocks;
    }
    
    // If it's an object (weekly structure)
    if (typeof blocks === 'object') {
      const allBlocks: any[] = [];
      Object.values(blocks).forEach((dayBlocks: any) => {
        if (Array.isArray(dayBlocks)) {
          allBlocks.push(...dayBlocks);
        }
      });
      return allBlocks;
    }
  } catch (error) {
    console.error('Error parsing workout blocks:', error);
  }
  
  return [];
}

/**
 * Extracts all exercises from a workout, handling block-based, weekly, and regular structures
 */
export function getExercisesFromWorkout(workout: Workout): Exercise[] {
  // Handle block-based workouts first
  if ((workout as any).is_block_based && (workout as any).blocks) {
    const blocks = getBlocksFromWorkout(workout);
    return blocks.reduce((allExercises: Exercise[], block: any) => {
      if (block.exercises && Array.isArray(block.exercises)) {
        return [...allExercises, ...block.exercises];
      }
      return allExercises;
    }, []);
  }

  // Handle regular workouts with exercises array
  if (workout.exercises && Array.isArray(workout.exercises)) {
    // Check if it's a weekly plan structure (array of day objects)
    if (workout.exercises.length > 0 && 
        typeof workout.exercises[0] === 'object' && 
        'day' in workout.exercises[0] && 
        'exercises' in workout.exercises[0]) {
      // It's a weekly plan structure - flatten all exercises from all days
      const weeklyPlan = workout.exercises as any[];
      return weeklyPlan.reduce((allExercises: Exercise[], dayPlan: any) => {
        if (dayPlan.exercises && Array.isArray(dayPlan.exercises) && !dayPlan.isRestDay) {
          return [...allExercises, ...dayPlan.exercises];
        }
        return allExercises;
      }, []);
    } else {
      // It's a regular exercise array
      return workout.exercises;
    }
  }
  
  return [];
}

/**
 * Gets the total exercise count for a workout
 */
export function getWorkoutExerciseCount(workout: Workout): number {
  return getExercisesFromWorkout(workout).length;
}

/**
 * Gets the total block count for a block-based workout
 */
export function getWorkoutBlockCount(workout: Workout): number {
  if (!(workout as any).is_block_based) {
    return 0;
  }
  return getBlocksFromWorkout(workout).length;
} 