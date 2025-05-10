import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useToast } from '@chakra-ui/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Profile } from '../services/dbSchema'

export function useProfile() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const auth = useAuth()

  const profileQuery = useQuery({
    queryKey: ['profile', auth.user?.id],
    queryFn: async () => {
      if (!auth.user?.id) {
        throw new Error('Profile query function called without a user ID.')
      }
      try {
        console.log(`useProfile: Fetching profile for user ${auth.user.id}`)
        return await api.profile.get()
      } catch (error: any) {
        if (error.message === 'Profile not found' || error.status === 404) {
          if (!auth.user) throw new Error('Cannot create profile: No authenticated user.')
          
          console.log(`useProfile: Profile not found for ${auth.user.id}. Attempting to create one.`)
          const newProfile = {
            email: auth.user.email || '',
            role: 'athlete',
            first_name: auth.user.email?.split('@')[0] || 'New',
            last_name: 'User',
          }
          await api.profile.upsert(newProfile)
          return await api.profile.get()
        }
        throw error
      }
    },
    enabled: !!auth.user && !auth.loading,
  })

  // Define the expected type for the variables passed to updateProfile.mutate
  interface UpdateProfileVariables {
    profile: Partial<Profile>;
    roleData?: any; // roleData can be optional depending on the use case
    avatar_url?: string; // Add avatar_url property
  }

  const updateProfile = useMutation<any, Error, UpdateProfileVariables>({ 
    mutationFn: async (variables: UpdateProfileVariables) => {
      // Ensure api.profile.updateWithRoleData exists and is the correct function to call.
      // If only updating basic profile info without role-specific data, 
      // you might have a simpler api.profile.update(variables.profile) call.
      if (typeof api.profile.updateWithRoleData === 'function') {
        return api.profile.updateWithRoleData(variables.profile, variables.roleData);
      } else {
        // Fallback or error if the specific update function isn't appropriate/available
        // This assumes api.profile.update takes just Partial<Profile>
        console.warn('api.profile.updateWithRoleData not found or not used, falling back to api.profile.update');
        return api.profile.update(variables.profile);
      }
    }, 
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', auth.user?.id] })
      queryClient.setQueryData(['profile', auth.user?.id], data)
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
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading || (auth.loading && !auth.user),
    isError: profileQuery.isError,
    error: profileQuery.error,
    updateProfile: updateProfile.mutate,
    isUpdatingProfile: updateProfile.isPending,
  }
} 