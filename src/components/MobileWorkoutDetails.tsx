import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  HStack,
  Text,
  Icon,
  Badge,
  Flex,
  IconButton,
  useColorModeValue,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Button,
  SimpleGrid,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { 
  FaRunning, 
  FaDumbbell, 
  FaLeaf, 
  FaClock, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaTimes,
  FaUsers,
  FaEdit,
  FaTrash,
  FaPlay,
  FaRedo,
  FaEye,
  FaUser,
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEllipsisV,
} from 'react-icons/fa';
import { format } from 'date-fns';
import type { Workout } from '../services/api';
import { getExercisesFromWorkout, getBlocksFromWorkout } from '../utils/workoutUtils';

interface MobileWorkoutDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  workout: Workout | null;
  userRole: 'athlete' | 'coach';
  // Athlete-specific props
  progress?: {
    completed: number;
    total: number;
    percentage: number;
    hasProgress?: boolean;
  };
  onStart?: () => void;
  onReset?: () => void;
  // Coach-specific props
  assignedTo?: string;
  athleteCount?: number;
  completionRate?: number;
  onAssign?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewProgress?: () => void;
  // Assignment-specific props (for unified assignments)
  assignment?: any;
  onExecute?: (assignmentId: string) => void;
}

function getTypeIcon(type: string | undefined) {
  switch (type?.toLowerCase()) {
    case 'strength':
      return { type: FaDumbbell, color: 'orange.500' };
    case 'cardio':
      return { type: FaRunning, color: 'red.500' };
    case 'flexibility':
      return { type: FaLeaf, color: 'green.500' };
    default:
      return { type: FaRunning, color: 'blue.500' };
  }
}

// Convert assignment to workout format (like UnifiedAssignmentCard does)
const convertAssignmentToWorkout = (assignment: any) => {
  if (!assignment) return null;
  
  const workout = {
    id: assignment.id,
    name: assignment.exercise_block?.workout_name || assignment.exercise_block?.plan_name || 'Assignment Workout',
    description: assignment.exercise_block?.description || '',
    type: assignment.assignment_type,
    date: assignment.start_date,
    duration: assignment.exercise_block?.estimated_duration || '',
    notes: assignment.exercise_block?.notes || '',
    created_at: assignment.created_at,
    exercises: assignment.exercise_block?.exercises || [],
    blocks: assignment.exercise_block?.blocks || [],
    is_block_based: assignment.exercise_block?.is_block_based || false,
    template_type: assignment.assignment_type as 'single' | 'weekly' | 'monthly',
    daily_workouts: assignment.exercise_block?.daily_workouts || undefined,
  };
  
  return workout;
};

// Get assignment details (like UnifiedAssignmentCard does)
const getAssignmentDetails = (assignment: any) => {
  if (!assignment) return null;
  
  const { assignment_type, exercise_block, progress, meta } = assignment;
  
  switch (assignment_type) {
    case 'single':
      return {
        title: exercise_block.workout_name || 'Single Workout',
        subtitle: assignment_type.toUpperCase(),
        duration: exercise_block.estimated_duration,
        exercises: exercise_block.exercises?.length || 0,
        workoutType: 'SINGLE'
      };
      
    case 'weekly':
      // For weekly plans, count total exercises across all days
      const dailyWorkouts = exercise_block.daily_workouts || {};
      let totalWeeklyExercises = 0;
      
      Object.values(dailyWorkouts).forEach((dayWorkout: any) => {
        if (Array.isArray(dayWorkout)) {
          // New blocks format: array of blocks, each with exercises
          dayWorkout.forEach((block: any) => {
            if (block.exercises && Array.isArray(block.exercises)) {
              totalWeeklyExercises += block.exercises.length;
            }
          });
        } else if (dayWorkout && dayWorkout.exercises && Array.isArray(dayWorkout.exercises)) {
          // Legacy format: { exercises: [], is_rest_day: boolean }
          totalWeeklyExercises += dayWorkout.exercises.length;
        }
      });
      
      // Fallback: try to extract from exercise_block.exercises if daily_workouts is empty
      if (totalWeeklyExercises === 0 && exercise_block.exercises) {
        const exercises = exercise_block.exercises;
        if (Array.isArray(exercises) && exercises.length > 0) {
          // Check if it's weekly plan structure (array of day objects)
          if (typeof exercises[0] === 'object' && 'day' in exercises[0] && 'exercises' in exercises[0]) {
            exercises.forEach((dayPlan: any) => {
              if (dayPlan.exercises && Array.isArray(dayPlan.exercises) && !dayPlan.isRestDay) {
                totalWeeklyExercises += dayPlan.exercises.length;
              }
            });
          } else {
            // Regular exercise array - count all
            totalWeeklyExercises = exercises.length;
          }
        }
      }
      
      return {
        title: exercise_block.workout_name || exercise_block.plan_name || 'Weekly Plan',
        subtitle: 'WEEKLY',
        duration: `${exercise_block.total_days || 7} days`,
        exercises: totalWeeklyExercises,
        workoutType: 'WEEKLY'
      };
      
    case 'monthly':
      return {
        title: exercise_block.plan_name || 'Monthly Plan',
        subtitle: 'MONTHLY',
        duration: `${exercise_block.duration_weeks || 4} weeks`,
        exercises: assignment.progress?.total_exercises || 0,
        workoutType: 'MONTHLY'
      };
      
    default:
      return {
        title: 'Unknown Assignment',
        subtitle: 'UNKNOWN',
        duration: '',
        exercises: 0,
        workoutType: 'UNKNOWN'
      };
  }
};

