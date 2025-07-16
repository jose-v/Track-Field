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
  // Always check for blocks, even if is_block_based is not set
  const blocks = (workout as any).blocks;
  const dailyWorkouts = (workout as any).daily_workouts;
  if (dailyWorkouts && typeof dailyWorkouts === 'object') {
    // Weekly plan structure: daily_workouts is an object of days to blocks
    const allBlocks: any[] = [];
    Object.values(dailyWorkouts).forEach((dayBlocks: any) => {
      if (Array.isArray(dayBlocks)) {
        allBlocks.push(...dayBlocks);
      }
    });
    return allBlocks;
  }
  if (!blocks) return [];
  try {
    let parsedBlocks = blocks;
    if (typeof blocks === 'string') {
      parsedBlocks = JSON.parse(blocks);
    }
    if (typeof parsedBlocks === 'object' && !Array.isArray(parsedBlocks)) {
      const allBlocks: any[] = [];
      Object.values(parsedBlocks).forEach((dayBlocks: any) => {
        if (Array.isArray(dayBlocks)) {
          allBlocks.push(...dayBlocks);
        }
      });
      return allBlocks;
    }
    if (Array.isArray(parsedBlocks)) {
      return parsedBlocks;
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
  // Check for daily_workouts (weekly plan structure)
  const dailyWorkouts = (workout as any).daily_workouts;
  if (dailyWorkouts && typeof dailyWorkouts === 'object') {
    const allExercises: Exercise[] = [];
    Object.values(dailyWorkouts).forEach((dayBlocks: any) => {
      if (Array.isArray(dayBlocks)) {
        dayBlocks.forEach((block: any) => {
          if (block.exercises && Array.isArray(block.exercises)) {
            allExercises.push(...block.exercises);
          }
        });
      }
    });
    return allExercises;
  }
  // Always check for blocks, even if is_block_based is not set
  const blocks = getBlocksFromWorkout(workout);
  if (blocks.length > 0) {
    return blocks.reduce((allExercises: Exercise[], block: any) => {
      if (block.exercises && Array.isArray(block.exercises)) {
        return [...allExercises, ...block.exercises];
      }
      return allExercises;
    }, []);
  }
  // Handle regular workouts with exercises array
  if (workout.exercises && Array.isArray(workout.exercises)) {
    if (workout.exercises.length > 0 && 
        typeof workout.exercises[0] === 'object' && 
        'day' in workout.exercises[0] && 
        'exercises' in workout.exercises[0]) {
      const weeklyPlan = workout.exercises as any[];
      return weeklyPlan.reduce((allExercises: Exercise[], dayPlan: any) => {
        if (dayPlan.exercises && Array.isArray(dayPlan.exercises) && !dayPlan.isRestDay) {
          return [...allExercises, ...dayPlan.exercises];
        }
        return allExercises;
      }, []);
    } else {
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