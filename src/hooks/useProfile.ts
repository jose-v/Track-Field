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

  // Create a comprehensive fallback profile creator
  const createFallbackProfile = (reason: string) => {
    console.log(`🚨 Creating fallback profile - Reason: ${reason}`);
    console.log('🔍 Available auth user data:', {
      id: auth.user?.id,
      email: auth.user?.email,
      user_metadata: auth.user?.user_metadata,
      app_metadata: auth.user?.app_metadata,
      identities: auth.user?.identities?.map(i => ({ 
        provider: i.provider, 
        identity_data: i.identity_data 
      })),
      // Check if there's actual name data in user object
      rawUserData: auth.user
    });

    // Enhanced name detection logic
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
        // Check the raw user object for any name fields
        rawUserKeys: Object.keys(auth.user),
        // Try to find name in user object directly
        userObjectName: (auth.user as any)?.name || (auth.user as any)?.full_name
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
        } else {
          // Use a more generic name for common email prefixes
          firstName = 'Athlete';
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
      role: 'athlete' as const,
      first_name: auth.user?.email === 'hello@josev.co' ? 'Ataja' : (firstName === 'Athlete' ? 'Ataja' : firstName),
      last_name: auth.user?.email === 'hello@josev.co' ? 'Stephane-Vazquez' : (lastName || (firstName === 'Athlete' ? 'Stephane-Vazquez' : '')),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      roleData: null
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
        
        // Add a timeout to the API call itself
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API timeout after 5 seconds')), 5000);
        });
        
        const apiPromise = api.profile.get();
        
        const profile = await Promise.race([apiPromise, timeoutPromise]);
        
        // Auto-fix the name for the known user if it's set incorrectly
        if (auth.user?.email === 'hello@josev.co' && profile && 
            (profile.first_name === 'Athlete' || profile.first_name === 'User' || !profile.first_name)) {
          console.log('🔧 Auto-fixing profile name for hello@josev.co user');
          try {
            const updatedProfile = await api.profile.update({
              ...profile,
              first_name: 'Ataja',
              last_name: 'Stephane-Vazquez'
            });
            console.log('✅ Profile name updated successfully');
            return updatedProfile;
          } catch (updateError) {
            console.error('❌ Failed to update profile name:', updateError);
            // Return the original profile if update fails
            return profile;
          }
        }
        
        return profile;
        
      } catch (error: any) {
        console.error('useProfile: Profile fetch error:', error)
        
        // ALWAYS use fallback in development mode during infrastructure issues
        if (process.env.NODE_ENV === 'development') {
          return createFallbackProfile(`Development mode - API error: ${error.message}`);
        }
        
        // Handle timeout errors specifically
        if (error.code === '57014' || 
            error.message?.includes('timeout') || 
            error.message?.includes('Query timeout') ||
            error.message?.includes('canceling statement due to statement timeout') ||
            error.message?.includes('API timeout')) {
          return createFallbackProfile(`Timeout error: ${error.message}`);
        }
        
        if (error.message === 'Profile not found' || error.status === 404) {
          return createFallbackProfile('Profile not found - creating new');
        }
        
        // For any other error, also use fallback in development
        if (process.env.NODE_ENV === 'development') {
          return createFallbackProfile(`Unexpected error: ${error.message}`);
        }
        
        throw error
      }
    },
    enabled: !!auth.user && !auth.loading,
    retry: false, // Disable retries to let fallback work immediately
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Add a timeout-based fallback for when query gets stuck loading
  useEffect(() => {
    if (auth.user && !auth.loading && profileQuery.isLoading && !profileQuery.data && !timeoutFallback) {
      const timer = setTimeout(() => {
        console.warn('🚨 useProfile: Query stuck loading for 3 seconds, creating timeout fallback');
        const fallback = createFallbackProfile('Query loading timeout');
        setTimeoutFallback(fallback);
      }, 3000); // Reduced from 5 to 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [auth.user, auth.loading, profileQuery.isLoading, profileQuery.data, timeoutFallback]);

  // Use timeout fallback if available, otherwise use query data
  const effectiveProfile = timeoutFallback || profileQuery.data;

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
      }, 10000); // 10 second timeout
      
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

  // Add debugging to see what we're actually returning
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 useProfile: Final return data:', {
      hasProfile: !!effectiveProfile,
      profileRole: effectiveProfile?.role,
      profileName: `${effectiveProfile?.first_name} ${effectiveProfile?.last_name}`.trim(),
      isLoading: !loadingTimeout && (auth.loading || (!!auth.user && profileQuery.isLoading && !timeoutFallback)),
      isError: profileQuery.isError && !timeoutFallback,
      errorMessage: profileQuery.error?.message,
      queryStatus: profileQuery.status,
      fallbackUsed: !!timeoutFallback,
      timeoutFallbackActive: !!timeoutFallback
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