// Get detailed progress metrics (like UnifiedAssignmentCard does)
const getDetailedProgress = (assignment: any) => {
  if (!assignment) return null;
  
  const progress = assignment.progress;
  const details = getAssignmentDetails(assignment);
  
  if (!progress || !details) {
    return {
      exercises: { current: 0, total: details?.exercises || 0 },
      sets: { current: 0, total: 0 },
      reps: { current: 0, total: 0 }
    };
  }

  // For different assignment types, calculate progress differently
  switch (assignment.assignment_type) {
    case 'single':
      const exercises = assignment.exercise_block?.exercises || [];
      const currentExerciseIndex = progress.current_exercise_index || 0;
      const currentSet = progress.current_set || 1;
      const currentRep = progress.current_rep || 1;
      
      // Calculate total sets and reps
      let totalSets = 0;
      let totalReps = 0;
      let completedSets = 0;
      let completedReps = 0;
      
      exercises.forEach((exercise: any, index: number) => {
        const exerciseSets = parseInt(String(exercise.sets)) || 1;
        const exerciseReps = parseInt(String(exercise.reps)) || 1;
        const exerciseTotalReps = exerciseSets * exerciseReps;
        
        totalSets += exerciseSets;
        totalReps += exerciseTotalReps;
        
        if (index < currentExerciseIndex) {
          // Completed exercises
          completedSets += exerciseSets;
          completedReps += exerciseTotalReps;
        } else if (index === currentExerciseIndex) {
          // Current exercise
          completedSets += currentSet - 1;
          completedReps += (currentSet - 1) * exerciseReps + (currentRep - 1);
        }
      });
      
      return {
        exercises: { current: currentExerciseIndex, total: exercises.length },
        sets: { current: completedSets, total: totalSets },
        reps: { current: completedReps, total: totalReps }
      };
      
    case 'weekly':
      return {
        exercises: { current: progress.current_exercise_index || 0, total: progress.total_exercises || 0 },
        sets: { current: progress.current_set || 0, total: (progress.current_set || 0) + 3 }, // Estimate
        reps: { current: progress.current_rep || 0, total: (progress.current_rep || 0) + 15 } // Estimate
      };
      
    case 'monthly':
      return {
        exercises: { current: progress.current_exercise_index || 0, total: progress.total_exercises || 0 },
        sets: { current: progress.current_set || 0, total: (progress.current_set || 0) + 5 }, // Estimate
        reps: { current: progress.current_rep || 0, total: (progress.current_rep || 0) + 20 } // Estimate
      };
      
    default:
      return {
        exercises: { current: 0, total: details.exercises },
        sets: { current: 0, total: 0 },
        reps: { current: 0, total: 0 }
      };
  }
};

