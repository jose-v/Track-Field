import React, { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAthleteNavigation } from './layout/AthleteNavigation';
import SimplifiedNav from './SimplifiedNav';
import { NavSentinelProvider } from '../contexts/NavSentinelContext';
import { NavbarVisibilityProvider } from './SimplifiedNav';

interface AthleteLayoutProps {
  children: ReactNode;
  yearNavBar?: ReactNode;
}

export function AthleteLayout({ children, yearNavBar }: AthleteLayoutProps) {
  // Get athlete navigation configuration
  const athleteNav = useAthleteNavigation();
  const location = useLocation();
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
  
  // Conditional top padding - reduced for mobile dashboard
  const isDashboardRoute = location.pathname === '/athlete/dashboard';
  const topPadding = yearNavBar ? "104px" : isDashboardRoute ? { base: "36px", md: "86px" } : "86px";
  
  return (
    <NavbarVisibilityProvider>
      <Flex width="100%" height="100vh" bg={bgColor}>
        {/* Sidebar for athlete navigation */}
        <Sidebar 
          userType="athlete" 
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
            roleTitle={athleteNav.roleTitle}
            roleBadge={athleteNav.roleBadge}
            notificationsPath={athleteNav.notificationsPath}
            storageKey={athleteNav.storageKey}
            shareTitle={athleteNav.shareTitle}
            shareDescription={athleteNav.shareDescription}
            isPublicPage={false}
            onOpen={handleHamburgerClick}
            scrollContainerRef={mainContentRef}
          />
          {/* Year nav bar (sticky, just below nav) - full width outside main content */}
          {yearNavBar}
          <NavSentinelProvider value={navSentinelRef}>
            {/* Main content with consistent margins for all content - left, right, top, bottom */}
            <Box 
              as="main" 
              pt={topPadding}
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