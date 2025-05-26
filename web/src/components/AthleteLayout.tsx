import React from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import { useAthleteNavigation } from './layout/AthleteNavigation';
import SimplifiedNav from './SimplifiedNav';

export function AthleteLayout({ children }: { children: React.ReactNode }) {
  // Get athlete navigation configuration
  const athleteNav = useAthleteNavigation();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  
  return (
    <Flex width="100%" height="100vh">
      {/* Sidebar for athlete navigation */}
      <Sidebar userType="athlete" />
      
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
          roleTitle={athleteNav.roleTitle}
          roleBadge={athleteNav.roleBadge}
          notificationsPath={athleteNav.notificationsPath}
          storageKey={athleteNav.storageKey}
          shareTitle={athleteNav.shareTitle}
          shareDescription={athleteNav.shareDescription}
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