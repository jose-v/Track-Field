import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Code,
  Alert,
  AlertIcon,
  useToast,
  Divider,
  Badge,
  SimpleGrid
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import { ServiceMigration } from '../../utils/migration/ServiceMigration';
import SleepQuickLogCard from '../SleepQuickLogCard';

export const SleepServiceTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setIsLoading(true);
    try {
      const result = await testFn();
      setTestResults(prev => ({
        ...prev,
        [testName]: { status: 'PASS', data: result, error: null }
      }));
      return result;
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { status: 'FAIL', data: null, error: error.message }
      }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const testMigrationFallback = async () => {
    return await runTest('Migration Fallback', async () => {
      if (!user) throw new Error('No user authenticated');
      
      // Test both new service and legacy fallback
      const mode = ServiceMigration.getCurrentMode();
      const records = await ServiceMigration.sleep.getRecords(user.id, 3);
      
      return {
        mode,
        recordCount: records.length,
        latestRecord: records[0] || null
      };
    });
  };

  const testSleepCardIntegration = async () => {
    return await runTest('Sleep Card Integration', async () => {
      if (!user) throw new Error('No user authenticated');
      
      // Create a test sleep record to verify the card can handle it
      const testRecord = {
        athlete_id: user.id,
        sleep_date: new Date().toISOString().split('T')[0],
        start_time: '22:30:00',
        end_time: '07:00:00',
        quality: 3,
        notes: 'Migration test record'
      };
      
      const result = await ServiceMigration.sleep.createRecord(testRecord);
      return {
        created: !!result,
        recordId: result.id || 'unknown'
      };
    });
  };

  const testServiceModeSwitch = async () => {
    return await runTest('Service Mode Switch', async () => {
      const originalMode = ServiceMigration.getCurrentMode();
      
      // Switch to new service mode
      ServiceMigration.enableNewServices();
      const newMode = ServiceMigration.getCurrentMode();
      
      // Test a simple operation
      if (!user) throw new Error('No user authenticated');
      const records = await ServiceMigration.sleep.getRecords(user.id, 1);
      
      // Switch back to original mode
      if (originalMode === 'legacy') {
        ServiceMigration.disableNewServices();
      }
      
      return {
        originalMode,
        switchedTo: newMode,
        testSuccessful: true,
        recordCount: records.length
      };
    });
  };

  const runAllTests = async () => {
    try {
      await testMigrationFallback();
      await testSleepCardIntegration();
      await testServiceModeSwitch();
      
      toast({
        title: 'All tests completed!',
        description: 'Check results below',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Test failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderTestResult = (testName: string, result: any) => {
    if (!result) return null;
    
    const { status, data, error } = result;
    
    return (
      <Box key={testName} p={4} borderWidth={1} borderRadius="md">
        <HStack justify="space-between" mb={2}>
          <Text fontWeight="bold">{testName}</Text>
          <Badge colorScheme={status === 'PASS' ? 'green' : 'red'}>
            {status}
          </Badge>
        </HStack>
        
        {error && (
          <Alert status="error" mb={2}>
            <AlertIcon />
            <Text fontSize="sm">{error}</Text>
          </Alert>
        )}
        
        {data && (
          <Code p={2} borderRadius="md" display="block" whiteSpace="pre-wrap" color="gray.800" bg="gray.100">
            {JSON.stringify(data, null, 2)}
          </Code>
        )}
      </Box>
    );
  };

  return (
    <VStack spacing={6} align="stretch" maxW="4xl" mx="auto" p={6}>
      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={2}>
          Sleep Service Migration Test
        </Text>
        <Text color="gray.600">
          Testing the migrated sleep dashboard card and service layer integration
        </Text>
      </Box>

      {/* Service Status */}
      <Box p={4} bg="blue.50" borderRadius="md">
        <Text fontWeight="bold" mb={2}>Current Service Mode</Text>
        <Badge colorScheme="blue" size="lg">
          {ServiceMigration.getCurrentMode().toUpperCase()}
        </Badge>
        <Text fontSize="sm" color="gray.600" mt={2}>
          {ServiceMigration.getCurrentMode() === 'new' 
            ? 'Using new service layer with fallback to legacy'
            : 'Using legacy Supabase calls directly'
          }
        </Text>
      </Box>

      {/* Test Controls */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Button
          onClick={testMigrationFallback}
          isLoading={isLoading}
          colorScheme="blue"
          variant="outline"
        >
          Test Migration Fallback
        </Button>
        
        <Button
          onClick={testSleepCardIntegration}
          isLoading={isLoading}
          colorScheme="green"
          variant="outline"
        >
          Test Sleep Card Integration
        </Button>
        
        <Button
          onClick={testServiceModeSwitch}
          isLoading={isLoading}
          colorScheme="purple"
          variant="outline"
        >
          Test Service Mode Switch
        </Button>
        
        <Button
          onClick={runAllTests}
          isLoading={isLoading}
          colorScheme="orange"
        >
          Run All Tests
        </Button>
      </SimpleGrid>

      <Divider />

      {/* Live Sleep Card Demo */}
      <Box>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Live Sleep Card Demo
        </Text>
        <Text fontSize="sm" color="gray.600" mb={4}>
          This is the actual migrated sleep card using the new service layer:
        </Text>
        <Box maxW="md">
          <SleepQuickLogCard 
            onLogComplete={() => {
              toast({
                title: 'Sleep logged via new service!',
                description: 'The migrated card successfully used the service layer',
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
            }}
          />
        </Box>
      </Box>

      <Divider />

      {/* Test Results */}
      <Box>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Test Results
        </Text>
        <VStack spacing={4} align="stretch">
          {Object.entries(testResults).map(([testName, result]) =>
            renderTestResult(testName, result)
          )}
        </VStack>
      </Box>

      {/* Service Controls */}
      <Box p={4} bg="gray.50" borderRadius="md">
        <Text fontWeight="bold" mb={3}>Service Mode Controls</Text>
        <HStack spacing={3}>
          <Button
            size="sm"
            onClick={() => {
              ServiceMigration.enableNewServices();
              toast({
                title: 'New services enabled',
                status: 'info',
                duration: 2000,
              });
            }}
          >
            Enable New Services
          </Button>
          <Button
            size="sm"
            onClick={() => {
              ServiceMigration.disableNewServices();
              toast({
                title: 'Using legacy services',
                status: 'info',
                duration: 2000,
              });
            }}
          >
            Use Legacy Services
          </Button>
        </HStack>
      </Box>
    </VStack>
  );
}; 