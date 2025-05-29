import { ReactNode } from 'react'
import { ChakraProvider, useColorMode } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { GamificationProvider } from '../contexts/GamificationContext'
import { ChatbotProvider } from '../components/ChatBot/ChatbotProvider'
import { theme } from '../theme'
import GlobalStylePatch from './GlobalStylePatch'
import ButtonStyleFixer from './ButtonStyleFixer'
import { useEffect } from 'react'

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

  useEffect(() => {
    if (!loading) {
      const targetMode = user ? 'dark' : 'light'
      
      // Only change if we need to, to avoid unnecessary re-renders
      if (colorMode !== targetMode) {
        setColorMode(targetMode)
      }
    }
  }, [user, loading, colorMode, setColorMode])

  // Don't render children until auth state is determined to avoid flicker
  if (loading) {
    return null
  }

  return <>{children}</>
}

export const RootProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ChakraProvider theme={theme}>
      <GlobalStylePatch />
      <ButtonStyleFixer />
      <AuthProvider>
        <ColorModeManager>
          <GamificationProvider>
            <ChatbotProvider>
              {children}
            </ChatbotProvider>
          </GamificationProvider>
        </ColorModeManager>
      </AuthProvider>
    </ChakraProvider>
  </QueryClientProvider>
)

export default RootProviders 