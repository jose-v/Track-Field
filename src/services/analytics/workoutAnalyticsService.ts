import { supabase } from '../../lib/supabase';

export interface WorkoutAnalyticsData {
  id: string;
  name: string;
  type?: string;
  created_at: string;
  user_id: string;
  source: 'active' | 'archived';
  archived_at?: string;
  archived_by?: string;
  exercises?: any[];
  blocks?: any[];
  is_block_based?: boolean;
  is_template?: boolean;
}

export interface WorkoutAnalyticsFilters {
  userId?: string;
  startDate?: string;
  endDate?: string;
  includeArchived?: boolean;
  workoutType?: string;
  isTemplate?: boolean;
}

export interface ExerciseResultAnalyticsData {
  id: string;
  athlete_id: string;
  workout_id: string;
  exercise_index: number;
  exercise_name: string;
  time_minutes?: number;
  time_seconds?: number;
  time_hundredths?: number;
  sets_completed?: number;
  reps_completed?: number;
  weight_used?: number;
  distance_meters?: number;
  rpe_rating?: number;
  notes?: string;
  completed_at: string;
  created_at: string;
  updated_at: string;
  source: 'active' | 'archived';
  archived_at?: string;
  archived_by?: string;
}

export interface ExerciseResultAnalyticsFilters {
  athleteId?: string;
  workoutId?: string;
  startDate?: string;
  endDate?: string;
  includeArchived?: boolean;
  exerciseName?: string;
}

export class WorkoutAnalyticsService {
  
