import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { LoadingSpinner } from '../components/LoadingSpinner'
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

  // DEBUG: Log all the data we're working with
  console.log('🔍 RoleProtectedRoute Debug:', {
    allowedRoles,
    currentPath: window.location.pathname,
    user: user ? { id: user.id, email: user.email } : null,
    profile: profile ? { 
      id: profile.id, 
      email: profile.email, 
      role: profile.role,
      roleType: typeof profile.role 
    } : null,
    authLoading,
    profileLoading,
    userEmailConfirmed: user?.email_confirmed_at ? 'YES' : 'NO'
  });

  // Explicit type-safe check
  if (profile && profile.role) {
    console.log('🔍 RoleProtectedRoute Role Check:', {
      allowedRoles,
      actualRole: profile.role,
      type: typeof profile.role,
      includes: allowedRoles.includes(profile.role)
    });
  }

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
    // If profile exists but no role, redirect to dashboard to trigger auto-fix
    if (profile && !profile.role) {
      console.log('🔧 RoleProtectedRoute: Profile has no role, redirecting to dashboard for auto-fix');
      return <Navigate to="/dashboard" />;
    }
    // If no profile at all, redirect to signup
    return <Navigate to="/signup" />;
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
        return <Navigate to="/coach/dashboard" />
      case 'team_manager':
        return <Navigate to="/team-manager/dashboard" />
      case 'athlete':
        return <Navigate to="/athlete/dashboard" />
      default:
        return <Navigate to="/dashboard" />
    }
  }

  return <>{children}</>
} 