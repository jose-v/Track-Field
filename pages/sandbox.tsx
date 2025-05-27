import React from 'react';
import { ChakraProvider, VStack, Box, Text, extendTheme } from '@chakra-ui/react';
import WorkoutCreatorPOC from '../src/components/WorkoutCreatorPOC';

// Clean theme for sandbox testing
const sandboxTheme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
});

const SandboxPage: React.FC = () => {
  return (
    <ChakraProvider theme={sandboxTheme}>
      <Box minHeight="100vh" bg="gray.50">
        <Box py={4} px={2} borderBottom="1px" borderColor="gray.200" bg="white" shadow="sm">
          <Text textAlign="center" fontSize="lg" fontWeight="semibold" color="gray.600">
            🏃‍♂️ Track & Field - Workout Creator Testing Sandbox
          </Text>
          <Text textAlign="center" fontSize="sm" color="gray.500" mt={1}>
            Standalone testing environment - No navigation dependencies
          </Text>
        </Box>
        <VStack spacing={0} p={0}>
          <WorkoutCreatorPOC />
        </VStack>
      </Box>
    </ChakraProvider>
  );
};

export default SandboxPage; 