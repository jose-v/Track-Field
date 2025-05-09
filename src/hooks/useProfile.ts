import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useToast } from '@chakra-ui/react'

export function useProfile() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.profile.get(),
  })

  const updateProfile = useMutation({
    mutationFn: api.profile.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })

  return {
    profile: profile.data,
    isLoading: profile.isLoading,
    isError: profile.isError,
    error: profile.error,
    updateProfile: updateProfile.mutate,
  }
} 