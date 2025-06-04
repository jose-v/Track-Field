import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  Button,
  useColorModeValue,
  useToast,
  Flex,
  Circle,
  SimpleGrid,
} from '@chakra-ui/react';
import { FaDumbbell, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface RPEPromptCardProps {
  onLogComplete?: () => void;
}

interface CompletedWorkout {
  id: string;
  athlete_id: string;
  workout_name: string;
  assigned_at: string; // Changed from scheduled_date to assigned_at
  rpe_rating?: number;
  notes?: string;
}

export const RPEPromptCard: React.FC<RPEPromptCardProps> = ({ onLogComplete }) => {
  const [pendingWorkouts, setPendingWorkouts] = useState<CompletedWorkout[]>([]);
  const [selectedRPE, setSelectedRPE] = useState<number | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<CompletedWorkout | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();

  // Color mode values matching other dashboard cards
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');
  const selectedWorkoutBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const rpeCircleBg = useColorModeValue('gray.100', 'gray.600');
  const rpeCircleColor = useColorModeValue('gray.600', 'gray.300');
  const rpeCircleHoverBg = useColorModeValue('gray.200', 'gray.500');

  useEffect(() => {
    fetchPendingWorkouts();
  }, [user]);

  const fetchPendingWorkouts = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // First, let's debug what athlete_workouts we have for this user
      const { data: allAssignments, error: debugError } = await supabase
        .from('athlete_workouts')
        .select('id, athlete_id, workout_id, assigned_at, status, updated_at')
        .eq('athlete_id', user.id)
        .order('assigned_at', { ascending: false });

      console.log('RPEPromptCard DEBUG: All user assignments:', allAssignments);

      // Get completed workouts that don't have RPE ratings yet
      const { data: assignments, error: assignmentError } = await supabase
        .from('athlete_workouts')
        .select('id, athlete_id, workout_id, assigned_at, status, updated_at')
        .eq('athlete_id', user.id)
        .eq('status', 'completed') // Only get completed workouts
        .order('updated_at', { ascending: false }) // Order by most recently updated
        .limit(10); // Get more to filter for unrated ones

      if (assignmentError) throw assignmentError;

      console.log('RPEPromptCard: Found completed workouts:', assignments?.length || 0, assignments);

      if (!assignments || assignments.length === 0) {
        console.log('RPEPromptCard: No completed workouts found, checking if any exist with other statuses...');
        
        // Let's also check for any workouts that might be marked as in_progress but actually need rating
        const { data: inProgressAssignments } = await supabase
          .from('athlete_workouts')
          .select('id, athlete_id, workout_id, assigned_at, status, updated_at')
          .eq('athlete_id', user.id)
          .eq('status', 'in_progress')
          .limit(5);
          
        console.log('RPEPromptCard: In progress assignments:', inProgressAssignments);
        
        // TEMPORARY: If no completed workouts, let's try to show in_progress ones that might need rating
        if (inProgressAssignments && inProgressAssignments.length > 0) {
          console.log('RPEPromptCard: Using in_progress workouts as fallback');
          
          // Get workout details for in_progress workouts
          const workoutIds = inProgressAssignments.map(a => a.workout_id);
          const { data: workouts, error: workoutError } = await supabase
            .from('workouts')
            .select('id, name')
            .in('id', workoutIds);

          if (!workoutError && workouts) {
            // Check which already have RPE ratings
            const { data: existingRatings } = await supabase
              .from('exercise_results')
              .select('workout_id')
              .in('workout_id', workoutIds)
              .eq('athlete_id', user.id)
              .eq('exercise_name', 'Workout RPE');

            const ratedWorkoutIds = new Set(existingRatings?.map(r => r.workout_id) || []);
            const workoutMap = new Map();
            workouts.forEach(workout => {
              workoutMap.set(workout.id, workout);
            });

            const fallbackWorkouts = inProgressAssignments
              .filter(assignment => 
                workoutMap.has(assignment.workout_id) && 
                !ratedWorkoutIds.has(assignment.workout_id)
              )
              .map(assignment => ({
                id: assignment.id,
                athlete_id: user.id,
                workout_name: workoutMap.get(assignment.workout_id)?.name || '',
                assigned_at: assignment.updated_at || assignment.assigned_at, // Use updated_at or assigned_at as date
                rpe_rating: undefined,
                notes: undefined
              }))
              .slice(0, 3);
              
            if (fallbackWorkouts.length > 0) {
              console.log('RPEPromptCard: Using fallback in_progress workouts:', fallbackWorkouts);
              setPendingWorkouts(fallbackWorkouts);
              setSelectedWorkout(fallbackWorkouts[0]);
              setIsLoading(false);
              return;
            }
          }
        }
        
        setPendingWorkouts([]);
        setIsLoading(false);
        return;
      }

      // Get workout details
      const workoutIds = assignments.map(a => a.workout_id);
      const { data: workouts, error: workoutError } = await supabase
        .from('workouts')
        .select('id, name')
        .in('id', workoutIds);

      if (workoutError) throw workoutError;

      // Check which assignments already have RPE ratings
      const assignmentIds = assignments.map(a => a.id);
      
      console.log('RPEPromptCard: Checking for existing RPE ratings for workout IDs:', workoutIds);
      
      const { data: existingRatings, error: ratingsError } = await supabase
        .from('exercise_results')
        .select('workout_id, exercise_name, rpe_rating, created_at')
        .in('workout_id', workoutIds)
        .eq('athlete_id', user.id)
        .eq('exercise_name', 'Workout RPE');

      if (ratingsError) {
        console.warn('Could not check for existing RPE ratings:', ratingsError);
      }

      console.log('RPEPromptCard: Existing RPE ratings found:', existingRatings?.length || 0, existingRatings);

      // Create set of workout IDs that already have RPE ratings
      const ratedWorkoutIds = new Set(existingRatings?.map(r => r.workout_id) || []);
      console.log('RPEPromptCard: Rated workout IDs set:', Array.from(ratedWorkoutIds));

      // Also check if there are ANY exercise_results for this user (debugging)
      const { data: allResults } = await supabase
        .from('exercise_results')
        .select('workout_id, exercise_name, rpe_rating')
        .eq('athlete_id', user.id)
        .limit(10);
      console.log('RPEPromptCard: All exercise_results for user:', allResults);

      // Create a map of workouts for quick lookup
      const workoutMap = new Map();
      if (workouts) {
        workouts.forEach(workout => {
          workoutMap.set(workout.id, workout);
        });
      }

      // Filter out workouts that already have RPE ratings and combine the data
      const pendingWorkoutsData = assignments
        .filter(assignment => {
          const hasWorkout = workoutMap.has(assignment.workout_id);
          const hasRating = ratedWorkoutIds.has(assignment.workout_id);
          console.log(`RPEPromptCard: Workout ${assignment.workout_id} - hasWorkout: ${hasWorkout}, hasRating: ${hasRating}`);
          return hasWorkout && !hasRating;
        })
        .map(assignment => ({
          id: assignment.id,
          athlete_id: user.id,
          workout_name: workoutMap.get(assignment.workout_id)?.name || '',
          assigned_at: assignment.updated_at || assignment.assigned_at, // Use updated_at or assigned_at as date
          rpe_rating: undefined,
          notes: undefined
        }))
        .slice(0, 3); // Limit to 3 most recent unrated

      console.log('RPEPromptCard: Final unrated completed workouts:', pendingWorkoutsData.length, pendingWorkoutsData);

      setPendingWorkouts(pendingWorkoutsData);
      
      // Auto-select the first/most recent unrated workout
      if (pendingWorkoutsData.length > 0) {
        setSelectedWorkout(pendingWorkoutsData[0]);
      }
    } catch (error) {
      console.error('Error fetching pending workouts:', error);
      // Fall back to empty state instead of showing error
      setPendingWorkouts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRPELog = async () => {
    if (!selectedWorkout || selectedRPE === null) return;

    setIsLogging(true);
    try {
      console.log('RPEPromptCard: Logging RPE', selectedRPE, 'for workout', selectedWorkout.workout_name);
      
      const insertData = {
        athlete_id: user.id,
        workout_id: selectedWorkout.id,
        exercise_index: 0,
        exercise_name: 'Workout RPE',
        rpe_rating: selectedRPE,
        notes: `Overall workout RPE: ${selectedRPE}/10`,
        completed_at: new Date().toISOString()
      };
      
      console.log('RPEPromptCard: Inserting data:', insertData);
      
      // Log the RPE rating in exercise_results table
      const { data: insertedData, error: rpeError } = await supabase
        .from('exercise_results')
        .insert(insertData)
        .select(); // Return the inserted data

      if (rpeError) {
        console.error('RPEPromptCard: Error inserting RPE:', rpeError);
        throw new Error('Failed to log RPE rating');
      }

      console.log('RPEPromptCard: Successfully logged RPE rating, inserted data:', insertedData);

      toast({
        title: 'RPE rating logged successfully!',
        description: `${selectedWorkout.workout_name}: ${selectedRPE}/10 RPE`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Clear selected workout and RPE before refreshing
      setSelectedWorkout(null);
      setSelectedRPE(null);
      
      // Add a small delay to ensure the database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh to remove the rated workout from the list
      console.log('RPEPromptCard: Refreshing workout list after RPE log...');
      await fetchPendingWorkouts();
      
      // Call completion callback if provided
      onLogComplete?.();
    } catch (error) {
      console.error('Error logging RPE:', error);
      toast({
        title: 'Error logging RPE',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLogging(false);
    }
  };

  const getRPEColor = (rating: number) => {
    if (rating <= 3) return 'green.500';
    if (rating <= 6) return 'yellow.500';
    if (rating <= 8) return 'orange.500';
    return 'red.500';
  };

  const getRPELabel = (rating: number) => {
    if (rating <= 3) return 'Easy';
    if (rating <= 5) return 'Moderate';
    if (rating <= 7) return 'Hard';
    if (rating <= 9) return 'Very Hard';
    return 'Max Effort';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow="lg"
        minH="200px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color={statLabelColor}>Loading workouts...</Text>
      </Box>
    );
  }

  if (pendingWorkouts.length === 0) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow="lg"
        textAlign="center"
      >
        <VStack spacing={3}>
          <Icon as={FaDumbbell} boxSize={8} color="green.500" />
          <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
            All caught up!
          </Text>
          <Text fontSize="sm" color={statLabelColor}>
            No completed workouts need RPE ratings
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      border="1px solid"
      borderColor={borderColor}
      boxShadow="lg"
    >
      <VStack spacing={5} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaExclamationTriangle} boxSize={6} color="orange.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                Rate Your Workout
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                How hard was it? (RPE 1-10)
              </Text>
            </VStack>
          </HStack>
          <Badge 
            colorScheme="orange" 
            variant="solid" 
            fontSize="xs"
            px={2}
            py={1}
          >
            {pendingWorkouts.length} Pending
          </Badge>
        </HStack>

        {/* Workout Selection */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color={statNumberColor} mb={2}>
            Select Completed Workout:
          </Text>
          <VStack spacing={2}>
            {pendingWorkouts.map((workout) => (
              <Box
                key={workout.id}
                p={3}
                borderRadius="md"
                border="2px solid"
                borderColor={selectedWorkout?.id === workout.id ? 'blue.500' : borderColor}
                bg={selectedWorkout?.id === workout.id ? selectedWorkoutBg : 'transparent'}
                cursor="pointer"
                onClick={() => setSelectedWorkout(workout)}
                w="100%"
                _hover={{ borderColor: 'blue.400', bg: hoverBg }}
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
                      {workout.workout_name}
                    </Text>
                    <Text fontSize="xs" color={statLabelColor}>
                      {formatDate(workout.assigned_at)}
                    </Text>
                  </VStack>
                  <HStack spacing={1}>
                    <Icon as={FaClock} fontSize="xs" color={statLabelColor} />
                    <Text fontSize="xs" color={statLabelColor}>
                      Completed
                    </Text>
                  </HStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* RPE Scale */}
        {selectedWorkout && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" color={statNumberColor} mb={3}>
              Rate Perceived Exertion (1-10):
            </Text>
            
            <SimpleGrid columns={5} spacing={2} mb={3}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <Circle
                  key={rating}
                  size="40px"
                  bg={selectedRPE === rating ? getRPEColor(rating) : rpeCircleBg}
                  color={selectedRPE === rating ? 'white' : rpeCircleColor}
                  cursor="pointer"
                  onClick={() => setSelectedRPE(rating)}
                  _hover={{ 
                    bg: selectedRPE === rating ? getRPEColor(rating) : rpeCircleHoverBg,
                    transform: 'scale(1.05)'
                  }}
                  transition="all 0.2s"
                  fontWeight="bold"
                  fontSize="sm"
                >
                  {rating}
                </Circle>
              ))}
            </SimpleGrid>

            {selectedRPE && (
              <Flex justify="center" mb={3}>
                <Badge 
                  colorScheme={getRPEColor(selectedRPE).split('.')[0]} 
                  variant="solid"
                  px={3}
                  py={1}
                >
                  {getRPELabel(selectedRPE)}
                </Badge>
              </Flex>
            )}
          </Box>
        )}

        {/* Action Button */}
        <Button
          colorScheme="orange"
          size="md"
          onClick={handleRPELog}
          isLoading={isLogging}
          loadingText="Logging..."
          leftIcon={<Icon as={FaDumbbell} />}
          isDisabled={!selectedWorkout || selectedRPE === null}
        >
          Log RPE Rating
        </Button>
      </VStack>
    </Box>
  );
};

export default RPEPromptCard; 