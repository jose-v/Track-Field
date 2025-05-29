import { ReactNode } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../contexts/AuthContext'
import { GamificationProvider } from '../contexts/GamificationContext'
import { ChatbotProvider } from '../components/ChatBot/ChatbotProvider'
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

export const RootProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ChakraProvider theme={theme}>
      <GlobalStylePatch />
      <ButtonStyleFixer />
      <AuthProvider>
        <GamificationProvider>
          <ChatbotProvider>
            {children}
          </ChatbotProvider>
        </GamificationProvider>
      </AuthProvider>
    </ChakraProvider>
  </QueryClientProvider>
)

export default RootProviders 