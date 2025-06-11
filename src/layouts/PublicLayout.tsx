import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Box, useColorModeValue } from '@chakra-ui/react'
import Navigation from '../components/Navigation'
import { PageContainer } from '../components/PageContainer'
import FeedbackProvider from '../components/FeedbackProvider'
import usePageClass from '../hooks/usePageClass'
import { Footer } from '../components/Footer'

const PublicLayout = () => {
  usePageClass('public-page')
  const location = useLocation()
  const [showOverlay, setShowOverlay] = useState(false)
  const isHome = location.pathname === '/'
  const isPrivate = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/coach') || location.pathname.startsWith('/athlete')
  const fullWidth = !isPrivate

  // Get background colors to match the page
  const pageBg = useColorModeValue('gray.50', 'gray.900')
  const overlayBg = useColorModeValue('gray.50', 'gray.900')

  // Scroll to top and handle transition masking whenever the route changes
  useEffect(() => {
    // Show overlay immediately to mask the transition
    setShowOverlay(true)
    
    // Disable browser scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    
    // Use requestAnimationFrame to ensure DOM has updated, then scroll
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        })
        // Fallback for older browsers
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
        
        // Wait for new content to render, then hide overlay
        setTimeout(() => {
          setShowOverlay(false)
        }, 100)
      }, 0)
    })
  }, [location.pathname])

  return (
    <FeedbackProvider>
      <Box bg={pageBg} minHeight="100vh" position="relative">
        <Navigation />
        
        {/* Content Container */}
        <Box
          key={location.pathname}
          opacity={showOverlay ? 0 : 1}
          transform={showOverlay ? 'translateY(10px)' : 'translateY(0)'}
          transition="all 0.3s ease-out"
          mt={{ base: '20px', md: 0 }}
        >
          <PageContainer py={0} fullWidth={fullWidth}>
            <Outlet />
          </PageContainer>
          <Footer />
        </Box>

        {/* Smooth Transition Overlay */}
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg={overlayBg}
          opacity={showOverlay ? 1 : 0}
          pointerEvents={showOverlay ? 'auto' : 'none'}
          transition="opacity 0.2s ease-in-out"
          zIndex={10}
        />
      </Box>
    </FeedbackProvider>
  )
}

export default PublicLayout 