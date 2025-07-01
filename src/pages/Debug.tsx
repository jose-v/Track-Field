import React from 'react';
import {
  Box,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Alert,
  AlertIcon,
  Heading,
  VStack,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
} from '@chakra-ui/react';
import { SleepServiceTest } from '../components/debug/SleepServiceTest';
import { OrphanedAssignmentsCleanup } from '../components/debug/OrphanedAssignmentsCleanup';

export const Debug: React.FC = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.md">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4}>
            <Heading size="lg" textAlign="center">
              🛠️ Debug & Administration Tools
            </Heading>
            <Text color="gray.500" textAlign="center" maxW="md">
              Administrative tools for maintaining data integrity and troubleshooting.
        </Text>
          </VStack>

          {/* Warning */}
          <Alert status="warning" borderRadius="md">
              <AlertIcon />
            <Box>
              <AlertTitle>Administrative Use Only</AlertTitle>
              <AlertDescription>
                These tools are intended for system administrators and developers.
                Use with caution in production environments.
              </AlertDescription>
            </Box>
            </Alert>

          {/* Cleanup Component */}
          <VStack spacing={4} align="stretch">
            <Heading size="md">Data Integrity Tools</Heading>
            <OrphanedAssignmentsCleanup />
          </VStack>

          {/* Footer */}
          <Text fontSize="sm" color="gray.400" textAlign="center">
            Debug page • Use only when needed • Changes may affect live data
          </Text>
        </VStack>
    </Container>
    </Box>
  );
}; 