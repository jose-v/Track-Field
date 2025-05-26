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
  const { profile } = useProfile()
  const { callApiWithAuth } = useApiWithAuth()

  const workoutsQuery = useQuery<Workout[], Error>({
    queryKey: ['workouts', user?.id, profile?.role],
    queryFn: async (): Promise<Workout[]> => {
      console.log('Fetching workouts for user:', user?.id, 'role:', profile?.role);
      if (!user?.id || !profile?.role) return [];
      
      try {
        if (profile.role === 'athlete') {
          return await callApiWithAuth(async () => {
            const data = await api.workouts.getAssignedToAthlete(user.id);
            console.log('Assigned workouts for athlete', user.id, data?.length || 0);
            return data as Workout[];
          }, { maxRetries: 2 });
        } else if (profile.role === 'coach') {
          return await callApiWithAuth(async () => {
            const data = await api.workouts.getByCreator(user.id);
            console.log('Workouts for coach', user.id, data?.length || 0);
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
    enabled: !!user?.id && !!profile?.role,
    staleTime: 1000, // Reduce stale time for faster updates
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
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

  const deleteWorkout = useMutation<
    void,
    Error,
    string
  >({
    mutationFn: async (id) => {
      return await callApiWithAuth(async () => {
        return api.workouts.delete(id);
      }, { maxRetries: 2 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      toast({
        title: 'Success',
        description: 'Workout deleted successfully',
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
  }
} 