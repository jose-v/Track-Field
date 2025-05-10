import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import type { Workout, Exercise } from '../services/api'
import { useToast } from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from './useProfile'

export type { Workout, Exercise }

export function useWorkouts() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { user } = useAuth()
  const { profile } = useProfile()

  const workoutsQuery = useQuery<Workout[], Error>({
    queryKey: ['workouts', user?.id, profile?.role],
    queryFn: async (): Promise<Workout[]> => {
      console.log('Fetching workouts for user:', user?.id, 'role:', profile?.role);
      if (!user?.id || !profile?.role) return [];
      if (profile.role === 'athlete') {
        const data = await api.workouts.getAssignedToAthlete(user.id);
        console.log('Assigned workouts for athlete', user.id, data);
        return data as Workout[];
      } else if (profile.role === 'coach') {
        const data = await api.workouts.getByCreator(user.id);
        console.log('Workouts for coach', user.id, data);
        return data;
      } else {
        return [];
      }
    },
    enabled: !!user?.id && !!profile?.role,
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const createWorkout = useMutation<
    Workout,
    Error,
    Omit<Workout, 'id' | 'user_id' | 'created_at'>
  >({
    mutationFn: api.workouts.create,
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
    mutationFn: ({ id, workout }) => api.workouts.update(id, workout),
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
    mutationFn: api.workouts.delete,
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
      const newWorkout = await api.workouts.create(data);
      
      await queryClient.invalidateQueries({ queryKey: ['workouts'] });
      
      return newWorkout;
    },
    updateWorkout: updateWorkout.mutate,
    deleteWorkout: deleteWorkout.mutate,
  }
} 