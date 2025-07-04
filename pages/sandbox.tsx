import React from 'react';
import { ChakraProvider, VStack, Box, Text, extendTheme } from '@chakra-ui/react';
import WorkoutCreatorWireframe from '../src/components/WorkoutCreator/WorkoutCreatorWireframe';
import { RunningSpinnerDemo } from '../src/components/RunningSpinnerDemo';

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
            🏃‍♂️ Track & Field - Running Man Spinner Demo
          </Text>
          <Text textAlign="center" fontSize="sm" color="gray.500" mt={1}>
            Testing your custom sprite animation - Scroll down to see all variants!
          </Text>
        </Box>
        <VStack spacing={0} p={0}>
          <RunningSpinnerDemo />
        </VStack>
      </Box>
    </ChakraProvider>
  );
};

export default SandboxPage; 