export const MobileWorkoutDetails: React.FC<MobileWorkoutDetailsProps> = ({
  isOpen,
  onClose,
  workout,
  userRole,
  progress,
  onStart,
  onReset,
  assignedTo,
  athleteCount,
  completionRate,
  onAssign,
  onEdit,
  onDelete,
  onViewProgress,
  assignment,
  onExecute,
}) => {
  // Early return if not open
  if (!isOpen) {
    return null;
  }

  // Determine if we're dealing with an assignment or a workout
  const isAssignment = !!assignment;
  const displayWorkout = isAssignment ? convertAssignmentToWorkout(assignment) : workout;
  const assignmentDetails = isAssignment ? getAssignmentDetails(assignment) : null;
  const detailedProgress = isAssignment ? getDetailedProgress(assignment) : null;

  // Calculate athlete count from assignedTo if not provided
  const calculatedAthleteCount = athleteCount || (assignedTo && assignedTo !== 'Unassigned' ? 
    assignedTo.split(',').length : 0);

  // Calculate overall progress percentage from detailed progress
  const calculateOverallProgress = () => {
    if (detailedProgress) {
      const exerciseProgress = detailedProgress.exercises.current / detailedProgress.exercises.total;
      const setsProgress = detailedProgress.sets.total > 0 ? detailedProgress.sets.current / detailedProgress.sets.total : 0;
      const repsProgress = detailedProgress.reps.total > 0 ? detailedProgress.reps.current / detailedProgress.reps.total : 0;
      
      // Weight the progress: exercises (50%), sets (30%), reps (20%)
      const overallProgress = (exerciseProgress * 0.5) + (setsProgress * 0.3) + (repsProgress * 0.2);
      return Math.round(overallProgress * 100);
    }
    return progress?.percentage || 0;
  };

  const overallProgressPercentage = calculateOverallProgress();

  // Theme colors
  const drawerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const drawerText = useColorModeValue('gray.700', 'gray.200');
  const sectionTitleColor = useColorModeValue('gray.500', 'gray.400');
  const exerciseCardBg = useColorModeValue('gray.50', 'gray.700');
  const buttonHoverBg = useColorModeValue('gray.100', 'gray.700');

  if (!displayWorkout) return null;

  // Get workout data
  const allExercises = getExercisesFromWorkout(displayWorkout);
  const workoutBlocks = getBlocksFromWorkout(displayWorkout);
  const isBlockBased = (displayWorkout as any).is_block_based;

  // Format date
  const formattedDate = displayWorkout.date 
    ? format(new Date(displayWorkout.date), 'MMM d, yyyy')
    : 'No date set';

  // Get assignment status
  const getAssignmentStatus = () => {
    if (!assignment) return null;
    
    switch (assignment.status) {
      case 'in_progress': return { text: 'IN PROGRESS', color: 'orange' };
      case 'completed': return { text: 'COMPLETED', color: 'green' };
      case 'assigned': return { text: 'ASSIGNED', color: 'blue' };
      default: return { text: assignment.status?.toUpperCase() || 'UNKNOWN', color: 'gray' };
    }
  };

  const assignmentStatus = getAssignmentStatus();

  const WorkoutContent = () => (
    <VStack spacing={6} align="stretch" p={6}>
      {/* Workout Header */}
      <VStack spacing={4} align="stretch">
        <HStack spacing={3} align="center">
          <Box 
            bg="blue.500" 
            borderRadius="full" 
            p={3} 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
          >
            <Icon 
              as={displayWorkout.type ? getTypeIcon(displayWorkout.type).type : FaRunning} 
              color="white" 
              boxSize={6} 
            />
          </Box>
          <VStack align="start" spacing={1} flex="1">
            <Text fontSize="xl" fontWeight="bold" color={drawerText}>
              {displayWorkout.name}
            </Text>
            <HStack spacing={2}>
              <Badge colorScheme="blue" fontSize="sm">
                {displayWorkout.type || 'Running'}
              </Badge>
              {isBlockBased && (
                <Badge colorScheme="green" fontSize="sm">
                  Block Mode
                </Badge>
              )}
              {isAssignment && assignmentDetails && (
                <Badge colorScheme="purple" fontSize="sm">
                  {assignmentDetails.subtitle}
                </Badge>
              )}
              {assignmentStatus && (
                <Badge colorScheme={assignmentStatus.color} fontSize="sm">
                  {assignmentStatus.text}
                </Badge>
              )}
            </HStack>
          </VStack>
        </HStack>

        {/* Assignment-specific details */}
        {isAssignment && assignmentDetails && (
          <Box bg={exerciseCardBg} p={4} borderRadius="lg">
            <VStack spacing={3} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color={drawerText}>
                Assignment Details
              </Text>
              <SimpleGrid columns={2} spacing={4}>
                <Stat>
                  <StatLabel color={sectionTitleColor}>Type</StatLabel>
                  <StatNumber color={drawerText}>{assignmentDetails.workoutType}</StatNumber>
                  <StatHelpText color={sectionTitleColor}>
                    {assignmentDetails.duration}
                  </StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel color={sectionTitleColor}>Exercises</StatLabel>
                  <StatNumber color={drawerText}>{assignmentDetails.exercises}</StatNumber>
                  <StatHelpText color={sectionTitleColor}>
                    Total exercises
                  </StatHelpText>
                </Stat>
              </SimpleGrid>
            </VStack>
          </Box>
        )}

        {/* Role-specific Stats Section */}
        {userRole === 'athlete' && (progress || detailedProgress) && (
          <Box bg={exerciseCardBg} p={4} borderRadius="lg">
            <VStack spacing={3} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color={drawerText}>
                Your Progress
              </Text>
              {detailedProgress ? (
                <VStack spacing={4} align="stretch">
                  {/* Exercise Progress */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" color={sectionTitleColor}>Exercises</Text>
                      <Text fontSize="sm" fontWeight="bold" color="blue.500">
                        {detailedProgress.exercises.current}/{detailedProgress.exercises.total}
                      </Text>
                    </HStack>
                    <Progress 
                      value={(detailedProgress.exercises.current / detailedProgress.exercises.total) * 100} 
                      colorScheme="blue" 
                      size="sm" 
                      borderRadius="full"
                    />
                  </Box>
                  
                  {/* Sets Progress */}
                  {detailedProgress.sets.total > 0 && (
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" color={sectionTitleColor}>Sets</Text>
                        <Text fontSize="sm" fontWeight="bold" color="green.500">
                          {detailedProgress.sets.current}/{detailedProgress.sets.total}
                        </Text>
                      </HStack>
                      <Progress 
                        value={(detailedProgress.sets.current / detailedProgress.sets.total) * 100} 
                        colorScheme="green" 
                        size="sm" 
                        borderRadius="full"
                      />
                    </Box>
                  )}
                  
                  {/* Reps Progress */}
                  {detailedProgress.reps.total > 0 && (
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" color={sectionTitleColor}>Reps</Text>
                        <Text fontSize="sm" fontWeight="bold" color="orange.500">
                          {detailedProgress.reps.current}/{detailedProgress.reps.total}
                        </Text>
                      </HStack>
                      <Progress 
                        value={(detailedProgress.reps.current / detailedProgress.reps.total) * 100} 
                        colorScheme="orange" 
                        size="sm" 
                        borderRadius="full"
                      />
                    </Box>
                  )}
                </VStack>
              ) : (
                <>
                  <Progress 
                    value={overallProgressPercentage} 
                    colorScheme="blue" 
                    size="lg" 
                    borderRadius="full"
                  />
                  <HStack justify="space-between">
                    <Text fontSize="sm" color={sectionTitleColor}>
                      {progress?.completed || 0} of {progress?.total || 0} completed
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" color="blue.500">
                      {overallProgressPercentage}%
                    </Text>
                  </HStack>
                </>
              )}
            </VStack>
          </Box>
        )}

        {userRole === 'coach' && (
          <Box bg={exerciseCardBg} p={4} borderRadius="lg">
            <VStack spacing={3} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color={drawerText}>
                Assignment Stats
              </Text>
              <SimpleGrid columns={1} spacing={4}>
                <Stat>
                  <StatLabel color={sectionTitleColor}>Assigned To</StatLabel>
                  <StatNumber color={drawerText} fontSize="sm">{assignedTo || 'Unassigned'}</StatNumber>
                  <StatHelpText color={sectionTitleColor} fontSize="sm">
                    {calculatedAthleteCount || 0} athletes
                  </StatHelpText>
                </Stat>
              </SimpleGrid>
            </VStack>
          </Box>
        )}

        {/* Workout Details */}
        <VStack spacing={3} align="stretch">
          {displayWorkout.description && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" color={sectionTitleColor} mb={2}>
                Description
              </Text>
              <Text fontSize="sm" color={drawerText}>
                {displayWorkout.description}
              </Text>
            </Box>
          )}

          <HStack spacing={6}>
            {displayWorkout.date && (
              <HStack spacing={2}>
                <Icon as={FaCalendarAlt} color={sectionTitleColor} />
                <Text fontSize="sm" color={drawerText}>{formattedDate}</Text>
              </HStack>
            )}
            {(displayWorkout as any).estimated_duration && (
              <HStack spacing={2}>
                <Icon as={FaClock} color={sectionTitleColor} />
                <Text fontSize="sm" color={drawerText}>{(displayWorkout as any).estimated_duration}</Text>
              </HStack>
            )}
            {(displayWorkout as any).location && (
              <HStack spacing={2}>
                <Icon as={FaMapMarkerAlt} color={sectionTitleColor} />
                <Text fontSize="sm" color={drawerText}>{(displayWorkout as any).location}</Text>
              </HStack>
            )}
          </HStack>
        </VStack>
      </VStack>

      <Divider />

      {/* Exercises/Blocks Content */}
      {(isAssignment && assignment?.assignment_type === 'weekly') || (displayWorkout?.template_type === 'weekly' && displayWorkout.blocks && typeof displayWorkout.blocks === 'object' && !Array.isArray(displayWorkout.blocks)) ? (
        // Special handling for weekly workouts - break down by days
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" color={drawerText}>
            Weekly Training Plan
          </Text>
          <Accordion allowMultiple>
            {(() => {
              const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
              const dayDisplayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
              
              let weeklyData: any = {};
              
              // Handle assignment-based weekly workouts
              if (isAssignment && assignment) {
                // Extract daily workouts from assignment
                const dailyWorkouts = assignment.exercise_block?.daily_workouts || {};
                
                // First, check if it's a block-based weekly workout (stored in blocks field)
                if (assignment.exercise_block?.blocks) {
                  let blocks = assignment.exercise_block.blocks;
                  
                  // Parse blocks if it's a string
                  if (typeof blocks === 'string') {
                    try {
                      blocks = JSON.parse(blocks);
                    } catch (e) {
                      console.error('Error parsing blocks in details drawer:', e);
                    }
                  }
                  
                  // Check if blocks is organized by days (monday, tuesday, etc.)
                  if (blocks && typeof blocks === 'object' && !Array.isArray(blocks)) {
                    dayNames.forEach(dayName => {
                      const dayBlocks = blocks[dayName];
                      if (Array.isArray(dayBlocks)) {
                        // Convert blocks to exercises format for display
                        const dayExercises = dayBlocks.flatMap((block: any) => block.exercises || []);
                        weeklyData[dayName] = {
                          exercises: dayExercises,
                          is_rest_day: dayExercises.length === 0,
                          blocks: dayBlocks // Keep original blocks for reference
                        };
                      }
                    });
                  }
                }
                
                // If no block-based data found, try daily_workouts
                if (Object.keys(weeklyData).length === 0) {
                  if (Object.keys(dailyWorkouts).length > 0) {
                    weeklyData = dailyWorkouts;
                  } else if (assignment.exercise_block?.exercises) {
                    // Try to extract from exercises array
                    const exercises = assignment.exercise_block.exercises;
                    if (Array.isArray(exercises) && exercises.length > 0 && 
                        typeof exercises[0] === 'object' && 'day' in exercises[0]) {
                      // Convert exercise array format to daily_workouts format
                      exercises.forEach((dayPlan: any) => {
                        if (dayPlan.day) {
                          weeklyData[dayPlan.day.toLowerCase()] = {
                            exercises: dayPlan.exercises || [],
                            is_rest_day: dayPlan.isRestDay || false
                          };
                        }
                      });
                    } else {
                      // Single workout repeated for all days
                      dayNames.forEach(day => {
                        weeklyData[day] = {
                          exercises: exercises,
                          is_rest_day: false
                        };
                      });
                    }
                  }
                }
              } 
              // Handle workout-based weekly workouts (for coaches)
              else if (displayWorkout?.template_type === 'weekly' && displayWorkout.blocks) {
                let blocks = displayWorkout.blocks;
                
                // Parse blocks if it's a string
                if (typeof blocks === 'string') {
                  try {
                    blocks = JSON.parse(blocks);
                  } catch (e) {
                    console.error('Error parsing workout blocks in mobile details:', e);
                  }
                }
                
                // Check if blocks is organized by days (monday, tuesday, etc.)
                if (blocks && typeof blocks === 'object' && !Array.isArray(blocks)) {
                  dayNames.forEach(dayName => {
                    const dayBlocks = blocks[dayName];
                    if (Array.isArray(dayBlocks)) {
                      // Convert blocks to exercises format for display
                      const dayExercises = dayBlocks.flatMap((block: any) => block.exercises || []);
                      weeklyData[dayName] = {
                        exercises: dayExercises,
                        is_rest_day: dayExercises.length === 0,
                        blocks: dayBlocks // Keep original blocks for reference
                      };
                    }
                  });
                }
              }
              
              return dayNames.map((dayName, index) => {
                const dayDisplayName = dayDisplayNames[index];
                const dayWorkout = weeklyData[dayName];
                
                let dayExercises: any[] = [];
                let isRestDay = false;
                
                if (dayWorkout) {
                  if (Array.isArray(dayWorkout)) {
                    // New blocks format
                    dayExercises = dayWorkout.flatMap((block: any) => block.exercises || []);
                  } else if (dayWorkout.exercises && Array.isArray(dayWorkout.exercises)) {
                    // Legacy format
                    dayExercises = dayWorkout.exercises;
                    isRestDay = dayWorkout.is_rest_day || false;
                  }
                }
                
                return (
                  <AccordionItem key={dayName} border="1px" borderColor={borderColor} borderRadius="md" mb={2}>
                    <AccordionButton bg={exerciseCardBg} borderRadius="md">
                      <Box flex="1" textAlign="left">
                        <HStack justify="space-between" align="center">
                          <Text fontWeight="medium" color={drawerText}>
                            {dayDisplayName}
                          </Text>
                          {isRestDay ? (
                            <Badge colorScheme="orange" fontSize="xs">
                              Rest Day
                            </Badge>
                          ) : (
                            <Badge colorScheme="blue" fontSize="xs">
                              {dayExercises.length} exercises
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      {isRestDay ? (
                        <Box p={3} bg={exerciseCardBg} borderRadius="md" textAlign="center">
                          <Text color={sectionTitleColor} fontSize="sm">
                            Rest day - Focus on recovery and preparation for tomorrow's training
                          </Text>
                        </Box>
                      ) : dayWorkout.blocks && Array.isArray(dayWorkout.blocks) ? (
                        // Show blocks structure for block-based workouts
                        <VStack spacing={4} align="stretch">
                          {dayWorkout.blocks.map((block: any, blockIndex: number) => (
                            <Box key={blockIndex} p={3} bg={exerciseCardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                              <VStack spacing={3} align="stretch">
                                <Text fontSize="md" fontWeight="bold" color={drawerText}>
                                  {block.name || `Block ${blockIndex + 1}`}
                                </Text>
                                {block.exercises && Array.isArray(block.exercises) && block.exercises.length > 0 ? (
                                  <VStack spacing={2} align="stretch">
                                    {block.exercises.map((exercise: any, exerciseIndex: number) => (
                                      <Box key={exerciseIndex} p={2} bg={useColorModeValue('gray.100', 'gray.600')} borderRadius="md">
                                        <VStack spacing={1} align="stretch">
                                          <HStack align="center" spacing={3}>
                                            <Text fontWeight="medium" color={drawerText} fontSize="sm">
                                              {exercise.name}
                                            </Text>
                                            {exercise.sets && exercise.reps && (
                                              <Text fontSize="xs" color={sectionTitleColor}>
                                                {exercise.sets} sets × {exercise.reps} reps
                                              </Text>
                                            )}
                                          </HStack>
                                          {exercise.rest && (
                                            <Text fontSize="xs" color={sectionTitleColor}>
                                              Rest: {exercise.rest}
                                            </Text>
                                          )}
                                          {exercise.distance && (
                                            <Text fontSize="xs" color={sectionTitleColor}>
                                              Distance: {exercise.distance}
                                            </Text>
                                          )}
                                          {exercise.notes && (
                                            <Text fontSize="xs" color={drawerText}>
                                              {exercise.notes}
                                            </Text>
                                          )}
                                        </VStack>
                                      </Box>
                                    ))}
                                  </VStack>
                                ) : (
                                  <Text fontSize="sm" color={sectionTitleColor} fontStyle="italic">
                                    No exercises in this block
                                  </Text>
                                )}
                              </VStack>
                            </Box>
                          ))}
                        </VStack>
                      ) : dayExercises.length > 0 ? (
                        // Show flat exercise list for non-block workouts
                        <VStack spacing={3} align="stretch">
                          {dayExercises.map((exercise, exerciseIndex) => (
                            <Box key={exerciseIndex} p={3} bg={exerciseCardBg} borderRadius="md">
                              <VStack spacing={2} align="stretch">
                                <HStack align="center" spacing={3}>
                                  <Text fontWeight="medium" color={drawerText}>
                                    {exercise.name}
                                  </Text>
                                  {exercise.sets && exercise.reps && (
                                    <Text fontSize="sm" color={sectionTitleColor}>
                                      {exercise.sets} sets × {exercise.reps} reps
                                    </Text>
                                  )}
                                </HStack>
                                {exercise.rest && (
                                  <Text fontSize="sm" color={sectionTitleColor}>
                                    Rest: {exercise.rest}
                                  </Text>
                                )}
                                {exercise.distance && (
                                  <Text fontSize="sm" color={sectionTitleColor}>
                                    Distance: {exercise.distance}
                                  </Text>
                                )}
                                {exercise.notes && (
                                  <Text fontSize="sm" color={drawerText}>
                                    {exercise.notes}
                                  </Text>
                                )}
                              </VStack>
                            </Box>
                          ))}
                        </VStack>
                      ) : (
                        <Box p={3} bg={exerciseCardBg} borderRadius="md" textAlign="center">
                          <Text color={sectionTitleColor} fontSize="sm">
                            No exercises scheduled for this day
                          </Text>
                        </Box>
                      )}
                    </AccordionPanel>
                  </AccordionItem>
                );
              });
            })()}
          </Accordion>
        </VStack>
      ) : workoutBlocks.length > 0 ? (
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" color={drawerText}>
            Workout Blocks ({workoutBlocks.length})
          </Text>
          <Accordion allowMultiple>
            {workoutBlocks.map((block, blockIndex) => (
              <AccordionItem key={blockIndex} border="1px" borderColor={borderColor} borderRadius="md" mb={2}>
                <AccordionButton bg={exerciseCardBg} borderRadius="md">
                  <Box flex="1" textAlign="left">
                    <Text fontWeight="medium" color={drawerText}>
                      Block {blockIndex + 1}: {block.name || `Block ${blockIndex + 1}`}
                    </Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={3} align="stretch">
                    {block.exercises?.map((exercise, exerciseIndex) => (
                      <Box key={exerciseIndex} p={3} bg={exerciseCardBg} borderRadius="md">
                        <VStack spacing={2} align="stretch">
                          <HStack align="center" spacing={3}>
                            <Text fontWeight="medium" color={drawerText}>
                              {exercise.name}
                            </Text>
                            {exercise.sets && exercise.reps && (
                              <Text fontSize="sm" color={sectionTitleColor}>
                                {exercise.sets} sets × {exercise.reps} reps
                              </Text>
                            )}
                          </HStack>
                          {exercise.rest && (
                            <Text fontSize="sm" color={sectionTitleColor}>
                              Rest: {exercise.rest}
                            </Text>
                          )}
                          {exercise.distance && (
                            <Text fontSize="sm" color={sectionTitleColor}>
                              Distance: {exercise.distance}
                            </Text>
                          )}
                          {exercise.notes && (
                            <Text fontSize="sm" color={drawerText}>
                              {exercise.notes}
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </VStack>
      ) : (
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" color={drawerText}>
            Exercises ({allExercises.length})
          </Text>
          <VStack spacing={3} align="stretch">
            {allExercises.map((exercise, index) => (
              <Box key={index} p={4} bg={exerciseCardBg} borderRadius="md">
                <VStack spacing={2} align="stretch">
                  <HStack align="center" spacing={3}>
                    <Text fontWeight="medium" color={drawerText}>
                      {exercise.name}
                    </Text>
                    {exercise.sets && exercise.reps && (
                      <Text fontSize="sm" color={sectionTitleColor}>
                        {exercise.sets} sets × {exercise.reps} reps
                      </Text>
                    )}
                  </HStack>
                  {exercise.rest && (
                    <Text fontSize="sm" color={sectionTitleColor}>
                      Rest: {exercise.rest}
                    </Text>
                  )}
                  {exercise.distance && (
                    <Text fontSize="sm" color={sectionTitleColor}>
                      Distance: {exercise.distance}
                    </Text>
                  )}
                  {exercise.notes && (
                    <Text fontSize="sm" color={drawerText}>
                      {exercise.notes}
                    </Text>
                  )}
                </VStack>
              </Box>
            ))}
          </VStack>
        </VStack>
      )}

      {/* Additional Notes */}
      {displayWorkout.notes && (
        <>
          <Divider />
          <VStack spacing={2} align="stretch">
            <Text fontSize="lg" fontWeight="bold" color={drawerText}>
              Notes
            </Text>
            <Text fontSize="sm" color={drawerText}>
              {displayWorkout.notes}
            </Text>
          </VStack>
        </>
      )}

      {/* Role-specific Action Buttons */}
      {userRole === 'athlete' && (
        <VStack spacing={3} align="stretch" pt={4}>
          {onStart && (
            <Button 
              size="lg" 
              colorScheme="blue" 
              leftIcon={<FaPlay />}
              onClick={onStart}
              w="full"
            >
              {progress && progress.completed > 0 ? 'Continue Workout' : 'Start Workout'}
            </Button>
          )}
          {onReset && (progress?.completed || 0) > 0 && (
            <Button 
              size="md" 
              variant="outline" 
              colorScheme="orange"
              leftIcon={<FaRedo />}
              onClick={onReset}
              w="full"
            >
              Reset Progress
            </Button>
          )}
        </VStack>
      )}

      {userRole === 'coach' && (
        <VStack spacing={3} align="stretch" pt={4}>
          <SimpleGrid columns={2} spacing={3}>
            {onAssign && (
              <Button 
                size="md" 
                colorScheme="blue" 
                leftIcon={<FaUsers />}
                onClick={onAssign}
                w="full"
              >
                Assign
              </Button>
            )}
            {onDelete && (
              <Button 
                size="md" 
                variant="outline" 
                colorScheme="red"
                leftIcon={<FaTrash />}
                onClick={onDelete}
                w="full"
              >
                Delete
              </Button>
            )}
          </SimpleGrid>
          {onViewProgress && (
            <Button 
              size="md" 
              variant="outline" 
              colorScheme="green"
              leftIcon={<FaChartLine />}
              onClick={onViewProgress}
              w="full"
            >
              View Progress
            </Button>
          )}
        </VStack>
      )}
    </VStack>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      motionPreset="slideInBottom"
      closeOnOverlayClick={true}
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent 
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        top="auto"
        height="auto"
        maxHeight="75vh"
        minHeight="300px"
        borderRadius="16px 16px 0 0"
        borderTopRadius="16px"
        bg={drawerBg}
        border={`1px solid ${borderColor}`}
        boxShadow="2xl"
        margin="0"
        maxWidth="100vw"
        width="100vw"
        display="flex"
        flexDirection="column"
      >
        <ModalBody 
          p={0} 
          h="100%" 
          display="flex" 
          flexDirection="column" 
          overflowY="auto"
          borderTopRadius="16px"
        >
          {/* Header */}
          <Flex 
            justify="space-between" 
            align="center" 
            p={6} 
            borderBottom={`1px solid ${borderColor}`}
            flexShrink={0}
            bg={drawerBg}
            position="sticky"
            top={0}
            zIndex={1}
          >
            <VStack align="start" spacing={1}>
              <Text fontSize="xl" fontWeight="bold" color={drawerText}>
                {isAssignment ? 'Assignment Details' : 'Workout Details'}
              </Text>
              <HStack spacing={2}>
                <Icon as={userRole === 'athlete' ? FaUser : FaUsers} color={sectionTitleColor} boxSize={4} />
                <Text fontSize="sm" color={sectionTitleColor} textTransform="capitalize">
                  {userRole} View
                </Text>
                {isAssignment && assignmentDetails && (
                  <Badge colorScheme="purple" fontSize="xs">
                    {assignmentDetails.workoutType}
                  </Badge>
                )}
              </HStack>
            </VStack>
            <IconButton
              aria-label="Close details"
              icon={<FaTimes />}
              size="lg"
              variant="ghost"
              borderRadius="full"
              onClick={onClose}
              color={drawerText}
              _hover={{ bg: buttonHoverBg }}
              fontSize="18px"
            />
          </Flex>
          
          {/* Content */}
          <Box flex="1" overflowY="auto">
            <WorkoutContent />
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 