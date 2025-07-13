import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Heading, Text, VStack, HStack, Button, Card, CardBody, 
  useColorModeValue, Flex, Badge, Icon, SimpleGrid, Avatar,
  Progress, Skeleton, Alert, AlertIcon, useToast, CardHeader
} from '@chakra-ui/react';
import { 
  FaUsers, FaEdit, FaDumbbell,
  FaClock, FaArrowLeft, FaTasks, FaLayerGroup
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

interface WorkoutBlock {
  id: string;
  name: string;
  exercises: Exercise[];
  category: string;
  flow: string;
  restBetweenExercises: number;
  rounds?: number;
}

// Simplified Block Display Component for Detail View
interface BlockDisplayProps {
  block: WorkoutBlock;
}

const BlockDisplay: React.FC<BlockDisplayProps> = ({ block }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const blockHeaderBg = useColorModeValue('gray.50', 'gray.600');
  const exerciseBg = useColorModeValue('gray.50', 'gray.600');
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'warmup': return 'orange';
      case 'main': return 'blue';
      case 'conditioning': return 'green';
      case 'accessory': return 'purple';
      case 'cooldown': return 'cyan';
      default: return 'gray';
    }
  };

  // Helper function to check if a value is meaningful (not empty or zero)
  const hasValue = (value: string | undefined) => value && String(value).trim() !== '' && String(value).trim() !== '0';

  return (
    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={4}>
      <CardHeader bg={blockHeaderBg} py={3}>
        <VStack align="start" spacing={1}>
          <HStack spacing={3}>
            <Icon as={FaLayerGroup} color={`${getCategoryColor(block.category)}.500`} />
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              {block.name}
            </Text>
            <Badge colorScheme={getCategoryColor(block.category)} size="sm">
              {block.category}
            </Badge>
            <Badge variant="outline" size="sm">
              {block.flow}
              {block.rounds && block.rounds > 1 && ` (${block.rounds}x)`}
            </Badge>
          </HStack>
          <Text fontSize="sm" color={subtitleColor}>
            {block.exercises.length} exercise{block.exercises.length !== 1 ? 's' : ''} • {block.restBetweenExercises}s rest between exercises
          </Text>
        </VStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={3} align="stretch">
          {block.exercises.map((exercise, index) => (
            <Box
              key={exercise.instanceId || `${exercise.name}-${index}`}
              p={3}
              bg={exerciseBg}
              borderRadius="md"
              borderLeft="3px solid"
              borderLeftColor={`${getCategoryColor(block.category)}.400`}
            >
              <VStack spacing={2} align="stretch">
                {/* Exercise Header */}
                <VStack align="start" spacing={1}>
                  <HStack spacing={2}>
                    <Text fontSize="md" fontWeight="bold" color={textColor}>
                      {index + 1}. {exercise.name}
                    </Text>
                    {exercise.category && (
                      <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                        {exercise.category}
                      </Badge>
                    )}
                  </HStack>
                  {exercise.description && (
                    <Text fontSize="xs" color={subtitleColor} noOfLines={2}>
                      {exercise.description}
                    </Text>
                  )}
                </VStack>
                
                {/* Exercise Parameters */}
                <SimpleGrid columns={{ base: 3, md: 6 }} spacing={2}>
                  <VStack align="start" spacing={0.5}>
                    <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>Sets</Text>
                    <Text fontSize="sm" fontWeight="medium" color={hasValue(String(exercise.sets)) ? textColor : subtitleColor}>
                      {hasValue(String(exercise.sets)) ? exercise.sets : '-'}
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0.5}>
                    <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>Reps</Text>
                    <Text fontSize="sm" fontWeight="medium" color={hasValue(String(exercise.reps)) ? textColor : subtitleColor}>
                      {hasValue(String(exercise.reps)) ? exercise.reps : '-'}
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0.5}>
                    <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>Weight</Text>
                    <Text fontSize="sm" fontWeight="medium" color={hasValue(String(exercise.weight)) ? textColor : subtitleColor}>
                      {hasValue(String(exercise.weight)) ? `${exercise.weight}kg` : '-'}
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0.5}>
                    <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>Distance</Text>
                    <Text fontSize="sm" fontWeight="medium" color={hasValue(String(exercise.distance)) ? textColor : subtitleColor}>
                      {hasValue(String(exercise.distance)) ? `${exercise.distance}m` : '-'}
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0.5}>
                    <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>Rest</Text>
                    <Text fontSize="sm" fontWeight="medium" color={hasValue(String(exercise.rest)) ? textColor : subtitleColor}>
                      {hasValue(String(exercise.rest)) ? 
                        (Number(exercise.rest) >= 60 ? 
                          `${Math.floor(Number(exercise.rest) / 60)}:${(Number(exercise.rest) % 60).toString().padStart(2, '0')}` : 
                          `${exercise.rest}s`
                        ) : '-'
                      }
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={0.5}>
                    <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>RPE</Text>
                    <Text fontSize="sm" fontWeight="medium" color={hasValue(String(exercise.rpe)) ? textColor : subtitleColor}>
                      {hasValue(String(exercise.rpe)) ? exercise.rpe : '-'}
                    </Text>
                  </VStack>
                </SimpleGrid>
                
                {/* Exercise Notes */}
                {exercise.notes && String(exercise.notes).trim() !== '' && (
                  <Box pt={1}>
                    <Text fontSize="xs" color={textColor} fontStyle="italic">
                      "{exercise.notes}"
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
};

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
  
  // Calculate exercise count properly for both block-based and exercise-based workouts
  const exerciseCount = useMemo(() => {
    if (workout.is_block_based && workout.blocks) {
      // For block-based workouts, count exercises from all blocks
      if (typeof workout.blocks === 'object' && !Array.isArray(workout.blocks)) {
        // Weekly block-based: sum exercises from all days
        return Object.values(workout.blocks as Record<string, any[]>).reduce((total: number, dayBlocks: any) => {
          if (Array.isArray(dayBlocks)) {
            return total + dayBlocks.reduce((dayTotal: number, block: any) => {
              return dayTotal + (block.exercises?.length || 0);
            }, 0);
          }
          return total;
        }, 0);
      } else if (Array.isArray(workout.blocks)) {
        // Single day block-based: sum exercises from all blocks
        return (workout.blocks as any[]).reduce((total: number, block: any) => {
          return total + (block.exercises?.length || 0);
        }, 0);
      }
    }
    // Fall back to exercise array count
    return exercises.length;
  }, [workout.is_block_based, workout.blocks, exercises.length]);
  
  // For block-based workouts, calculate block count
  const blockCount = useMemo(() => {
    if (workout.is_block_based && workout.blocks) {
      if (typeof workout.blocks === 'object' && !Array.isArray(workout.blocks)) {
        // Weekly: count total blocks across all days
        return Object.values(workout.blocks as Record<string, any[]>).reduce((total: number, dayBlocks: any) => {
          return total + (Array.isArray(dayBlocks) ? dayBlocks.length : 0);
        }, 0);
      } else if (Array.isArray(workout.blocks)) {
        // Single day: count blocks
        return (workout.blocks as any[]).length;
      }
    }
    return 0;
  }, [workout.is_block_based, workout.blocks]);

  // Load assigned athletes with timeout and optimization
  const loadAssignedAthletes = useCallback(async () => {
    try {
      setLoading(true);
      
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Athlete loading timeout')), 5000);
      });

      const queryPromise = (async () => {
        // Simple, fast query - get assignment data from unified system
        const { data: unifiedAssignments, error: workoutError } = await supabase
          .from('unified_workout_assignments')
          .select('athlete_id, status, assigned_at')
          .eq('meta->>original_workout_id', workout.id)
          .limit(50); // Reasonable limit
          
        if (workoutError) throw workoutError;
        
        if (!unifiedAssignments || unifiedAssignments.length === 0) {
          return [];
        }

        // Only fetch profiles if we have assignments (avoid unnecessary query)
        const athleteIds = unifiedAssignments.map(aw => aw.athlete_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .in('id', athleteIds)
          .limit(50);
          
        // Combine the data efficiently
        return unifiedAssignments.map(aw => ({
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

  // Debug logging for weekly workouts
  useEffect(() => {
    if (workout.template_type === 'weekly') {
      console.log('🔍 Weekly Workout Debug:', {
        name: workout.name,
        template_type: workout.template_type,
        is_block_based: workout.is_block_based,
        exercises: workout.exercises,
        blocks: workout.blocks,
        exercisesIsArray: Array.isArray(workout.exercises),
        exercisesLength: workout.exercises?.length,
        blocksIsObject: typeof workout.blocks === 'object',
        blocksKeys: workout.blocks ? Object.keys(workout.blocks) : null,
        firstExercise: workout.exercises?.[0],
        hasDay: workout.exercises?.[0] && 'day' in workout.exercises[0],
        exerciseStructure: workout.exercises?.map((ex: any, i: number) => ({
          index: i,
          type: typeof ex,
          keys: Object.keys(ex || {}),
          hasDay: ex && 'day' in ex,
          hasExercises: ex && 'exercises' in ex
        }))
      });
    }
  }, [workout]);

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
              <HStack spacing={3}>
                <Heading size="lg" color={titleColor}>{workout.name}</Heading>
                {workout.is_block_based && (
                  <Badge colorScheme="green" fontSize="sm">
                    BLOCK MODE
                  </Badge>
                )}
              </HStack>
              <Text color={infoColor}>Workout Details</Text>
            </VStack>
          </HStack>

          {/* Action buttons */}
          <HStack spacing={3}>
            {onAssign && !workout.is_template && (
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
                <Icon as={workout.is_block_based ? FaLayerGroup : FaTasks} color="blue.500" boxSize={6} />
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {workout.is_block_based ? blockCount : exerciseCount}
                </Text>
                <Text fontSize="sm" color={infoColor}>
                  {workout.is_block_based ? 'Blocks' : 'Exercises'}
                </Text>
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
        {workout.template_type === 'weekly' && (
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody p={6}>
              <Heading size="md" color={titleColor} mb={4}>Weekly Breakdown</Heading>
              
              {/* Handle block-based weekly workouts */}
              {workout.is_block_based && workout.blocks && typeof workout.blocks === 'object' ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                    const dayBlocks = workout.blocks[day] || [];
                    const isRestDay = !dayBlocks || dayBlocks.length === 0;
                    
                    // Calculate total exercises for this day
                    const totalExercises = Array.isArray(dayBlocks) 
                      ? dayBlocks.reduce((total: number, block: any) => {
                          return total + (block.exercises?.length || 0);
                        }, 0)
                      : 0;

                    return (
                      <Card key={day} bg={bgColor} borderWidth="1px" borderColor={borderColor}>
                        <CardBody p={4}>
                          <Flex justify="space-between" align="center" mb={3}>
                            <Heading size="sm" color={titleColor} textTransform="capitalize">
                              {day}
                            </Heading>
                            {isRestDay ? (
                              <Badge colorScheme="orange">Rest Day</Badge>
                            ) : (
                              <Badge colorScheme="blue">
                                {dayBlocks.length} block{dayBlocks.length !== 1 ? 's' : ''} • {totalExercises} exercises
                              </Badge>
                            )}
                          </Flex>
                          {isRestDay ? (
                            <Text fontSize="sm" color={infoColor} fontStyle="italic">
                              No training scheduled
                            </Text>
                          ) : (
                            <VStack spacing={2} align="stretch">
                              {dayBlocks.slice(0, 3).map((block: any, blockIndex: number) => (
                                <Box key={blockIndex} fontSize="sm" color={infoColor}>
                                  <Text fontWeight="medium">• {block.name}</Text>
                                  <Text fontSize="xs" color={infoColor} ml={3}>
                                    {block.exercises?.length || 0} exercises • {block.flow} • {block.restBetweenExercises}s rest
                                  </Text>
                                </Box>
                              ))}
                              {dayBlocks.length > 3 && (
                                <Text fontSize="xs" color={infoColor} fontStyle="italic">
                                  +{dayBlocks.length - 3} more blocks...
                                </Text>
                              )}
                            </VStack>
                          )}
                        </CardBody>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              ) : 
              /* Handle legacy exercise-based weekly workouts */
              workout.exercises && Array.isArray(workout.exercises) && 
               workout.exercises.length > 0 && 
               workout.exercises[0] && 
               typeof workout.exercises[0] === 'object' && 
               'day' in workout.exercises[0] ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {(workout.exercises as any[]).map((dayPlan, index) => (
                    <Card key={index} bg={bgColor} borderWidth="1px" borderColor={borderColor}>
                      <CardBody p={4}>
                        <Flex justify="space-between" align="center" mb={3}>
                          <Heading size="sm" color={titleColor} textTransform="capitalize">
                            {dayPlan.day || `Day ${index + 1}`}
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
              ) : (
                /* Fallback for weekly workouts without proper structure */
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Weekly Workout Structure Issue</Text>
                    <Text fontSize="sm">
                      This weekly workout doesn't have the expected structure. 
                      {workout.is_block_based 
                        ? `Block-based: ${workout.blocks ? Object.keys(workout.blocks).length : 0} day(s) configured.`
                        : `Exercise-based: ${workout.exercises ? `Found ${Array.isArray(workout.exercises) ? workout.exercises.length : 1} item(s).` : 'No exercises found.'}`
                      }
                    </Text>
                    {process.env.NODE_ENV === 'development' && (
                      <VStack align="start" spacing={1} mt={2}>
                        <Text fontSize="xs" color="gray.500">
                          Debug: is_block_based={workout.is_block_based ? 'true' : 'false'}
                        </Text>
                        {workout.blocks && (
                          <Text fontSize="xs" color="gray.500">
                            blocks={JSON.stringify(Object.keys(workout.blocks))}
                          </Text>
                        )}
                        {workout.exercises && (
                          <Text fontSize="xs" color="gray.500">
                            exercises={JSON.stringify(workout.exercises?.slice?.(0, 2) || workout.exercises || 'null')}
                          </Text>
                        )}
                      </VStack>
                    )}
                  </Box>
                </Alert>
              )}
            </CardBody>
          </Card>
        )}

        {/* Block Structure (for block-based workouts) */}
        {workout.is_block_based && workout.blocks && workout.blocks.length > 0 && (
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody p={6}>
              <Heading size="md" color={titleColor} mb={4}>Training Blocks</Heading>
              <VStack spacing={4} align="stretch">
                {(workout.blocks as WorkoutBlock[]).map((block, index) => (
                  <BlockDisplay key={block.id || index} block={block} />
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Exercise List (for non-block workouts) */}
        {!workout.is_block_based && exercises && exercises.length > 0 && (
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