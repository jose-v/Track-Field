import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface WorkoutCompletionStats {
  workoutId: string;
  totalAssigned: number;
  completedCount: number;
  percentage: number;
}

export function useWorkoutCompletionStats(workoutIds: string[]) {
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
      return api.athleteWorkouts.getCompletionStatsForMultipleWorkouts(workoutIds);
    },
    enabled: workoutIds && workoutIds.length > 0,
    staleTime: 30000, // Data becomes stale after 30 seconds
    refetchInterval: 60000, // Automatically refetch every minute
  });

  return {
    completionStats: completionStats || [],
    isLoading,
    isError,
    error,
    refetch,
    getStatsForWorkout: (workoutId: string) => {
      return completionStats?.find(stat => stat.workoutId === workoutId) || {
        workoutId,
        totalAssigned: 0,
        completedCount: 0,
        percentage: 0
      };
    }
  };
} 