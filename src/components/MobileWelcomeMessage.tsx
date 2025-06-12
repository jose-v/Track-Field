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
        top="20px"
        right="20px"
        zIndex="999"
        p="8px"
        maxW="280px"
        display={{ base: "block", lg: "none" }}
      >
      <Text 
        fontSize={{ base: "sm", md: "md" }}
        fontWeight="semibold" 
        color="white"
        textAlign="right"
        lineHeight="1.2"
        textShadow="0 1px 3px rgba(0,0,0,0.8)"
        wordBreak="break-word"
        noOfLines={2}
      >
        {message}
      </Text>
    </Box>
  );
};

export default MobileWelcomeMessage; 