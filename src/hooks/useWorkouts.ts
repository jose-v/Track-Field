import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useToast } from '@chakra-ui/react'

export function useWorkouts() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const workouts = useQuery({
    queryKey: ['workouts'],
    queryFn: () => api.workouts.getAll(),
  })

  const createWorkout = useMutation({
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

  const updateWorkout = useMutation({
    mutationFn: ({ id, workout }: { id: string; workout: any }) =>
      api.workouts.update(id, workout),
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

  const deleteWorkout = useMutation({
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
    workouts: workouts.data || [],
    isLoading: workouts.isLoading,
    isError: workouts.isError,
    error: workouts.error,
    createWorkout: createWorkout.mutate,
    updateWorkout: updateWorkout.mutate,
    deleteWorkout: deleteWorkout.mutate,
  }
} 