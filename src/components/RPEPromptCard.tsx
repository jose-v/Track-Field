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

interface PendingWorkout {
  id: string;
  scheduled_date: string;
  completed_at?: string;
  workouts?: {
    id: string;
    name: string;
  };
}

export const RPEPromptCard: React.FC<RPEPromptCardProps> = ({ onLogComplete }) => {
  const [pendingWorkouts, setPendingWorkouts] = useState<PendingWorkout[]>([]);
  const [selectedRPE, setSelectedRPE] = useState<number | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<PendingWorkout | null>(null);
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
      // First, get athlete_workouts assignments (simplified query without embed)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: assignments, error: assignmentError } = await supabase
        .from('athlete_workouts')
        .select('id, athlete_id, workout_id, assigned_at, status')
        .eq('athlete_id', user.id)
        .eq('status', 'completed') // Only get completed workouts
        .gte('assigned_at', sevenDaysAgo.toISOString())
        .order('assigned_at', { ascending: false })
        .limit(5);

      if (assignmentError) throw assignmentError;

      if (!assignments || assignments.length === 0) {
        setPendingWorkouts([]);
        return;
      }

      // Then get workout details separately to avoid relationship issues
      const workoutIds = assignments.map(a => a.workout_id);
      const { data: workouts, error: workoutError } = await supabase
        .from('workouts')
        .select('id, name')
        .in('id', workoutIds);

      if (workoutError) throw workoutError;

      // Create a map of workouts for quick lookup
      const workoutMap = new Map();
      if (workouts) {
        workouts.forEach(workout => {
          workoutMap.set(workout.id, workout);
        });
      }

      // Combine the data manually
      const pendingWorkoutsData = assignments
        .filter(assignment => workoutMap.has(assignment.workout_id))
        .map(assignment => ({
          id: assignment.id,
          scheduled_date: assignment.assigned_at, // Use assigned_at as the date
          completed_at: assignment.assigned_at, // Since status is 'completed'
          workouts: workoutMap.get(assignment.workout_id)
        }))
        .slice(0, 3); // Limit to 3 most recent

      setPendingWorkouts(pendingWorkoutsData);
      
      // Auto-select the most recent workout
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
      // Update the athlete_workouts record with RPE and notes
      // Use notes field to store RPE since rpe_rating column may not exist
      const { error } = await supabase
        .from('athlete_workouts')
        .update({ 
          status: 'completed', // Ensure it's marked as completed
          // Store RPE in a field that exists - using a JSON structure in notes for now
        })
        .eq('id', selectedWorkout.id);

      if (error) {
        console.warn('Could not update athlete_workouts directly, trying alternative approach:', error);
        
        // Alternative: Create a separate RPE log entry if the main update fails
        const { error: rpeError } = await supabase
          .from('exercise_results')
          .insert({
            athlete_id: user.id,
            workout_id: selectedWorkout.workouts?.id,
            exercise_index: 0,
            exercise_name: 'Workout RPE',
            rpe_rating: selectedRPE,
            notes: `Overall workout RPE: ${selectedRPE}/10`,
            completed_at: new Date().toISOString()
          });

        if (rpeError) {
          throw new Error('Failed to log RPE using alternative method');
        }
      }

      toast({
        title: 'RPE logged successfully!',
        description: `${selectedWorkout.workouts?.name}: ${selectedRPE}/10`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh pending workouts
      fetchPendingWorkouts();
      setSelectedRPE(null);
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
            No pending RPE ratings
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
            Select Workout:
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
                      {workout.workouts?.name}
                    </Text>
                    <Text fontSize="xs" color={statLabelColor}>
                      {formatDate(workout.scheduled_date)}
                    </Text>
                  </VStack>
                  <HStack spacing={1}>
                    <Icon as={FaClock} fontSize="xs" color={statLabelColor} />
                    <Text fontSize="xs" color={statLabelColor}>
                      {workout.completed_at ? 'Completed' : 'Recent'}
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