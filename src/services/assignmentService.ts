import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Types for the new unified assignment system
export interface WorkoutAssignment {
  id: string;
  athlete_id: string;
  assignment_type: 'single' | 'weekly' | 'monthly';
  exercise_block: any; // JSONB - workout content
  progress: AssignmentProgress;
  start_date: string;
  end_date?: string;
  assigned_at: string;
  assigned_by?: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  meta: any; // JSONB - type-specific metadata
  created_at: string;
  updated_at: string;
}

export interface AssignmentProgress {
  current_exercise_index: number;
  current_set: number;
  current_rep: number;
  completed_exercises: number[];
  started_at?: string;
  completed_at?: string;
  last_activity_at?: string;
  total_exercises: number;
  completion_percentage: number;
  total_time_seconds?: number;
  exercise_times?: Record<string, number>;
  current_exercise_progress?: {
    completed_sets: Array<{
      set: number;
      reps: number;
      completed_at: string;
    }>;
    current_set_reps_completed?: number;
  };
}

export interface AssignmentFilters {
  assignment_type?: 'single' | 'weekly' | 'monthly';
  status?: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  start_date?: string;
  end_date?: string;
}

export interface ProgressUpdate {
  current_exercise_index?: number;
  current_set?: number;
  current_rep?: number;
  completed_exercises?: number[];
  exercise_completed?: boolean;
  workout_completed?: boolean;
  time_spent_seconds?: number;
  completion_percentage?: number;
}

/**
 * Unified Assignment Service
 * Handles all workout assignment operations for the new unified system
 * Works in parallel with existing services during migration
 */
export class AssignmentService {
  private client = supabase;

  /**
   * Get assignments for an athlete with optional filtering
   */
  async getAssignments(
    athleteId: string, 
    filters?: AssignmentFilters
  ): Promise<WorkoutAssignment[]> {
    try {
      let query = this.client
        .from('unified_workout_assignments')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('assigned_at', { ascending: false });

      // Apply filters
      if (filters?.assignment_type) {
        query = query.eq('assignment_type', filters.assignment_type);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.start_date) {
        query = query.gte('start_date', filters.start_date);
      }
      
      if (filters?.end_date) {
        query = query.lte('start_date', filters.end_date);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching assignments:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('AssignmentService.getAssignments error:', error);
      throw error;
    }
  }

  /**
   * Get today's workout assignment for an athlete
   */
  async getTodaysAssignment(athleteId: string): Promise<WorkoutAssignment | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await this.client
        .from('unified_workout_assignments')
        .select('*')
        .eq('athlete_id', athleteId)
        .eq('start_date', today)
        .in('status', ['assigned', 'in_progress'])
        .order('assigned_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching today\'s assignment:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('AssignmentService.getTodaysAssignment error:', error);
      return null;
    }
  }

