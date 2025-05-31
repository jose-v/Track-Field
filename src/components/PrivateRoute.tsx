import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'
import { PWADebugger } from '../utils/pwaDebug'

interface PrivateRouteProps {
  children: React.ReactNode
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    PWADebugger.log('PrivateRoute: Auth loading');
    return <LoadingSpinner />
  }

  if (!user) {
    PWADebugger.log('PrivateRoute: No user, redirecting to login', { 
      currentPath: window.location.pathname,
      currentSearch: window.location.search 
    });
    return <Navigate to="/login" />
  }

  PWADebugger.log('PrivateRoute: User authenticated, rendering protected content', { 
    userId: user.id,
    currentPath: window.location.pathname 
  });
  return <>{children}</>
} 