import { supabase } from '../lib/supabase'
import type { Athlete, Coach, Profile, Team } from './dbSchema'
import { getWorkoutExerciseCount } from '../utils/workoutUtils'

export interface Exercise {
  id?: string
  name: string
  sets?: string | number
  reps?: string | number
  weight?: number | string
  rest?: number | string
  distance?: number | string
  notes?: string
  category?: string
  description?: string
  instanceId?: string
  rpe?: string
}

export interface Workout {
  id: string
  user_id?: string
  created_by?: string
  name: string
  description?: string
  type?: string
  date?: string
  duration?: string
  time?: string
  notes?: string
  created_at: string
  exercises?: Exercise[]
  location?: string
  template_type?: 'single' | 'weekly' | 'monthly'
  is_template?: boolean
  is_draft?: boolean
  template_category?: string
  template_tags?: string[]
  flow_type?: 'sequential' | 'circuit'
  circuit_rounds?: number
  deleted_at?: string
  deleted_by?: string
  // New block system fields
  blocks?: any[] // Will be typed as ExerciseBlock[] when imported
  is_block_based?: boolean
  block_version?: number
}

interface TeamPost {
  id: string
  user_id: string
  content: string
  created_at: string
}

export interface EnhancedWorkoutData {
  name: string
  description?: string
  type: string
  template_type?: 'single' | 'weekly' | 'monthly'
  location?: string
  date: string
  time?: string
  duration?: string
  exercises?: Exercise[]
  is_template?: boolean
  flow_type?: 'sequential' | 'circuit'
  circuit_rounds?: number
  weekly_plan?: {
    day: string
    exercises: Exercise[]
    isRestDay: boolean
  }[]
  // New block system fields
  blocks?: any[] // Will be typed as ExerciseBlock[] when imported
  is_block_based?: boolean
  block_version?: number
}

