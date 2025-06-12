import React from 'react';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';

interface MobileWelcomeMessageProps {
  message: string;
}

export const MobileWelcomeMessage: React.FC<MobileWelcomeMessageProps> = ({ message }) => {
  return (
    <Box 
      className="mobile-welcome-message"
      position="fixed"
      top={{ base: "max(16px, env(safe-area-inset-top))", md: "16px" }}
      right="16px"
      zIndex="9999"
      pt="8px"
      pr="4px"
      maxW="200px"
      display={{ base: "block", lg: "none" }}
    >
      <Text 
        fontSize={{ base: "sm", md: "md" }}
        fontWeight="semibold" 
        color="white"
        textAlign="right"
        lineHeight="1.2"
        textShadow="0 1px 3px rgba(0,0,0,0.5)"
        wordBreak="break-word"
        noOfLines={2}
      >
        {message}
      </Text>
    </Box>
  );
};

export default MobileWelcomeMessage; 