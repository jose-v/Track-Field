import React from 'react';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';

interface MobileWelcomeMessageProps {
  message: string;
}

export const MobileWelcomeMessage: React.FC<MobileWelcomeMessageProps> = ({ message }) => {
  // Debug mode - make it more visible for troubleshooting
  const isDebugMode = true; // Force debug mode for now
  
  console.log('MobileWelcomeMessage rendering:', { message, isDebugMode });
  
  return (
    <Box 
      className="mobile-welcome-message"
      position="fixed"
      top="20px"
      right="20px"
      zIndex="99999"
      p="12px"
      maxW="280px"
      minH="40px"
      display="block"
      bg={isDebugMode ? "rgba(255,0,0,0.8)" : "rgba(0,0,0,0.7)"}
      borderRadius="lg"
      border={isDebugMode ? "3px solid yellow" : "1px solid rgba(255,255,255,0.2)"}
      boxShadow="0 4px 12px rgba(0,0,0,0.3)"
    >
      <Text 
        fontSize="14px"
        fontWeight="bold" 
        color="white"
        textAlign="center"
        lineHeight="1.3"
        textShadow="0 2px 4px rgba(0,0,0,1)"
      >
        {isDebugMode ? `DEBUG: ${message}` : message}
      </Text>
    </Box>
  );
};

export default MobileWelcomeMessage; 