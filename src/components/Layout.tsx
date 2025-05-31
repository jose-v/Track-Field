import { Box, useColorModeValue } from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import { PageContainer } from './PageContainer'

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const bgColor = useColorModeValue('gray.50', 'gray.900')

  return (
    <Box bg={bgColor} minH="100vh">
      {/* No navigation bar - this layout is only used temporarily for /dashboard before redirect */}
      <PageContainer py={6}>
        {children}
      </PageContainer>
    </Box>
  )
} 