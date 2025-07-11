import { ReactNode, useState, useEffect } from 'react'
import { ChakraProvider, useColorMode, Box, Spinner } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { GamificationProvider } from '../contexts/GamificationContext'
import { TimeFormatProvider } from '../contexts/TimeFormatContext'
import { ChatbotProvider } from '../components/ChatBot/ChatbotProvider'
import { StripeProvider } from '../contexts/StripeContext'
import { theme } from '../theme'
import GlobalStylePatch from './GlobalStylePatch'
import ButtonStyleFixer from './ButtonStyleFixer'

// Shared query client for the whole app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000,
    },
    mutations: {
      retry: 2,
    },
  },
})

// Component to manage color mode based on authentication
const ColorModeManager = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth()
  const { colorMode, setColorMode } = useColorMode()
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    if (!loading && !hasInitialized) {
      const userColorModePreference = localStorage.getItem('chakra-ui-color-mode')
      const isAuthenticated = !!user
      
      // Only auto-set color mode if user hasn't set a manual preference
      if (!userColorModePreference) {
        const targetMode = 'dark' // Default to dark mode for all users
        setColorMode(targetMode)
      }
      
      setHasInitialized(true)
    }
  }, [user, loading, setColorMode, hasInitialized])

  // Don't show loading overlay here - let PrivateRoute handle loading states
  // This prevents double loading spinners (one overlay + one page-level)
  return <>{children}</>
}

export const RootProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ChakraProvider theme={theme}>
      <GlobalStylePatch />
      <ButtonStyleFixer />
      <AuthProvider>
        <TimeFormatProvider>
          <ColorModeManager>
            <GamificationProvider>
              <ChatbotProvider>
                <StripeProvider>
                  {children}
                </StripeProvider>
              </ChatbotProvider>
            </GamificationProvider>
          </ColorModeManager>
        </TimeFormatProvider>
      </AuthProvider>
    </ChakraProvider>
  </QueryClientProvider>
)

export default RootProviders 