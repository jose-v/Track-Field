import React, { useState, useEffect } from 'react';
import { Box, Flex, useColorModeValue, useDisclosure } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import { useTeamManagerNavigation } from './layout/TeamManagerNavigation';
import SimplifiedNav from './SimplifiedNav';

export function TeamManagerLayout({ children }: { children: React.ReactNode }) {
  // Get team manager navigation configuration
  const teamManagerNav = useTeamManagerNavigation();
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
      {/* Sidebar for team manager navigation */}
      <Sidebar userType="team_manager" />
      
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
          roleTitle={teamManagerNav.roleTitle}
          roleBadge={teamManagerNav.roleBadge}
          notificationsPath={teamManagerNav.notificationsPath}
          storageKey={teamManagerNav.storageKey}
          shareTitle={teamManagerNav.shareTitle}
          shareDescription={teamManagerNav.shareDescription}
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