import { ExerciseBlock, BlockBasedWorkout } from '../types/workout-blocks';

// Migration utilities for backwards compatibility
export class WorkoutMigration {
  
  /**
   * Converts legacy exercise array to block-based structure
   */
  static migrateWorkoutToBlocks(legacyWorkout: any): BlockBasedWorkout {
    // If already has blocks, return as is
    if (legacyWorkout.blocks) {
      return legacyWorkout as BlockBasedWorkout;
    }

    // Convert exercises array to single block
    const defaultBlock: ExerciseBlock = {
      id: 'default-block-' + Date.now(),
      name: 'Main Workout',
      exercises: legacyWorkout.exercises || [],
      flow: legacyWorkout.flow_type || 'sequential',
      rounds: legacyWorkout.circuit_rounds || 1,
      category: 'main',
      restBetweenExercises: 60, // Default rest
    };

    return {
      ...legacyWorkout,
      blocks: [defaultBlock],
      exercises: legacyWorkout.exercises, // Keep for backwards compatibility
    };
  }

  /**
   * Auto-detects workout structure and creates intelligent blocks
   * Groups exercises by category first, then creates consolidated blocks
   */
  static autoCreateBlocks(exercises: any[]): ExerciseBlock[] {
    // Group exercises by category
    const exercisesByCategory: Record<string, any[]> = {};

    for (const exercise of exercises) {
      let detectedCategory = 'main';

      // First check the actual category field from exercise library
      if (exercise.category) {
        const exerciseCategory = exercise.category.toLowerCase();
        if (exerciseCategory.includes('warm') || exerciseCategory === 'warm_up') {
          detectedCategory = 'warmup';
        } else if (exerciseCategory.includes('cool') || exerciseCategory === 'cool_down') {
          detectedCategory = 'cooldown';
        } else if (exerciseCategory.includes('accessory') || exerciseCategory.includes('auxiliary')) {
          detectedCategory = 'accessory';
        } else if (exerciseCategory.includes('cardio') || exerciseCategory.includes('conditioning')) {
          detectedCategory = 'conditioning';
        }
      }

      // Fall back to name-based detection only if category didn't match
      if (detectedCategory === 'main') {
        const exerciseName = exercise.name?.toLowerCase() || '';
        if (exerciseName.includes('warm') || exerciseName.includes('stretch') || 
            exerciseName.includes('dynamic') || exerciseName.includes('activation')) {
          detectedCategory = 'warmup';
        } else if (exerciseName.includes('cool') || exerciseName.includes('recovery') ||
                   exerciseName.includes('static stretch')) {
          detectedCategory = 'cooldown';
        } else if (exerciseName.includes('accessory') || exerciseName.includes('auxiliary') ||
                   exerciseName.includes('supplemental')) {
          detectedCategory = 'accessory';
        }
      }

      if (!exercisesByCategory[detectedCategory]) {
        exercisesByCategory[detectedCategory] = [];
      }
      exercisesByCategory[detectedCategory].push(exercise);
    }

    // Create blocks in logical order: warmup -> main -> conditioning -> accessory -> cooldown
    const categoryOrder = ['warmup', 'main', 'conditioning', 'accessory', 'cooldown'];
    const blocks: ExerciseBlock[] = [];

    for (const category of categoryOrder) {
      if (exercisesByCategory[category] && exercisesByCategory[category].length > 0) {
        blocks.push({
          id: `${category}-block-${Date.now()}`,
          name: this.getCategoryDisplayName(category),
          exercises: exercisesByCategory[category],
          flow: 'sequential',
          category: category as any,
          restBetweenExercises: this.getDefaultRestForCategory(category),
        });
      }
    }

    // Handle any other categories not in the standard order
    for (const [category, exercises] of Object.entries(exercisesByCategory)) {
      if (!categoryOrder.includes(category) && exercises.length > 0) {
        blocks.push({
          id: `${category}-block-${Date.now()}`,
          name: this.getCategoryDisplayName(category),
          exercises: exercises,
          flow: 'sequential',
          category: category as any,
          restBetweenExercises: this.getDefaultRestForCategory(category),
        });
      }
    }

    return blocks.length > 0 ? blocks : [{
      id: 'default-block',
      name: 'Main Workout',
      exercises: exercises,
      flow: 'sequential',
      category: 'main',
      restBetweenExercises: 60,
    }];
  }

  private static getCategoryDisplayName(category: string): string {
    const names = {
      warmup: 'Warm-up',
      main: 'Main Set',
      accessory: 'Accessory Work',
      cooldown: 'Cool-down',
      conditioning: 'Conditioning'
    };
    return names[category] || 'Workout';
  }

  private static getDefaultRestForCategory(category: string): number {
    const restTimes = {
      warmup: 60,
      main: 90,
      accessory: 60,
      cooldown: 30,
      conditioning: 120
    };
    return restTimes[category] || 60;
  }

  /**
   * Validates block structure and fixes common issues
   */
  static validateAndFixBlocks(blocks: ExerciseBlock[]): ExerciseBlock[] {
    return blocks.map(block => ({
      ...block,
      exercises: block.exercises || [],
      flow: block.flow || 'sequential',
      restBetweenExercises: block.restBetweenExercises || 60,
      category: block.category || 'main',
    }));
  }
}

// Helper to get total exercise count from blocks (for progress tracking)
export function getTotalExercisesFromBlocks(blocks: ExerciseBlock[]): number {
  return blocks.reduce((total, block) => total + block.exercises.length, 0);
}

// Helper to flatten blocks back to exercise array (for legacy compatibility)
export function flattenBlocksToExercises(blocks: ExerciseBlock[]): any[] {
  return blocks.flatMap(block => block.exercises);
} 