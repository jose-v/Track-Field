import React from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import { useCoachNavigation } from './layout/CoachNavigation';
import SimplifiedNav from './SimplifiedNav';

export function CoachLayout({ children }: { children: React.ReactNode }) {
  // Get coach navigation configuration
  const coachNav = useCoachNavigation();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  
  return (
    <Flex width="100%" height="100vh">
      {/* Sidebar for coach navigation */}
      <Sidebar userType="coach" />
      
      {/* Main content area */}
      <Box
        flex="1"
        ml={{ base: 0, md: "200px" }}
        transition="margin-left 0.2s"
        bg={bgColor}
        minH="100vh"
        position="relative"
      >
        {/* Simplified top navigation */}
        <SimplifiedNav 
          roleTitle={coachNav.roleTitle}
          roleBadge={coachNav.roleBadge}
          notificationsPath={coachNav.notificationsPath}
          storageKey={coachNav.storageKey}
          shareTitle={coachNav.shareTitle}
          shareDescription={coachNav.shareDescription}
        />
        
        {/* Main content with padding to account for the top navigation */}
        <Box 
          as="main" 
          pt="80px" 
          px="6" 
          pb="8"
          height="100%"
          overflowY="auto"
        >
          {children}
        </Box>
      </Box>
    </Flex>
  );
} 