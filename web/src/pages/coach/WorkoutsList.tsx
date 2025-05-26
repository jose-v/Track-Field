import { Box, Heading, Text, Spinner, Alert, AlertIcon, Stack, Card, CardBody, Link, Button, Flex, HStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye, FaEdit, FaPlus } from 'react-icons/fa';

// Define a simple Workout type for now, align with what api.workouts.getByCreator returns
// This should ideally come from a shared types definition if more complex
interface Workout {
  id: string;
  name: string;
  created_at: string;
  // Add other relevant fields you want to display, e.g., number of exercises, type
  exercises?: any[]; // Example
  type?: string; // Example
}

export function CoachWorkoutsList() {
  const { user } = useAuth();

  // Assuming TanStack Query v5+ syntax (object options)
  const { data: workouts, isLoading, isError, error } = useQuery<Workout[], Error>({
    queryKey: ['coachWorkouts', user?.id], 
    queryFn: async (): Promise<Workout[]> => { // Explicit Promise<Workout[]> return type
      if (!user?.id) {
        return []; 
      }
      return api.workouts.getByCreator(user.id);
    },
    enabled: !!user?.id, 
  });

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">
          My Workouts
        </Heading>
        <Button 
          as={RouterLink} 
          to="/coach/workouts/new" 
          colorScheme="blue" 
          leftIcon={<FaPlus />}
        >
          Create Workout
        </Button>
      </Flex>

      {isLoading && (
        <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />
      )}

      {isError && (
        <Alert status="error">
          <AlertIcon />
          Error fetching workouts: {error?.message}
        </Alert>
      )}

      {/* workouts should be Workout[] here if query is successful */}
      {!isLoading && !isError && workouts && workouts.length === 0 && (
        <Box p={5} borderWidth="1px" borderRadius="lg" shadow="sm" textAlign="center">
          <Text fontSize="lg" color="gray.500">
            You haven't created any workouts yet.
          </Text>
          <Button as={RouterLink} to="/coach/workouts/new" colorScheme="blue" mt={4}>
            Create Your First Workout
          </Button>
        </Box>
      )}

      {!isLoading && !isError && workouts && workouts.length > 0 && (
        <Stack spacing={4}>
          {workouts.map((workout: Workout) => ( // Explicitly type workout here
            <Card key={workout.id} shadow="sm" borderWidth="1px">
              <CardBody>
                <Flex justify="space-between" align="center">
                  <Box>
                    <Heading size="md">{workout.name}</Heading>
                    <Text fontSize="sm" color="gray.500">
                      Created: {new Date(workout.created_at).toLocaleDateString()}
                      {workout.type && ` - Type: ${workout.type}`}
                      {/* {workout.exercises && ` - ${workout.exercises.length} exercises`} */}
                    </Text>
                  </Box>
                  <HStack spacing={2}>
                    {/* TODO: Implement View and Edit functionalities */}
                    <Button size="sm" variant="outline" colorScheme="blue" leftIcon={<FaEye />} isDisabled>
                      View
                    </Button>
                    <Button size="sm" variant="outline" colorScheme="green" leftIcon={<FaEdit />} isDisabled>
                      Edit
                    </Button>
                  </HStack>
                </Flex>
              </CardBody>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
} 