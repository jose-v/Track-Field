import { Outlet, useLocation } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { PageContainer } from '../components/PageContainer'
import { Footer } from '../components/Footer'
import FeedbackProvider from '../components/FeedbackProvider'
import usePageClass from '../hooks/usePageClass'
import { Box } from '@chakra-ui/react'

const PublicLayout = () => {
  usePageClass('public-page')
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isPrivate = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/coach') || location.pathname.startsWith('/athlete')
  const fullWidth = !isPrivate
  return (
    <FeedbackProvider>
      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navigation />
        <PageContainer py={0} fullWidth={fullWidth} flex="1" minH="calc(100vh - 64px - 120px)">
          <Outlet />
        </PageContainer>
        <Footer />
      </Box>
    </FeedbackProvider>
  )
}

export default PublicLayout 