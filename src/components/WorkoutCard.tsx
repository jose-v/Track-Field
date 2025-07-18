import React, { useState } from 'react';
import {
  Box, Card, CardBody, Heading, Text, Icon, Flex, HStack, VStack, 
  Button, Badge, IconButton, useColorModeValue, Tooltip,
  Menu, MenuButton, MenuList, MenuItem
} from '@chakra-ui/react';
import { FaRunning, FaDumbbell, FaLeaf, FaRedo, FaEdit, FaTrash, FaPlayCircle, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaTasks, FaUndo, FaLayerGroup, FaEllipsisV, FaEye, FaExchangeAlt } from 'react-icons/fa';
import type { Workout, Exercise } from '../services/api';
import { dateUtils } from '../utils/date';
import { ProgressBar } from './ProgressBar';
import { DetailedProgressDisplay } from './DetailedProgressDisplay';
import { Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';
import { getExercisesFromWorkout, getBlocksFromWorkout } from '../utils/workoutUtils';
import { WorkoutDetailsDrawer } from './WorkoutDetailsDrawer';

// Shared utility functions
export function getTypeIcon(type: string | undefined) {
  switch (type) {
    case 'Strength': return <FaDumbbell />;
    case 'Running': return <FaRunning />;
    case 'Flexibility': return <FaLeaf />;
    case 'Recovery': return <FaRedo />;
    default: return <FaRunning />;
  }
}

export function getTypeColor(type: string | undefined) {
  switch (type) {
    case 'Strength': return 'blue';
    case 'Running': return 'blue';
    case 'Flexibility': return 'blue';
    case 'Recovery': return 'blue';
    default: return 'blue';
  }
}

export function getTypeName(type: string | undefined) {
  return type || 'Workout';
}

export function formatDate(dateStr: string | undefined) {
  if (!dateStr) return 'No date set';
  try {
    // Use our date utilities to properly handle timezone issues
    return dateUtils.format(dateUtils.parseLocalDate(dateStr), 'MMM d, yyyy');
  } catch (e) {
    console.error(`Error formatting date: ${dateStr}`, e);
    return 'Error';
  }
}

// Helper functions moved to utils/workoutUtils.ts

interface WorkoutCardProps {
  workout: Workout;
  isCoach?: boolean;
  progress?: {
    completed: number;
    total: number;
    percentage: number;
    inProgressCount?: number;
    exerciseCount?: number;
    hasProgress?: boolean; // Override for granular progress detection
  };
  assignedTo?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
  onViewDetails?: () => void;
  onStart?: () => void;
  onRefresh?: () => void;
  showRefresh?: boolean;
  statsLoading?: boolean;
  detailedProgress?: boolean;
  onReset?: () => void;
  isTemplate?: boolean;
  currentUserId?: string; // For athlete permission checking
  monthlyPlanUsage?: {
    isUsed: boolean;
    monthlyPlans: { id: string; name: string }[];
  };
  onConvertToWorkout?: () => void;
}

export function WorkoutCard({
  workout,
  isCoach = false,
  progress = { completed: 0, total: 0, percentage: 0 },
  assignedTo = 'Unassigned',
  onEdit,
  onDelete,
  onAssign,
  onViewDetails,
  onStart,
  onRefresh,
  showRefresh = false,
  statsLoading = false,
  detailedProgress = false,
  onReset,
  isTemplate = false,
  currentUserId,
  monthlyPlanUsage,
  onConvertToWorkout
}: WorkoutCardProps) {
  // State for workout details drawer
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  
  // Handle view details - use drawer or existing callback
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      setIsDetailsDrawerOpen(true);
    }
  };
  
  // All useColorModeValue calls must be at the top level to follow Rules of Hooks
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const iconBgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.800');
  const singleWorkoutBg = useColorModeValue('red.500', 'blue.500');
  const weeklyWorkoutBg = useColorModeValue('blue.600', 'blue.600');
  const infoColor = useColorModeValue('gray.600', 'gray.200');
  const loadingTextColor = useColorModeValue('gray.500', 'gray.300');
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const exerciseTextColor = useColorModeValue('gray.700', 'gray.200');
  const cardShadow = useColorModeValue('none', 'lg');
  
  // Monthly plan usage colors
  const monthlyPlanBg = useColorModeValue('orange.50', 'orange.900');
  const monthlyPlanBorder = useColorModeValue('orange.200', 'orange.700');
  const monthlyPlanText = useColorModeValue('orange.700', 'orange.300');
  const monthlyPlanItemText = useColorModeValue('orange.600', 'orange.400');
  
  // Description box colors
  const descriptionBg = useColorModeValue('gray.50', 'gray.700');
  
  // Derived values
  const typeColorBase = getTypeColor(workout.type);
  const typeColor = `${typeColorBase}.500`; // Use the 500 variant for stronger color
  const typeName = getTypeName(workout.type);
  const monthlyWorkoutBg = useColorModeValue('purple.500', 'purple.600');
  const headerBg = workout.template_type === 'weekly' ? weeklyWorkoutBg : 
                   workout.template_type === 'monthly' ? monthlyWorkoutBg : 
                   singleWorkoutBg;
  
  // Format schedule date
  const formattedScheduleDate = workout.date 
    ? dateUtils.format(workout.date, 'MMM d, yyyy')
    : 'No date set';

  // Get exercises using the helper function that handles both regular and weekly plan structures
  const allExercises = getExercisesFromWorkout(workout);
  const displayExercises = allExercises.slice(0, 3);
  
  // Safely get blocks array
  const workoutBlocks = getBlocksFromWorkout(workout);

  return (
    <Card 
      borderRadius="xl" 
      overflow="hidden" 
      boxShadow={cardShadow}
      borderWidth="1px" 
      borderColor={borderColor}
      bg={cardBg}
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
      h="100%"
      p="0"
    >
      {/* Card header with type info and actions */}
      <Box 
        bg={headerBg}
        px={4} 
        py={4} 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between"
        borderTopLeftRadius="inherit"
        borderTopRightRadius="inherit"
        margin="0"
        width="100%"
      >
        <HStack spacing={3}>
          <Box 
            bg="rgba(255, 255, 255, 0.3)" 
            borderRadius="full" 
            p={2.5} 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
          >
            <Icon 
              as={workout.type ? getTypeIcon(workout.type).type : FaRunning} 
              color="white" 
              boxSize={6} 
            />
          </Box>
          <Badge 
                bg="rgba(255, 255, 255, 0.2)"
                color="white"
                fontSize="sm"
                fontWeight="bold"
                py={1.5}
                px={3}
                borderRadius="md"
          >
            {workout.template_type === 'weekly' ? 'Weekly Plan' : 
             workout.template_type === 'monthly' ? 'Monthly Plan' : 
             isTemplate ? 'Template' : typeName}
          </Badge>
        </HStack>
        
        {/* Action menu */}
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FaEllipsisV />}
            variant="ghost"
            color="white"
            size="sm"
            aria-label="Workout actions"
            _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
          />
          <MenuList>
            {/* Always use new workout creator for editing */}
            <MenuItem 
              icon={<FaEdit />} 
              as={RouterLink}
              to={isCoach ? `/coach/workout-creator-new?edit=${workout.id}` : `/athlete/workout-creator-new?edit=${workout.id}`}
            >
              Edit
            </MenuItem>
            <MenuItem icon={<FaEye />} onClick={handleViewDetails}>
              View Details
            </MenuItem>
            {isTemplate && onConvertToWorkout && (
              <MenuItem icon={<FaExchangeAlt />} onClick={onConvertToWorkout}>
                Convert to Workout
              </MenuItem>
            )}
            {onAssign && !isTemplate && !(workout as any).is_template && (
              <MenuItem icon={<FaUsers />} onClick={onAssign}>
                Assign Athletes
              </MenuItem>
            )}
            {!isTemplate && showRefresh && onRefresh && (
              <MenuItem icon={<FaRedo />} onClick={onRefresh}>
                Refresh progress
              </MenuItem>
            )}
            {isCoach && onDelete && (
              <MenuItem icon={<FaTrash />} onClick={onDelete} color="red.500">
                Delete
              </MenuItem>
            )}
            {!isCoach && onDelete && currentUserId && (
              <MenuItem 
                icon={<FaTrash />} 
                onClick={onDelete} 
                color="red.500"
                isDisabled={workout.user_id !== currentUserId}
                opacity={workout.user_id !== currentUserId ? 0.6 : 1}
              >
                Delete
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      </Box>
      
      {/* Card content */}
      <CardBody px={4} py={4}>
        <VStack align="start" spacing={4} height="100%" justify="space-between">
          <VStack align="start" spacing={4} width="100%">
            {/* Title */}
            <Heading size="lg" mt={1} noOfLines={1} color={titleColor}>{workout.name}</Heading>
            
            {/* Template badge - Show for templates */}
            {isTemplate && (
              <Badge 
                colorScheme="purple" 
                size="sm" 
                fontSize="xs"
                fontWeight="bold"
                px={2}
                py={1}
                borderRadius="md"
                alignSelf="flex-start"
              >
                TEMPLATE
              </Badge>
            )}

            {/* Block Mode badge - Show for block-based workouts */}
            {(workout as any).is_block_based && (
              <HStack spacing={1} alignSelf="flex-start">
                <Icon as={FaLayerGroup} boxSize={3} color="green.500" />
                <Badge 
                  colorScheme="green" 
                  size="sm" 
                  fontSize="xs"
                  fontWeight="bold"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  BLOCK MODE
                </Badge>
              </HStack>
            )}
            
            {/* Monthly Plan Usage - Show for coaches when workout is used in monthly plans */}
            {isCoach && monthlyPlanUsage?.isUsed && (
              <Box
                width="100%"
                bg={monthlyPlanBg}
                border="1px solid"
                borderColor={monthlyPlanBorder}
                borderRadius="md"
                p={3}
              >
                <Flex align="center" mb={1}>
                  <Icon as={FaCalendarAlt} mr={2} color="orange.500" boxSize={4} />
                  <Text fontSize="sm" fontWeight="medium" color={monthlyPlanText}>
                    Used in {monthlyPlanUsage.monthlyPlans.length} Monthly Plan{monthlyPlanUsage.monthlyPlans.length !== 1 ? 's' : ''}
                  </Text>
                </Flex>
                <VStack align="start" spacing={1} pl={6}>
                  {monthlyPlanUsage.monthlyPlans.slice(0, 2).map((plan) => (
                    <Text key={plan.id} fontSize="xs" color={monthlyPlanItemText} noOfLines={1}>
                      • {plan.name}
                    </Text>
                  ))}
                  {monthlyPlanUsage.monthlyPlans.length > 2 && (
                    <Text fontSize="xs" color={monthlyPlanItemText} fontStyle="italic">
                      +{monthlyPlanUsage.monthlyPlans.length - 2} more...
                    </Text>
                  )}
                </VStack>
              </Box>
            )}
            
            {/* Date and time - Hide for templates */}
            {!isTemplate && (
              <HStack spacing={4} fontSize="md" color={infoColor} width="100%">
                <Tooltip label="Scheduled Date" placement="top">
                  <Flex align="center">
                    <Icon as={FaCalendarAlt} mr={2} color={typeColor} boxSize={4} />
                    <Text>{formattedScheduleDate}</Text>
                  </Flex>
                </Tooltip>
                {workout.time && (
                  <Flex align="center">
                    <Icon as={FaClock} mr={2} color={typeColor} boxSize={4} />
                    <Text>{workout.time}</Text>
                  </Flex>
                )}
              </HStack>
            )}
            
            {/* Duration and location info - Show duration for templates, hide time-specific info */}
            {(workout.duration || (workout as any).location) && (
              <HStack spacing={4} fontSize="md" color={infoColor} width="100%">
                {workout.duration && (
                  <Flex align="center">
                    <Icon as={FaClock} mr={2} color={typeColor} boxSize={4} />
                    <Text>{isTemplate ? `~${workout.duration}` : workout.duration}</Text>
                  </Flex>
                )}
                {(workout as any).location && (
                  <Flex align="center">
                    <Icon as={FaMapMarkerAlt} mr={2} color={typeColor} boxSize={4} />
                    <Text>{(workout as any).location}</Text>
                  </Flex>
                )}
              </HStack>
            )}
            

            
            {/* Exercise/Block count only for coaches - simplified display */}
            {isCoach && (
              <Flex align="center" width="100%">
                {(workout as any).is_block_based && workoutBlocks.length > 0 ? (
                  <>
                    <Icon as={FaLayerGroup} mr={2} color={typeColor} boxSize={4} />
                    <Text fontSize="md" color={infoColor}>
                      {workoutBlocks.length} Block{workoutBlocks.length !== 1 ? 's' : ''}
                    </Text>
                  </>
                ) : (
                  <>
                    <Icon as={FaTasks} mr={2} color={typeColor} boxSize={4} />
                    <Text fontSize="md" color={infoColor}>
                      {workout.template_type === 'monthly' && (workout as any)._planTotalExercises ? 
                        (workout as any)._planTotalExercises : allExercises.length} Exercise{(workout.template_type === 'monthly' && (workout as any)._planTotalExercises ? 
                        (workout as any)._planTotalExercises : allExercises.length) !== 1 ? 's' : ''}
                    </Text>
                  </>
                )}
              </Flex>
            )}
            
            {/* Assigned to (for coach view) - Hide for templates */}
            {!isTemplate && isCoach && (
              <Flex align="center" width="100%">
                <Icon as={FaUsers} mr={2} color={typeColor} boxSize={4} />
                <Text fontSize="md" color={infoColor} noOfLines={1} title={assignedTo}>
                  Assigned to: {assignedTo}
                </Text>
              </Flex>
            )}
            
            {/* Template type for templates */}
            {isTemplate && workout.template_type && (
              <Flex align="center" width="100%">
                <Icon as={FaLayerGroup} mr={2} color={typeColor} boxSize={4} />
                <Text fontSize="md" color={infoColor}>
                  Template Type: {workout.template_type === 'weekly' ? 'Weekly Plan' : 'Single Workout'}
                </Text>
              </Flex>
            )}
            
            {/* Card description/notes - Hide auto-generated descriptions */}
            {(() => {
              const description = workout.notes || workout.description;
              // Hide auto-generated descriptions that match the pattern "X workout with Y block(s) and Z exercise(s)"
              const isAutoGenerated = description && /^\w+ workout with \d+ blocks? and \d+ exercises?$/.test(description);
              
              return description && !isAutoGenerated && (
                <Box width="100%" bg={descriptionBg} p={3} borderRadius="md">
                  <Text fontSize="sm" color={infoColor} noOfLines={3}>
                    {description}
                  </Text>
                </Box>
              );
            })()}
          </VStack>
          
          {/* Bottom section with progress bar and action button - Hide progress for templates and coaches */}
          <VStack width="100%" spacing={2}>
            {/* Progress bar - Only show for non-templates and non-coaches */}
            {!isTemplate && !isCoach && (
              <Box width="100%">
                <Flex justifyContent="space-between" alignItems="center" mb={2}>
                  <Text fontSize="sm" color={infoColor} fontWeight="medium">
                    Your Progress
                  </Text>
                  {showRefresh && onRefresh && (
                    <IconButton
                      icon={<FaRedo />}
                      aria-label="Sync progress"
                      size="xs"
                      variant="outline"
                      onClick={(e) => { 
                        e.stopPropagation();
                        onRefresh();
                      }}
                      title="Sync progress with database"
                    />
                  )}
                </Flex>
                
                <DetailedProgressDisplay
                  exerciseProgress={{
                    current: progress.completed,
                    total: progress.total,
                    currentExerciseName: progress.completed < progress.total ? 
                      `${progress.completed + 1} of ${progress.total}` : 'Completed!'
                  }}
                  blockProgress={(workout as any).is_block_based && workoutBlocks.length > 0 ? {
                    current: Math.floor(progress.completed / Math.max(1, Math.ceil(progress.total / workoutBlocks.length))),
                    total: workoutBlocks.length,
                    currentBlockName: `Block ${Math.floor(progress.completed / Math.max(1, Math.ceil(progress.total / workoutBlocks.length))) + 1}`
                  } : undefined}
                  setProgress={(() => {
                    // Calculate total sets across all exercises
                    const totalSets = allExercises.reduce((total, ex) => {
                      return total + (ex.sets ? parseInt(String(ex.sets)) : 1);
                    }, 0);
                    
                    // Estimate completed sets based on completed exercises
                    let completedSets = 0;
                    for (let i = 0; i < progress.completed && i < allExercises.length; i++) {
                      const exercise = allExercises[i];
                      completedSets += exercise.sets ? parseInt(String(exercise.sets)) : 1;
                    }
                    
                    return totalSets > 0 ? {
                      current: completedSets,
                      total: totalSets
                    } : undefined;
                  })()}
                  repProgress={(() => {
                    // Calculate total reps across all exercises
                    const totalReps = allExercises.reduce((total, ex) => {
                      const sets = ex.sets ? parseInt(String(ex.sets)) : 1;
                      const reps = ex.reps ? parseInt(String(ex.reps)) : 10;
                      return total + (sets * reps);
                    }, 0);
                    
                    // Estimate completed reps based on completed exercises
                    let completedReps = 0;
                    for (let i = 0; i < progress.completed && i < allExercises.length; i++) {
                      const exercise = allExercises[i];
                      const sets = exercise.sets ? parseInt(String(exercise.sets)) : 1;
                      const reps = exercise.reps ? parseInt(String(exercise.reps)) : 10;
                      completedReps += sets * reps;
                    }
                    
                    return totalReps > 0 ? {
                      current: completedReps,
                      total: totalReps
                    } : undefined;
                  })()}
                  layout="compact"
                  showLabels={true}
                  showPercentages={false}
                />
              </Box>
            )}
            
            {/* Action button */}
            {onStart && (
              <VStack width="100%" spacing={2}>
                {isTemplate ? (
                  /* Template-specific buttons: Edit and Delete */
                  <HStack width="100%" spacing={2}>
                    <Button 
                      width="50%" 
                      variant="outline"
                      colorScheme="blue"
                      leftIcon={<FaEdit />} 
                      onClick={onEdit}
                      size="md"
                    >
                      Edit
                    </Button>
                    <Button 
                      width="50%" 
                      variant="outline"
                      colorScheme="red"
                      leftIcon={<FaTrash />} 
                      onClick={onDelete}
                      size="md"
                    >
                      Delete
                    </Button>
                  </HStack>
                ) : (
                  /* Regular workout button */
                  <Button 
                    width="100%" 
                    variant="primary"
                    leftIcon={<FaPlayCircle />} 
                    onClick={onStart}
                    size="md"
                  >
                    {!isCoach && progress.completed === progress.total && progress.total > 0 
                      ? "Start Again" 
                      : !isCoach && (progress.completed > 0 || progress.hasProgress) 
                        ? "Continue Workout" 
                        : "Start Workout"}
                  </Button>
                )}
                
                {/* Reset Progress Button - Hide for templates */}
                {!isTemplate && !isCoach && onReset && (progress.completed > 0 || workout.template_type === 'monthly') && (
                  <Button 
                    width="100%" 
                    variant="outline"
                    colorScheme="orange"
                    leftIcon={<FaUndo />} 
                    onClick={onReset}
                    size="sm"
                  >
                    Reset Progress
                  </Button>
                )}
              </VStack>
            )}
          </VStack>
        </VStack>
      </CardBody>

      {/* Workout Details Drawer */}
      <WorkoutDetailsDrawer
        isOpen={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        workout={workout}
      />
    </Card>
  );
} 