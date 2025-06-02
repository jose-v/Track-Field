/**
 * Daily Workout Calculator
 * Calculates which daily workout an athlete should see based on their monthly plan assignment
 */

import type { MonthlyPlan, MonthlyPlanAssignment } from '../services/dbSchema';
import type { Workout } from '../services/api';

interface DailyWorkoutResult {
  currentDay: number; // Days since start (0-based)
  currentWeek: number; // Week number (1-based)
  dayOfWeek: number; // Day within the week (0=Monday, 6=Sunday)
  dayName: string; // 'monday', 'tuesday', etc.
  weekInfo: {
    week_number: number;
    workout_id: string;
    is_rest_week: boolean;
  } | null;
  dailyWorkout: any | null; // The specific daily workout for today
  isRestDay: boolean;
  isRestWeek: boolean;
  planCompleted: boolean; // Whether the athlete has completed the entire plan
  weeklyWorkout?: Workout; // The full weekly workout template
}

// Day names for array indexing
const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Calculate which daily workout an athlete should see today
 */
export function calculateDailyWorkout(
  assignment: MonthlyPlanAssignment,
  monthlyPlan: MonthlyPlan,
  weeklyWorkout?: Workout
): DailyWorkoutResult {
  const startDate = new Date(assignment.start_date);
  const today = new Date();
  
  // Calculate days since start (0-based)
  const timeDiff = today.getTime() - startDate.getTime();
  const daysSinceStart = Math.floor(timeDiff / (1000 * 3600 * 24));
  
  // Calculate current week (1-based) and day of week (0-based)
  const currentWeek = Math.floor(daysSinceStart / 7) + 1;
  const dayOfWeek = daysSinceStart % 7;
  const dayName = DAY_NAMES[dayOfWeek];
  
  // Check if plan is completed
  const totalWeeks = monthlyPlan.weeks.length;
  const planCompleted = currentWeek > totalWeeks;
  
  // Find the current week info
  const weekInfo = monthlyPlan.weeks.find(w => w.week_number === currentWeek) || null;
  
  // Default result
  const result: DailyWorkoutResult = {
    currentDay: daysSinceStart,
    currentWeek,
    dayOfWeek,
    dayName,
    weekInfo,
    dailyWorkout: null,
    isRestDay: false,
    isRestWeek: false,
    planCompleted,
    weeklyWorkout
  };
  
  // If plan is completed or no week info, return early
  if (planCompleted || !weekInfo) {
    return result;
  }
  
  // Check if it's a rest week
  if (weekInfo.is_rest_week) {
    result.isRestWeek = true;
    result.isRestDay = true;
    return result;
  }
  
  // If we have the weekly workout data, extract today's workout
  if (weeklyWorkout && weeklyWorkout.exercises) {
    // Check if exercises is a weekly plan structure
    if (Array.isArray(weeklyWorkout.exercises) && 
        weeklyWorkout.exercises.length > 0 &&
        typeof weeklyWorkout.exercises[0] === 'object' &&
        'day' in weeklyWorkout.exercises[0]) {
      
      // It's a weekly plan structure - find today's workout
      const weeklyPlan = weeklyWorkout.exercises as any[];
      const todaysPlan = weeklyPlan.find(dayPlan => dayPlan.day === dayName);
      
      if (todaysPlan) {
        result.dailyWorkout = todaysPlan;
        result.isRestDay = todaysPlan.isRestDay || false;
      } else {
        // Day not found in plan - default to rest day
        result.isRestDay = true;
      }
    } else {
      // It's a single day workout - use it for all days
      result.dailyWorkout = {
        day: dayName,
        exercises: weeklyWorkout.exercises,
        isRestDay: false
      };
    }
  }
  
  return result;
}

/**
 * Get a formatted description of the current training day
 */
export function getDailyWorkoutDescription(result: DailyWorkoutResult): string {
  if (result.planCompleted) {
    return 'Training plan completed! Great job! 🎉';
  }
  
  if (result.isRestWeek) {
    return `Week ${result.currentWeek} - Rest Week. Take time to recover! 😴`;
  }
  
  if (result.isRestDay) {
    return `${result.dayName.charAt(0).toUpperCase() + result.dayName.slice(1)} - Rest Day. Recovery is important! 😌`;
  }
  
  if (result.dailyWorkout && result.dailyWorkout.exercises) {
    const exerciseCount = result.dailyWorkout.exercises.length;
    return `Week ${result.currentWeek}, ${result.dayName.charAt(0).toUpperCase() + result.dayName.slice(1)} - ${exerciseCount} exercises planned`;
  }
  
  return `Week ${result.currentWeek}, ${result.dayName.charAt(0).toUpperCase() + result.dayName.slice(1)} - Training day`;
}

/**
 * Check if an athlete should see a workout today
 */
export function shouldShowWorkout(result: DailyWorkoutResult): boolean {
  return !result.planCompleted && !result.isRestDay && result.dailyWorkout !== null;
}

/**
 * Get workout progress information
 */
export function getWorkoutProgress(result: DailyWorkoutResult, monthlyPlan: MonthlyPlan): {
  currentWeek: number;
  totalWeeks: number;
  weekProgress: number;
  overallProgress: number;
} {
  const totalWeeks = monthlyPlan.weeks.length;
  const weekProgress = ((result.dayOfWeek + 1) / 7) * 100; // Progress within current week
  const overallProgress = result.planCompleted 
    ? 100 
    : ((result.currentWeek - 1) / totalWeeks) * 100 + (weekProgress / totalWeeks);
  
  return {
    currentWeek: result.currentWeek,
    totalWeeks,
    weekProgress,
    overallProgress: Math.min(100, Math.max(0, overallProgress))
  };
} 