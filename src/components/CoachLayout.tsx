import React, { useState, useEffect } from 'react';
import { Box, Flex, useColorModeValue, useDisclosure } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import { useCoachNavigation } from './layout/CoachNavigation';
import SimplifiedNav from './SimplifiedNav';

export function CoachLayout({ children }: { children: React.ReactNode }) {
  // Get coach navigation configuration
  const coachNav = useCoachNavigation();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Check localStorage for the saved sidebar state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    return savedSidebarState === 'true' ? 70 : 200;
  });
  const { onOpen } = useDisclosure();
  
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
  
  return (
    <Flex width="100%" height="100vh" bg={bgColor}>
      {/* Sidebar for coach navigation */}
      <Sidebar userType="coach" />
      
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
      >
        {/* Simplified top navigation */}
        <SimplifiedNav 
          roleTitle={coachNav.roleTitle}
          roleBadge={coachNav.roleBadge}
          notificationsPath={coachNav.notificationsPath}
          storageKey={coachNav.storageKey}
          shareTitle={coachNav.shareTitle}
          shareDescription={coachNav.shareDescription}
          isPublicPage={false}
          onOpen={onOpen}
        />
        
        {/* Main content with padding to account for the top navigation */}
        <Box 
          as="main" 
          pt="80px" 
          px={{ base: 0, md: 6 }}
          pb="8"
          height="100%"
          overflowY="auto"
          w="100%"
          maxW="100%"
          overflowX="hidden"
        >
          {children}
        </Box>
      </Box>
    </Flex>
  );
} 