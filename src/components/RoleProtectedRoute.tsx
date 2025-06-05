import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { LoadingSpinner } from './LoadingSpinner'
import { UserRole } from '../contexts/SignupContext'

interface RoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  redirectTo?: string
}

export function RoleProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo 
}: RoleProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile()

  // Show loading while authentication or profile is loading
  if (authLoading || profileLoading) {
    return <LoadingSpinner />
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" />
  }

  // Check if user's email is verified
  if (!user.email_confirmed_at) {
    return <Navigate to="/verify-email" />
  }

  // If profile doesn't exist or doesn't have a role, redirect to signup completion
  if (!profile || !profile.role) {
    return <Navigate to="/signup" />
  }

  // Check if user's role is allowed for this route
  if (!allowedRoles.includes(profile.role)) {
    // If redirectTo is specified, use it
    if (redirectTo) {
      return <Navigate to={redirectTo} />
    }
    
    // Otherwise, redirect to the appropriate dashboard based on user's role
    switch (profile.role) {
      case 'coach':
      case 'team_manager':
        return <Navigate to="/coach/dashboard" />
      case 'athlete':
        return <Navigate to="/athlete/dashboard" />
      default:
        return <Navigate to="/dashboard" />
    }
  }

  return <>{children}</>
} 