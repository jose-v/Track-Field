import { useEffect, useState } from 'react'
import { useToast } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const AuthErrorHandler = () => {
  const { refreshSession } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [authErrorCount, setAuthErrorCount] = useState(0)

  useEffect(() => {
    const handleAuthError = async (event: ErrorEvent) => {
      if (event.error?.message?.includes('JWT') ||
          event.error?.message?.includes('refresh token') ||
          event.error?.message?.includes('not authenticated')) {
        setAuthErrorCount(prev => prev + 1)
        const success = await refreshSession()
        if (!success && authErrorCount >= 3) {
          toast({
            title: 'Authentication Error',
            description: 'Your session has expired. Please login again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
          navigate('/login')
          setAuthErrorCount(0)
        } else if (success) {
          setAuthErrorCount(0)
        }
      }
    }

    window.addEventListener('error', handleAuthError)
    return () => window.removeEventListener('error', handleAuthError)
  }, [refreshSession, navigate, authErrorCount, toast])

  return null
}

export default AuthErrorHandler 