import React from 'react';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';

interface MobileWelcomeMessageProps {
  message: string;
}

export const MobileWelcomeMessage: React.FC<MobileWelcomeMessageProps> = ({ message }) => {
  return (
    <Box 
      position="absolute"
      top="24px"
      right="15px"
      zIndex="999"
    >
      <Text 
        fontSize="md" 
        fontWeight="semibold" 
        color="white"
        textAlign="left"
      >
        {message}
      </Text>
    </Box>
  );
};

export default MobileWelcomeMessage; 