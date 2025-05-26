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
      // Log the variables being sent to ensure proper data flow
      console.log('======== UPDATE PROFILE MUTATION START ========');
      console.log('Update profile variables:', variables);
      console.log('Role data type check:', {
        type: typeof variables.roleData,
        isNull: variables.roleData === null,
        isUndefined: variables.roleData === undefined,
        hasGender: variables.roleData?.gender !== undefined,
        hasBirthDate: variables.roleData?.birth_date !== undefined,
        hasEvents: variables.roleData?.events !== undefined,
        eventsIsArray: Array.isArray(variables.roleData?.events)
      });
      
      // For coach profiles, check the data more thoroughly
      if (variables.profile.role === 'coach') {
        console.log('COACH PROFILE UPDATE DETAILS:');
        console.log('- Gender:', variables.roleData?.gender);
        console.log('- Birth date:', variables.roleData?.birth_date);
        console.log('- Events:', variables.roleData?.events);
        
        // Force fix any issues with events data
        if (variables.roleData && !Array.isArray(variables.roleData.events)) {
          console.warn('Fixing events array for coach data');
          variables.roleData.events = variables.roleData.events ? [variables.roleData.events] : [];
        }
        
        // Force fix empty gender
        if (variables.roleData && !variables.roleData.gender) {
          console.warn('Gender is empty in coach data, using default');
          variables.roleData.gender = 'male'; // Default to male if not set
        }
      }
      
      try {
        // Ensure api.profile.updateWithRoleData exists and is the correct function to call.
        if (typeof api.profile.updateWithRoleData === 'function') {
          console.log('Using updateWithRoleData with profile and role data');
          return await api.profile.updateWithRoleData(variables.profile, variables.roleData);
        } else {
          // Fallback or error if the specific update function isn't appropriate/available
          console.warn('api.profile.updateWithRoleData not found or not used, falling back to api.profile.update');
          return await api.profile.update(variables.profile);
        }
      } catch (error) {
        console.error('Mutation error in updateProfile:', error);
        // If normal update fails, try the direct method for coaches
        if (variables.profile.role === 'coach' && variables.roleData) {
          console.log('Normal update failed, trying direct coach update method...');
          try {
            const directResult = await api.profile.updateCoachDirectly(
              variables.profile.id || '',
              variables.roleData
            );
            console.log('Direct coach update successful:', directResult);
            return directResult;
          } catch (directError) {
            console.error('Direct coach update also failed:', directError);
            throw directError;
          }
        } else {
          throw error;
        }
      }
    }, 
    onSuccess: (data, variables) => {
      console.log('Profile update successful:', data);
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
      console.error('Profile update error:', error);
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