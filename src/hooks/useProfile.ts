import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useToast } from '@chakra-ui/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import type { Profile } from '../services/dbSchema'

export function useProfile() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const auth = useAuth()
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [timeoutFallback, setTimeoutFallback] = useState<any>(null)

  // Create a comprehensive fallback profile creator - only use when database is truly unavailable
  const createFallbackProfile = (reason: string) => {
    console.log(`🚨 Creating fallback profile - Reason: ${reason}`);
    console.log('🔍 This should only happen when database is completely unavailable');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Available auth user data:', {
        id: auth.user?.id,
        email: auth.user?.email,
        user_metadata: auth.user?.user_metadata,
        app_metadata: auth.user?.app_metadata,
        identities: auth.user?.identities?.map(i => ({ 
          provider: i.provider, 
          identity_data: i.identity_data 
        })),
        rawUserData: auth.user
      });
    }

    // Enhanced name detection logic - try to get real names from auth data
    let firstName = 'User';
    let lastName = '';

    if (auth.user) {
      // Check for any available name data from the session/user object
      const sessionName = (auth.user as any)?.name;
      const userMetadataName = auth.user.user_metadata?.name || auth.user.user_metadata?.full_name;
      const identityName = auth.user.identities?.[0]?.identity_data?.name || auth.user.identities?.[0]?.identity_data?.full_name;
      
      console.log('🔍 Name detection sources:', {
        sessionName,
        userMetadataName,
        identityName,
        firstName: auth.user.user_metadata?.first_name,
        lastName: auth.user.user_metadata?.last_name,
      });
      
      // Try multiple sources for first name with priority on actual names over metadata
      firstName = auth.user.user_metadata?.first_name || 
                 (sessionName ? sessionName.split(' ')[0] : null) ||
                 ((auth.user as any)?.name ? (auth.user as any).name.split(' ')[0] : null) ||
                 (userMetadataName ? userMetadataName.split(' ')[0] : null) ||
                 (identityName ? identityName.split(' ')[0] : null) ||
                 auth.user.user_metadata?.name?.split(' ')[0] ||
                 auth.user.user_metadata?.full_name?.split(' ')[0] ||
                 auth.user.identities?.[0]?.identity_data?.first_name ||
                 auth.user.identities?.[0]?.identity_data?.name?.split(' ')[0] ||
                 auth.user.identities?.[0]?.identity_data?.full_name?.split(' ')[0] ||
                 'User';

      // If we don't have a name yet, try to extract from email
      if (firstName === 'User' && auth.user.email) {
        const emailUsername = auth.user.email.split('@')[0];
        
        // Skip common non-name email prefixes
        const skipPrefixes = ['hello', 'contact', 'info', 'admin', 'support', 'team', 'user', 'test'];
        
        if (!skipPrefixes.includes(emailUsername.toLowerCase())) {
          // Handle common email formats like "john.doe", "john_doe", "john-doe"
          if (emailUsername.includes('.') || emailUsername.includes('_') || emailUsername.includes('-')) {
            const nameParts = emailUsername.split(/[._-]/);
            firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
            if (nameParts.length > 1) {
              lastName = nameParts.slice(1)
                .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                .join(' ');
            }
          } else {
            // Single word email like "john@domain.com"
            firstName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1).toLowerCase();
          }
        }
      }

      // Try multiple sources for last name if not already set
      if (!lastName) {
        lastName = auth.user.user_metadata?.last_name || 
                  (sessionName ? sessionName.split(' ').slice(1).join(' ') : null) ||
                  ((auth.user as any)?.name ? (auth.user as any).name.split(' ').slice(1).join(' ') : null) ||
                  (userMetadataName ? userMetadataName.split(' ').slice(1).join(' ') : null) ||
                  (identityName ? identityName.split(' ').slice(1).join(' ') : null) ||
                  auth.user.user_metadata?.name?.split(' ').slice(1).join(' ') ||
                  auth.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
                  auth.user.identities?.[0]?.identity_data?.last_name ||
                  auth.user.identities?.[0]?.identity_data?.name?.split(' ').slice(1).join(' ') ||
                  auth.user.identities?.[0]?.identity_data?.full_name?.split(' ').slice(1).join(' ') ||
                  '';
      }
    }

    const fallbackProfile = {
      id: auth.user?.id || '',
      email: auth.user?.email || '',
      role: null as any, // Don't assign a default role - let users choose
      // Use actual extracted names instead of hardcoded ones
      first_name: firstName,
      last_name: lastName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      roleData: null,
      isFallback: true // Mark this as a fallback profile
    };

    console.log(`🚨 Generated fallback profile:`, fallbackProfile);
    return fallbackProfile;
  };

  const profileQuery = useQuery({
    queryKey: ['profile', auth.user?.id],
    queryFn: async () => {
      if (!auth.user?.id) {
        throw new Error('Profile query function called without a user ID.')
      }
      
      try {
        console.log(`useProfile: Fetching profile for user ${auth.user.id}`)
        
        // Increase timeout for better reliability
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API timeout after 15 seconds')), 15000);
        });
        
        const apiPromise = api.profile.get();
        
        const profile = await Promise.race([apiPromise, timeoutPromise]);
        
        console.log('✅ Successfully fetched profile from database:', profile);
        return profile;
        
      } catch (error: any) {
        console.error('useProfile: Profile fetch error:', error)
        
        // Only use fallback for genuine database connectivity issues
        if (error.code === '57014' || 
            error.message?.includes('timeout') || 
            error.message?.includes('Query timeout') ||
            error.message?.includes('canceling statement due to statement timeout') ||
            error.message?.includes('API timeout') ||
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('NetworkError') ||
            error.message?.includes('connection')) {
          console.warn('🚨 Database connectivity issue detected, using fallback');
          return createFallbackProfile(`Database connectivity error: ${error.message}`);
        }
        
        if (error.message === 'Profile not found' || error.status === 404) {
          console.warn('🚨 Profile not found in database, using fallback');
          return createFallbackProfile('Profile not found - creating temporary profile');
        }
        
        // For other errors, re-throw to trigger React Query error handling
        throw error
      }
    },
    enabled: !!auth.user && !auth.loading,
    retry: (failureCount, error: any) => {
      // Retry network/timeout errors up to 2 times
      if (failureCount < 2) {
        if (error?.message?.includes('timeout') || 
            error?.message?.includes('Failed to fetch') ||
            error?.message?.includes('NetworkError')) {
          console.log(`Retrying profile fetch (attempt ${failureCount + 1}/3)`);
          return true;
        }
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 30 * 1000, // Reduced to 30 seconds for testing
    gcTime: 5 * 60 * 1000, // Reduced to 5 minutes  
    refetchOnWindowFocus: true, // Enable refetch to pick up role changes
    refetchOnMount: true, // Enable refetch on mount to get fresh data
  })

  // Increase timeout for loading state fallback
  useEffect(() => {
    if (auth.user && !auth.loading && profileQuery.isLoading && !profileQuery.data && !timeoutFallback) {
      const timer = setTimeout(() => {
        console.warn('🚨 useProfile: Query stuck loading for 10 seconds, creating timeout fallback');
        const fallback = createFallbackProfile('Query loading timeout after 10 seconds');
        setTimeoutFallback(fallback);
      }, 10000); // Increased from 3 to 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [auth.user, auth.loading, profileQuery.isLoading, profileQuery.data, timeoutFallback]);

  // Use timeout fallback if available, otherwise use query data
  const effectiveProfile = profileQuery.data || timeoutFallback;

  // Clear timeout fallback when real data is available
  useEffect(() => {
    if (profileQuery.data && timeoutFallback) {
      console.log('🔄 Real profile data received, clearing timeout fallback');
      setTimeoutFallback(null);
    }
  }, [profileQuery.data, timeoutFallback]);

  // Add timeout for loading states to prevent infinite loading
  useEffect(() => {
    if (auth.loading || (!!auth.user && profileQuery.isLoading && !timeoutFallback)) {
      console.log('Profile loading state:', { 
        authLoading: auth.loading, 
        hasUser: !!auth.user, 
        profileQueryLoading: profileQuery.isLoading,
        hasTimeoutFallback: !!timeoutFallback
      });
      
      const timer = setTimeout(() => {
        console.warn('Profile loading taking too long, this may indicate an issue');
        setLoadingTimeout(true)
      }, 15000); // Increased from 10 to 15 seconds
      
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false)
    }
  }, [auth.loading, auth.user, profileQuery.isLoading, timeoutFallback]);

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
        hasBirthDate: variables.roleData?.date_of_birth !== undefined,
        hasEvents: variables.roleData?.events !== undefined,
        eventsIsArray: Array.isArray(variables.roleData?.events)
      });
      
      // For coach profiles, check the data more thoroughly
      if (variables.profile.role === 'coach') {
        console.log('COACH PROFILE UPDATE DETAILS:');
        console.log('- Gender:', variables.roleData?.gender);
        console.log('- Birth date:', variables.roleData?.date_of_birth);
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

  // Reduced debugging - only log critical issues
  if (process.env.NODE_ENV === 'development' && effectiveProfile && effectiveProfile.role === null) {
    console.warn('🚨 useProfile: Profile found but role is NULL - this will cause routing issues');
    console.log('Profile details:', {
      id: effectiveProfile.id,
      email: effectiveProfile.email,
      first_name: effectiveProfile.first_name,
      last_name: effectiveProfile.last_name,
      role: effectiveProfile.role
    });
  }

  return {
    profile: effectiveProfile,
    // Simplified loading logic to prevent infinite loading states
    // Only show loading if auth is loading OR if we have a user and profile query is actively loading (and no timeout fallback)
    isLoading: !loadingTimeout && (auth.loading || (!!auth.user && profileQuery.isLoading && !timeoutFallback)),
    isError: profileQuery.isError && !timeoutFallback, // Don't show error if we have fallback
    error: profileQuery.error,
    updateProfile: updateProfile.mutate,
    isUpdatingProfile: updateProfile.isPending,
  }
} 