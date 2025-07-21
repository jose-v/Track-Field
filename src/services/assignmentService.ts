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
        // Add specific handling for 406 errors
        if (error.code === '406' || error.message?.includes('406') || error.message?.includes('Not Acceptable')) {
          console.warn('PostgREST 406 error detected, returning empty array as fallback');
          return [];
        }
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
      
      // Get today's assignment with assigned or in_progress status
      const { data, error } = await this.client
        .from('unified_workout_assignments')
        .select('*')
        .eq('athlete_id', athleteId)
        .eq('start_date', today)
        .or('status.eq.assigned,status.eq.in_progress')
        .order('assigned_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching today\'s assignment:', error);
        // Add specific handling for 406 errors
        if (error.code === '406' || error.message?.includes('406') || error.message?.includes('Not Acceptable')) {
          console.warn('PostgREST 406 error detected in getTodaysAssignment, returning null as fallback');
          return null;
        }
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('AssignmentService.getTodaysAssignment error:', error);
      return null;
    }
  }

  /**
   * Create a new assignment (with duplicate handling)
   */
  async createAssignment(assignment: Omit<WorkoutAssignment, 'id' | 'created_at' | 'updated_at'>): Promise<WorkoutAssignment> {
    try {
      // Handle assigned_by field - convert auth ID to profile ID if needed
      let assignedBy = assignment.assigned_by;
      if (assignedBy) {
        // Check if the assigned_by ID exists in profiles table
        const { data: profileExists, error: profileError } = await this.client
          .from('profiles')
          .select('id')
          .eq('id', assignedBy)
          .single();

        // If not found in profiles, set to null to avoid foreign key error
        if (profileError && profileError.code === 'PGRST116') {
          console.warn(`assigned_by ID ${assignedBy} not found in profiles table, setting to null`);
          assignedBy = null;
        } else if (profileError) {
          // If there's a different error, log it but continue
          console.error('Error checking assigned_by profile:', profileError);
          assignedBy = null;
        }
      }

      // For single workout assignments, check if this specific workout is already assigned
      // For other types, check by athlete, type, and date
      let existingAssignment = null;
      let checkError = null;
      
      if (assignment.assignment_type === 'single') {
        // For single workouts, check for the specific workout ID
        const workoutId = assignment.meta?.original_workout_id || assignment.exercise_block?.workout_id;
        
        if (workoutId) {
          const { data, error } = await this.client
            .from('unified_workout_assignments')
            .select('*')
            .eq('athlete_id', assignment.athlete_id)
            .eq('assignment_type', 'single')
            .or(`meta->>original_workout_id.eq.${workoutId},exercise_block->>workout_id.eq.${workoutId}`)
            .single();
          
          existingAssignment = data;
          checkError = error;
        }
      } else {
        // For weekly/monthly assignments, check by athlete, type, and date
        const { data, error } = await this.client
          .from('unified_workout_assignments')
          .select('*')
          .eq('athlete_id', assignment.athlete_id)
          .eq('assignment_type', assignment.assignment_type)
          .eq('start_date', assignment.start_date)
          .single();
          
        existingAssignment = data;
        checkError = error;
      }

      // If no error and assignment exists, return the existing one
      if (!checkError && existingAssignment) {
        return existingAssignment;
      }

      // If error is not "no rows found", throw it
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing assignment:', checkError);
        throw checkError;
      }

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

      const assignmentToCreate = {
        ...assignment,
        assigned_by: assignedBy, // Use the corrected assigned_by value
        progress: initialProgress
      };

      // Create new assignment (no upsert needed since we checked for duplicates above)
      const { data, error } = await this.client
        .from('unified_workout_assignments')
        .insert([assignmentToCreate])
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
   * Duplicate an existing assignment
   * Creates a new assignment based on an existing one with fresh progress tracking
   */
  async duplicateAssignment(
    originalAssignmentId: string,
    targetAthleteId?: string,
    newStartDate?: string,
    newAssignedBy?: string,
    customName?: string
  ): Promise<WorkoutAssignment> {
    try {
      // Get the original assignment
      const { data: originalAssignment, error: fetchError } = await this.client
        .from('unified_workout_assignments')
        .select('*')
        .eq('id', originalAssignmentId)
        .single();

      if (fetchError) {
        console.error('Error fetching original assignment:', fetchError);
        throw fetchError;
      }

      if (!originalAssignment) {
        throw new Error(`Assignment ${originalAssignmentId} not found`);
      }

      // Calculate total exercises for progress tracking
      const totalExercises = this.calculateTotalExercises(
        originalAssignment.exercise_block, 
        originalAssignment.assignment_type
      );

      // Create a copy of the exercise block with optional custom name
      const updatedExerciseBlock = {
        ...originalAssignment.exercise_block,
        ...(customName && { workout_name: customName })
      };

      // Create the new assignment data
      const newAssignmentData = {
        athlete_id: targetAthleteId || originalAssignment.athlete_id,
        assignment_type: originalAssignment.assignment_type,
        exercise_block: updatedExerciseBlock,
        progress: {
          current_exercise_index: 0,
          current_set: 1,
          current_rep: 1,
          completed_exercises: [],
          total_exercises: totalExercises,
          completion_percentage: 0,
          total_time_seconds: 0,
          exercise_times: {},
        } as AssignmentProgress,
        start_date: newStartDate || originalAssignment.start_date,
        end_date: originalAssignment.end_date,
        assigned_at: new Date().toISOString(),
        assigned_by: newAssignedBy || originalAssignment.assigned_by,
        status: 'assigned' as const,
        meta: {
          ...originalAssignment.meta,
          duplicated_from: originalAssignmentId,
          duplicated_at: new Date().toISOString(),
          ...(customName && { custom_name: customName })
        }
      };

      // Use the existing createAssignment method which handles duplicate checking
      const newAssignment = await this.createAssignment(newAssignmentData);
      
      return newAssignment;
    } catch (error) {
      console.error('AssignmentService.duplicateAssignment error:', error);
      throw error;
    }
  }

  /**
   * Duplicate a workout from the workouts table as a new assignment
   * Creates a new assignment based on an existing workout
   */
  async duplicateWorkoutAsAssignment(
    workoutId: string,
    targetAthleteId: string,
    assignedBy?: string,
    startDate?: string,
    customName?: string
  ): Promise<WorkoutAssignment> {
    try {
      // Get the original workout
      const { data: workout, error: workoutError } = await this.client
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();

      if (workoutError) {
        console.error('Error fetching workout:', workoutError);
        throw workoutError;
      }

      if (!workout) {
        throw new Error(`Workout ${workoutId} not found`);
      }

      // Determine assignment type based on workout template_type
      const assignmentType: 'single' | 'weekly' | 'monthly' = workout.template_type === 'weekly' ? 'weekly' : 
                           workout.template_type === 'monthly' ? 'monthly' : 'single';

      // Convert workout to exercise block format
      let exerciseBlock: any;

      if (assignmentType === 'weekly') {
        // For weekly workouts, use blocks as daily_workouts
        let dailyWorkouts: any = {};
        
        if (workout.blocks) {
          // Parse blocks if it's a string
          let blocks: any = workout.blocks;
          if (typeof blocks === 'string') {
            try {
              blocks = JSON.parse(blocks);
            } catch (e) {
              console.error('Failed to parse workout blocks:', e);
              blocks = {};
            }
          }
          
          if (typeof blocks === 'object' && blocks !== null) {
            dailyWorkouts = blocks;
          }
        }

        exerciseBlock = {
          workout_name: customName || workout.name,
          description: workout.description || workout.notes || '',
          estimated_duration: workout.duration,
          location: workout.location,
          workout_type: workout.type || 'strength',
          daily_workouts: dailyWorkouts
        };
      } else {
        // For single workouts, use exercises directly
        exerciseBlock = {
          workout_name: customName || workout.name,
          description: workout.description || workout.notes || '',
          estimated_duration: workout.duration,
          location: workout.location,
          workout_type: workout.type || 'strength',
          exercises: workout.exercises || []
        };
      }

      // Calculate end date based on type
      const start = startDate || workout.date || new Date().toISOString().split('T')[0];
      let endDate = start;
      
      if (assignmentType === 'weekly') {
        endDate = new Date(new Date(start).getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      } else if (assignmentType === 'monthly') {
        endDate = new Date(new Date(start).getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      }

      // Calculate total exercises
      const totalExercises = this.calculateTotalExercises(exerciseBlock, assignmentType);

      // Create the assignment
      const newAssignmentData = {
        athlete_id: targetAthleteId,
        assignment_type: assignmentType,
        exercise_block: exerciseBlock,
        progress: {
          current_exercise_index: 0,
          current_set: 1,
          current_rep: 1,
          completed_exercises: [],
          total_exercises: totalExercises,
          completion_percentage: 0,
          total_time_seconds: 0,
          exercise_times: {},
        } as AssignmentProgress,
        start_date: start,
        end_date: endDate,
        assigned_at: new Date().toISOString(),
        assigned_by: assignedBy,
        status: 'assigned' as const,
        meta: {
          original_workout_id: workoutId,
          workout_type: assignmentType,
          estimated_duration: workout.duration,
          location: workout.location,
          duplicated_from_workout: true,
          duplicated_at: new Date().toISOString(),
          ...(customName && { custom_name: customName })
        }
      };

      const newAssignment = await this.createAssignment(newAssignmentData);
      
      return newAssignment;
    } catch (error) {
      console.error('AssignmentService.duplicateWorkoutAsAssignment error:', error);
      throw error;
    }
  }

  /**
   * Duplicate an assignment or workout as a new unassigned workout
   * Creates a new workout record in the workouts table
   */
  async duplicateAsWorkout(
    originalAssignmentId: string,
    customName?: string
  ): Promise<any> {
    try {
      // Get the original assignment
      const { data: assignment, error: assignmentError } = await this.client
        .from('unified_workout_assignments')
        .select('*')
        .eq('id', originalAssignmentId)
        .single();

      if (assignmentError) {
        console.error('Error fetching assignment:', assignmentError);
        throw assignmentError;
      }

      if (!assignment) {
        throw new Error(`Assignment ${originalAssignmentId} not found`);
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Convert assignment to workout format
      const exerciseBlock = assignment.exercise_block;
      
      // Check if the original was based on a template
      let originalWorkout = null;
      let isOriginalTemplate = false;
      
      if (assignment.meta?.original_workout_id) {
        try {
          const { data: original } = await this.client
            .from('workouts')
            .select('is_template')
            .eq('id', assignment.meta.original_workout_id)
            .single();
          
          if (original) {
            isOriginalTemplate = !!original.is_template;
          }
        } catch (error) {
          console.warn('Could not fetch original workout template status:', error);
        }
      }

      let workoutData: any = {
        name: customName || `${exerciseBlock.workout_name || 'Workout'} - Copy`,
        description: exerciseBlock.description || '',
        user_id: user.id,
        created_by: user.id,
        type: exerciseBlock.workout_type || 'strength',
        is_template: isOriginalTemplate, // Preserve template status from original
        is_draft: false,
        // No date/time for templates or unassigned workouts
        date: null,
        time: null,
        duration: exerciseBlock.estimated_duration || null,
        location: exerciseBlock.location || null
      };

      // Handle different assignment types
      if (assignment.assignment_type === 'single') {
        workoutData.template_type = 'single';
        
        // Ensure we have exercises data - try multiple sources
        let exercises = exerciseBlock.exercises || [];
        
        // If no exercises in the main field, try to extract from other sources
        if (!exercises || exercises.length === 0) {
          // Try to get from blocks if it's block-based
          if (exerciseBlock.is_block_based && exerciseBlock.blocks) {
            if (Array.isArray(exerciseBlock.blocks)) {
              exercises = exerciseBlock.blocks.flatMap((block: any) => block.exercises || []);
            }
          }
          
          // If still no exercises, try the original workout if available
          const originalWorkoutId = assignment.meta?.original_workout_id;
          if (originalWorkoutId && exercises.length === 0) {
            try {
              const { data: originalWorkout } = await this.client
                .from('workouts')
                .select('exercises, blocks, is_block_based')
                .eq('id', originalWorkoutId)
                .single();
                
              if (originalWorkout) {
                if (originalWorkout.exercises && originalWorkout.exercises.length > 0) {
                  exercises = originalWorkout.exercises;
                } else if (originalWorkout.is_block_based && originalWorkout.blocks) {
                  // Extract exercises from blocks
                  if (Array.isArray(originalWorkout.blocks)) {
                    exercises = originalWorkout.blocks.flatMap((block: any) => block.exercises || []);
                  }
                  workoutData.blocks = originalWorkout.blocks;
                  workoutData.is_block_based = true;
                  workoutData.block_version = 1;
                }
              }
            } catch (error) {
              console.warn('Could not fetch original workout for exercise data:', error);
            }
          }
        }
        
        workoutData.exercises = exercises;
        
        // Handle block-based workouts
        if (exerciseBlock.is_block_based && exerciseBlock.blocks) {
          workoutData.blocks = exerciseBlock.blocks;
          workoutData.is_block_based = true;
          workoutData.block_version = 1;
          // For block-based workouts, exercises can be empty as they're in blocks
          if (workoutData.blocks && Array.isArray(workoutData.blocks) && workoutData.blocks.length > 0) {
            workoutData.exercises = [];
          }
        }
      } else if (assignment.assignment_type === 'weekly') {
        workoutData.template_type = 'weekly';
        // Store daily workouts in exercises field (as the system expects)
        workoutData.exercises = exerciseBlock.daily_workouts || [];
      } else if (assignment.assignment_type === 'monthly') {
        workoutData.template_type = 'monthly';
        workoutData.exercises = exerciseBlock.monthly_plan || [];
      }

      console.log('Creating duplicated workout with data:', {
        name: workoutData.name,
        type: workoutData.type,
        template_type: workoutData.template_type,
        exerciseCount: workoutData.exercises?.length || 0,
        hasBlocks: !!workoutData.blocks,
        is_block_based: workoutData.is_block_based
      });

      // Create the workout using the api service
      const { api } = await import('./api');
      const createdWorkout = await api.workouts.create(workoutData);

      console.log('Successfully created duplicated workout:', {
        id: createdWorkout.id,
        name: createdWorkout.name,
        exerciseCount: createdWorkout.exercises?.length || 0,
        hasBlocks: !!createdWorkout.blocks
      });

      return createdWorkout;
    } catch (error) {
      console.error('AssignmentService.duplicateAsWorkout error:', error);
      throw error;
    }
  }

  /**
   * Duplicate a workout from the workouts table as a new unassigned workout
   */
  async duplicateWorkoutAsNewWorkout(
    workoutId: string,
    customName?: string
  ): Promise<any> {
    try {
      // Get the original workout
      const { data: workout, error: workoutError } = await this.client
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();

      if (workoutError) {
        console.error('Error fetching workout:', workoutError);
        throw workoutError;
      }

      if (!workout) {
        throw new Error(`Workout ${workoutId} not found`);
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create new workout data - preserve template status from original
      const newWorkoutData = {
        ...workout,
        id: undefined, // Remove ID so a new one is generated
        name: customName || `${workout.name} - Copy`,
        user_id: user.id,
        created_by: user.id,
        created_at: undefined, // Will be set by database
        updated_at: undefined, // Will be set by database
        is_template: !!workout.is_template, // Preserve template status from original
        is_draft: false,
        // No date/time for templates or unassigned workouts
        date: null,
        time: null
      };

      // Create the workout using the api service
      const { api } = await import('./api');
      const createdWorkout = await api.workouts.create(newWorkoutData);

      return createdWorkout;
    } catch (error) {
      console.error('AssignmentService.duplicateWorkoutAsNewWorkout error:', error);
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
        return (Object.values(dailyWorkouts) as any[]).reduce((total: number, dayBlocks: any) => {
          if (Array.isArray(dayBlocks)) {
            // Each day contains an array of blocks, each block has exercises
            return total + dayBlocks.reduce((dayTotal: number, block: any) => {
              return dayTotal + (block.exercises?.length || 0);
            }, 0);
          }
          return total;
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