  /**
   * Get workout data for analytics from the unified view
   * This includes both active and archived workouts
   */
  static async getWorkoutsForAnalytics(filters: WorkoutAnalyticsFilters = {}): Promise<WorkoutAnalyticsData[]> {
    try {
      let query = supabase
        .from('workouts_for_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters.workoutType) {
        query = query.eq('type', filters.workoutType);
      }

      if (filters.isTemplate !== undefined) {
        query = query.eq('is_template', filters.isTemplate);
      }

      // By default, include both active and archived
      // If explicitly set to false, only include active
      if (filters.includeArchived === false) {
        query = query.eq('source', 'active');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching workout analytics data:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getWorkoutsForAnalytics:', error);
      throw error;
    }
  }

  /**
   * Get workout statistics for analytics
   */
  static async getWorkoutStats(filters: WorkoutAnalyticsFilters = {}): Promise<{
    totalWorkouts: number;
    activeWorkouts: number;
    archivedWorkouts: number;
    templates: number;
    averageExercisesPerWorkout: number;
    mostCommonType: string | null;
    dateRange: { earliest: string | null; latest: string | null };
  }> {
    try {
      const workouts = await this.getWorkoutsForAnalytics(filters);
      
      const stats = {
        totalWorkouts: workouts.length,
        activeWorkouts: workouts.filter(w => w.source === 'active').length,
        archivedWorkouts: workouts.filter(w => w.source === 'archived').length,
        templates: workouts.filter(w => w.is_template).length,
        averageExercisesPerWorkout: 0,
        mostCommonType: null as string | null,
        dateRange: { earliest: null as string | null, latest: null as string | null }
      };

      // Calculate average exercises per workout
      const workoutsWithExercises = workouts.filter(w => w.exercises && Array.isArray(w.exercises));
      if (workoutsWithExercises.length > 0) {
        const totalExercises = workoutsWithExercises.reduce((sum, w) => sum + w.exercises!.length, 0);
        stats.averageExercisesPerWorkout = totalExercises / workoutsWithExercises.length;
      }

      // Find most common workout type
      const typeCounts: Record<string, number> = {};
      workouts.forEach(w => {
        if (w.type) {
          typeCounts[w.type] = (typeCounts[w.type] || 0) + 1;
        }
      });
      
      if (Object.keys(typeCounts).length > 0) {
        stats.mostCommonType = Object.entries(typeCounts)
          .sort(([,a], [,b]) => b - a)[0][0];
      }

      // Calculate date range
      const dates = workouts.map(w => w.created_at).filter(Boolean);
      if (dates.length > 0) {
        stats.dateRange.earliest = dates.sort()[0];
        stats.dateRange.latest = dates.sort().reverse()[0];
      }

      return stats;
    } catch (error) {
      console.error('Error in getWorkoutStats:', error);
      throw error;
    }
  }

  /**
   * Get workout trends over time
   */
  static async getWorkoutTrends(filters: WorkoutAnalyticsFilters = {}): Promise<{
    date: string;
    activeCount: number;
    archivedCount: number;
    totalCount: number;
  }[]> {
    try {
      const workouts = await this.getWorkoutsForAnalytics(filters);
      
      // Group by date
      const dailyStats: Record<string, { active: number; archived: number }> = {};
      
      workouts.forEach(workout => {
        const date = workout.created_at.split('T')[0]; // Get just the date part
        if (!dailyStats[date]) {
          dailyStats[date] = { active: 0, archived: 0 };
        }
        
        if (workout.source === 'active') {
          dailyStats[date].active++;
        } else {
          dailyStats[date].archived++;
        }
      });

      // Convert to array and sort by date
      return Object.entries(dailyStats)
        .map(([date, stats]) => ({
          date,
          activeCount: stats.active,
          archivedCount: stats.archived,
          totalCount: stats.active + stats.archived
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error in getWorkoutTrends:', error);
      throw error;
    }
  }

  /**
   * Get exercise results for analytics from the unified view
   * This includes both active and archived exercise results
   */
  static async getExerciseResultsForAnalytics(filters: ExerciseResultAnalyticsFilters = {}): Promise<ExerciseResultAnalyticsData[]> {
    try {
      let query = supabase
        .from('exercise_results_for_analytics')
        .select('*')
        .order('completed_at', { ascending: false });

      // Apply filters
      if (filters.athleteId) {
        query = query.eq('athlete_id', filters.athleteId);
      }

      if (filters.workoutId) {
        query = query.eq('workout_id', filters.workoutId);
      }

      if (filters.startDate) {
        query = query.gte('completed_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('completed_at', filters.endDate);
      }

      if (filters.exerciseName) {
        query = query.ilike('exercise_name', `%${filters.exerciseName}%`);
      }

      // By default, include both active and archived
      // If explicitly set to false, only include active
      if (filters.includeArchived === false) {
        query = query.eq('source', 'active');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching exercise results analytics data:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getExerciseResultsForAnalytics:', error);
      throw error;
    }
  }

  /**
   * Get exercise results statistics for analytics
   */
  static async getExerciseResultStats(filters: ExerciseResultAnalyticsFilters = {}): Promise<{
    totalResults: number;
    activeResults: number;
    archivedResults: number;
    averageTimePerExercise: number;
    mostCommonExercise: string | null;
    dateRange: { earliest: string | null; latest: string | null };
  }> {
    try {
      const results = await this.getExerciseResultsForAnalytics(filters);
      
      const stats = {
        totalResults: results.length,
        activeResults: results.filter(r => r.source === 'active').length,
        archivedResults: results.filter(r => r.source === 'archived').length,
        averageTimePerExercise: 0,
        mostCommonExercise: null as string | null,
        dateRange: { earliest: null as string | null, latest: null as string | null }
      };

      // Calculate average time per exercise
      const exercisesWithTime = results.filter(r => r.time_minutes || r.time_seconds);
      if (exercisesWithTime.length > 0) {
        const totalTime = exercisesWithTime.reduce((sum, r) => {
          const minutes = r.time_minutes || 0;
          const seconds = r.time_seconds || 0;
          return sum + (minutes * 60) + seconds;
        }, 0);
        stats.averageTimePerExercise = totalTime / exercisesWithTime.length;
      }

      // Find most common exercise
      const exerciseCounts = results.reduce((acc, r) => {
        acc[r.exercise_name] = (acc[r.exercise_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      if (Object.keys(exerciseCounts).length > 0) {
        stats.mostCommonExercise = Object.entries(exerciseCounts)
          .sort(([,a], [,b]) => b - a)[0][0];
      }

      // Calculate date range
      if (results.length > 0) {
        const dates = results.map(r => new Date(r.completed_at)).sort((a, b) => a.getTime() - b.getTime());
        stats.dateRange.earliest = dates[0].toISOString();
        stats.dateRange.latest = dates[dates.length - 1].toISOString();
      }

      return stats;
    } catch (error) {
      console.error('Error in getExerciseResultStats:', error);
      throw error;
    }
  }

  /**
   * Get workout performance analytics (for completed workouts)
   */
  static async getWorkoutPerformanceAnalytics(userId: string, dateRange: { start: string; end: string }): Promise<{
    totalCompleted: number;
    averageCompletionTime: number;
    completionRate: number;
    mostCompletedType: string | null;
  }> {
    try {
      // This would need to be enhanced to include exercise_results data
      // For now, returning basic structure
      return {
        totalCompleted: 0,
        averageCompletionTime: 0,
        completionRate: 0,
        mostCompletedType: null
      };
    } catch (error) {
      console.error('Error in getWorkoutPerformanceAnalytics:', error);
      throw error;
    }
  }
} 