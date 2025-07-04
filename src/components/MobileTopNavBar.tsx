import React from 'react';
import { 
  Box, 
  Text, 
  Avatar
} from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { useProfileDisplay } from '../hooks/useProfileDisplay';

interface MobileTopNavBarProps {
  welcomeMessage?: string;
}

export const MobileTopNavBar: React.FC<MobileTopNavBarProps> = ({ welcomeMessage }) => {
  const location = useLocation();
  const { isHeaderVisible } = useScrollDirection(15);
  const { profile, displayName, initials } = useProfileDisplay();

  // Only show welcome message on dashboard pages
  const isDashboardPage = location.pathname.includes('/dashboard');
  
  return (
    <Box
      position="fixed"
      top={isHeaderVisible ? "0" : "-64px"}
      left="0"
      right="0"
      zIndex={1001}
      h="64px"
      display={{ base: "flex", lg: "none" }}
      alignItems="center"
      justifyContent="space-between"
      pl={16}
      pr={4}
      bg="rgba(255, 255, 255, 0.8)"
      backdropFilter="blur(10px)"
      borderBottom="1px solid"
      borderColor="rgba(255, 255, 255, 0.2)"
      transition="top 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      transform="translateZ(0)"
    >
      {/* Welcome Message (only on dashboard pages) */}
      <Box flex="1" mr={3}>
        {isDashboardPage && welcomeMessage && (
          <Text 
            fontSize="sm"
            fontWeight="semibold" 
            color="gray.700"
            textAlign="right"
            lineHeight="1.2"
            noOfLines={1}
            pr={1}
          >
            {welcomeMessage}
          </Text>
        )}
      </Box>

      {/* User Avatar */}
      <Avatar
        size="sm"
        name={displayName || 'User'}
        src={profile?.avatar_url || undefined}
        bg="blue.500"
        color="white"
        cursor="pointer"
        _hover={{ 
          transform: 'scale(1.05)',
          boxShadow: 'md'
        }}
        transition="all 0.2s"
      >
        {!profile?.avatar_url && (initials || '?')}
      </Avatar>
    </Box>
  );
};

export default MobileTopNavBar; 