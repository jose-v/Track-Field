import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export function useProfileDisplay() {
  const auth = useAuth()

  const profileQuery = useQuery({
    queryKey: ['profile-display', auth.user?.id],
    queryFn: async () => {
      if (!auth.user?.id) {
        throw new Error('No user ID available')
      }
      
      console.log('🚀 useProfileDisplay: Fetching lightweight profile data')
      return await api.profile.getLightweight()
    },
    enabled: !!auth.user && !auth.loading,
    retry: 1, // Only retry once for faster failures
    retryDelay: 500, // Quick retry
    staleTime: 30 * 60 * 1000, // 30 minutes - profile display data doesn't change often
    gcTime: 60 * 60 * 1000, // 1 hour cache
  })

  // Simple display name helper
  const displayName = profileQuery.data 
    ? `${profileQuery.data.first_name || ''} ${profileQuery.data.last_name || ''}`.trim() || 'User'
    : 'User'

  // Simple initials helper  
  const initials = profileQuery.data
    ? `${profileQuery.data.first_name?.[0] || ''}${profileQuery.data.last_name?.[0] || ''}`.toUpperCase() || 'U'
    : 'U'

  return {
    profile: profileQuery.data,
    displayName,
    initials,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
  }
} 