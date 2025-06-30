import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Heading, Text, VStack, HStack, Button, Card, CardBody, 
  useColorModeValue, Flex, Badge, Icon, SimpleGrid, Avatar,
  Progress, Skeleton, Alert, AlertIcon, useToast
} from '@chakra-ui/react';
import { 
  FaUsers, FaEdit, FaDumbbell,
  FaClock, FaArrowLeft, FaTasks
} from 'react-icons/fa';
import type { Workout, Exercise } from '../services/api';
import { supabase } from '../lib/supabase';

interface WorkoutDetailViewProps {
  workout: Workout;
  onBack: () => void;
  onEdit?: () => void;
  onAssign?: () => void;
  onDelete?: () => void;
}

interface AthleteAssignment {
  athlete_id: string;
  status: string;
  assigned_at: string;
  athlete_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface WeeklyExerciseDay {
  day: number;
  exercises: Exercise[];
  isRestDay: boolean;
}

export function WorkoutDetailView({
  workout,
  onBack,
  onEdit,
  onAssign,
  onDelete
}: WorkoutDetailViewProps) {
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const infoColor = useColorModeValue('gray.600', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const toast = useToast();

  // Helper function to extract exercises from workout (handles both single and weekly formats)
  const getExercisesFromWorkout = useCallback((workout: Workout): Exercise[] => {
    if (!workout.exercises || !Array.isArray(workout.exercises)) {
      return [];
    }

    // Check if it's a weekly plan structure (array of day objects)
    if (workout.exercises.length > 0 && 
        typeof workout.exercises[0] === 'object' && 
        'day' in workout.exercises[0] && 
        'exercises' in workout.exercises[0]) {
      // It's a weekly plan structure - flatten all exercises from all days
      const weeklyPlan = workout.exercises as any[];
      return weeklyPlan.reduce((allExercises: Exercise[], dayPlan: any) => {
        if (dayPlan.exercises && Array.isArray(dayPlan.exercises) && !dayPlan.isRestDay) {
          return [...allExercises, ...dayPlan.exercises];
        }
        return allExercises;
      }, []);
    } else {
      // It's a regular exercise array
      return workout.exercises;
    }
  }, []);

  // State
  const [assignedAthletes, setAssignedAthletes] = useState<AthleteAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Memoize expensive calculations
  const exercises = useMemo(() => getExercisesFromWorkout(workout), [workout.exercises, workout.template_type, getExercisesFromWorkout]);
  const exerciseCount = useMemo(() => exercises.length, [exercises]);

  // Load assigned athletes with timeout and optimization
  const loadAssignedAthletes = useCallback(async () => {
    try {
      setLoading(true);
      
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Athlete loading timeout')), 5000);
      });

      const queryPromise = (async () => {
        // Simple, fast query - just get basic assignment data first
        const { data: athleteWorkouts, error: workoutError } = await supabase
          .from('athlete_workouts')
          .select('athlete_id, status, assigned_at')
          .eq('workout_id', workout.id)
          .limit(50); // Reasonable limit
          
        if (workoutError) throw workoutError;
        
        if (!athleteWorkouts || athleteWorkouts.length === 0) {
          return [];
        }

        // Only fetch profiles if we have assignments (avoid unnecessary query)
        const athleteIds = athleteWorkouts.map(aw => aw.athlete_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .in('id', athleteIds)
          .limit(50);
          
        // Combine the data efficiently
        return athleteWorkouts.map(aw => ({
          athlete_id: aw.athlete_id,
          status: aw.status,
          assigned_at: aw.assigned_at,
          athlete_profile: profiles?.find(p => p.id === aw.athlete_id) || null
        }));
      })();

      const assignments = await Promise.race([queryPromise, timeoutPromise]) as any[];
      setAssignedAthletes(assignments);
      
    } catch (error) {
      console.error('Error loading assigned athletes:', error);
      setAssignedAthletes([]); // Set empty array on error
      
      // Only show toast for non-timeout errors to reduce noise
      if (!error.message?.includes('timeout')) {
        toast({
          title: 'Error loading assignments',
          description: 'Unable to load athlete assignments.',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    } finally {
      setLoading(false);
    }
  }, [workout.id, toast]);

  useEffect(() => {
    // Debounce the loading to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      loadAssignedAthletes();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [workout.id]); // Only depend on workout.id, not the callback

  // Calculate statistics
  const completedAssignments = assignedAthletes.filter(a => a.status === 'completed').length;
  const inProgressAssignments = assignedAthletes.filter(a => a.status === 'in_progress').length;
  const notStartedAssignments = assignedAthletes.filter(a => a.status === 'not_started').length;
  const completionPercentage = assignedAthletes.length > 0 
    ? (completedAssignments / assignedAthletes.length) * 100 
    : 0;

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Box bg={bgColor} minH="100vh" p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <HStack spacing={4}>
            <Button
              leftIcon={<FaArrowLeft />}
              variant="ghost"
              onClick={onBack}
            >
              Back
            </Button>
            <VStack align="start" spacing={1}>
              <Heading size="lg" color={titleColor}>{workout.name}</Heading>
              <Text color={infoColor}>Workout Details</Text>
            </VStack>
          </HStack>

          {/* Action buttons */}
          <HStack spacing={3}>
            {onAssign && (
              <Button
                leftIcon={<FaUsers />}
                colorScheme="blue"
                onClick={onAssign}
                size="md"
              >
                Assign Athletes
              </Button>
            )}
            {onEdit && (
              <Button
                leftIcon={<FaEdit />}
                colorScheme="teal"
                onClick={onEdit}
                size="md"
              >
                Edit
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Basic Info */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody p={6}>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
              <VStack spacing={2}>
                <Icon as={FaTasks} color="blue.500" boxSize={6} />
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {exerciseCount}
                </Text>
                <Text fontSize="sm" color={infoColor}>Exercises</Text>
              </VStack>
              
              {workout.duration && (
                <VStack spacing={2}>
                  <Icon as={FaClock} color="green.500" boxSize={6} />
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {workout.duration}
                  </Text>
                  <Text fontSize="sm" color={infoColor}>Minutes</Text>
                </VStack>
              )}
              
              <VStack spacing={2}>
                <Icon as={FaUsers} color="purple.500" boxSize={6} />
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  {assignedAthletes.length}
                </Text>
                <Text fontSize="sm" color={infoColor}>Athletes</Text>
              </VStack>
              
              <VStack spacing={2}>
                <Icon as={FaDumbbell} color="orange.500" boxSize={6} />
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {completionPercentage.toFixed(0)}%
                </Text>
                <Text fontSize="sm" color={infoColor}>Complete</Text>
              </VStack>
            </SimpleGrid>

            {/* Description */}
            {(workout.notes || workout.description) && (
              <Box mt={6}>
                <Heading size="sm" color={titleColor} mb={2}>Description</Heading>
                <Text color={infoColor}>{workout.notes || workout.description}</Text>
              </Box>
            )}
          </CardBody>
        </Card>

        {/* Weekly Breakdown (for weekly workouts) */}
        {workout.template_type === 'weekly' && workout.exercises && Array.isArray(workout.exercises) && 
         workout.exercises.length > 0 && 'day' in workout.exercises[0] && (
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody p={6}>
              <Heading size="md" color={titleColor} mb={4}>Weekly Breakdown</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {(workout.exercises as any[]).map((dayPlan, index) => (
                  <Card key={index} bg={bgColor} borderWidth="1px" borderColor={borderColor}>
                    <CardBody p={4}>
                      <Flex justify="space-between" align="center" mb={3}>
                        <Heading size="sm" color={titleColor} textTransform="capitalize">
                          {dayPlan.day}
                        </Heading>
                        {dayPlan.isRestDay ? (
                          <Badge colorScheme="orange">Rest Day</Badge>
                        ) : (
                          <Badge colorScheme="blue">{dayPlan.exercises?.length || 0} exercises</Badge>
                        )}
                      </Flex>
                      {dayPlan.isRestDay ? (
                        <Text fontSize="sm" color={infoColor} fontStyle="italic">
                          Scheduled rest day
                        </Text>
                      ) : (
                        <VStack spacing={2} align="stretch">
                          {(dayPlan.exercises || []).slice(0, 3).map((exercise: Exercise, exIndex: number) => (
                            <Text key={exIndex} fontSize="sm" color={infoColor}>
                              • {exercise.name}
                              {exercise.sets && exercise.reps && ` (${exercise.sets} × ${exercise.reps})`}
                            </Text>
                          ))}
                          {(dayPlan.exercises || []).length > 3 && (
                            <Text fontSize="xs" color={infoColor} fontStyle="italic">
                              +{(dayPlan.exercises || []).length - 3} more...
                            </Text>
                          )}
                        </VStack>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>
        )}

        {/* Exercise List */}
        {exercises && exercises.length > 0 && (
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody p={6}>
              <Heading size="md" color={titleColor} mb={4}>
                {workout.template_type === 'weekly' ? 'All Exercises' : 'Exercises'}
              </Heading>
              {workout.template_type === 'weekly' && (
                <Text fontSize="sm" color={infoColor} mb={4} fontStyle="italic">
                  Complete list of exercises from all training days
                </Text>
              )}
              <VStack spacing={3} align="stretch">
                {exercises.slice(0, 15).map((exercise, index) => (
                  <HStack key={index} justify="space-between" p={3} bg={bgColor} borderRadius="md">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium" color={titleColor}>
                        {exercise.name}
                      </Text>
                      {exercise.notes && (
                        <Text fontSize="sm" color={infoColor}>
                          {exercise.notes}
                        </Text>
                      )}
                      {exercise.description && (
                        <Text fontSize="xs" color={infoColor} opacity={0.8}>
                          {exercise.description}
                        </Text>
                      )}
                    </VStack>
                    <VStack align="end" spacing={1}>
                      {exercise.sets && exercise.reps && (
                        <Badge colorScheme="blue">
                          {exercise.sets} × {exercise.reps}
                        </Badge>
                      )}
                      {exercise.weight && (
                        <Text fontSize="sm" color={infoColor}>
                          {exercise.weight} lbs
                        </Text>
                      )}
                      {exercise.distance && (
                        <Text fontSize="sm" color={infoColor}>
                          {exercise.distance}m
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                ))}
                {exercises.length > 15 && (
                  <Text fontSize="sm" color={infoColor} textAlign="center" fontStyle="italic">
                    +{exercises.length - 15} more exercises...
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Assigned Athletes */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody p={6}>
            <Heading size="md" color={titleColor} mb={4}>
              Assigned Athletes ({assignedAthletes.length})
            </Heading>
            
            {loading ? (
              <VStack spacing={3}>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} height="60px" borderRadius="md" />
                ))}
              </VStack>
            ) : assignedAthletes.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                <Text>No athletes assigned to this workout yet.</Text>
              </Alert>
            ) : (
              <VStack spacing={3} align="stretch">
                {assignedAthletes.map((assignment) => (
                  <HStack key={assignment.athlete_id} justify="space-between" p={3} bg={bgColor} borderRadius="md">
                    <HStack spacing={3}>
                      <Avatar
                        size="sm"
                        name={assignment.athlete_profile ? 
                          `${assignment.athlete_profile.first_name} ${assignment.athlete_profile.last_name}` : 
                          'Unknown'
                        }
                        src={assignment.athlete_profile?.avatar_url}
                      />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium" color={titleColor}>
                          {assignment.athlete_profile ? 
                            `${assignment.athlete_profile.first_name} ${assignment.athlete_profile.last_name}` : 
                            'Unknown Athlete'
                          }
                        </Text>
                        <Text fontSize="sm" color={infoColor}>
                          Assigned {formatDate(assignment.assigned_at)}
                        </Text>
                      </VStack>
                    </HStack>
                    <Badge
                      colorScheme={
                        assignment.status === 'completed' ? 'green' :
                        assignment.status === 'in_progress' ? 'blue' : 'gray'
                      }
                    >
                      {assignment.status === 'completed' ? 'Completed' :
                       assignment.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                    </Badge>
                  </HStack>
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
} 