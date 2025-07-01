import React, { useState } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Collapse,
  useToast,
  useColorModeValue,
  Divider,
  List,
  ListItem,
  ListIcon,
  Spinner,
} from '@chakra-ui/react';
import { FaBroom, FaCheck, FaExclamationTriangle, FaInfo, FaTrash } from 'react-icons/fa';
import { api } from '../../services/api';

interface CleanupResult {
  removedCount: number;
  details: Array<{
    assignmentId: string;
    workoutId: string;
    athleteId: string;
  }>;
}

export const OrphanedAssignmentsCleanup: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const runCleanup = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧹 Running orphaned assignments cleanup...');
      const cleanupResult = await api.workouts.cleanupOrphanedAssignments();
      
      setResult(cleanupResult);
      
      if (cleanupResult.removedCount === 0) {
        toast({
          title: 'Database is Clean!',
          description: 'No orphaned assignments found.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Cleanup Successful!',
          description: `Removed ${cleanupResult.removedCount} orphaned assignments.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      
      toast({
        title: 'Cleanup Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Box
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={6}
      maxW="md"
      mx="auto"
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <VStack spacing={2}>
          <HStack>
            <FaBroom />
            <Text fontSize="lg" fontWeight="bold">
              Orphaned Assignments Cleanup
            </Text>
          </HStack>
          <Text fontSize="sm" color="gray.500" textAlign="center">
            Clean up athlete workout assignments that point to deleted workouts
          </Text>
        </VStack>

        <Divider />

        {/* Info Alert */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">What this does:</AlertTitle>
            <AlertDescription fontSize="xs">
              Removes athlete assignments for workouts that have been deleted by coaches.
              This prevents athletes from seeing deleted workouts in their portal.
            </AlertDescription>
          </Box>
        </Alert>

        {/* Run Button */}
        <Button
          colorScheme="blue"
          size="md"
          leftIcon={isRunning ? <Spinner size="sm" /> : <FaBroom />}
          onClick={runCleanup}
          isLoading={isRunning}
          loadingText="Cleaning..."
          isDisabled={isRunning}
        >
          Run Cleanup
        </Button>

        {/* Results */}
        {result && (
          <VStack spacing={3} align="stretch">
            <Alert 
              status={result.removedCount === 0 ? "success" : "warning"} 
              borderRadius="md"
            >
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">
                  {result.removedCount === 0 ? "Database is Clean!" : "Cleanup Complete!"}
                </AlertTitle>
                <AlertDescription fontSize="xs">
                  {result.removedCount === 0 
                    ? "No orphaned assignments found."
                    : `Removed ${result.removedCount} orphaned assignment${result.removedCount !== 1 ? 's' : ''}.`
                  }
                </AlertDescription>
              </Box>
            </Alert>

            {result.removedCount > 0 && (
              <VStack spacing={2} align="stretch">
                <HStack justify="space-between">
                  <Badge colorScheme="orange" variant="subtle">
                    {result.removedCount} assignments removed
                  </Badge>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? 'Hide' : 'Show'} Details
                  </Button>
                </HStack>

                <Collapse in={showDetails}>
                  <Box
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    p={3}
                    borderRadius="md"
                    maxH="200px"
                    overflowY="auto"
                  >
                    <Text fontSize="xs" fontWeight="bold" mb={2}>
                      Removed Assignments:
                    </Text>
                    <List spacing={1}>
                      {result.details.slice(0, 10).map((assignment, index) => (
                        <ListItem key={assignment.assignmentId} fontSize="xs">
                          <ListIcon as={FaTrash} color="red.400" />
                          Assignment {index + 1}
                          <Text as="span" color="gray.500" ml={2}>
                            (Workout: {assignment.workoutId.slice(0, 8)}...)
                          </Text>
                        </ListItem>
                      ))}
                      {result.details.length > 10 && (
                        <ListItem fontSize="xs" color="gray.500">
                          ... and {result.details.length - 10} more
                        </ListItem>
                      )}
                    </List>
                  </Box>
                </Collapse>
              </VStack>
            )}
          </VStack>
        )}

        {/* Error */}
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle fontSize="sm">Cleanup Failed!</AlertTitle>
              <AlertDescription fontSize="xs">{error}</AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Additional Info */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">
              <FaInfo style={{ display: 'inline', marginRight: '4px' }} />
              Safe to Run
            </AlertTitle>
            <AlertDescription fontSize="xs">
              This operation only removes assignment records, not workouts themselves.
              It's safe to run multiple times.
            </AlertDescription>
          </Box>
        </Alert>
      </VStack>
    </Box>
  );
}; 