import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useApiWithAuth } from '../utils/apiUtils';
import { useAuth } from '../contexts/AuthContext';
import { useCallback } from 'react';

interface WorkoutCompletionStats {
  workoutId: string;
  totalAssigned: number;
  completedCount: number;
  percentage: number;
  exerciseCount?: number;
  inProgressCount?: number;
}

export function useWorkoutCompletionStats(workoutIds: string[]) {
  const queryClient = useQueryClient();
  const { callApiWithAuth } = useApiWithAuth();
  const { refreshSession } = useAuth();
  
  const {
    data: completionStats,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<WorkoutCompletionStats[]>({
    queryKey: ['workoutCompletionStats', workoutIds],
    queryFn: async () => {
      if (!workoutIds || workoutIds.length === 0) return [];
      
      try {
        return await callApiWithAuth(async () => {
          return api.athleteWorkouts.getCompletionStatsForMultipleWorkouts(workoutIds);
        }, { maxRetries: 2 });
      } catch (error) {
        console.error('Error fetching completion stats:', error);
        // Try to refresh the session
        await refreshSession();
        throw error;
      }
    },
    enabled: workoutIds && workoutIds.length > 0,
    staleTime: 60000, // 1 minute stale time for better performance
    refetchInterval: false, // Disable automatic refetching to improve performance
    refetchOnWindowFocus: false, // Disable refetch on focus for better performance  
    refetchOnMount: true, // Only refetch when component mounts
    retry: 2, // Reduce retry attempts
  });

  // Function to manually force a refresh of stats
  const forceRefresh = async () => {
    try {
      // Force invalidate the query to trigger a refetch
      await queryClient.invalidateQueries({ queryKey: ['workoutCompletionStats'] });
      
      // Also try to refresh auth session on manual refresh
      await refreshSession();
      
      return refetch();
    } catch (error) {
      console.error('Error during forceRefresh:', error);
      return refetch();
    }
  };

  const fetchStats = useCallback(async (workoutIds: string[]) => {
    if (!workoutIds.length) {
      return [];
    }

    try {
      return await api.athleteWorkouts.getCompletionStatsForMultipleWorkouts(workoutIds);
    } catch (error) {
      console.error('Failed to fetch workout completion stats:', error);
      return [];
    }
  }, []);

  return {
    completionStats: completionStats || [],
    isLoading,
    isError,
    error,
    refetch: forceRefresh, // Use our enhanced refetch function
    getStatsForWorkout: (workoutId: string) => {
      return completionStats?.find(stat => stat.workoutId === workoutId) || {
        workoutId,
        totalAssigned: 0,
        completedCount: 0,
        percentage: 0,
        exerciseCount: 0,
        inProgressCount: 0
      };
    },
    fetchStats
  };
} 