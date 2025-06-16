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

    return fallbackProfile;
  };

  const profileQuery = useQuery({
    queryKey: ['profile', auth.user?.id],
    queryFn: async () => {
      if (!auth.user?.id) {
        throw new Error('Profile query function called without a user ID.')
      }
      
      try {
        // Increase timeout for better reliability
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API timeout after 15 seconds')), 15000);
        });
        
        const apiPromise = api.profile.get();
        
        const profile = await Promise.race([apiPromise, timeoutPromise]);
        
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
          return createFallbackProfile(`Database connectivity error: ${error.message}`);
        }
        
        if (error.message === 'Profile not found' || error.status === 404) {
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
      setTimeoutFallback(null);
    }
  }, [profileQuery.data, timeoutFallback]);

  // Add timeout for loading states to prevent infinite loading
  useEffect(() => {
    if (auth.loading || (!!auth.user && profileQuery.isLoading && !timeoutFallback)) {
      const timer = setTimeout(() => {
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
      // Clean up roleData before sending
      if (variables.roleData) {
        // Fix events array if it's not an array
        if (variables.roleData.events && !Array.isArray(variables.roleData.events)) {
          if (typeof variables.roleData.events === 'string') {
            variables.roleData.events = variables.roleData.events.split(',').map((e: string) => e.trim()).filter(Boolean);
          } else {
            variables.roleData.events = [variables.roleData.events];
          }
        }
        
        // Convert empty strings to null for proper database storage
        if (variables.roleData.gender === '') variables.roleData.gender = null;
        if (variables.roleData.date_of_birth === '') variables.roleData.date_of_birth = null;
      }
      
      try {
        // Always use updateWithRoleData for better consistency
        return await api.profile.updateWithRoleData(variables.profile, variables.roleData);
      } catch (error) {
        console.error('Mutation error in updateProfile:', error);
        throw error;
      }
    }, 
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      toast({
        title: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
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