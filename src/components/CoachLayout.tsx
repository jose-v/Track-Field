import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import { useCoachNavigation } from './layout/CoachNavigation';
import SimplifiedNav from './SimplifiedNav';
import { NavSentinelProvider } from '../contexts/NavSentinelContext';
import { NavbarVisibilityProvider } from './SimplifiedNav';

export function CoachLayout({ children }: { children: React.ReactNode }) {
  // Get coach navigation configuration
  const coachNav = useCoachNavigation();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Check localStorage for the saved sidebar state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    return savedSidebarState === 'true' ? 70 : 200;
  });
  
  // Function to handle hamburger menu click using global event
  const handleHamburgerClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent('openMobileSidebar'));
  }, []);
  
  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      const newWidth = event.detail.width;
      setSidebarWidth(newWidth);
    };
    
    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  const navSentinelRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  
  return (
    <NavbarVisibilityProvider>
      <Flex width="100%" height="100vh" bg={bgColor}>
        {/* Sidebar for coach navigation */}
        <Sidebar 
          userType="coach"
        />
        {/* Main content area */}
        <Box
          flex="1"
          ml={{ base: 0, md: `${sidebarWidth}px` }}
          transition="margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          bg={bgColor}
          minH="100vh"
          position="relative"
          w="100%"
          maxW="100%"
          overflowX="hidden"
          display="flex"
          flexDirection="column"
        >
          {/* Simplified top navigation (fixed) */}
          <SimplifiedNav 
            roleTitle={coachNav.roleTitle}
            roleBadge={coachNav.roleBadge}
            notificationsPath={coachNav.notificationsPath}
            storageKey={coachNav.storageKey}
            shareTitle={coachNav.shareTitle}
            shareDescription={coachNav.shareDescription}
            isPublicPage={false}
            onOpen={handleHamburgerClick}
            scrollContainerRef={mainContentRef}
          />
          <NavSentinelProvider value={navSentinelRef}>
            {/* Main content with consistent margins for all content - left, right, top, bottom */}
            <Box 
              as="main" 
              pt="86px"
              pl={{ base: 4, md: 6 }}
              pr={{ base: 4, md: 6 }}
              pb="8"
              w="100%"
              maxW="100%"
              overflowX="hidden"
              overflowY="auto"
              flex="1"
              ref={mainContentRef}
            >
              {/* Sentinel for nav bar visibility - now inside scrollable content */}
              <div ref={navSentinelRef} style={{ height: 1, width: '100%' }} />
              {children}
            </Box>
          </NavSentinelProvider>
        </Box>
      </Flex>
    </NavbarVisibilityProvider>
  );
} 