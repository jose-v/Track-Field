import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  Flex,
  Badge,
  ButtonGroup,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Portal
} from '@chakra-ui/react';
import { FaEllipsisV, FaEye, FaTrash, FaUsers } from 'react-icons/fa';

import { WorkoutAssignment } from '../services/assignmentService';
import { useUnifiedAssignmentActions } from '../hooks/useUnifiedAssignments';
import { WorkoutDetailsDrawer } from './WorkoutDetailsDrawer';

interface UnifiedAssignmentCardProps {
  assignment: WorkoutAssignment;
  onExecute?: (assignmentId: string) => void;
  showActions?: boolean;
  compact?: boolean;
  onDelete?: () => void;
  onAssign?: () => void;
  isCoach?: boolean;
  currentUserId?: string;
}

export function UnifiedAssignmentCard({ 
  assignment, 
  onExecute, 
  showActions = true,
  compact = false,
  onDelete,
  onAssign,
  isCoach = false,
  currentUserId
}: UnifiedAssignmentCardProps) {
  
  // State for workout details drawer
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  
  // Handle view details
  const handleViewDetails = () => {
    setIsDetailsDrawerOpen(true);
  };
  
  // Check if current user can delete (user who created/assigned the workout)
  const canDelete = currentUserId && (
    assignment.assigned_by === currentUserId || 
    assignment.athlete_id === currentUserId ||
    isCoach
  );

  // Convert WorkoutAssignment to Workout format for the drawer
  const convertAssignmentToWorkout = () => {
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
    // DEBUG: Log the constructed workout object
    console.log('UnifiedAssignmentCard: convertAssignmentToWorkout', workout);
    return workout;
  };

  // Theme colors - responsive light/dark mode
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.500', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const progressTextColor = useColorModeValue('gray.700', 'white');
  const separatorColor = useColorModeValue('gray.300', 'gray.500');

  // Extract assignment details
  const getAssignmentDetails = () => {
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
        return {
          title: exercise_block.workout_name || exercise_block.plan_name || 'Weekly Plan',
          subtitle: 'WEEKLY',
          duration: `${exercise_block.total_days || 7} days`,
          exercises: Object.keys(exercise_block.daily_workouts || {}).length,
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

  const details = getAssignmentDetails();
  const progress_pct = assignment.progress?.completion_percentage || 0;
  const isCompleted = assignment.status === 'completed';
  const isInProgress = assignment.status === 'in_progress';

  // Calculate detailed progress metrics
  const getDetailedProgress = () => {
    const progress = assignment.progress;
    
    if (!progress) {
      return {
        exercises: { current: 0, total: details.exercises },
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

  const progressMetrics = getDetailedProgress();

  // Format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: '2-digit' 
    });
  };

  // Status formatting
  const getStatusText = () => {
    switch (assignment.status) {
      case 'in_progress': return 'IN PROGRESS';
      case 'completed': return 'COMPLETED';
      case 'assigned': return 'ASSIGNED';
      default: return assignment.status?.toUpperCase() || 'UNKNOWN';
    }
  };

  // Get the actual workout name from assignment data
  const workoutName = assignment.exercise_block?.workout_name || 
                     assignment.exercise_block?.plan_name || 
                     assignment.exercise_block?.name ||
                     `Workout ${assignment.id.slice(-4).toUpperCase()}`;

  // Circular progress component
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 78; // 20% bigger than 65
    const strokeWidth = 10; // Thicker stroke
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <Box position="relative" display="inline-flex">
        <svg height={radius * 2} width={radius * 2}>
          <circle
            stroke={useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.2)")}
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="#68D391" // Green color for progress
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
        </svg>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
        >
          <Text
            fontSize="xl"
            fontWeight="bold"
            color={progressTextColor}
            textAlign="center"
          >
            {Math.round(percentage)}%
          </Text>
        </Box>
      </Box>
    );
  };

  const { resetProgress } = useUnifiedAssignmentActions();

  return (
    <Box
      bg={cardBg}
      borderRadius="lg"
      p={6}
      borderWidth="1px"
      borderColor={borderColor}
      color={textColor}
      maxW={{ base: "100%", md: "340px" }}
      w="100%"
      boxShadow={useColorModeValue("md", "lg")}
      _hover={{ 
        transform: 'translateY(-2px)', 
        boxShadow: useColorModeValue("lg", "xl") 
      }}
      transition="all 0.2s"
    >
      <VStack spacing={4} align="stretch">
        {/* Header Section */}
        <HStack justify="space-between" align="center">
          <ButtonGroup size="sm" isAttached variant="outline">
            <Button 
              bg={useColorModeValue("gray.200", "gray.600")} 
              color={useColorModeValue("gray.700", "white")} 
              _hover={{ bg: useColorModeValue("gray.300", "gray.500") }}
              border="1px solid"
              borderColor={separatorColor}
            >
              {assignment.assigned_by ? 'COACH' : 'ATHLETE'}
            </Button>
            <Button 
              bg={useColorModeValue("gray.200", "gray.600")} 
              color={useColorModeValue("gray.700", "white")} 
              _hover={{ bg: useColorModeValue("gray.300", "gray.500") }}
              border="1px solid"
              borderColor={separatorColor}
            >
              {assignment.assignment_type.toUpperCase()}
            </Button>
          </ButtonGroup>
                      <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaEllipsisV />}
                variant="ghost"
                aria-label="Options"
                size="sm"
                color={secondaryTextColor}
              />
              <Portal>
                <MenuList>
                  <MenuItem 
                    icon={<FaEye />} 
                    onClick={handleViewDetails}
                  >
                    View Details
                  </MenuItem>
                  {onAssign && (
                    <MenuItem 
                      icon={<FaUsers />} 
                      onClick={onAssign}
                    >
                      Assign Athletes
                    </MenuItem>
                  )}
                  {onDelete && canDelete && (
                    <MenuItem 
                      icon={<FaTrash />} 
                      onClick={onDelete}
                      color="red.500"
                    >
                      Delete Workout
                    </MenuItem>
                  )}
                </MenuList>
              </Portal>
            </Menu>
        </HStack>

        {/* Workout ID, Status and Date Information - Two Columns */}
        <HStack align="start" justify="space-between" w="100%">
          <VStack align="start" spacing={2}>
            <Text fontSize="2xl" fontWeight="bold" color={textColor}>
              {workoutName}
            </Text>
            <Badge
              colorScheme={isInProgress ? "orange" : isCompleted ? "green" : "gray"}
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="md"
            >
              {getStatusText()}
            </Badge>
          </VStack>
          
          <VStack align="end" spacing={1}>
            <Text fontSize="sm" color={secondaryTextColor}>
              ASSIGNED: {formatDate(assignment.assigned_at || assignment.start_date)}
            </Text>
            <Text fontSize="sm" color={secondaryTextColor}>
              START DATE: {formatDate(assignment.start_date)}
            </Text>
            {assignment.progress?.started_at && (
              <Text fontSize="sm" color={secondaryTextColor}>
                STARTED: {formatDate(assignment.progress.started_at)}
              </Text>
            )}
          </VStack>
        </HStack>

        {/* Progress Metrics Grid with Separators */}
        <HStack spacing={0} textAlign="center" w="100%" mt="25px">
          <VStack spacing={1} flex={1}>
            <Text fontSize="xs" color={secondaryTextColor} fontWeight="bold">
              EXERCISES
            </Text>
            <Text fontSize="lg" fontWeight="bold" color={progressTextColor}>
              {progressMetrics.exercises.current}/{progressMetrics.exercises.total}
            </Text>
          </VStack>
          
          <Box w="1px" h="40px" bg={useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.2)")} />
          
          <VStack spacing={1} flex={1}>
            <Text fontSize="xs" color={secondaryTextColor} fontWeight="bold">
              SETS
            </Text>
            <Text fontSize="lg" fontWeight="bold" color={progressTextColor}>
              {progressMetrics.sets.current}/{progressMetrics.sets.total}
            </Text>
          </VStack>
          
          <Box w="1px" h="40px" bg={useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.2)")} />
          
          <VStack spacing={1} flex={1}>
            <Text fontSize="xs" color={secondaryTextColor} fontWeight="bold">
              REPS
            </Text>
            <Text fontSize="lg" fontWeight="bold" color={progressTextColor}>
              {progressMetrics.reps.current}/{progressMetrics.reps.total}
            </Text>
          </VStack>
        </HStack>

        {/* Circular Progress */}
        <Flex justify="center" mt={4} mb={-2}>
          <CircularProgress percentage={progress_pct} />
        </Flex>

        {/* Action Buttons */}
        {showActions && (
          <Flex justify="space-between" w="100%" mt={2}>
            <Button
              size="lg"
              bg="#FBBF24" // Yellow color
              color="white"
              borderRadius="full"
              w="80px"
              h="80px"
              fontSize="xs"
              fontWeight="bold"
              _hover={{ bg: "#F59E42" }}
              _active={{ bg: "#B45309" }}
              onClick={() => resetProgress.mutate(assignment.id)}
            >
              RESET
            </Button>
            <Button
              size="lg"
              bg="#10B981" // Green color
              color="white"
              borderRadius="full"
              w="80px"
              h="80px"
              fontSize="xs"
              fontWeight="bold"
              _hover={{ bg: "#059669" }}
              _active={{ bg: "#047857" }}
              onClick={() => onExecute?.(assignment.id)}
            >
              START
            </Button>
          </Flex>
        )}
      </VStack>

      {/* Workout Details Drawer */}
      <WorkoutDetailsDrawer
        isOpen={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        workout={convertAssignmentToWorkout()}
      />
    </Box>
  );
}

// Export a specialized version for different contexts
export function TodaysWorkoutCard({ assignment, onExecute }: { assignment: WorkoutAssignment; onExecute?: (id: string) => void }) {
  return (
    <UnifiedAssignmentCard 
      assignment={assignment} 
      onExecute={onExecute}
      showActions={true}
      compact={false}
    />
  );
}

export function CompactAssignmentCard({ assignment, onExecute }: { assignment: WorkoutAssignment; onExecute?: (id: string) => void }) {
  return (
    <UnifiedAssignmentCard 
      assignment={assignment} 
      onExecute={onExecute}
      showActions={true}
      compact={true}
    />
  );
} 