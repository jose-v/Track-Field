import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService, WorkoutAssignment, AssignmentFilters, ProgressUpdate } from '../services/assignmentService';

/**
 * Simplified hooks for the unified assignment system
 * TODO: Integrate with proper authentication once user ID property is confirmed
 */

/**
 * Hook to get all assignments for a specific athlete ID
 */
export function useUnifiedAssignments(athleteId: string | undefined, filters?: AssignmentFilters) {
  return useQuery({
    queryKey: ['unified-assignments', athleteId, filters],
    queryFn: () => {
      if (!athleteId) throw new Error('No athlete ID provided');
      return assignmentService.getAssignments(athleteId, filters);
    },
    enabled: !!athleteId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get today's workout assignment for a specific athlete
 */
export function useUnifiedTodaysWorkout(athleteId: string | undefined) {
  return useQuery({
    queryKey: ['unified-todays-assignment', athleteId],
    queryFn: () => {
      if (!athleteId) throw new Error('No athlete ID provided');
      return assignmentService.getTodaysAssignment(athleteId);
    },
    enabled: !!athleteId,
    staleTime: 1 * 60 * 1000, // 1 minute for today's workout
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get assignments by type (single, weekly, monthly)
 */
export function useUnifiedAssignmentsByType(
  athleteId: string | undefined, 
  assignmentType: 'single' | 'weekly' | 'monthly'
) {
  return useQuery({
    queryKey: ['unified-assignments-by-type', athleteId, assignmentType],
    queryFn: () => {
      if (!athleteId) throw new Error('No athlete ID provided');
      return assignmentService.getAssignments(athleteId, { assignment_type: assignmentType });
    },
    enabled: !!athleteId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

/**
 * Hook to get progress summary for analytics
 */
export function useUnifiedProgressSummary(
  athleteId: string | undefined, 
  dateRange?: { start: string; end: string }
) {
  return useQuery({
    queryKey: ['unified-progress-summary', athleteId, dateRange],
    queryFn: () => {
      if (!athleteId) throw new Error('No athlete ID provided');
      return assignmentService.getProgressSummary(athleteId, dateRange);
    },
    enabled: !!athleteId,
    staleTime: 5 * 60 * 1000, // 5 minutes for analytics
  });
}

/**
 * Hook for assignment actions (create, update progress, reset)
 */
export function useUnifiedAssignmentActions() {
  const queryClient = useQueryClient();

  // Create new assignment mutation
  const createAssignment = useMutation({
    mutationFn: assignmentService.createAssignment.bind(assignmentService),
    onSuccess: () => {
      // Invalidate and refetch assignments
      queryClient.invalidateQueries({ queryKey: ['unified-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['unified-todays-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['unified-assignments-by-type'] });
      // Assignment created successfully - log removed to prevent console flooding
    },
    onError: (error) => {
      console.error('Error creating assignment:', error);
    },
  });

  // Update progress mutation
  const updateProgress = useMutation({
    mutationFn: ({ assignmentId, progressUpdate }: { assignmentId: string; progressUpdate: ProgressUpdate }) =>
      assignmentService.updateProgress(assignmentId, progressUpdate),
    onSuccess: (updatedAssignment) => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['unified-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['unified-todays-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['unified-progress-summary'] });
      
      // Progress updated successfully - log removed to prevent console flooding
    },
    onError: (error) => {
      console.error('Error updating progress:', error);
    },
  });

  // Reset progress mutation
  const resetProgress = useMutation({
    mutationFn: (assignmentId: string) => assignmentService.resetProgress(assignmentId),
    onSuccess: () => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['unified-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['unified-todays-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['unified-progress-summary'] });
      
      // Progress reset successfully - log removed to prevent console flooding
    },
    onError: (error) => {
      console.error('Error resetting progress:', error);
    },
  });

  return {
    createAssignment,
    updateProgress,
    resetProgress,
  };
}

/**
 * Hook to get a specific assignment by ID
 */
export function useUnifiedAssignment(assignmentId: string | undefined) {
  return useQuery({
    queryKey: ['unified-assignment', assignmentId],
    queryFn: async () => {
      if (!assignmentId) throw new Error('Missing assignment ID');
      
      // For now, we'll need to get all assignments and filter
      // This can be optimized later with a direct service method
      const queryClient = useQueryClient();
      const cachedAssignments = queryClient.getQueryData(['unified-assignments']) as WorkoutAssignment[] | undefined;
      
      if (cachedAssignments) {
        const assignment = cachedAssignments.find(a => a.id === assignmentId);
        if (assignment) return assignment;
      }
      
      throw new Error('Assignment not found in cache - ensure assignments are loaded first');
    },
    enabled: !!assignmentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Composite hook that provides everything needed for assignment management
 */
export function useUnifiedAssignmentManager(athleteId: string | undefined) {
  const assignments = useUnifiedAssignments(athleteId);
  const todaysWorkout = useUnifiedTodaysWorkout(athleteId);
  const progressSummary = useUnifiedProgressSummary(athleteId);
  const actions = useUnifiedAssignmentActions();

  // Derived state
  const activeAssignments = assignments.data?.filter(a => a.status === 'in_progress') || [];
  const completedAssignments = assignments.data?.filter(a => a.status === 'completed') || [];
  const assignedWorkouts = assignments.data?.filter(a => a.status === 'assigned') || [];

  // Helper functions
  const getAssignmentsByType = (type: 'single' | 'weekly' | 'monthly') => 
    assignments.data?.filter(a => a.assignment_type === type) || [];

  const hasWorkoutToday = !!todaysWorkout.data;
  const todaysProgress = todaysWorkout.data?.progress.completion_percentage || 0;

  return {
    // Data
    assignments,
    todaysWorkout,
    progressSummary,
    
    // Derived state
    activeAssignments,
    completedAssignments, 
    assignedWorkouts,
    hasWorkoutToday,
    todaysProgress,
    
    // Actions
    ...actions,
    
    // Helpers
    getAssignmentsByType,
    isLoading: assignments.isLoading || todaysWorkout.isLoading,
    error: assignments.error || todaysWorkout.error,
  };
}

/**
 * Hook for real-time workout execution with timer and state management
 */
export function useUnifiedWorkoutExecution(assignmentId: string) {
  const [isActive, setIsActive] = React.useState(false);
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [currentExercise, setCurrentExercise] = React.useState(0);
  const queryClient = useQueryClient();
  
  // Timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isActive]);

  // Start execution mutation
  const startExecution = useMutation({
    mutationFn: async () => {
      // Just mark as started - the service will handle the progress update
      return assignmentService.updateProgress(assignmentId, {
        current_exercise_index: 0,
      });
    },
    onSuccess: () => {
      setIsActive(true);
      queryClient.invalidateQueries({ queryKey: ['unified-assignments'] });
    },
  });

  // Pause execution mutation
  const pauseExecution = useMutation({
    mutationFn: async () => {
      // Just update current state
      return assignmentService.updateProgress(assignmentId, {
        current_exercise_index: currentExercise,
      });
    },
    onSuccess: () => {
      setIsActive(false);
    },
  });

  // Stop execution mutation
  const stopExecution = useMutation({
    mutationFn: async () => {
      return assignmentService.updateProgress(assignmentId, {
        workout_completed: true,
        time_spent_seconds: elapsedTime,
      });
    },
    onSuccess: () => {
      setIsActive(false);
      queryClient.invalidateQueries({ queryKey: ['unified-assignments'] });
    },
  });

  // Next exercise mutation
  const nextExercise = useMutation({
    mutationFn: async () => {
      const newIndex = currentExercise + 1;
      setCurrentExercise(newIndex);
      return assignmentService.updateProgress(assignmentId, {
        current_exercise_index: newIndex,
      });
    },
  });

  // Previous exercise mutation  
  const prevExercise = useMutation({
    mutationFn: async () => {
      const newIndex = Math.max(0, currentExercise - 1);
      setCurrentExercise(newIndex);
      return assignmentService.updateProgress(assignmentId, {
        current_exercise_index: newIndex,
      });
    },
  });

  // Complete exercise mutation
  const completeExercise = useMutation({
    mutationFn: async ({ exerciseId, completed }: { exerciseId: string; completed: boolean }) => {
      const exerciseIndex = parseInt(exerciseId.replace('ex', '')) - 1; // Convert ex1 -> 0, ex2 -> 1, etc.
      return assignmentService.updateProgress(assignmentId, {
        exercise_completed: completed,
        completed_exercises: [exerciseIndex],
      });
    },
  });

  // Reset execution mutation
  const resetExecution = useMutation({
    mutationFn: async () => {
      return assignmentService.resetProgress(assignmentId);
    },
    onSuccess: () => {
      setIsActive(false);
      setElapsedTime(0);
      setCurrentExercise(0);
      queryClient.invalidateQueries({ queryKey: ['unified-assignments'] });
    },
  });

  return {
    currentExercise,
    isActive,
    elapsedTime,
    startExecution,
    pauseExecution,
    stopExecution,
    nextExercise,
    prevExercise,
    completeExercise,
    resetExecution,
  };
} 