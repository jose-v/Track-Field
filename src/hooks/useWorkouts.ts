import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import type { Workout, Exercise } from '../services/api'
import { useToast } from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from './useProfile'
import { useApiWithAuth } from '../utils/apiUtils'

export type { Workout, Exercise }

export function useWorkouts() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { user, refreshSession } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile()
  const { callApiWithAuth } = useApiWithAuth()

  const workoutsQuery = useQuery<Workout[], Error>({
    queryKey: ['workouts', user?.id, profile?.role],
    queryFn: async (): Promise<Workout[]> => {
      if (!user?.id) return [];
      
      // If profile is still loading, don't make the query yet
      if (profileLoading) {
        return [];
      }
      
      // If no profile role, assume coach for now (most coach pages call this)
      const userRole = profile?.role || 'coach';
      
      try {
        if (userRole === 'athlete') {
          return await callApiWithAuth(async () => {
            const data = await api.workouts.getAssignedToAthlete(user.id);
            return data as Workout[];
          }, { maxRetries: 2 });
        } else if (userRole === 'coach') {
          return await callApiWithAuth(async () => {
            const data = await api.workouts.getByCreator(user.id, { includeTemplates: false });
            return data;
          }, { maxRetries: 2 });
        } else {
          return [];
        }
      } catch (error) {
        console.error('Error fetching workouts:', error);
        // Attempt to refresh the session on error
        await refreshSession();
        throw error;
      }
    },
    enabled: !!user?.id && !profileLoading, // Don't run while profile is loading
    staleTime: 30000, // 30 seconds - more reasonable cache time
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: false, // 🚨 DISABLED - was causing 17K+ requests/day!
    retry: 3, // Add retry attempts
  })

  const createWorkout = useMutation<
    Workout,
    Error,
    Omit<Workout, 'id' | 'user_id' | 'created_at'>
  >({
    mutationFn: async (workoutData) => {
      return await callApiWithAuth(async () => {
        return api.workouts.create(workoutData);
      }, { maxRetries: 2 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      toast({
        title: 'Success',
        description: 'Workout created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      console.error('Error creating workout:', error);
      refreshSession(); // Try to refresh on error
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to create workout',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })

  const updateWorkout = useMutation<
    Workout,
    Error,
    { id: string; workout: Partial<Workout> }
  >({
    mutationFn: async ({ id, workout }) => {
      return await callApiWithAuth(async () => {
        return api.workouts.update(id, workout);
      }, { maxRetries: 2 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      toast({
        title: 'Success',
        description: 'Workout updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      console.error('Error updating workout:', error);
      refreshSession(); // Try to refresh on error
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to update workout',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })

  const checkMonthlyPlanUsage = useMutation<
    { isUsed: boolean; monthlyPlans: { id: string; name: string }[] },
    Error,
    string
  >({
    mutationFn: async (workoutId) => {
      return await callApiWithAuth(async () => {
        return api.workouts.checkMonthlyPlanUsage(workoutId);
      }, { maxRetries: 2 });
    },
    onError: (error) => {
      console.error('Error checking monthly plan usage:', error);
      refreshSession();
      
      toast({
        title: 'Error',
        description: 'Failed to check workout usage',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })

  const batchCheckMonthlyPlanUsage = useMutation<
    Record<string, { isUsed: boolean; monthlyPlans: { id: string; name: string }[] }>,
    Error,
    string[]
  >({
    mutationFn: async (workoutIds) => {
      return await callApiWithAuth(async () => {
        return api.workouts.batchCheckMonthlyPlanUsage(workoutIds);
      }, { maxRetries: 2 });
    },
    onError: (error) => {
      console.error('Error batch checking monthly plan usage:', error);
      refreshSession();
    },
  })

  const removeFromMonthlyPlans = useMutation<
    void,
    Error,
    { workoutId: string; planIds: string[] }
  >({
    mutationFn: async ({ workoutId, planIds }) => {
      return await callApiWithAuth(async () => {
        return api.workouts.removeFromMonthlyPlans(workoutId, planIds);
      }, { maxRetries: 2 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyPlans'] })
      toast({
        title: 'Success',
        description: 'Workout removed from monthly plans',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      console.error('Error removing from monthly plans:', error);
      refreshSession();
      
      toast({
        title: 'Error',
        description: 'Failed to remove workout from monthly plans',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })

  const deleteWorkout = useMutation<
    void,
    Error,
    string
  >({
    mutationFn: async (id) => {
      return await callApiWithAuth(async () => {
        return api.workouts.softDelete(id);
      }, { maxRetries: 2 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      toast({
        title: 'Success',
        description: 'Workout moved to recycle bin',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      console.error('Error deleting workout:', error);
      refreshSession(); // Try to refresh on error
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete workout',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })

  return {
    workouts: workoutsQuery.data || [],
    isLoading: workoutsQuery.isLoading,
    isError: workoutsQuery.isError,
    error: workoutsQuery.error,
    refetch: workoutsQuery.refetch,
    createWorkout: async (data: Omit<Workout, 'id' | 'user_id' | 'created_at'>) => {
      try {
        const newWorkout = await callApiWithAuth(async () => {
          return api.workouts.create(data);
        }, { maxRetries: 2 });
        
        await queryClient.invalidateQueries({ queryKey: ['workouts'] });
        return newWorkout;
      } catch (error) {
        console.error('Error in createWorkout:', error);
        await refreshSession();
        throw error;
      }
    },
    updateWorkout: updateWorkout.mutate,
    deleteWorkout: deleteWorkout.mutate,
    deleteWorkoutAsync: deleteWorkout.mutateAsync,
    checkMonthlyPlanUsage: checkMonthlyPlanUsage.mutateAsync,
    batchCheckMonthlyPlanUsage: batchCheckMonthlyPlanUsage.mutateAsync,
    removeFromMonthlyPlans: removeFromMonthlyPlans.mutateAsync,
    isCheckingUsage: checkMonthlyPlanUsage.isPending,
    isBatchCheckingUsage: batchCheckMonthlyPlanUsage.isPending,
    isRemovingFromPlans: removeFromMonthlyPlans.isPending,
  }
} 