import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  useColorModeValue,
  Card,
  CardBody,
  Badge,
  Icon,
  useToast,
  Alert,
  AlertIcon,
  Spinner,
  Center
} from '@chakra-ui/react';
import { FaHistory, FaUndo, FaEye, FaDumbbell, FaCalendarAlt, FaClock, FaUser } from 'react-icons/fa';
import { format } from 'date-fns';
import { api } from '../../services/api';

interface ArchivedWorkout {
  id: string;
  original_workout_id: string;
  name: string;
  description?: string;
  type?: string;
  user_id: string;
  created_by: string;
  created_at: string;
  archived_at: string;
  archived_by: string;
  exercises?: any[];
  blocks?: any[];
  is_block_based?: boolean;
  is_template?: boolean;
}

interface ArchivedWorkoutsViewProps {
  userId: string;
  userRole: string;
}

export function ArchivedWorkoutsView({ userId, userRole }: ArchivedWorkoutsViewProps) {
  const [archivedWorkouts, setArchivedWorkouts] = React.useState<ArchivedWorkout[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [restoring, setRestoring] = React.useState<string | null>(null);
  const [viewing, setViewing] = React.useState<string | null>(null);

  const toast = useToast();

  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const loadArchivedWorkouts = async () => {
    try {
      setLoading(true);
      const data = await api.workouts.getArchivedWorkouts(userId);
      setArchivedWorkouts(data);
    } catch (error) {
      console.error('Error loading archived workouts:', error);
      toast({
        title: 'Error loading archived workouts',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadArchivedWorkouts();
    } finally {
      setRefreshing(false);
    }
  };

  const handleRestore = async (workoutHistoryId: string) => {
    try {
      setRestoring(workoutHistoryId);
      await api.workouts.restoreArchivedWorkout(workoutHistoryId);
      toast({
        title: 'Workout Restored',
        description: 'The workout has been restored from archive.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      await loadArchivedWorkouts(); // Refresh the list
    } catch (error) {
      console.error('Error restoring workout:', error);
      toast({
        title: 'Error restoring workout',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setRestoring(null);
    }
  };

  const handleViewDetails = async (workoutHistoryId: string) => {
    try {
      setViewing(workoutHistoryId);
      // This would open a modal with detailed workout information
      toast({
        title: 'View Details',
        description: 'Detailed view functionality coming soon.',
        status: 'info',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setViewing(null);
    }
  };

  React.useEffect(() => {
    loadArchivedWorkouts();
  }, []);

  if (loading) {
    return (
      <Center py={10}>
        <VStack spacing={4}>
          <Spinner size="lg" />
          <Text>Loading archived workouts...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <VStack spacing={6} maxW="1200px" mx="auto" px={4}>
        {/* Header */}
        <VStack spacing={2} textAlign="center">
          <HStack spacing={3}>
            <Icon as={FaHistory} color="orange.500" boxSize={6} />
            <Heading size="lg" color="orange.500">
              Archived Workouts
            </Heading>
          </HStack>
          <Text color="gray.600" fontSize="lg">
            View and manage archived workout data
          </Text>
        </VStack>

        {/* Info Alert */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold">Data Preservation</Text>
            <Text fontSize="sm">
              Archived workouts are preserved in history tables for data retention and potential recovery. 
              Only coaches and administrators can access this view.
            </Text>
          </VStack>
        </Alert>

        {/* Controls */}
        <HStack spacing={4} w="100%" justify="center">
          <Button
            leftIcon={<FaUndo />}
            colorScheme="blue"
            onClick={handleRefresh}
            isLoading={refreshing}
            loadingText="Refreshing..."
          >
            Refresh
          </Button>
        </HStack>

        {/* Archived Workouts List */}
        {archivedWorkouts.length === 0 ? (
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} w="100%">
            <CardBody>
              <VStack spacing={4} py={8}>
                <Icon as={FaHistory} color="gray.400" boxSize={8} />
                <Text color="gray.500" fontSize="lg">
                  No archived workouts found
                </Text>
                <Text color="gray.400" fontSize="sm" textAlign="center">
                  Workouts that are archived will appear here for data retention purposes.
                </Text>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <VStack spacing={4} w="100%">
            {archivedWorkouts.map((workout) => (
              <Card key={workout.id} bg={cardBg} borderWidth="1px" borderColor={borderColor} w="100%">
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    {/* Header */}
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Heading size="md" noOfLines={2}>
                          {workout.name}
                        </Heading>
                        <HStack spacing={2}>
                          <Badge colorScheme="orange" variant="solid">
                            Archived
                          </Badge>
                          {workout.type && (
                            <Badge colorScheme="blue" variant="outline">
                              {workout.type}
                            </Badge>
                          )}
                          {workout.is_template && (
                            <Badge colorScheme="purple" variant="outline">
                              Template
                            </Badge>
                          )}
                        </HStack>
                      </VStack>
                      <Icon as={FaHistory} color="orange.500" boxSize={5} />
                    </HStack>

                    {/* Details */}
                    <VStack align="start" spacing={2}>
                      {workout.description && (
                        <Text color="gray.600" noOfLines={2}>
                          {workout.description}
                        </Text>
                      )}
                      
                      <HStack spacing={4} fontSize="sm" color="gray.500">
                        <HStack spacing={1}>
                          <Icon as={FaCalendarAlt} boxSize={3} />
                          <Text>
                            Created: {format(new Date(workout.created_at), 'MMM d, yyyy')}
                          </Text>
                        </HStack>
                        <HStack spacing={1}>
                          <Icon as={FaClock} boxSize={3} />
                          <Text>
                            Archived: {format(new Date(workout.archived_at), 'MMM d, yyyy')}
                          </Text>
                        </HStack>
                      </HStack>

                      {workout.exercises && workout.exercises.length > 0 && (
                        <HStack spacing={1}>
                          <Icon as={FaDumbbell} boxSize={3} color="gray.500" />
                          <Text fontSize="sm" color="gray.500">
                            {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                          </Text>
                        </HStack>
                      )}
                    </VStack>

                    {/* Actions */}
                    <HStack spacing={3} pt={2}>
                      <Button
                        size="sm"
                        leftIcon={<FaEye />}
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => handleViewDetails(workout.id)}
                        isLoading={viewing === workout.id}
                        loadingText="Loading..."
                        flex={1}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<FaUndo />}
                        colorScheme="green"
                        variant="solid"
                        onClick={() => handleRestore(workout.id)}
                        isLoading={restoring === workout.id}
                        loadingText="Restoring..."
                        flex={1}
                      >
                        Restore
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  );
} 