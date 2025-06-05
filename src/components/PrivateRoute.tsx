import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'

interface PrivateRouteProps {
  children: React.ReactNode
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  // Check if user's email is verified
  // Note: email_confirmed_at will be null for unverified emails
  if (!user.email_confirmed_at) {
    return <Navigate to="/verify-email" />
  }

  return <>{children}</>
} 