  /**
   * Create a new assignment
   */
  async createAssignment(assignment: Omit<WorkoutAssignment, 'id' | 'created_at' | 'updated_at'>): Promise<WorkoutAssignment> {
    try {
      // Calculate total exercises for progress tracking
      const totalExercises = this.calculateTotalExercises(assignment.exercise_block, assignment.assignment_type);
      
      // Initialize progress
      const initialProgress: AssignmentProgress = {
        current_exercise_index: 0,
        current_set: 1,
        current_rep: 1,
        completed_exercises: [],
        total_exercises: totalExercises,
        completion_percentage: 0,
        ...assignment.progress
      };

      const { data, error } = await this.client
        .from('unified_workout_assignments')
        .insert([{
          ...assignment,
          progress: initialProgress
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating assignment:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('AssignmentService.createAssignment error:', error);
      throw error;
    }
  }

  /**
   * Update assignment progress
   */
  async updateProgress(
    assignmentId: string, 
    progressUpdate: ProgressUpdate
  ): Promise<WorkoutAssignment> {
    try {
      // First get current assignment to merge progress
      const { data: currentAssignment, error: fetchError } = await this.client
        .from('unified_workout_assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (fetchError) {
        console.error('Error fetching current assignment:', fetchError);
        throw fetchError;
      }

      const currentProgress = currentAssignment.progress as AssignmentProgress;
      
      // Merge progress updates
      const updatedProgress: AssignmentProgress = {
        ...currentProgress,
        last_activity_at: new Date().toISOString(),
        ...progressUpdate
      };

      // Handle exercise completion
      if (progressUpdate.exercise_completed && progressUpdate.current_exercise_index !== undefined) {
        if (!updatedProgress.completed_exercises.includes(progressUpdate.current_exercise_index)) {
          updatedProgress.completed_exercises.push(progressUpdate.current_exercise_index);
        }
        updatedProgress.current_exercise_index = progressUpdate.current_exercise_index + 1;
        updatedProgress.current_set = 1;
        updatedProgress.current_rep = 1;
      }

      // Update completion percentage - use provided value if available, otherwise calculate from completed exercises
      if (progressUpdate.completion_percentage !== undefined) {
        updatedProgress.completion_percentage = Math.round(progressUpdate.completion_percentage);
      } else {
        // Fallback to calculating from completed exercises
        updatedProgress.completion_percentage = Math.round(
          (updatedProgress.completed_exercises.length / updatedProgress.total_exercises) * 100
        );
      }

      // Determine status
      let status = currentAssignment.status;
      if (updatedProgress.completion_percentage === 100 || progressUpdate.workout_completed) {
        status = 'completed';
        updatedProgress.completed_at = new Date().toISOString();
      } else if (updatedProgress.completion_percentage > 0) {
        status = 'in_progress';
        if (!updatedProgress.started_at) {
          updatedProgress.started_at = new Date().toISOString();
        }
      }

      // Update assignment
      const { data, error } = await this.client
        .from('unified_workout_assignments')
        .update({
          progress: updatedProgress,
          status: status
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating assignment progress:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('AssignmentService.updateProgress error:', error);
      throw error;
    }
  }

  /**
   * Reset assignment progress
   */
  async resetProgress(assignmentId: string): Promise<WorkoutAssignment> {
    try {
      const { data: currentAssignment, error: fetchError } = await this.client
        .from('unified_workout_assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const totalExercises = this.calculateTotalExercises(
        currentAssignment.exercise_block, 
        currentAssignment.assignment_type
      );

      const resetProgress: AssignmentProgress = {
        current_exercise_index: 0,
        current_set: 1,
        current_rep: 1,
        completed_exercises: [],
        started_at: undefined,
        completed_at: undefined,
        last_activity_at: undefined,
        total_exercises: totalExercises,
        completion_percentage: 0,
        total_time_seconds: 0,
        exercise_times: {},
        current_exercise_progress: undefined
      };

      const { data, error } = await this.client
        .from('unified_workout_assignments')
        .update({
          progress: resetProgress,
          status: 'assigned'
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) {
        console.error('Error resetting assignment progress:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('AssignmentService.resetProgress error:', error);
      throw error;
    }
  }

  /**
   * Get assignment progress summary
   */
  async getProgressSummary(athleteId: string, dateRange?: { start: string; end: string }) {
    try {
      let query = this.client
        .from('unified_workout_assignments')
        .select('assignment_type, status, progress, assigned_at')
        .eq('athlete_id', athleteId);

      if (dateRange) {
        query = query
          .gte('assigned_at', dateRange.start)
          .lte('assigned_at', dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Calculate summary statistics
      const summary = {
        total_assignments: data.length,
        completed: data.filter(a => a.status === 'completed').length,
        in_progress: data.filter(a => a.status === 'in_progress').length,
        assigned: data.filter(a => a.status === 'assigned').length,
        overdue: data.filter(a => a.status === 'overdue').length,
        average_completion: data.reduce((sum, a) => sum + (a.progress?.completion_percentage || 0), 0) / data.length || 0,
        by_type: {
          single: data.filter(a => a.assignment_type === 'single').length,
          weekly: data.filter(a => a.assignment_type === 'weekly').length,
          monthly: data.filter(a => a.assignment_type === 'monthly').length
        }
      };

      return summary;
    } catch (error) {
      console.error('AssignmentService.getProgressSummary error:', error);
      throw error;
    }
  }

  /**
   * Helper: Calculate total exercises based on assignment type and exercise block
   */
  private calculateTotalExercises(exerciseBlock: any, assignmentType: string): number {
    try {
      if (assignmentType === 'single') {
        if (exerciseBlock.exercises) {
          return exerciseBlock.exercises.length;
        }
        if (exerciseBlock.blocks) {
          return exerciseBlock.blocks.reduce((total: number, block: any) => {
            return total + (block.exercises?.length || 0);
          }, 0);
        }
      }
      
            if (assignmentType === 'weekly') {
        const dailyWorkouts = exerciseBlock.daily_workouts || {};
        return (Object.values(dailyWorkouts) as any[]).reduce((total: number, day: any) => {
          return total + (day?.exercises?.length || 0);
        }, 0);
      }
        
      if (assignmentType === 'monthly') {
        // For monthly plans, count training weeks (not individual exercises)
        const weeklyStructure = exerciseBlock.weekly_structure || [];
        return weeklyStructure.filter((week: any) => !week.is_rest_week && week.workout_id).length;
      }

      return 0;
    } catch (error) {
      console.error('Error calculating total exercises:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const assignmentService = new AssignmentService(); 