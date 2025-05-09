import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useToast } from '@chakra-ui/react'
import { supabase } from '../lib/supabase'

export function useProfile() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        return await api.profile.get()
      } catch (error: any) {
        if (error.status === 404) {
          // Insert a new profile row for the user
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('No user found')
          // Insert with minimal/default values
          const newProfile = {
            id: user.id,
            name: user.email || '',
            role: 'Athlete',
            team: '',
            email: user.email || '',
            phone: '',
            bio: '',
            gender: '',
            dob: '',
            events: [],
          }
          await api.profile.upsert(newProfile)
          // Refetch
          return await api.profile.get()
        }
        throw error
      }
    },
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