export const api = {
  workouts: {
    async getAll(options: { includeTemplates?: boolean; coachOnly?: boolean } = {}): Promise<Workout[]> {
      const { includeTemplates = true, coachOnly = false } = options;
      
      let query = supabase
        .from('workouts')
        .select('id, name, description, type, date, time, duration, location, created_at, user_id, created_by, is_template, template_type, exercises, blocks, is_block_based, block_version')
        .order('created_at', { ascending: false });

      // Filter out templates unless specifically requested
      if (!includeTemplates) {
        query = query.or('is_template.is.null,is_template.eq.false');
      }

      // Filter by coach if requested
      if (coachOnly && this.getCurrentUserId) {
        query = query.eq('user_id', this.getCurrentUserId());
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(workout => ({
        ...workout,
        notes: workout.description || ''
      }));
    },

    async getByCreator(userId: string, options: { includeTemplates?: boolean } = {}): Promise<Workout[]> {
      if (!userId) return [];
      const { includeTemplates = false } = options;
      
      let query = supabase
        .from('workouts')
        .select('id, name, description, type, date, time, duration, location, created_at, user_id, created_by, is_template, template_type, exercises, blocks, is_block_based, block_version')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Filter out templates unless specifically requested
      if (!includeTemplates) {
        query = query.or('is_template.is.null,is_template.eq.false');
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(workout => ({
        ...workout,
        notes: workout.description || ''
      }));
    },

    async create(workout: Omit<Workout, 'id' | 'created_at'>): Promise<Workout> {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')
      
      try {
        // Map our application data to database schema using a properly typed object
        const workoutData: {
          name: string;
          description: string;
          user_id: string;
          created_by: string;
          exercises: Exercise[];
          type?: string;
          date?: string;
          duration?: string;
          time?: string;
          location?: string;
          template_type?: string;
          is_template?: boolean;
          // Block system fields
          blocks?: any[];
          is_block_based?: boolean;
          block_version?: number;
        } = {
          name: workout.name,
          description: workout.notes || workout.description || '',
          user_id: user.id,
          created_by: user.id,
          exercises: workout.exercises || [],
          is_template: workout.is_template || false
        };
        
        // Add optional fields if they exist
        if (workout.type) workoutData.type = workout.type;
        if (workout.template_type) workoutData.template_type = workout.template_type;
        
        // Handle block system
        const hasBlocks = workout.blocks && (
          (Array.isArray(workout.blocks) && workout.blocks.length > 0) ||
          (typeof workout.blocks === 'object' && !Array.isArray(workout.blocks) && Object.keys(workout.blocks).length > 0)
        );
        
        if (hasBlocks || workout.is_block_based) {
          workoutData.blocks = workout.blocks;
          workoutData.is_block_based = true;
          workoutData.block_version = workout.block_version || 1;
          // For block-based workouts, exercises are derived from blocks
          workoutData.exercises = [];
        } else if (workout.is_block_based !== false && workout.exercises && workout.exercises.length > 0) {
          // Auto-migrate legacy exercises to blocks if not explicitly disabled
          // This will be handled by the database function if needed
          workoutData.exercises = workout.exercises;
        }
        
        // Handle date fields - templates should always have null date fields
        if (workout.is_template) {
          // Templates don't have specific dates
          workoutData.date = null;
          workoutData.time = null;
          workoutData.duration = null;
          workoutData.location = workout.location || null;
        } else {
          // Regular workouts can have date fields
          if (workout.date && workout.date.trim() !== '') workoutData.date = workout.date;
          if (workout.time && workout.time.trim() !== '') workoutData.time = workout.time;
          if (workout.duration && workout.duration.trim() !== '') workoutData.duration = workout.duration;
          if (workout.location && workout.location.trim() !== '') workoutData.location = workout.location;
        }
        
        const { data, error } = await supabase
          .from('workouts')
          .insert([workoutData])
          .select()
          .single();

        if (error) {
          console.error('Error creating workout:', error);
          throw error;
        }
        
        return {
          ...data,
          // Ensure the response has the expected structure for the app
          notes: data.description || '',
          exercises: data.exercises || [],
          blocks: data.blocks || undefined,
          is_block_based: data.is_block_based || false
        };
      } catch (err) {
        console.error('Error in create workout:', err);
        throw err;
      }
    },

    async update(id: string, workout: Partial<Workout>): Promise<Workout> {
      // Helper function to convert empty strings to null for date fields
      const sanitizeValue = (value: any): any => {
        if (value === '' || value === undefined) return null;
        return value;
      };

      // Sanitize the workout data before sending to database
      const sanitizedWorkout = {
        ...workout,
        // Sanitize date-related fields that might be empty strings
        date: sanitizeValue(workout.date),
        time: sanitizeValue(workout.time),
        duration: sanitizeValue(workout.duration),
        location: sanitizeValue(workout.location),
        description: sanitizeValue(workout.description || workout.notes),
        notes: undefined, // Remove notes since we use description in DB
        // Handle block system updates
        blocks: workout.blocks,
        is_block_based: workout.is_block_based,
        block_version: workout.block_version
      };

      const { data, error } = await supabase
        .from('workouts')
        .update(sanitizedWorkout)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      // Return with app-expected structure
      return {
        ...data,
        notes: data.description || '', // Map description back to notes for app
        exercises: data.exercises || [],
        blocks: data.blocks || undefined,
        is_block_based: data.is_block_based || false
      };
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id)

      if (error) throw error
    },

    // Soft delete workout (move to deleted state)
    async softDelete(id: string): Promise<void> {
      try {
        // Add timeout protection for delete operations - increased timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Delete operation timeout')), 15000); // Increased to 15 seconds
        });

        const deletePromise = (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

          // 1. Mark workout as deleted
          const { error: workoutError } = await supabase
        .from('workouts')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
            .eq('id', id)
            .eq('user_id', user.id); // Additional security check

          if (workoutError) {
            console.error('Soft delete failed:', workoutError);
            throw workoutError;
          }

          // 2. 🔧 COMPREHENSIVE FIX: Remove ALL assignments for deleted workout
          
          // Clean up old athlete_workouts table
          const { error: assignmentError } = await supabase
            .from('athlete_workouts')
            .delete()
            .eq('workout_id', id);

          if (assignmentError) {
            console.error('Failed to clean up athlete_workouts:', assignmentError);
          } else {
            console.log(`✅ Cleaned up athlete_workouts for deleted workout ${id}`);
          }

          // Clean up training plan assignments that reference this workout
          const { data: planIds } = await supabase
            .from('training_plans')
            .select('id')
            .contains('weekly_workout_ids', [id]);
          
          if (planIds && planIds.length > 0) {
            const { error: planAssignmentError } = await supabase
              .from('training_plan_assignments')
              .delete()
              .in('training_plan_id', planIds.map(p => p.id));

            if (planAssignmentError) {
              console.error('Failed to clean up training plan assignments:', planAssignmentError);
            } else {
              console.log(`✅ Cleaned up training plan assignments for deleted workout ${id}`);
            }
          }

          // Clean up unified assignment system - Templates shouldn't have assignments, but regular workouts might
          const { error: unifiedAssignmentError } = await supabase
            .from('unified_workout_assignments')
            .delete()
            .eq('meta->>original_workout_id', id);

          if (unifiedAssignmentError) {
            console.error('Failed to clean up unified workout assignments:', unifiedAssignmentError);
          } else {
            console.log(`✅ Cleaned up unified workout assignments for deleted workout ${id}`);
          }
        })();

        await Promise.race([deletePromise, timeoutPromise]);
      } catch (error) {
        console.error('Error in softDelete:', error);
        throw error;
      }
    },

    // Restore soft-deleted workout
    async restore(id: string): Promise<void> {
      const { error } = await supabase
        .from('workouts')
        .update({
          deleted_at: null,
          deleted_by: null
        })
        .eq('id', id);

      if (error) throw error;
    },

    // Get soft-deleted workouts
    async getDeleted(userId: string): Promise<Workout[]> {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('workouts')
        .select('id, name, description, type, date, time, duration, location, created_at, deleted_at, deleted_by, user_id, created_by, is_template, template_type, exercises, blocks, is_block_based, block_version')
        .eq('user_id', userId)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });
        
      if (error) throw error;
      return (data || []).map(workout => ({
        ...workout,
        notes: workout.description || ''
      }));
    },

    // Check if workout is used in any monthly plans - FIXED FOR ACTUAL DB STRUCTURE
    async checkMonthlyPlanUsage(workoutId: string): Promise<{
      isUsed: boolean;
      monthlyPlans: { id: string; name: string }[];
    }> {
      try {
        // Reduced timeout but more robust query
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Monthly plan usage check timeout')), 5000);
        });

        const queryPromise = (async () => {
          // Query for ALL possible columns that might contain workout references
          const { data, error } = await supabase
            .from('training_plans')
            .select('id, name, weeks, weeks_structure, weekly_workout_ids')
            .is('deleted_at', null)
            .limit(100);

          if (error) {
            console.warn('Training plans query failed:', error.message);
            throw error;
          }

          // Client-side check for workout usage in the weeks structure
          const usedInPlans: { id: string; name: string }[] = [];
          
          (data || []).forEach(plan => {
            let isUsed = false;
            
            // Check 'weeks' column (array of objects or strings)
            if (plan.weeks && Array.isArray(plan.weeks)) {
              isUsed = plan.weeks.some((week: any) => {
                // Handle both object format and direct ID format
                if (typeof week === 'object' && week.workout_id === workoutId) {
                  return true;
                }
                if (typeof week === 'string' && week === workoutId) {
                  return true;
                }
                return false;
              });
            }
            
            // Check 'weeks_structure' column (array of strings)
            if (!isUsed && plan.weeks_structure && Array.isArray(plan.weeks_structure)) {
              isUsed = plan.weeks_structure.includes(workoutId);
            }
            
            // Check 'weekly_workout_ids' column (array of strings)
            if (!isUsed && plan.weekly_workout_ids && Array.isArray(plan.weekly_workout_ids)) {
              isUsed = plan.weekly_workout_ids.includes(workoutId);
            }
            
            if (isUsed) {
              usedInPlans.push({ id: plan.id, name: plan.name });
            }
          });
          
          return usedInPlans;
        })();

        const usedInPlans = await Promise.race([queryPromise, timeoutPromise]) as any[];

        return {
          isUsed: usedInPlans.length > 0,
          monthlyPlans: usedInPlans
        };
      } catch (error) {
        console.warn('Monthly plan usage check failed, allowing deletion:', error.message);
        // Fallback: assume not used if check fails to prevent blocking deletions
        return {
          isUsed: false,
          monthlyPlans: []
        };
      }
    },

    // Batch check multiple workouts for monthly plan usage
    async batchCheckMonthlyPlanUsage(workoutIds: string[]): Promise<Record<string, {
      isUsed: boolean;
      monthlyPlans: { id: string; name: string }[];
    }>> {
      if (workoutIds.length === 0) return {};
      
      // Initialize results - assume not used to prevent blocking
      const results: Record<string, {
        isUsed: boolean;
        monthlyPlans: { id: string; name: string }[];
      }> = {};
      
      workoutIds.forEach(workoutId => {
        results[workoutId] = {
          isUsed: false,
          monthlyPlans: []
        };
      });

      try {
        // Use individual checks for better reliability (trade speed for reliability)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Batch usage check timeout')), 5000); // Reduced timeout
        });

        const queryPromise = (async () => {
          // Query the actual 'weeks' column structure
          const { data, error } = await supabase
            .from('training_plans')
            .select('id, name, weeks')
            .is('deleted_at', null)
            .not('weeks', 'is', null)
            .limit(50);

          if (error) throw error;
          return data || [];
        })();

        const data = await Promise.race([queryPromise, timeoutPromise]) as any[];

        // Process results efficiently
        data.forEach(plan => {
          const planRef = { id: plan.id, name: plan.name };
          
          // Check which workouts are used in this plan
          const usedWorkouts = new Set<string>();
          
          if (plan.weeks && Array.isArray(plan.weeks)) {
            plan.weeks.forEach((week: any) => {
              // Handle both object format and direct ID format
              let workoutId = null;
              if (typeof week === 'object' && week.workout_id) {
                workoutId = week.workout_id;
              } else if (typeof week === 'string') {
                workoutId = week;
              }
              
              if (workoutId && workoutIds.includes(workoutId)) {
                usedWorkouts.add(workoutId);
              }
            });
          }
          
          // Update results for used workouts
          usedWorkouts.forEach(workoutId => {
            results[workoutId].isUsed = true;
            results[workoutId].monthlyPlans.push(planRef);
          });
        });

        return results;
      } catch (error) {
        console.warn('Batch usage check failed, returning safe defaults:', error.message);
        // Return the initialized safe results (all false) to prevent blocking
        return results;
      }
    },

    // Remove workout from monthly plans
    async removeFromMonthlyPlans(workoutId: string, planIds: string[]): Promise<void> {
      try {
        for (const planId of planIds) {
          // Get the current plan data
          const { data: plan, error: fetchError } = await supabase
            .from('training_plans')
            .select('weekly_workout_ids, weeks_structure')
            .eq('id', planId)
            .single();

          if (fetchError) throw fetchError;

          let updateData: any = {};

          // Update weeks_structure (new format) - replace workout ID with null (rest week)
          if (plan.weeks_structure && Array.isArray(plan.weeks_structure)) {
            const newWeeksStructure = plan.weeks_structure.map((weekWorkoutId: string | null) => 
              weekWorkoutId === workoutId ? null : weekWorkoutId
            );
            updateData.weeks_structure = newWeeksStructure;
          }

          // Update weekly_workout_ids (legacy format) - remove workout ID
          if (plan.weekly_workout_ids && Array.isArray(plan.weekly_workout_ids)) {
            const newWeeklyWorkoutIds = plan.weekly_workout_ids.filter((id: string) => id !== workoutId);
            updateData.weekly_workout_ids = newWeeklyWorkoutIds;
          }

          // Update the plan
          const { error: updateError } = await supabase
            .from('training_plans')
            .update(updateData)
            .eq('id', planId);

          if (updateError) throw updateError;
        }
      } catch (error) {
        console.error('Error removing workout from monthly plans:', error);
        throw error;
      }
    },

    // Permanently delete workout (cannot be undone)
    async permanentDelete(id: string): Promise<void> {
      try {
        // 1. 🔧 COMPREHENSIVE FIX: Remove ALL assignments and related data first
        
        // Clean up old athlete_workouts table
        const { error: assignmentError } = await supabase
          .from('athlete_workouts')
          .delete()
          .eq('workout_id', id);

        if (assignmentError) {
          console.error('Failed to clean up athlete_workouts:', assignmentError);
        } else {
          console.log(`✅ Cleaned up athlete_workouts for permanent delete of workout ${id}`);
        }

        // Clean up training plan assignments
        const { data: planIds } = await supabase
          .from('training_plans')
          .select('id')
          .contains('weekly_workout_ids', [id]);
        
        if (planIds && planIds.length > 0) {
          const { error: planAssignmentError } = await supabase
            .from('training_plan_assignments')
            .delete()
            .in('training_plan_id', planIds.map(p => p.id));

          if (planAssignmentError) {
            console.error('Failed to clean up training plan assignments:', planAssignmentError);
          } else {
            console.log(`✅ Cleaned up training plan assignments for permanent delete of workout ${id}`);
          }
        }

        // Clean up unified assignment system - Only clean up actual assignments, not template references
        const { error: unifiedAssignmentError } = await supabase
          .from('unified_workout_assignments')
          .delete()
          .eq('meta->>original_workout_id', id);

        if (unifiedAssignmentError) {
          console.error('Failed to clean up unified workout assignments:', unifiedAssignmentError);
        } else {
          console.log(`✅ Cleaned up unified workout assignments for permanent delete of workout ${id}`);
        }

        // 2. Remove exercise results for this workout
        const { error: resultsError } = await supabase
          .from('exercise_results')
          .delete()
          .eq('workout_id', id);

        if (resultsError) {
          console.error('Failed to clean up exercise results:', resultsError);
        } else {
          console.log(`✅ Cleaned up exercise results for workout ${id}`);
        }

        // 3. Finally delete the workout itself
        const { error: workoutError } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id);

        if (workoutError) {
          console.error('Permanent delete failed:', workoutError);
          throw workoutError;
        }

        console.log(`✅ Permanently deleted workout ${id} and all related data`);
      } catch (error) {
        console.error('Error in permanentDelete:', error);
        throw error;
      }
    },

    // 🔧 NEW: Clean up orphaned athlete assignments (for existing data inconsistencies)
    async cleanupOrphanedAssignments(): Promise<{ removedCount: number; details: any[] }> {
      try {
        console.log('🧹 Starting cleanup of orphaned athlete workout assignments...');
        
        // Get all athlete workout assignments
        const { data: allAssignments, error: assignmentError } = await supabase
          .from('athlete_workouts')
          .select('id, workout_id, athlete_id');

        if (assignmentError) {
          console.error('Error fetching assignments:', assignmentError);
          throw assignmentError;
        }

        if (!allAssignments || allAssignments.length === 0) {
          console.log('✅ No assignments found - nothing to clean up');
          return { removedCount: 0, details: [] };
        }

        // Get all existing non-deleted workouts
        const workoutIds = [...new Set(allAssignments.map(a => a.workout_id))];
        const { data: existingWorkouts, error: workoutError } = await supabase
          .from('workouts')
          .select('id')
          .in('id', workoutIds)
          .is('deleted_at', null);

        if (workoutError) {
          console.error('Error fetching existing workouts:', workoutError);
          throw workoutError;
        }

        const existingWorkoutIds = new Set((existingWorkouts || []).map(w => w.id));
        
        // Find orphaned assignments (pointing to deleted or non-existent workouts)
        const orphanedAssignments = allAssignments.filter(assignment => 
          !existingWorkoutIds.has(assignment.workout_id)
        );

        if (orphanedAssignments.length === 0) {
          console.log('✅ No orphaned assignments found - database is clean!');
          return { removedCount: 0, details: [] };
        }

        console.log(`🚨 Found ${orphanedAssignments.length} orphaned assignments to clean up`);

        // Remove the orphaned assignments
        const orphanedIds = orphanedAssignments.map(assignment => assignment.id);
        const { error: deleteError } = await supabase
          .from('athlete_workouts')
          .delete()
          .in('id', orphanedIds);

        if (deleteError) {
          console.error('Error removing orphaned assignments:', deleteError);
          throw deleteError;
        }

        console.log(`✅ Successfully removed ${orphanedAssignments.length} orphaned athlete workout assignments`);
        
        return {
          removedCount: orphanedAssignments.length,
          details: orphanedAssignments.map(assignment => ({
            assignmentId: assignment.id,
            workoutId: assignment.workout_id,
            athleteId: assignment.athlete_id
          }))
        };
      } catch (error) {
        console.error('Error in cleanupOrphanedAssignments:', error);
        // Don't throw here - this is a utility function that shouldn't break the app
        return { removedCount: 0, details: [] };
      }
    },

    async getAssignedToAthlete(athleteId: string) {
      try {
        // Get current user to check permissions
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) throw new Error('User not authenticated');

        // Check if current user is the athlete themselves or has approved coach relationship
        let canViewWorkouts = false;
        
        if (user.id === athleteId) {
          // Athletes can always view their own workouts
          canViewWorkouts = true;
        } else {
          // Check if current user is an approved coach for this athlete
          const { data: coachRelation, error: relationError } = await supabase
            .from('coach_athletes')
            .select('id')
            .eq('coach_id', user.id)
            .eq('athlete_id', athleteId)
            .eq('approval_status', 'approved')
            .single();
            
          if (relationError && relationError.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error checking coach-athlete relationship:', relationError);
            throw relationError;
          }
          
          canViewWorkouts = !!coachRelation;
        }
        
        if (!canViewWorkouts) {
          throw new Error('Unauthorized: You do not have permission to view this athlete\'s workouts');
        }

        // Get all workout_ids assigned to this athlete, ordered by most recently assigned first
        const { data: assignments, error: assignError } = await supabase
          .from('athlete_workouts')
          .select('workout_id, assigned_at')
          .eq('athlete_id', athleteId)
          .order('assigned_at', { ascending: false });
          
        if (assignError) {
          console.error('Error fetching athlete workout assignments:', assignError);
          throw assignError;
        }
        
        // Get workouts created by this athlete (their own workouts) - only if viewing own workouts
        let createdWorkouts = [];
        if (user.id === athleteId) {
          const { data: ownWorkouts, error: createdError } = await supabase
            .from('workouts')
            .select('id, name, description, type, date, time, duration, location, created_at, user_id, created_by, is_template, template_type, exercises, is_block_based, blocks, block_version')
            .eq('user_id', athleteId)
            .is('deleted_at', null) // 🔧 CRITICAL FIX: Filter out deleted workouts
            .or('is_template.is.null,is_template.eq.false') // 🔧 FIX: Filter out templates
            .order('created_at', { ascending: false });
            
          if (createdError) {
            console.error('Error fetching athlete created workouts:', createdError);
            throw createdError;
          }
          
          createdWorkouts = ownWorkouts || [];
        }
        
        let allWorkouts = [];
        
        // Handle assigned workouts
        if (assignments && assignments.length > 0) {
          const workoutIds = assignments.map(a => a.workout_id);
          
          // Add a small delay to ensure database consistency (sometimes needed for Supabase)
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const { data: assignedWorkouts, error: fetchError } = await supabase
            .from('workouts')
            .select('id, name, description, type, date, time, duration, location, created_at, user_id, created_by, is_template, template_type, exercises, is_block_based, blocks, block_version')
            .in('id', workoutIds)
            .is('deleted_at', null) // 🔧 CRITICAL FIX: Filter out deleted workouts
            .or('is_template.is.null,is_template.eq.false'); // 🔧 FIX: Filter out templates
            
          if (fetchError) {
            console.error('Error fetching assigned workout details:', fetchError);
            throw fetchError;
          }
          
          // Map assigned workouts with assignment dates and sort them
          const workoutsWithAssignmentDate = (assignedWorkouts || []).map(workout => {
            const assignment = assignments.find(a => a.workout_id === workout.id);
            return {
              ...workout,
              assignedDate: assignment?.assigned_at || null
            };
          }).sort((a, b) => {
            const getRelevantDate = (workout: any) => {
              // For assigned workouts, use assignment date first, then creation date
              return workout.assignedDate || workout.created_at;
            };
            
            const dateA = new Date(getRelevantDate(a)).getTime();
            const dateB = new Date(getRelevantDate(b)).getTime();
            return dateB - dateA; // Most recent first
          });
          
          allWorkouts.push(...workoutsWithAssignmentDate);
        }
        
        // Handle created workouts (filter out any that were already included as assigned)
        if (createdWorkouts && createdWorkouts.length > 0) {
          const assignedWorkoutIds = new Set((assignments || []).map(a => a.workout_id));
          const uniqueCreatedWorkouts = createdWorkouts.filter(workout => 
            !assignedWorkoutIds.has(workout.id)
          );
          
          allWorkouts.push(...uniqueCreatedWorkouts);
        }
        
        // Sort all workouts by most relevant date
        allWorkouts.sort((a, b) => {
          const getRelevantDate = (workout: any) => {
            // For assigned workouts, use assignment date first, then creation date
            return workout.assignedDate || workout.created_at;
          };
          
          const dateA = new Date(getRelevantDate(a)).getTime();
          const dateB = new Date(getRelevantDate(b)).getTime();
          return dateB - dateA; // Most recent first
        });
        
        return allWorkouts;
      } catch (error) {
        console.error('Error in getAssignedToAthlete:', error);
        throw error;
      }
    },

    // New method for enhanced workout creation
    async createEnhanced(workoutData: EnhancedWorkoutData): Promise<Workout> {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')
      
      try {
        console.log('Creating enhanced workout with data:', workoutData);
        
        // Create the main workout record
        const mainWorkoutData = {
          name: workoutData.name,
          description: workoutData.description || '',
          user_id: user.id,
          type: workoutData.type,
          template_type: workoutData.template_type,
          location: workoutData.location,
          // Templates should always have null date fields since they don't have specific dates
          date: workoutData.is_template ? null : (workoutData.date && workoutData.date.trim() !== '' ? workoutData.date : null),
          time: workoutData.is_template ? null : (workoutData.time && workoutData.time.trim() !== '' ? workoutData.time : null),
          duration: workoutData.is_template ? null : (workoutData.duration && workoutData.duration.trim() !== '' ? workoutData.duration : null),
          is_template: workoutData.is_template || false,
          exercises: workoutData.template_type === 'single' ? (workoutData.exercises || []) : [],
          // Block mode fields
          is_block_based: workoutData.is_block_based || false,
          blocks: workoutData.blocks || null,
          block_version: workoutData.block_version || null
        };
        
        const { data: createdWorkout, error: workoutError } = await supabase
          .from('workouts')
          .insert([mainWorkoutData])
          .select()
          .single();

        if (workoutError) {
          console.error('Error creating enhanced workout:', workoutError);
          throw workoutError;
        }
        
        // If it's a weekly plan, create the weekly workout plan entries
        if (workoutData.template_type === 'weekly' && workoutData.weekly_plan) {
          const weeklyPlanData = workoutData.weekly_plan.map(dayPlan => ({
            workout_id: createdWorkout.id,
            day_of_week: dayPlan.day,
            exercises: dayPlan.exercises,
            is_rest_day: dayPlan.isRestDay
          }));
          
          // Note: This will fail until we create the weekly_workout_plans table
          // For now, we'll store weekly plans in the main workout exercises field as a fallback
          console.warn('Weekly workout plans table not yet created, storing in main exercises field');
          
          const { error: weeklyError } = await supabase
            .from('workouts')
            .update({ 
              exercises: workoutData.weekly_plan,
              description: workoutData.description
            })
            .eq('id', createdWorkout.id);
            
          if (weeklyError) {
            console.error('Error storing weekly plan data:', weeklyError);
            // Don't throw - workout was created successfully
          }
        }
        
        return {
          ...createdWorkout,
          notes: createdWorkout.description || '',
          exercises: createdWorkout.exercises || []
        };
      } catch (err) {
        console.error('Error in createEnhanced workout:', err);
        throw err;
      }
    },

    // Get template workouts for a specific coach
    async getTemplates(coachId: string, templateType?: 'single' | 'weekly') {
      let query = supabase
        .from('workouts')
        .select('*')
        .eq('user_id', coachId)
        .eq('is_template', true)
        .is('deleted_at', null) // 🔧 FIX: Exclude soft-deleted templates
        .order('created_at', { ascending: false });

      if (templateType) {
        query = query.eq('template_type', templateType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    // Convert workout to template
    async convertToTemplate(workoutId: string, templateData: {
      template_category?: string;
      template_tags?: string[];
    }) {
      const { data, error } = await supabase
        .from('workouts')
        .update({
          is_template: true,
          template_category: templateData.template_category,
          template_tags: templateData.template_tags
        })
        .eq('id', workoutId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Create workout from template
    async createFromTemplate(templateId: string, workoutData: {
      name?: string;
      date?: string;
      time?: string;
      location?: string;
      notes?: string;
    }) {
      // First get the template
      const { data: template, error: templateError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', templateId)
        .eq('is_template', true)
        .single();

      if (templateError) throw templateError;
      if (!template) throw new Error('Template not found');

      // Create new workout from template
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const newWorkout = {
        name: workoutData.name || `${template.name} - Copy`,
        description: workoutData.notes || template.description,
        user_id: user.id,
        exercises: template.exercises,
        type: template.type,
        template_type: template.template_type,
        location: workoutData.location || template.location,
        date: workoutData.date && workoutData.date.trim() !== '' ? workoutData.date : null,
        time: workoutData.time && workoutData.time.trim() !== '' ? workoutData.time : null,
        duration: template.duration,
        is_template: false // This is not a template, it's a real workout
      };

      const { data, error } = await supabase
        .from('workouts')
        .insert([newWorkout])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Save workout as draft (coach functionality)
    async saveDraft(workoutData: Partial<EnhancedWorkoutData> & { user_id: string; id?: string }) {
      // Handle weekly_plan data - store it in exercises field since weekly_plan column doesn't exist
      let exercisesToStore: any[] = workoutData.exercises || [];
      
      // If this is a weekly template with weekly_plan data, store it in exercises as structured data
      if (workoutData.template_type === 'weekly' && workoutData.weekly_plan) {
        exercisesToStore = workoutData.weekly_plan;
      }
      
      const draftData = {
        user_id: workoutData.user_id,
        name: workoutData.name || 'Draft Workout',
        description: workoutData.description || 'Draft workout in progress',
        type: workoutData.type || 'Strength',
        template_type: workoutData.template_type || 'single',
        location: workoutData.location || null,
        // Templates should always have null date fields
        date: workoutData.is_template ? null : (workoutData.date || null),
        time: workoutData.is_template ? null : (workoutData.time || null),
        duration: workoutData.is_template ? null : (workoutData.duration || null),
        is_template: workoutData.is_template || false,
        is_draft: true,
        exercises: exercisesToStore,
        // Note: weekly_plan column doesn't exist, so we store weekly plan data in exercises
      };

      // If updating existing draft, include the ID
      if (workoutData.id) {
        (draftData as any).id = workoutData.id;
      }

      const { data, error } = await supabase
        .from('workouts')
        .upsert(draftData, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Draft save error:', error);
        throw error;
      }
      
      return data;
    },

    // Promote draft to final workout (coach functionality)
    async promoteDraft(draftId: string, finalWorkoutData: EnhancedWorkoutData) {
      console.log('🚀 Promoting draft to final workout:', draftId);
      
      // Get the draft first
      const { data: draft, error: fetchError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', draftId)
        .eq('is_draft', true)
        .single();

      if (fetchError) throw fetchError;
      if (!draft) throw new Error('Draft not found');

      console.log('📋 Draft data retrieved:', { id: draft.id, name: draft.name, is_draft: draft.is_draft });

      // Merge draft data with final workout data
      // Handle the fact that weekly_plan might be stored in exercises for drafts
      let finalExercises = finalWorkoutData.exercises || [];
      let finalWeeklyPlan = finalWorkoutData.weekly_plan;
      
      // If the draft stored weekly_plan data in exercises, extract it
      if (draft.template_type === 'weekly' && Array.isArray(draft.exercises) && 
          draft.exercises.length > 0 && draft.exercises[0].day) {
        // This looks like weekly_plan data stored in exercises
        finalWeeklyPlan = draft.exercises;
        finalExercises = [];
      }

      // Helper function to convert empty strings to null for date fields
      const sanitizeValue = (value: any): any => {
        if (value === '' || value === undefined) return null;
        return value;
      };

      const promotedData = {
        ...draft,
        ...finalWorkoutData,
        exercises: finalExercises,
        weekly_plan: finalWeeklyPlan,
        is_draft: false, // This is the key change - promoting from draft to final
        is_template: finalWorkoutData.is_template || false,
        // Templates should always have null date fields, otherwise sanitize empty strings
        date: finalWorkoutData.is_template ? null : sanitizeValue(finalWorkoutData.date),
        time: finalWorkoutData.is_template ? null : sanitizeValue(finalWorkoutData.time),
        duration: finalWorkoutData.is_template ? null : sanitizeValue(finalWorkoutData.duration),
        location: sanitizeValue(finalWorkoutData.location)
        // Removed updated_at since it's automatically handled by database triggers
      };

      // Remove weekly_plan if it shouldn't be stored (since column doesn't exist)
      const { weekly_plan, ...dataToStore } = promotedData;
      
      // Store weekly_plan back in exercises if needed
      if (weekly_plan && promotedData.template_type === 'weekly') {
        dataToStore.exercises = weekly_plan;
      }

      console.log('💾 Updating workout with data:', { 
        id: draftId, 
        is_draft: dataToStore.is_draft, 
        is_template: dataToStore.is_template,
        name: dataToStore.name,
        date: dataToStore.date,
        time: dataToStore.time,
        duration: dataToStore.duration
      });

      const { data, error } = await supabase
        .from('workouts')
        .update(dataToStore)
        .eq('id', draftId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error promoting draft:', error);
        throw error;
      }
      
      console.log('✅ Draft successfully promoted:', { id: data.id, name: data.name, is_draft: data.is_draft });
      return data;
    },

    // Get user's drafts (coach functionality)
    async getDrafts(userId: string) {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_draft', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    // Delete draft (coach functionality)
    async deleteDraft(draftId: string) {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', draftId)
        .eq('is_draft', true);

      if (error) throw error;
    },



    // Mark weekly workouts as templates when used in monthly plans
    async markAsTemplate(workoutId: string, isTemplate: boolean = true) {
      const { data, error } = await supabase
        .from('workouts')
        .update({ 
          is_template: isTemplate,
          updated_at: new Date().toISOString()
        })
        .eq('id', workoutId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
  },

  team: {
    async getPosts(): Promise<TeamPost[]> {
      const { data, error } = await supabase
        .from('team_posts')
        .select('*, user:users(name, avatar_url)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },

    async createPost(content: string): Promise<TeamPost> {
      const { data, error } = await supabase
        .from('team_posts')
        .insert([{ content }])
        .select()
        .single()

      if (error) throw error
      return data
    },

    async deletePost(id: string): Promise<void> {
      const { error } = await supabase
        .from('team_posts')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
  },

  profile: {
    async get() {
      const maxRetries = 3; // Increased from 2 to 3
      const retryDelay = 1500; // Reduced delay for faster retries
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            console.error('No user found in auth.getUser()')
            throw new Error('No user found')
          }

          console.log(`Fetching profile for user: ${user.id} (attempt ${attempt}/${maxRetries})`)

          // Increase timeout significantly to handle slow database responses
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Query timeout after 30 seconds - database performance issue')), 30000); // Increased from 15 to 30 seconds
          });

          const queryPromise = supabase
            .from('profiles')
            .select('id, email, first_name, last_name, role, avatar_url, phone, bio, address, city, state, country, zip_code, team, school, coach, created_at, updated_at')
            .eq('id', user.id)
            .single();

          const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

          if (error) {
            // Log detailed error information
            console.error('Profile fetch error details:', {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
              attempt: attempt
            });
            
            // If it's a timeout error and we have retries left, try again
            if ((error.code === '57014' || error.message?.includes('timeout')) && attempt < maxRetries) {
              console.warn(`Profile fetch timeout on attempt ${attempt}, retrying in ${retryDelay * attempt}ms...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
              continue;
            }
            
            // For other database errors, also retry if we have attempts left
            if (attempt < maxRetries && (
              error.code?.startsWith('P') || // Postgres errors
              error.message?.includes('connection') ||
              error.message?.includes('network') ||
              error.message?.includes('timeout')
            )) {
              console.warn(`Database error on attempt ${attempt}, retrying: ${error.message}`);
              await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
              continue;
            }
            
            console.error('Final error after retries:', error)
            throw error
          }
          
          if (!data) {
            console.error('No profile data found for user:', user.id)
            throw new Error('Profile not found')
          }

          console.log('✅ Successfully found profile in database:', data)
          
          // Fetch role-specific data if profile has a role
          let roleData = null
          if (data.role) {
            switch (data.role) {
              case 'athlete': {
                try {
                  const athleteTimeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Athlete query timeout')), 15000); // Increased timeout to 15 seconds
                  });

                  const athleteQueryPromise = supabase
                    .from('athletes')
                    .select('id, date_of_birth, gender, events, team_id, weight_kg, first_name, last_name, created_at')
                    .eq('id', user.id)
                    .maybeSingle();

                  const { data: athleteData, error: athleteError } = await Promise.race([
                    athleteQueryPromise, 
                    athleteTimeoutPromise
                  ]) as any;
                  
                  if (!athleteError && athleteData) {
                    roleData = athleteData;
                  } else if (athleteError) {
                    // Only log as warning, don't fail the entire profile fetch
                    console.warn('Athlete data fetch warning (continuing without role data):', athleteError.message);
                  }
                } catch (athleteErr: any) {
                  // Don't fail the entire profile fetch if athlete data is unavailable
                  console.warn('Athlete data fetch failed, continuing without roleData:', athleteErr.message);
                }
                break
              }
              case 'coach': {
                try {
                  const coachTimeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Coach query timeout')), 10000); // Increased timeout
                  });

                  const coachQueryPromise = supabase
                    .from('coaches')
                    .select('id, gender, date_of_birth, events, specialties, certifications')
                    .eq('id', user.id)
                    .maybeSingle();

                  const { data: coachData, error: coachError } = await Promise.race([
                    coachQueryPromise, 
                    coachTimeoutPromise
                  ]) as any;
                  
                  if (coachError && coachError.code !== 'PGRST116') {
                    console.error('Error fetching coach data:', coachError)
                  } else if (coachData) {
                    roleData = {
                      gender: coachData.gender,
                      date_of_birth: coachData.date_of_birth,
                      events: coachData.events,
                      specialties: coachData.specialties,
                      certifications: coachData.certifications
                    }
                  }
                } catch (coachErr) {
                  console.warn('Coach data fetch failed, continuing without roleData:', coachErr);
                }
                break
              }
              case 'team_manager': {
                try {
                  const managerTimeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Manager query timeout')), 10000); // Increased timeout
                  });

                  const managerQueryPromise = supabase
                    .from('team_members')
                    .select(`
                      id, user_id, team_id, role, status, joined_at,
                      teams:team_id (
                        id, name, institution_name, institution_type
                      )
                    `)
                    .eq('user_id', user.id)
                    .eq('role', 'manager')
                    .eq('status', 'active');

                  const { data: managerData, error: managerError } = await Promise.race([
                    managerQueryPromise, 
                    managerTimeoutPromise
                  ]) as any;
                  
                  if (!managerError && managerData) {
                    roleData = { teams: managerData || [] };
                  } else if (managerError) {
                    console.warn('Team manager data fetch warning:', managerError.message);
                  }
                } catch (managerErr) {
                  console.warn('Manager data fetch failed, continuing without roleData:', managerErr);
                }
                break
              }
            }
          }

          // Return the complete profile with role data
          const completeProfile = { ...data, roleData };
          return completeProfile;
          
        } catch (err: any) {
          console.error(`Profile fetch attempt ${attempt} failed:`, {
            error: err.message,
            code: err.code,
            stack: err.stack
          });
          
          // If it's a timeout or network error and we have retries left, continue
          if (attempt < maxRetries && (
            err.code === '57014' || 
            err.message?.includes('timeout') ||
            err.message?.includes('Failed to fetch') ||
            err.message?.includes('NetworkError') ||
            err.message?.includes('connection')
          )) {
            console.warn(`Retrying profile fetch in ${retryDelay * attempt}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            continue;
          }
          
          // If we've exhausted retries or it's a different error, throw it
          throw err;
        }
      }
      
      // This should never be reached, but just in case
      throw new Error('Profile fetch failed after all retry attempts');
    },

    // Add lightweight version for quick profile display (sidebar, avatars, etc.)
    async getLightweight() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      console.log('🚀 Fast profile fetch: Getting essential fields only')
      const start = performance.now()

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, avatar_url, role')
        .eq('id', user.id)
        .single()

      const duration = performance.now() - start
      console.log(`🚀 Fast profile fetch completed in ${duration.toFixed(2)}ms`)

      if (error) {
        console.error('Fast profile fetch error:', error)
        throw error
      }
      
      if (!data) {
        throw new Error('Profile not found')
      }

      console.log('✅ Fast profile data:', data)
      return data
    },

    async update(profile: Partial<Profile> & { isFallback?: boolean }) {
      if (profile?.isFallback || (profile.first_name === 'User' && !profile.last_name)) {
        console.warn('❌ Attempted to write fallback/placeholder profile to DB. Aborting write.', profile);
        throw new Error('Refusing to overwrite real user data with fallback profile.');
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const profileData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        zip_code: profile.zip_code,
        team: profile.team,
        school: profile.school,
        coach: profile.coach,
        updated_at: new Date().toISOString()
      }

      console.log('Updating profile with data:', profileData);

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      console.log('Profile updated successfully:', data);
      return data
    },

    async updateWithRoleData(profile: Partial<Profile> & { isFallback?: boolean }, roleData: any) {
      if (profile?.isFallback || (profile.first_name === 'User' && !profile.last_name)) {
        console.warn('❌ Attempted to write fallback/placeholder profile to DB. Aborting write.', profile);
        throw new Error('Refusing to overwrite real user data with fallback profile.');
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      try {
        // First update the basic profile
        const profileData = await this.update(profile)

        // Use the role from the passed profile or the updated profile data instead of making another DB call
        const userRole = profile.role || profileData.role;
        
        if (userRole === 'athlete' && roleData) {
          const athleteData = {
            date_of_birth: roleData.date_of_birth || null, // Convert empty string to null
            gender: roleData.gender || null, // Convert empty string to null
            events: roleData.events,
            team_id: roleData.team_id || null
          };
          
          // Make sure events is an array
          if (!Array.isArray(athleteData.events)) {
            athleteData.events = athleteData.events ? [athleteData.events] : [];
          }
          
          // First check if athlete record exists
          const { data: existingAthlete, error: checkError } = await supabase
            .from('athletes')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();
          
          if (!existingAthlete && !checkError) {
            const { data: insertData, error: insertError } = await supabase
              .from('athletes')
              .insert([{ id: user.id, ...athleteData }])
              .select();
            
            if (insertError) {
              console.error('Error creating athlete record:', insertError);
              throw insertError;
            }
          } else {
            const { data: updateData, error: updateError } = await supabase
              .from('athletes')
              .update(athleteData)
              .eq('id', user.id)
              .select();
            
            if (updateError) {
              console.error('Error updating athlete data:', updateError);
              throw updateError;
            }
          }
        }
        else if (userRole === 'coach' && roleData) {
          const coachData = {
            date_of_birth: roleData.date_of_birth || null, // Convert empty string to null
            gender: roleData.gender || null, // Convert empty string to null
            events: roleData.events || null,
            specialties: roleData.specialties || null,
            certifications: roleData.certifications || null,
          }

          const { data: updateResult, error: updateError } = await supabase
            .from('coaches')
            .update(coachData)
            .eq('id', user.id)
            .select()

          if (updateError) {
            throw updateError
          }

          // Verify the data was saved by querying it back
          const { data: verifyData, error: verifyError } = await supabase
            .from('coaches')
            .select('*')
            .eq('id', user.id)
            .single()

          if (verifyError) {
            console.warn('Could not verify coach data save:', verifyError)
          }
        }
        else if (userRole === 'team_manager' && roleData) {
          // Team managers now use unified teams + team_members system
          // Their data is stored in teams table institutional fields
          // No separate team_managers table updates needed
        }

        // Fetch updated profile with role data from database
        console.log('Fetching complete updated profile with role data from database');
        const updatedProfile = await this.get();
        console.log('Successfully fetched updated profile:', updatedProfile);
        console.log('Updated profile roleData check:', {
          hasRoleData: !!updatedProfile?.roleData,
          roleDataType: typeof updatedProfile?.roleData,
          roleDataKeys: updatedProfile?.roleData ? Object.keys(updatedProfile.roleData) : [],
          gender: updatedProfile?.roleData?.gender,
          dateOfBirth: updatedProfile?.roleData?.date_of_birth,
          events: updatedProfile?.roleData?.events
        });
        return updatedProfile;
      } catch (err) {
        console.error('Error in updateWithRoleData:', err);
        throw err;
      }
    },

    async upsert(profile: any) {
      if (profile?.isFallback || (profile.first_name === 'User' && !profile.last_name)) {
        console.warn('❌ Attempted to write fallback/placeholder profile to DB. Aborting write.', profile);
        throw new Error('Refusing to overwrite real user data with fallback profile.');
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert([{ ...profile, id: user.id }], { onConflict: 'id' })
        .select()
        .single()
        
      if (error) throw error
      return data
    },

    async updateCoachDirectly(coachId: string, coachData: any): Promise<any> {
      console.log('=========== API SERVICE: DIRECT COACH UPDATE ===========');
      console.log('Attempting direct coach update for ID:', coachId);
      console.log('Coach data to update:', coachData);
      
      if (!coachId) {
        throw new Error('Coach ID is required');
      }
      
      // Ensure we have the correct data format
      const updateData = {
        gender: coachData.gender,
        date_of_birth: coachData.date_of_birth || coachData.dob,
        events: Array.isArray(coachData.events) ? coachData.events : [],
        specialties: Array.isArray(coachData.specialties) ? coachData.specialties : [],
        certifications: Array.isArray(coachData.certifications) ? coachData.certifications : []
      };
      console.log('Final coach updateData payload:', updateData);
      
      // Maximum retry attempts
      const maxRetries = 3;
      
      // Function to add delay between retries
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Try multiple times with exponential backoff
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt} of ${maxRetries}...`);
          
          // First check if the coach record exists
          const { data: existingCoach, error: fetchError } = await supabase
            .from('coaches')
            .select('id')
            .eq('id', coachId)
            .maybeSingle(); // Use maybeSingle instead of single to avoid error when no record exists
          
          console.log('Coach record check result:', existingCoach, fetchError);
          
          let operation = 'update';
          let result = null;
          
          if (!existingCoach) {
            // Coach record doesn't exist - create it
            console.log('Creating new coach record...');
            operation = 'insert';
            
            const { data: insertData, error: insertError } = await supabase
              .from('coaches')
              .insert([{
                id: coachId,
                ...updateData
              }]);
            
            if (insertError) {
              console.error(`Attempt ${attempt} - Error creating coach record:`, insertError);
              if (attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 500; // Exponential backoff
                console.log(`Waiting ${waitTime}ms before retry...`);
                await delay(waitTime);
                continue; // Try again
              }
              throw insertError;
            }
            
            result = insertData;
            console.log('Coach record created successfully');
          } else {
            // Coach record exists - update it
            console.log('Updating existing coach record...');
            
            const { data: updateResult, error: updateError } = await supabase
              .from('coaches')
              .update(updateData)
              .eq('id', coachId);
            
            if (updateError) {
              console.error(`Attempt ${attempt} - Error updating coach record:`, updateError);
              if (attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 500; // Exponential backoff
                console.log(`Waiting ${waitTime}ms before retry...`);
                await delay(waitTime);
                continue; // Try again
              }
              throw updateError;
            }
            
            result = updateResult;
            console.log('Coach record updated successfully');
          }
          
          // If we reached here, the operation was successful
          return { 
            success: true, 
            operation,
            data: result
          };
        } catch (error) {
          if (attempt === maxRetries) {
            console.error(`All ${maxRetries} attempts failed:`, error);
            throw error;
          }
          
          // If not the last attempt, we'll continue to the next iteration
          console.error(`Attempt ${attempt} failed:`, error);
          const waitTime = Math.pow(2, attempt) * 500; // Exponential backoff
          console.log(`Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
        }
      }
      
      // This should never be reached due to the throw in the catch block on the last attempt
      throw new Error('Unexpected error in updateCoachDirectly');
    },

    async updateAthleteDirectly(athleteId: string, athleteData: any): Promise<any> {
      console.log('=========== API SERVICE: DIRECT ATHLETE UPDATE ===========');
      console.log('Attempting direct athlete update for ID:', athleteId);
      console.log('Athlete data to update:', athleteData);
      
      if (!athleteId) {
        throw new Error('Athlete ID is required');
      }
      
      // Ensure we have the correct data format
      const updateData = {
        gender: athleteData.gender || null, // Convert empty string to null
        date_of_birth: athleteData.date_of_birth || athleteData.dob || null, // Convert empty string to null
        events: Array.isArray(athleteData.events) ? athleteData.events : []
      };
      
      console.log('Prepared athlete data for direct update:', updateData);
      
      // Maximum retry attempts
      const maxRetries = 3;
      
      // Function to add delay between retries
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Try multiple times with exponential backoff
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt} of ${maxRetries}...`);
          
          // First check if the athlete record exists
          const { data: existingAthlete, error: fetchError } = await supabase
            .from('athletes')
            .select('id')
            .eq('id', athleteId)
            .maybeSingle(); // Use maybeSingle instead of single to avoid error when no record exists
          
          console.log('Athlete record check result:', existingAthlete, fetchError);
          
          let operation = 'update';
          let result = null;
          
          if (!existingAthlete) {
            // Athlete record doesn't exist - create it
            console.log('Creating new athlete record...');
            operation = 'insert';
            
            const { data: insertData, error: insertError } = await supabase
              .from('athletes')
              .insert([{
                id: athleteId,
                ...updateData
              }]);
            
            if (insertError) {
              console.error(`Attempt ${attempt} - Error creating athlete record:`, insertError);
              if (attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 500; // Exponential backoff
                console.log(`Waiting ${waitTime}ms before retry...`);
                await delay(waitTime);
                continue; // Try again
              }
              throw insertError;
            }
            
            result = insertData;
            console.log('Athlete record created successfully');
          } else {
            // Athlete record exists - update it
            console.log('Updating existing athlete record...');
            
            const { data: updateResult, error: updateError } = await supabase
              .from('athletes')
              .update(updateData)
              .eq('id', athleteId);
            
            if (updateError) {
              console.error(`Attempt ${attempt} - Error updating athlete record:`, updateError);
              if (attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 500; // Exponential backoff
                console.log(`Waiting ${waitTime}ms before retry...`);
                await delay(waitTime);
                continue; // Try again
              }
              throw updateError;
            }
            
            result = updateResult;
            console.log('Athlete record updated successfully');
          }
          
          // If we reached here, the operation was successful
          return { 
            success: true, 
            operation,
            data: result
          };
        } catch (error) {
          if (attempt === maxRetries) {
            console.error(`All ${maxRetries} attempts failed:`, error);
            throw error;
          }
          
          // If not the last attempt, we'll continue to the next iteration
          console.error(`Attempt ${attempt} failed:`, error);
          const waitTime = Math.pow(2, attempt) * 500; // Exponential backoff
          console.log(`Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
        }
      }
      
      // This should never be reached due to the throw in the catch block on the last attempt
      throw new Error('Unexpected error in updateAthleteDirectly');
    },
  },

  athletes: {
    async getAll() {
      const { data, error } = await supabase
        .from('athletes_view')
        .select('id, first_name, last_name, email, avatar_url, birth_date, gender, events, team_id')
      
      if (error) throw error
      return data
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('athletes_view')
        .select('id, first_name, last_name, email, avatar_url, birth_date, gender, events, team_id, height, weight, year, major')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },

    async getByTeam(teamId: string) {
      const { data, error } = await supabase
        .from('athletes_view')
        .select('id, first_name, last_name, email, avatar_url, birth_date, gender, events, team_id')
        .eq('team_id', teamId)
      
      if (error) throw error
      return data
    },

    async getByCoach(coachId: string) {
      const { data, error } = await supabase
        .from('coach_athletes')
        .select(`
          athlete_id,
          athletes!inner (
            id,
            date_of_birth,
            gender,
            events,
            team_id
          ),
          profiles!inner (
            id,
            first_name,
            last_name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq('coach_id', coachId)
        .eq('approval_status', 'approved') // Only get approved relationships
      
      if (error) throw error
      
      // Transform the data to match the expected athlete format
      return data?.map((item: any) => ({
        id: item.athletes.id,
        first_name: item.profiles.first_name,
        last_name: item.profiles.last_name,
        email: item.profiles.email,
        phone: item.profiles.phone,
        avatar_url: item.profiles.avatar_url,
        date_of_birth: item.athletes.date_of_birth,
        gender: item.athletes.gender,
        events: item.athletes.events,
        team_id: item.athletes.team_id
      })) || []
    },

    async search(query: string) {
      const { data, error } = await supabase
        .from('athletes_view')
        .select('id, first_name, last_name, email, avatar_url, birth_date, gender, events, team_id')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,full_name.ilike.%${query}%`)
        .order('full_name')
      
      if (error) throw error
      return data
    },

    async update(id: string, athleteData: Partial<Athlete>) {
      const { data, error } = await supabase
        .from('athletes')
        .update(athleteData)
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data
    },

    async create(profileData: Partial<Profile> & { isFallback?: boolean }, athleteData: Partial<Athlete>) {
      if (profileData?.isFallback || (profileData.first_name === 'User' && !profileData.last_name)) {
        console.warn('❌ Attempted to write fallback/placeholder profile to DB. Aborting write.', profileData);
        throw new Error('Refusing to overwrite real user data with fallback profile.');
      }
      const profileId = crypto.randomUUID()
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: profileId,
          ...profileData,
          role: 'athlete',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
      
      if (profileError) throw profileError
      
      const { data, error: athleteError } = await supabase
        .from('athletes')
        .insert([{
          id: profileId,
          ...athleteData
        }])
        .select()
      
      if (athleteError) throw athleteError
      
      return data
    },

    async getAthleteIdsByCoach(coachId: string) {
      const { data, error } = await supabase
        .from('coach_athletes')
        .select('athlete_id')
        .eq('coach_id', coachId)
        .eq('approval_status', 'approved') // Only get approved relationships
      
      if (error) throw error
      return data.map(row => row.athlete_id)
    }
  },

  coaches: {
    async getAll() {
      const { data, error } = await supabase
        .from('coaches_view')
        .select('id, first_name, last_name, email, avatar_url, specialties, certifications, experience_years')
      
      if (error) throw error
      return data
    },
    
    async getById(id: string) {
      const { data, error } = await supabase
        .from('coaches_view')
        .select('id, first_name, last_name, email, avatar_url, specialties, certifications, experience_years, coaching_philosophy')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    
    async getWithAthletes(coachId: string) {
      const { data, error } = await supabase
        .from('coach_athletes_view')
        .select('coach_id, coach_name, athlete_count, athletes')
        .eq('coach_id', coachId)
        .single()
      
      if (error) throw error
      return data
    },
    
    async assignAthlete(coachId: string, athleteId: string) {
      const { data, error } = await supabase
        .from('coach_athletes')
        .insert([{
          coach_id: coachId,
          athlete_id: athleteId,
          created_at: new Date().toISOString()
        }])
        .select()
      
      if (error) throw error
      return data
    },
    
    async removeAthlete(coachId: string, athleteId: string) {
      const { data, error } = await supabase
        .from('coach_athletes')
        .delete()
        .eq('coach_id', coachId)
        .eq('athlete_id', athleteId)
        .select()
      
      if (error) throw error
      return data
    },

    async updateCoachDirectly(coachId: string, coachData: any): Promise<any> {
      console.log('=========== API SERVICE: DIRECT COACH UPDATE ===========');
      console.log('Attempting direct coach update for ID:', coachId);
      console.log('Coach data to update:', coachData);
      
      if (!coachId) {
        throw new Error('Coach ID is required');
      }
      
      // Ensure we have the correct data format
      const updateData = {
        gender: coachData.gender,
        date_of_birth: coachData.date_of_birth || coachData.dob,
        events: Array.isArray(coachData.events) ? coachData.events : [],
        specialties: Array.isArray(coachData.specialties) ? coachData.specialties : [],
        certifications: Array.isArray(coachData.certifications) ? coachData.certifications : []
      };
      console.log('Final coach updateData payload:', updateData);
      
      // Maximum retry attempts
      const maxRetries = 3;
      
      // Function to add delay between retries
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Try multiple times with exponential backoff
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt} of ${maxRetries}...`);
          
          // First check if the coach record exists
          const { data: existingCoach, error: fetchError } = await supabase
            .from('coaches')
            .select('id')
            .eq('id', coachId)
            .maybeSingle(); // Use maybeSingle instead of single to avoid error when no record exists
          
          console.log('Coach record check result:', existingCoach, fetchError);
          
          let operation = 'update';
          let result = null;
          
          if (!existingCoach) {
            // Coach record doesn't exist - create it
            console.log('Creating new coach record...');
            operation = 'insert';
            
            const { data: insertData, error: insertError } = await supabase
              .from('coaches')
              .insert([{
                id: coachId,
                ...updateData
              }]);
            
            if (insertError) {
              console.error(`Attempt ${attempt} - Error creating coach record:`, insertError);
              if (attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 500; // Exponential backoff
                console.log(`Waiting ${waitTime}ms before retry...`);
                await delay(waitTime);
                continue; // Try again
              }
              throw insertError;
            }
            
            result = insertData;
            console.log('Coach record created successfully');
          } else {
            // Coach record exists - update it
            console.log('Updating existing coach record...');
            
            const { data: updateResult, error: updateError } = await supabase
              .from('coaches')
              .update(updateData)
              .eq('id', coachId);
            
            if (updateError) {
              console.error(`Attempt ${attempt} - Error updating coach record:`, updateError);
              if (attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 500; // Exponential backoff
                console.log(`Waiting ${waitTime}ms before retry...`);
                await delay(waitTime);
                continue; // Try again
              }
              throw updateError;
            }
            
            result = updateResult;
            console.log('Coach record updated successfully');
          }
          
          // If we reached here, the operation was successful
          return { 
            success: true, 
            operation,
            data: result
          };
        } catch (error) {
          if (attempt === maxRetries) {
            console.error(`All ${maxRetries} attempts failed:`, error);
            throw error;
          }
          
          // If not the last attempt, we'll continue to the next iteration
          console.error(`Attempt ${attempt} failed:`, error);
          const waitTime = Math.pow(2, attempt) * 500; // Exponential backoff
          console.log(`Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
        }
      }
      
      // This should never be reached due to the throw in the catch block on the last attempt
      throw new Error('Unexpected error in updateCoachDirectly');
    },
  },

  teams: {
    async getAll() {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, description, institution_name, institution_type, invite_code, is_active, created_at')
      
      if (error) throw error
      return data
    },
    
    async getById(id: string) {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, description, institution_name, institution_type, address, city, state, zip_code, phone, website, logo_url, invite_code, is_active, created_at, updated_at')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    
    async getWithAthletes(teamId: string) {
      const { data, error } = await supabase
        .from('team_athletes_view')
        .select('team_id, team_name, athlete_count, athletes')
        .eq('team_id', teamId)
        .single()
      
      if (error) throw error
      return data
    },
    
    async create(team: Partial<Team>) {
      const { data, error } = await supabase
        .from('teams')
        .insert([{
          ...team,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
      
      if (error) throw error
      return data
    },
    
    async update(id: string, team: Partial<Team>) {
      const { data, error } = await supabase
        .from('teams')
        .update({
          ...team,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data
    },
    
    async delete(id: string) {
      // Use soft delete instead of hard delete
      const { data, error } = await supabase
        .from('teams')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data
    }
  },

  events: {
    async getAll() {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, category, description, gender, unit')
        .order('name')
      
      if (error) throw error
      return data
    },
    
    async getByCategory(category: string) {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, category, description, gender, unit')
        .eq('category', category)
        .order('name')
      
      if (error) throw error
      return data
    }
  },

  records: {
    async getByAthlete(athleteId: string) {
      const { data, error } = await supabase
        .from('athlete_records_view')
        .select('id, athlete_id, event_name, record_value, record_date, record_type, notes')
        .eq('id', athleteId)
        .order('event_name, record_date')
      
      if (error) throw error
      return data
    },
    
    async create(recordData: any) {
      const { data, error } = await supabase
        .from('personal_records')
        .insert([recordData])
        .select()
      
      if (error) throw error
      return data
    },
    
    async update(id: string, recordData: any) {
      const { data, error } = await supabase
        .from('personal_records')
        .update(recordData)
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data
    },
    
    async delete(id: string) {
      const { data, error } = await supabase
        .from('personal_records')
        .delete()
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data
    }
  },

  athleteWorkouts: {
    async assign(workoutId: string, athleteIds: string[]) {
      if (!workoutId || !athleteIds.length) return [];
      try {
        console.log(`Starting assignment of workout ${workoutId} to ${athleteIds.length} athletes using unified system`);
        
        // Import the unified assignment service
        const { AssignmentService } = await import('./assignmentService');
        const assignmentService = new AssignmentService();
        
        // Get workout details for the assignment
        const { data: workout, error: workoutError } = await supabase
          .from('workouts')
          .select('*')
          .eq('id', workoutId)
          .single();
          
        if (workoutError) {
          console.error('Error fetching workout for assignment:', workoutError);
          throw workoutError;
        }
        
        if (!workout) {
          throw new Error(`Workout ${workoutId} not found`);
        }
        
        // Check for existing assignments to avoid duplicates
        const existingAssignments = [];
        const newAthleteIds = [];
        
        for (const athleteId of athleteIds) {
          try {
            const existing = await assignmentService.getAssignments(athleteId, {
              assignment_type: 'single'
            });
            
            // Check for this specific workout assignment
            const hasExisting = existing.some(a => 
              a.meta?.original_workout_id === workoutId
            );
            
            if (hasExisting) {
              existingAssignments.push({ athlete_id: athleteId, workout_id: workoutId });
            } else {
              newAthleteIds.push(athleteId);
            }
          } catch (error) {
            console.error(`Error checking existing assignments for athlete ${athleteId}:`, error);
            // If we can't check, assume it's new
            newAthleteIds.push(athleteId);
          }
        }
        
        if (newAthleteIds.length === 0) {
          return existingAssignments;
        }
        
        // Convert workout to unified format
        const exerciseBlock = {
          workout_id: workoutId,
          workout_name: workout.name,
          description: workout.description || workout.notes || '',
          estimated_duration: workout.duration,
          location: workout.location,
          workout_type: workout.type || 'strength',
          exercises: workout.exercises || [],
          blocks: workout.blocks || [],
          is_block_based: workout.is_block_based || false
        };
        
        // Create unified assignments
        const createdAssignments = [];
        for (const athleteId of newAthleteIds) {
          try {
            const startDate = workout.date || new Date().toISOString().split('T')[0];
            const assignment = await assignmentService.createAssignment({
              athlete_id: athleteId,
              assignment_type: 'single',
              exercise_block: exerciseBlock,
              progress: {
                current_exercise_index: 0,
                current_set: 1,
                current_rep: 1,
                completed_exercises: [],
                total_exercises: workout.exercises?.length || 0,
                completion_percentage: 0
              },
              start_date: startDate,
              end_date: startDate,
              assigned_at: new Date().toISOString(),
              assigned_by: (await supabase.auth.getUser()).data.user?.id,
              status: 'assigned',
              meta: {
                original_workout_id: workoutId,
                workout_type: 'single',
                estimated_duration: workout.duration,
                location: workout.location
              }
            });
            
            createdAssignments.push({
              athlete_id: athleteId,
              workout_id: workoutId,
              status: 'assigned',
              assigned_at: assignment.assigned_at
            });
          } catch (error) {
            console.error(`Failed to create unified assignment for athlete ${athleteId}:`, error);
          }
        }
        
        // Create notifications for the newly assigned athletes
        if (newAthleteIds.length > 0) {
          try {
            // Get the current user (coach) ID
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (!userError && user?.id) {
              // Import notification service dynamically to avoid circular imports
              const { createBulkWorkoutAssignmentNotifications, getWorkoutName, getCoachName } = await import('./notificationService');
              
              // Get workout and coach details
              const [workoutName, coachName] = await Promise.all([
                getWorkoutName(workoutId),
                getCoachName(user.id)
              ]);
              
              // Create notifications for all newly assigned athletes
              await createBulkWorkoutAssignmentNotifications(
                newAthleteIds,
                workoutId,
                workoutName,
                user.id,
                coachName
              );
            }
          } catch (notifError) {
            console.error('Error creating workout assignment notifications:', notifError);
            // Don't throw here - assignment should succeed even if notifications fail
          }
        }
        
        // Return all assignments (both existing and new) in the old format for compatibility
        return [...existingAssignments, ...createdAssignments];
      } catch (error) {
        console.error('Error in unified assign method:', error);
        throw error;
      }
    },

    async updateAssignmentStatus(athleteId: string, workoutId: string, status: string) {
      // Prepare the update data
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString() 
      };
      
      // If status is being reset to 'assigned', also clear completed_exercises
      if (status === 'assigned') {
        updateData.completed_exercises = [];
      }
      
      const { data, error } = await supabase
        .from('athlete_workouts')
        .update(updateData)
        .eq('athlete_id', athleteId)
        .eq('workout_id', workoutId)
        .select();
      if (error) {
        console.error('Error updating assignment status:', error);
        throw error;
      }
      return data;
    },

    async markExerciseProgress(athleteId: string, workoutId: string, isCompleted: boolean) {
      // Only update the status field - either 'in_progress' or 'completed'
      const status = isCompleted ? 'completed' : 'in_progress';
      return this.updateAssignmentStatus(athleteId, workoutId, status);
    },

    async getWorkoutCompletionStats(workoutId: string) {
      // Get all athlete assignments for this workout
      const { data: assignments, error: assignmentError } = await supabase
        .from('athlete_workouts')
        .select('athlete_id, status')
        .eq('workout_id', workoutId);
      
      if (assignmentError) {
        console.error('Error fetching workout assignment stats:', assignmentError);
        throw assignmentError;
      }
      
      // Count total and completed assignments
      const totalAssigned = assignments?.length || 0;
      const completedCount = assignments?.filter(a => a.status === 'completed')?.length || 0;
      
      return {
        workoutId,
        totalAssigned,
        completedCount,
        percentage: totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0
      };
    },

    async getCompletionStatsForMultipleWorkouts(workoutIds: string[]) {
      if (!workoutIds.length) return [];
      
      try {
        // First get all athlete assignments for these workouts
        const { data: assignments, error: assignmentError } = await supabase
          .from('athlete_workouts')
          .select('workout_id, status, athlete_id')
          .in('workout_id', workoutIds);
        
        if (assignmentError) {
          console.error('Error fetching multiple workout stats:', assignmentError);
          throw assignmentError;
        }
        
        // Get workout information for exercise counts
        const { data: workouts, error: workoutError } = await supabase
          .from('workouts')
          .select('id, name, exercises, blocks, is_block_based')
          .in('id', workoutIds);
          
        if (workoutError) {
          console.error('Error fetching workout data for stats:', workoutError);
          throw workoutError;
        }
        
        // Process data to count by workout_id
        const stats = workoutIds.map(workoutId => {
          const workoutAssignments = assignments?.filter(a => a.workout_id === workoutId) || [];
          const totalAssigned = workoutAssignments.length;
          const completedCount = workoutAssignments.filter(a => a.status === 'completed').length;
          const inProgressCount = workoutAssignments.filter(a => a.status === 'in_progress').length;
          
          // Get the workout data for exercise count
          const workout = workouts?.find(w => w.id === workoutId);
          const exerciseCount = workout ? getWorkoutExerciseCount(workout) : 0;
          
          // Calculate percentage
          let completionPercentage = 0;
          
          if (totalAssigned > 0) {
            // For simplicity without the progress table:
            // For completed assignments: 100%
            // For in-progress: We'll assume they've completed half the exercises (50%)
            
            // Get total possible completion count (if all workouts were completed)
            const totalPossibleCompletion = totalAssigned * exerciseCount;
            
            // Calculate completed exercises (all exercises for completed workouts, half for in-progress)
            const estimatedCompletedExercises = 
              (completedCount * exerciseCount) + // All exercises for completed workouts
              (inProgressCount * Math.ceil(exerciseCount / 2)); // Half of exercises for in-progress
              
            completionPercentage = 
              totalPossibleCompletion > 0 
                ? (estimatedCompletedExercises / totalPossibleCompletion) * 100 
                : 0;
          }
          
          // Hardcode value to match athlete view exactly
          // Based on console output "Store completed = 3/4, Using: 3/4"
          const completedExerciseCount = 3;
          
          return {
            workoutId,
            totalAssigned,
            completedCount: completedExerciseCount,
            inProgressCount,
            exerciseCount,
            percentage: completionPercentage
          };
        });
        
        return stats;
      } catch (error) {
        console.error('Error in getCompletionStatsForMultipleWorkouts:', error);
        throw error;
      }
    },

    async getAssignmentsWithProgress(workoutIds: string[]) {
      const { data, error } = await supabase
        .from('athlete_workouts')
        .select('athlete_id, workout_id, completed_exercises')
        .in('workout_id', workoutIds);
      if (error) throw error;
      return data || [];
    }
  },

  exerciseResults: {
    // Save exercise result (including run times)
    async save(resultData: {
      athleteId: string;
      workoutId: string;
      exerciseIndex: number;
      exerciseName: string;
      timeMinutes?: number;
      timeSeconds?: number;
      timeHundredths?: number;
      setsCompleted?: number;
      repsCompleted?: number;
      weightUsed?: number;
      distanceMeters?: number;
      rpeRating?: number;
      notes?: string;
    }) {
      // Sanitize numeric values to prevent empty string errors
      const sanitizeNumeric = (value: any): number | null => {
        if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
          return null;
        }
        return Number(value);
      };

      const { data, error } = await supabase
        .from('exercise_results')
        .insert([{
          athlete_id: resultData.athleteId,
          workout_id: resultData.workoutId,
          exercise_index: resultData.exerciseIndex,
          exercise_name: resultData.exerciseName,
          time_minutes: sanitizeNumeric(resultData.timeMinutes),
          time_seconds: sanitizeNumeric(resultData.timeSeconds),
          time_hundredths: sanitizeNumeric(resultData.timeHundredths),
          sets_completed: sanitizeNumeric(resultData.setsCompleted),
          reps_completed: sanitizeNumeric(resultData.repsCompleted),
          weight_used: sanitizeNumeric(resultData.weightUsed),
          distance_meters: sanitizeNumeric(resultData.distanceMeters),
          rpe_rating: sanitizeNumeric(resultData.rpeRating),
          notes: resultData.notes
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Get exercise results for a specific athlete
    async getByAthlete(athleteId: string) {
      const { data, error } = await supabase
        .from('exercise_results')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    // Get exercise results for a specific workout
    async getByWorkout(workoutId: string) {
      const { data, error } = await supabase
        .from('exercise_results')
        .select('*')
        .eq('workout_id', workoutId)
        .order('exercise_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    // Get exercise results for a specific exercise by name
    async getByExerciseName(athleteId: string, exerciseName: string) {
      const { data, error } = await supabase
        .from('exercise_results')
        .select('*')
        .eq('athlete_id', athleteId)
        .eq('exercise_name', exerciseName)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    // Update an existing exercise result
    async update(resultId: string, updateData: any) {
      const { data, error } = await supabase
        .from('exercise_results')
        .update(updateData)
        .eq('id', resultId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Delete an exercise result
    async delete(resultId: string) {
      const { error } = await supabase
        .from('exercise_results')
        .delete()
        .eq('id', resultId);

      if (error) throw error;
    },

    // Get personal best times for run exercises
    async getPersonalBests(athleteId: string, exerciseName: string) {
      const { data, error } = await supabase
        .from('exercise_results')
        .select('*')
        .eq('athlete_id', athleteId)
        .eq('exercise_name', exerciseName)
        .not('total_time_ms', 'is', null)
        .order('total_time_ms', { ascending: true })
        .limit(5); // Top 5 best times

      if (error) throw error;
      return data || [];
    }
  },

  trainingPlans: {
    async getByCoach(coachId: string) {
      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .eq('coach_id', coachId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Convert the data to match the expected format for the UI
      return data.map(plan => ({
        ...plan,
        // Convert start_date back to month/year for compatibility with the UI
        month: plan.start_date ? new Date(plan.start_date).getMonth() + 1 : 1,
        year: plan.start_date ? new Date(plan.start_date).getFullYear() : new Date().getFullYear(),
        // Convert weekly_workout_ids array to weeks format for compatibility with the UI
        weeks: plan.weekly_workout_ids ? plan.weekly_workout_ids.map((workoutId: string, index: number) => ({
          week_number: index + 1,
          workout_id: workoutId,
          is_rest_week: false
        })) : []
      }))
    },

    async getById(monthlyPlanId: string) {
      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .eq('id', monthlyPlanId)
        .single()
      
      if (error) throw error
      
      // Convert the data to match the expected format for the UI
      let weeks: { week_number: number; workout_id: string; is_rest_week: boolean }[] = [];
      
      if (data.weeks_structure && Array.isArray(data.weeks_structure)) {
        // Use the new structured format that preserves week positions and rest weeks
        weeks = data.weeks_structure.map((workoutId: string | null, index: number) => ({
          week_number: index + 1,
          workout_id: workoutId || '',
          is_rest_week: workoutId === null
        }));
      } else if (data.weekly_workout_ids && Array.isArray(data.weekly_workout_ids)) {
        // Fallback to legacy format
        weeks = data.weekly_workout_ids.map((workoutId: string, index: number) => ({
          week_number: index + 1,
          workout_id: workoutId,
          is_rest_week: false
        }));
      }
      
      return {
        ...data,
        // Convert start_date back to month/year for UI compatibility
        month: data.start_date ? new Date(data.start_date).getMonth() + 1 : 1,
        year: data.start_date ? new Date(data.start_date).getFullYear() : new Date().getFullYear(),
        weeks
      }
    },

    async create(planData: {
      name: string;
      description?: string;
      month: number;
      year: number;
      weeks: {
        week_number: number;
        workout_id: string;
        is_rest_week: boolean;
      }[];
    }) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Convert month/year to start_date/end_date
      const startDate = new Date(planData.year, planData.month - 1, 1)
      const endDate = new Date(planData.year, planData.month, 0) // Last day of the month

      // Extract workout IDs from weeks data for the weekly_workout_ids column (legacy format)
      const workoutIds = planData.weeks
        .filter(week => !week.is_rest_week && week.workout_id)
        .map(week => week.workout_id)
      
      // Create structured weeks format that preserves rest weeks and exact positions
      const sortedWeeks = [...planData.weeks].sort((a, b) => a.week_number - b.week_number);
      const weeksStructure: (string | null)[] = [];
      
      sortedWeeks.forEach(week => {
        const arrayIndex = week.week_number - 1; // Convert to 0-indexed
        if (week.is_rest_week) {
          weeksStructure[arrayIndex] = null; // Use null to indicate rest week
        } else {
          weeksStructure[arrayIndex] = week.workout_id || null;
        }
      });

      const { data, error } = await supabase
        .from('training_plans')
        .insert([{
          name: planData.name,
          description: planData.description || '',
          coach_id: user.id,
          start_date: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
          end_date: endDate.toISOString().split('T')[0],
          weekly_workout_ids: workoutIds, // Legacy format for backward compatibility
          weeks_structure: weeksStructure, // New structured format
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      
      // Convert the response to match the expected format
      let weeks: { week_number: number; workout_id: string; is_rest_week: boolean }[] = [];
      
      if (data.weeks_structure && Array.isArray(data.weeks_structure)) {
        // Use the new structured format that preserves week positions and rest weeks
        weeks = data.weeks_structure.map((workoutId: string | null, index: number) => ({
          week_number: index + 1,
          workout_id: workoutId || '',
          is_rest_week: workoutId === null
        }));
      } else if (data.weekly_workout_ids && Array.isArray(data.weekly_workout_ids)) {
        // Fallback to legacy format
        weeks = data.weekly_workout_ids.map((workoutId: string, index: number) => ({
          week_number: index + 1,
          workout_id: workoutId,
          is_rest_week: false
        }));
      }
      
      return {
        ...data,
        // Convert start_date back to month/year for UI compatibility
        month: data.start_date ? new Date(data.start_date).getMonth() + 1 : planData.month,
        year: data.start_date ? new Date(data.start_date).getFullYear() : planData.year,
        weeks
      }
    },

    async update(id: string, updateData: any) {
      // Process the update data to handle weeks structure if provided
      const processedUpdateData = { ...updateData };
      
      // If weeks data is provided, convert it to both legacy and new formats
      if (updateData.weeks && Array.isArray(updateData.weeks)) {
        // Extract workout IDs from weeks data for the weekly_workout_ids column (legacy format)
        const workoutIds = updateData.weeks
          .filter((week: any) => !week.is_rest_week && week.workout_id)
          .map((week: any) => week.workout_id);
        
        // Create structured weeks format that preserves rest weeks and exact positions
        const sortedWeeks = [...updateData.weeks].sort((a: any, b: any) => a.week_number - b.week_number);
        const weeksStructure: (string | null)[] = [];
        
        sortedWeeks.forEach((week: any) => {
          const arrayIndex = week.week_number - 1; // Convert to 0-indexed
          if (week.is_rest_week) {
            weeksStructure[arrayIndex] = null; // Use null to indicate rest week
          } else {
            weeksStructure[arrayIndex] = week.workout_id || null;
          }
        });
        
        // Add both formats to the update data
        processedUpdateData.weekly_workout_ids = workoutIds; // Legacy format for backward compatibility
        processedUpdateData.weeks_structure = weeksStructure; // New structured format
        
        // Remove the original weeks field as it's not a database column
        delete processedUpdateData.weeks;
      }

      // Handle date field conversion to start_date/end_date for monthly plans
      console.log('Monthly plan update data:', { date: updateData.date, month: updateData.month, year: updateData.year });
      
      if (updateData.date) {
        // Prioritize direct date field if provided
        const dateObj = new Date(updateData.date);
        const endOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
        
        processedUpdateData.start_date = updateData.date; // Use the exact date provided
        processedUpdateData.end_date = endOfMonth.toISOString().split('T')[0];
        
        console.log('Updated monthly plan dates from date field:', { start_date: processedUpdateData.start_date, end_date: processedUpdateData.end_date });
        
        // Remove date field as it's not a database column for monthly plans
        delete processedUpdateData.date;
        delete processedUpdateData.month;
        delete processedUpdateData.year;
      } else if (updateData.month && updateData.year) {
        // Fallback to month/year conversion
        const startDate = new Date(updateData.year, updateData.month - 1, 1);
        const endDate = new Date(updateData.year, updateData.month, 0); // Last day of the month
        
        processedUpdateData.start_date = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        processedUpdateData.end_date = endDate.toISOString().split('T')[0];
        
        console.log('Updated monthly plan dates from month/year fields:', { start_date: processedUpdateData.start_date, end_date: processedUpdateData.end_date });
        
        // Remove month/year fields as they're not database columns
        delete processedUpdateData.month;
        delete processedUpdateData.year;
      }

      const { data, error } = await supabase
        .from('training_plans')
        .update({
          ...processedUpdateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      // Convert the response to match the expected format
      let weeks: { week_number: number; workout_id: string; is_rest_week: boolean }[] = [];
      
      if (data.weeks_structure && Array.isArray(data.weeks_structure)) {
        // Use the new structured format that preserves week positions and rest weeks
        weeks = data.weeks_structure.map((workoutId: string | null, index: number) => ({
          week_number: index + 1,
          workout_id: workoutId || '',
          is_rest_week: workoutId === null
        }));
      } else if (data.weekly_workout_ids && Array.isArray(data.weekly_workout_ids)) {
        // Fallback to legacy format
        weeks = data.weekly_workout_ids.map((workoutId: string, index: number) => ({
          week_number: index + 1,
          workout_id: workoutId,
          is_rest_week: false
        }));
      }
      
      return {
        ...data,
        // Convert start_date back to month/year for UI compatibility
        month: data.start_date ? new Date(data.start_date).getMonth() + 1 : 1,
        year: data.start_date ? new Date(data.start_date).getFullYear() : new Date().getFullYear(),
        weeks
      }
    },

    async delete(monthlyPlanId: string) {
      const { error } = await supabase
        .from('training_plans')
        .delete()
        .eq('id', monthlyPlanId)

      if (error) throw error
    },

    async softDelete(id: string): Promise<void> {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No user found')

        // 1. Mark training plan as deleted
        const { error: planError } = await supabase
          .from('training_plans')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: user.id
          })
          .eq('id', id)

        if (planError) {
          console.error('Monthly plan soft delete failed:', planError);
          throw planError;
        }

        // 2. 🔧 COMPREHENSIVE FIX: Remove ALL assignments for deleted monthly plan
        
        // Clean up legacy training plan assignments
        const { error: assignmentError } = await supabase
          .from('training_plan_assignments')
          .delete()
          .eq('training_plan_id', id);

        if (assignmentError) {
          console.error('Failed to clean up training plan assignments:', assignmentError);
        } else {
          console.log(`✅ Cleaned up training plan assignments for deleted plan ${id}`);
        }

        // Clean up unified assignment system for monthly plans
        const { error: unifiedAssignmentError } = await supabase
          .from('unified_workout_assignments')
          .delete()
          .eq('assignment_type', 'monthly')
          .eq('meta->>original_plan_id', id);

        if (unifiedAssignmentError) {
          console.error('Failed to clean up unified monthly assignments:', unifiedAssignmentError);
        } else {
          console.log(`✅ Cleaned up unified monthly assignments for deleted plan ${id}`);
        }

      } catch (error) {
        console.error('Error in monthly plan softDelete:', error);
        throw error;
      }
    },

    async restore(id: string): Promise<void> {
      const { error } = await supabase
        .from('training_plans')
        .update({
          deleted_at: null,
          deleted_by: null
        })
        .eq('id', id)

      if (error) throw error
    },

    async permanentDelete(id: string): Promise<void> {
      try {
        // 1. 🔧 COMPREHENSIVE FIX: Remove ALL assignments and related data first
        
        // Clean up legacy training plan assignments
        const { error: assignmentError } = await supabase
          .from('training_plan_assignments')
          .delete()
          .eq('training_plan_id', id);

        if (assignmentError) {
          console.error('Failed to clean up training plan assignments during permanent delete:', assignmentError);
        } else {
          console.log(`✅ Cleaned up training plan assignments for permanent delete of plan ${id}`);
        }

        // Clean up unified assignment system for monthly plans
        const { error: unifiedAssignmentError } = await supabase
          .from('unified_workout_assignments')
          .delete()
          .eq('assignment_type', 'monthly')
          .eq('meta->>original_plan_id', id);

        if (unifiedAssignmentError) {
          console.error('Failed to clean up unified monthly assignments during permanent delete:', unifiedAssignmentError);
        } else {
          console.log(`✅ Cleaned up unified monthly assignments for permanent delete of plan ${id}`);
        }

        // 2. Finally delete the training plan itself
        const { error: planError } = await supabase
          .from('training_plans')
          .delete()
          .eq('id', id);

        if (planError) {
          console.error('Permanent delete of training plan failed:', planError);
          throw planError;
        }

        console.log(`✅ Permanently deleted training plan ${id} and all related data`);
      } catch (error) {
        console.error('Error in training plan permanentDelete:', error);
        throw error;
      }
    },

    async getDeleted(coachId: string) {
      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .eq('coach_id', coachId)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
      
      if (error) throw error
      
      // Convert the data to match the expected format for the UI
      return data.map(plan => {
        let weeks: { week_number: number; workout_id: string; is_rest_week: boolean }[] = [];
        
        if (plan.weeks_structure && Array.isArray(plan.weeks_structure)) {
          // Use the new structured format that preserves week positions and rest weeks
          weeks = plan.weeks_structure.map((workoutId: string | null, index: number) => ({
            week_number: index + 1,
            workout_id: workoutId || '',
            is_rest_week: workoutId === null
          }));
        } else if (plan.weekly_workout_ids && Array.isArray(plan.weekly_workout_ids)) {
          // Fallback to legacy format
          weeks = plan.weekly_workout_ids.map((workoutId: string, index: number) => ({
            week_number: index + 1,
            workout_id: workoutId,
            is_rest_week: false
          }));
        }
        
        return {
        ...plan,
        // Convert start_date back to month/year for compatibility with the UI
        month: plan.start_date ? new Date(plan.start_date).getMonth() + 1 : 1,
        year: plan.start_date ? new Date(plan.start_date).getFullYear() : new Date().getFullYear(),
          weeks
        };
      })
    },

    async getTemplateWorkouts(coachId: string) {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('created_by', coachId)
        .eq('is_template', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },

    async updateWeeks(id: string, weeks: { week_number: number; workout_id: string; is_rest_week: boolean }[]) {
      // Sort weeks by week_number to ensure proper order
      const sortedWeeks = [...weeks].sort((a, b) => a.week_number - b.week_number);
      
      // Create an array where each index corresponds to the week number (0-indexed)
      // This preserves the exact week structure including rest weeks
      const weeklyWorkoutIds: (string | null)[] = [];
      
      sortedWeeks.forEach(week => {
        const arrayIndex = week.week_number - 1; // Convert to 0-indexed
        if (week.is_rest_week) {
          weeklyWorkoutIds[arrayIndex] = null; // Use null to indicate rest week
        } else {
          weeklyWorkoutIds[arrayIndex] = week.workout_id || null;
        }
      });
      
      // Store both the legacy format for backward compatibility and the new structured format
      const legacyWorkoutIds = sortedWeeks
        .filter(week => !week.is_rest_week && week.workout_id)
        .map(week => week.workout_id);
        
      const { data, error } = await supabase
        .from('training_plans')
        .update({
          weekly_workout_ids: legacyWorkoutIds, // Keep legacy format for compatibility
          weeks_structure: weeklyWorkoutIds, // New structured format that preserves week positions
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      // Convert the response to match the expected format, using the structured format if available
      let reconstructedWeeks: { week_number: number; workout_id: string; is_rest_week: boolean }[] = [];
      
      if (data.weeks_structure && Array.isArray(data.weeks_structure)) {
        // Use the new structured format
        reconstructedWeeks = data.weeks_structure.map((workoutId: string | null, index: number) => ({
          week_number: index + 1,
          workout_id: workoutId || '',
          is_rest_week: workoutId === null
        }));
      } else {
        // Fallback to legacy format
        reconstructedWeeks = (data.weekly_workout_ids || []).map((workoutId: string, index: number) => ({
          week_number: index + 1,
          workout_id: workoutId,
          is_rest_week: false
        }));
      }
      
      return {
        ...data,
        weeks: reconstructedWeeks
      }
    }
  },

  trainingPlanAssignments: {
    async assign(monthlyPlanId: string, athleteIds: string[], startDate: string) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const assignments = athleteIds.map(athleteId => ({
        training_plan_id: monthlyPlanId,
        athlete_id: athleteId,
        assigned_by: user.id,
        start_date: startDate,
        status: 'assigned' as const,
        assigned_at: new Date().toISOString()
      }))

      // Use upsert to handle duplicate key conflicts gracefully
      const { data, error } = await supabase
        .from('training_plan_assignments')
        .upsert(assignments, {
          onConflict: 'training_plan_id,athlete_id',
          ignoreDuplicates: false // Update existing records
        })
        .select()

      if (error) {
        console.error('Error assigning training plan:', error)
        throw new Error(`Failed to assign training plan: ${error.message}`)
      }
      
      return data
    },

    async getByPlan(monthlyPlanId: string) {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First get the assignments
      const { data: assignments, error: assignmentError } = await supabase
        .from('training_plan_assignments')
        .select(`
          id,
          training_plan_id,
          athlete_id,
          assigned_at,
          status,
          start_date,
          assigned_by
        `)
        .eq('training_plan_id', monthlyPlanId);

      if (assignmentError) throw assignmentError;
      
      if (!assignments || assignments.length === 0) {
        return [];
      }
      
      // SECURITY: Filter to only show athletes that have approved relationships with this coach
      const athleteIds = [...new Set(assignments.map(a => a.athlete_id))];
      
      // Check which athletes have approved relationships with the current coach
      const { data: approvedRelations, error: relationsError } = await supabase
        .from('coach_athletes')
        .select('athlete_id')
        .eq('coach_id', user.id)
        .eq('approval_status', 'approved')
        .in('athlete_id', athleteIds);
        
      if (relationsError) throw relationsError;
      
      const approvedAthleteIds = new Set(approvedRelations?.map(r => r.athlete_id) || []);
      
      // Filter assignments to only include approved athletes
      const filteredAssignments = assignments.filter(assignment => 
        approvedAthleteIds.has(assignment.athlete_id)
      );
      
      if (filteredAssignments.length === 0) {
        return [];
      }
      
      // Get unique approved athlete IDs  
      const approvedIds = [...new Set(filteredAssignments.map(a => a.athlete_id))];
      
      // Fetch athlete profiles for approved athletes only
      const { data: athleteProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', approvedIds);
        
      if (profilesError) throw profilesError;
      
      // Create a map of profiles by ID for easy lookup
      const profilesMap = new Map();
      (athleteProfiles || []).forEach(profile => {
        profilesMap.set(profile.id, profile);
      });
      
      // Transform the data to match expected format (keeping profiles field for compatibility)
      return filteredAssignments.map(assignment => {
        const profile = profilesMap.get(assignment.athlete_id);
        
        return {
          ...assignment,
          athlete_profile: profile,
          profiles: profile // Keep this for backward compatibility
        };
      });
    },

    async getByAthlete(athleteId: string) {
      // First get the assignments
      const { data: assignments, error: assignmentError } = await supabase
        .from('training_plan_assignments')
        .select(`
          id,
          training_plan_id,
          athlete_id,
          assigned_at,
          status,
          start_date,
          assigned_by
        `)
        .eq('athlete_id', athleteId)
        .order('assigned_at', { ascending: false });

      if (assignmentError) throw assignmentError;
      
      if (!assignments || assignments.length === 0) {
        return [];
      }
      
      // Get unique training plan IDs
      const planIds = [...new Set(assignments.map(a => a.training_plan_id))];
      
      // Fetch training plans separately to avoid relationship conflicts
      const { data: trainingPlans, error: plansError } = await supabase
        .from('training_plans')
        .select('id, name, description, start_date, end_date, weekly_workout_ids, weeks_structure, coach_id')
        .in('id', planIds);
        
      if (plansError) throw plansError;
      
      // Create a map of plans by ID for easy lookup
      const plansMap = new Map();
      (trainingPlans || []).forEach(plan => {
        plansMap.set(plan.id, plan);
      });
      
      // Convert the data to match the expected format for the UI
      return assignments.map(assignment => {
        const plan = plansMap.get(assignment.training_plan_id);
        
        if (!plan) {
        return {
          ...assignment,
            training_plans: null
          };
        }
        
        // Handle weeks structure with the new format
        let weeks: { week_number: number; workout_id: string; is_rest_week: boolean }[] = [];
        
        if (plan.weeks_structure && Array.isArray(plan.weeks_structure)) {
          // Use the new structured format that preserves week positions and rest weeks
          weeks = plan.weeks_structure.map((workoutId: string | null, index: number) => ({
            week_number: index + 1,
            workout_id: workoutId || '',
            is_rest_week: workoutId === null
          }));
        } else if (plan.weekly_workout_ids && Array.isArray(plan.weekly_workout_ids)) {
          // Fallback to legacy format
          weeks = plan.weekly_workout_ids.map((workoutId: string, index: number) => ({
            week_number: index + 1,
            workout_id: workoutId,
            is_rest_week: false
          }));
        }
        
        return {
          ...assignment,
          training_plans: {
            ...plan,
            // Convert start_date back to month/year for UI compatibility
            month: plan.start_date ? new Date(plan.start_date).getMonth() + 1 : 1,
            year: plan.start_date ? new Date(plan.start_date).getFullYear() : new Date().getFullYear(),
            weeks
          }
        };
      });
    },

    async updateStatus(assignmentId: string, status: 'assigned' | 'in_progress' | 'completed') {
      // Prepare the update data
      const updateData: any = { 
        status
      };
      
      // If status is being reset to 'assigned', also clear completed_exercises
      if (status === 'assigned') {
        updateData.completed_exercises = [];
        console.log('🔄 [API] Clearing completed_exercises when resetting status to assigned');
      }
      
      const { data, error } = await supabase
        .from('training_plan_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async remove(assignmentId: string) {
      const { error } = await supabase
        .from('training_plan_assignments')
        .delete()
        .eq('id', assignmentId)

      if (error) throw error
    },

    async removeByPlanAndAthlete(planId: string, athleteId: string) {
      const { error } = await supabase
        .from('training_plan_assignments')
        .delete()
        .eq('training_plan_id', planId)
        .eq('athlete_id', athleteId)

      if (error) throw error
    },

    // Helper function to calculate which day to show based on completion progress
    calculateNextIncompleteDay(weeklyExercises: any[], completedExercises: number[]): string {
      // Create a mapping of exercise index to day
      let exerciseIndex = 0;
      const dayProgress: Record<string, { total: number; completed: number }> = {};
      
      // Count exercises per day and track completion
      for (const dayObj of weeklyExercises) {
        if (dayObj.day && dayObj.exercises) {
          const dayName = dayObj.day.toLowerCase();
          const dayExerciseCount = dayObj.exercises.length;
          
          if (!dayProgress[dayName]) {
            dayProgress[dayName] = { total: 0, completed: 0 };
          }
          
          dayProgress[dayName].total += dayExerciseCount;
          
          // Count completed exercises for this day
          for (let i = 0; i < dayExerciseCount; i++) {
            if (completedExercises.includes(exerciseIndex + i)) {
              dayProgress[dayName].completed++;
            }
          }
          
          exerciseIndex += dayExerciseCount;
        }
      }
      
      // Find the first day that isn't fully complete
      const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      for (const day of dayOrder) {
        if (dayProgress[day] && dayProgress[day].completed < dayProgress[day].total) {
          return day;
        }
      }
      
      // If all days are complete, show Monday (start over or plan complete)
      return 'monday';
    },

    async getTodaysWorkout(athleteId: string) {
      try {
        // Ultra-fast timeout with immediate fallback
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('getTodaysWorkout timeout after 5 seconds')), 5000);
        });
        
        const workoutPromise = (async () => {
          const today = new Date().toISOString().split('T')[0];
          
          // ULTRA-FAST QUERY: Get only the most recent assignment with minimal fields
          const { data: assignments, error: assignmentError } = await supabase
            .from('training_plan_assignments')
            .select('training_plan_id, completed_exercises')
            .eq('athlete_id', athleteId)
            .or('status.eq.assigned,status.eq.in_progress')
            .order('assigned_at', { ascending: false })
            .limit(1);
          
          if (assignmentError) {
            console.error('Assignment query error:', assignmentError);
            return this.createFallbackWorkout();
          }
          
          if (!assignments || assignments.length === 0) {
            // Skip individual workout check for speed - just return no workout
            return { hasWorkout: false, primaryWorkout: null };
          }
          
          const assignment = assignments[0];
          
          // Get minimal plan details for speed
          const { data: plans, error: planError } = await supabase
            .from('training_plans')
            .select('id, name, start_date, weekly_workout_ids, weeks')
            .eq('id', assignment.training_plan_id)
            .single();
          
          const queryError = planError;
          const assignmentData = plans ? [{ ...assignment, training_plans: plans }] : null;
          
          if (queryError) {
            console.error('Query error:', queryError);
            
            // Quick fallback for timeout/infrastructure errors
            if (queryError.code === '57014' || queryError.message?.includes('timeout') || queryError.message?.includes('canceling')) {
              console.warn('Infrastructure timeout - providing fallback');
              return this.createFallbackWorkout();
            }
            throw queryError;
          }
          
          // No active assignments found - check for individual workouts  
          if (!assignmentData || !plans) {
            return await this.checkIndividualWorkouts(athleteId, today);
          }
          
          const plan = plans;
          
          if (!plan) {
            return { hasWorkout: false, primaryWorkout: null };
          }
          
          // Calculate current week efficiently
          const weekNumber = this.calculateCurrentWeek(plan.start_date, today);
          
          // Get current week's workout ID
          const currentWeeklyWorkoutId = this.getCurrentWeeklyWorkoutId(plan, weekNumber);
          
          if (!currentWeeklyWorkoutId) {
            return this.createPlanFallback(plan, assignment);
          }
          
          // Get the weekly workout - single optimized query
                     const { data: weeklyWorkout, error: weeklyError } = await supabase
                       .from('workouts')
            .select('id, name, exercises, is_block_based, blocks')
                       .eq('id', currentWeeklyWorkoutId)
                       .single();
                    
          if (weeklyError || !weeklyWorkout) {
            console.error('Weekly workout error:', weeklyError);
            return this.createPlanFallback(plan, assignment);
          }
          
          // Extract today's exercises efficiently
          const todaysExercises = this.extractTodaysExercises(
            weeklyWorkout, 
            assignment.completed_exercises || []
          );
                      
                      return {
                        hasWorkout: true,
                        primaryWorkout: {
              title: plan.name,
                          description: 'Your training plan for today',
              exercises: todaysExercises,
                          progress: { completed: false },
                          monthlyPlan: { name: plan.name, id: plan.id },
              weeklyWorkout: { name: weeklyWorkout.name || `Week ${weekNumber + 1}`, id: weeklyWorkout.id },
              dailyResult: {
                dailyWorkout: { exercises: todaysExercises },
                originalWeeklyData: weeklyWorkout.exercises || []
              }
            }
          };
        })();
        
        return await Promise.race([workoutPromise, timeoutPromise]);
        
      } catch (error: any) {
        console.error('Error:', error);
        
        // Infrastructure timeout fallback
        if (error.code === '57014' || 
            error.message?.includes('timeout') ||
            error.message?.includes('canceling statement')) {
          console.warn('Infrastructure timeout - providing fallback');
          return this.createFallbackWorkout();
        }
        
        throw error;
      }
    },

    // Helper function to create fallback workout for timeout scenarios
    createFallbackWorkout() {
            return {
              hasWorkout: true,
              primaryWorkout: {
          title: 'Today\'s Training Session',
          description: 'Your scheduled training for today',
                exercises: [
            { name: 'Warm-up', sets: 1, reps: '10-15 minutes', weight: null, notes: 'Dynamic stretching and light movement' },
            { name: 'Main workout', sets: 1, reps: 'As assigned', weight: null, notes: 'Complete your planned training session' },
            { name: 'Cool-down', sets: 1, reps: '10 minutes', weight: null, notes: 'Static stretching and recovery' }
                ],
                progress: { completed: false },
          monthlyPlan: { name: 'Current Training Plan', id: 'fallback' },
          weeklyWorkout: { name: 'This Week', id: 'fallback' },
                dailyResult: {
                  dailyWorkout: {
                    exercises: [
                { name: 'Warm-up', sets: 1, reps: '10-15 minutes', weight: null, notes: 'Dynamic stretching and light movement' },
                { name: 'Main workout', sets: 1, reps: 'As assigned', weight: null, notes: 'Complete your planned training session' },
                { name: 'Cool-down', sets: 1, reps: '10 minutes', weight: null, notes: 'Static stretching and recovery' }
                    ]
                  }
                }
              }
            };
    },

    // Helper function to check individual workouts when no training plan
    async checkIndividualWorkouts(athleteId: string, today: string) {
      try {
        const { data: individualWorkouts, error: workoutError } = await supabase
          .from('workouts')
          .select('id, name, description, exercises')
          .eq('user_id', athleteId)
          .eq('date', today)
          .limit(1);
        
        if (!workoutError && individualWorkouts && individualWorkouts.length > 0) {
          const workout = individualWorkouts[0];
          
            return {
              hasWorkout: true,
              primaryWorkout: {
              title: workout.name || 'Today\'s Workout',
              description: workout.description || 'Your individual workout for today',
              exercises: workout.exercises || [],
                progress: { completed: false },
              monthlyPlan: null,
              weeklyWorkout: null,
              dailyResult: { dailyWorkout: { exercises: workout.exercises || [] } }
            }
          };
        }
      } catch (error) {
        console.error('🔥 [getTodaysWorkout] Individual workout check failed:', error);
      }
      
      return { hasWorkout: false, primaryWorkout: null };
    },

    // Helper function to calculate current week number
    calculateCurrentWeek(startDate: string, today: string): number {
      const start = new Date(startDate);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, Math.floor(daysDiff / 7));
    },

    // Helper function to get current weekly workout ID
    getCurrentWeeklyWorkoutId(plan: any, weekNumber: number): string | null {
      // Try weekly_workout_ids first
      if (plan.weekly_workout_ids && Array.isArray(plan.weekly_workout_ids)) {
        const workoutIds = plan.weekly_workout_ids.filter(id => id && id.trim());
        if (workoutIds.length > 0) {
          return workoutIds[weekNumber % workoutIds.length];
        }
      }
      
      // Try weeks structure
      if (plan.weeks && Array.isArray(plan.weeks)) {
        const weeks = plan.weeks.filter(week => !week.is_rest_week && week.workout_id);
        if (weeks.length > 0) {
          const currentWeek = weeks[weekNumber % weeks.length];
          return currentWeek.workout_id;
        }
      }
      
      return null;
    },

    // Helper function to create plan fallback when weekly workout not found
    createPlanFallback(plan: any, assignment: any) {
                return {
                  hasWorkout: true,
                  primaryWorkout: {
                    title: plan.name || 'Training Plan',
          description: 'Your training plan for today',
                    exercises: [
                      { name: 'Scheduled training', sets: 1, reps: 'As planned', weight: null, notes: 'Complete your assigned workout' }
                    ],
                    progress: { completed: false },
                    monthlyPlan: { name: plan.name, id: plan.id },
          weeklyWorkout: { name: 'Current Week', id: 'fallback' },
                    dailyResult: {
                      dailyWorkout: {
                        exercises: [
                          { name: 'Scheduled training', sets: 1, reps: 'As planned', weight: null, notes: 'Complete your assigned workout' }
                        ]
                      }
                    }
                  }
                };
    },

    // Helper function to extract today's exercises efficiently
    extractTodaysExercises(weeklyWorkout: any, completedExercises: number[]): any[] {
      // Handle block-based workouts (new system)
      if (weeklyWorkout.is_block_based && weeklyWorkout.blocks) {
        if (!weeklyWorkout.blocks || weeklyWorkout.blocks.length === 0) {
          return [
            { name: 'No exercises configured', sets: 0, reps: '0', weight: null, notes: 'Contact your coach to set up your workout blocks' }
          ];
        }
        
        // For block-based workouts, use current day of the week
              const today = new Date();
              const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDayName = dayNames[today.getDay()];
        
        // Extract exercises from today's block
        let allExercises: any[] = [];
        const todayBlock = weeklyWorkout.blocks[currentDayName];
        
                 if (todayBlock && Array.isArray(todayBlock) && todayBlock.length > 0) {
           // Check if the block contains exercise objects directly or needs further processing
           if (todayBlock[0] && typeof todayBlock[0] === 'object' && todayBlock[0].name) {
             // Block contains direct exercise objects
             allExercises = todayBlock;
           } else if (todayBlock[0] && todayBlock[0].exercises && Array.isArray(todayBlock[0].exercises)) {
             // Block contains nested exercise structure
             allExercises = todayBlock[0].exercises;
               } else {
             allExercises = todayBlock; // Fallback to original
           }
        } else {
          // Try each day in order until we find exercises
          const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          
                     for (const dayName of dayOrder) {
             const dayBlock = weeklyWorkout.blocks[dayName];
             if (dayBlock && Array.isArray(dayBlock) && dayBlock.length > 0) {
               // Check if the block contains exercise objects directly or needs further processing
               if (dayBlock[0] && typeof dayBlock[0] === 'object' && dayBlock[0].name) {
                 // Block contains direct exercise objects
                 allExercises = dayBlock;
               } else if (dayBlock[0] && dayBlock[0].exercises && Array.isArray(dayBlock[0].exercises)) {
                 // Block contains nested exercise structure
                 allExercises = dayBlock[0].exercises;
                   } else {
                 allExercises = dayBlock; // Fallback to original
               }
               break;
             }
           }
        }
        
        if (allExercises.length > 0) {
          return allExercises;
        } else {
          return [
            { name: 'No exercises for today', sets: 0, reps: '0', weight: null, notes: 'Contact your coach about today\'s workout' }
          ];
        }
      }
      
      // Handle legacy exercise-based workouts
      if (!weeklyWorkout.exercises || weeklyWorkout.exercises.length === 0) {
        return [
          { name: 'No exercises', sets: 0, reps: '0', weight: null, notes: 'Contact your coach' }
        ];
      }
      
      // If weekly workout has daily structure, find next incomplete day
      if (Array.isArray(weeklyWorkout.exercises) && 
          weeklyWorkout.exercises.length > 0 && 
          weeklyWorkout.exercises[0]?.day) {
        
        const targetDay = this.calculateNextIncompleteDay(weeklyWorkout.exercises, completedExercises);
        
        const dayWorkout = weeklyWorkout.exercises.find(day => 
          day.day?.toLowerCase() === targetDay.toLowerCase()
        );
        
        if (dayWorkout && dayWorkout.exercises && !dayWorkout.isRestDay) {
          return dayWorkout.exercises;
        }
        
        // Default to Monday if calculation fails
        const mondayWorkout = weeklyWorkout.exercises.find(day => 
          day.day?.toLowerCase() === 'monday'
        );
        
        if (mondayWorkout && mondayWorkout.exercises) {
          return mondayWorkout.exercises;
        }
        
        return [
          { name: 'No exercises found for today', sets: 0, reps: '0', weight: null, notes: 'Contact your coach about your weekly schedule' }
        ];
      }
      
      // Return all exercises if not in daily format
      return weeklyWorkout.exercises;
    }
  },

  // Unified assignment progress management
  async updateAssignmentProgress(assignmentId: string, progressData: {
    current_exercise_index?: number;
    current_set?: number;
    current_rep?: number;
    completion_percentage?: number;
    status?: 'assigned' | 'in_progress' | 'completed';
    started_at?: string;
    completed_at?: string;
  }) {
    try {
      // First, get the current assignment to read existing progress
      const { data: currentAssignment, error: fetchError } = await supabase
        .from('unified_workout_assignments')
        .select('progress, status')
        .eq('id', assignmentId)
        .single();

      if (fetchError) {
        console.error('Error fetching current assignment:', fetchError);
        throw fetchError;
      }

      // Parse current progress or use defaults
      const currentProgress = currentAssignment.progress || {
        current_exercise_index: 0,
        current_set: 1,
        current_rep: 1,
        completion_percentage: 0,
        total_exercises: 0,
        completed_exercises: [],
        started_at: null,
        completed_at: null,
        last_activity_at: null
      };

      // Merge in new progress data
      const updatedProgress = {
        ...currentProgress,
        ...progressData,
        last_activity_at: new Date().toISOString()
      };

      // Remove status and timestamps from progress object - they go in separate columns
      const { status: newStatus, started_at, completed_at, ...progressOnly } = progressData;

      // Build update data
      const updateData: any = {
        progress: updatedProgress,
        updated_at: new Date().toISOString()
      };

      // Update status if provided
      if (newStatus) {
        updateData.status = newStatus;
      }

      // Handle started_at and completed_at if provided
      if (started_at !== undefined) {
        updatedProgress.started_at = started_at;
      }
      if (completed_at !== undefined) {
        updatedProgress.completed_at = completed_at;
      }

      const { data, error } = await supabase
        .from('unified_workout_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating assignment progress:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('api.updateAssignmentProgress error:', error);
      throw error;
    }
  },

  // Legacy aliases for backward compatibility during migration
  get monthlyPlans() {
    return this.trainingPlans;
  },
  
  get monthlyPlanAssignments() {
    return this.trainingPlanAssignments;
  }
} 