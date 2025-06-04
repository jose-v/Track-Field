import React from 'react';
import {
  Box, Card, CardBody, Heading, Text, Icon, Flex, HStack, VStack, 
  Button, Badge, IconButton, useColorModeValue, Tooltip
} from '@chakra-ui/react';
import { FaRunning, FaDumbbell, FaLeaf, FaRedo, FaEdit, FaTrash, FaPlayCircle, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaTasks, FaUndo, FaLayerGroup } from 'react-icons/fa';
import type { Workout, Exercise } from '../services/api';
import { dateUtils } from '../utils/date';
import { ProgressBar } from './ProgressBar';
import { Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';

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
    case 'Strength': return 'purple';
    case 'Running': return 'blue';
    case 'Flexibility': return 'green';
    case 'Recovery': return 'orange';
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

// Helper function to extract exercises from weekly workout
function getExercisesFromWorkout(workout: Workout): Exercise[] {
  // If it's a regular workout with exercises array
  if (workout.exercises && Array.isArray(workout.exercises)) {
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
  }
  
  return [];
}

interface WorkoutCardProps {
  workout: Workout;
  isCoach?: boolean;
  progress?: {
    completed: number;
    total: number;
    percentage: number;
    inProgressCount?: number;
    exerciseCount?: number;
  };
  assignedTo?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onStart?: () => void;
  onRefresh?: () => void;
  showRefresh?: boolean;
  statsLoading?: boolean;
  detailedProgress?: boolean;
  onReset?: () => void;
  isTemplate?: boolean;
}

export function WorkoutCard({
  workout,
  isCoach = false,
  progress = { completed: 0, total: 0, percentage: 0 },
  assignedTo = 'Unassigned',
  onEdit,
  onDelete,
  onStart,
  onRefresh,
  showRefresh = false,
  statsLoading = false,
  detailedProgress = false,
  onReset,
  isTemplate = false
}: WorkoutCardProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const iconBgColor = useColorModeValue('white', 'gray.800');
  const typeColorBase = getTypeColor(workout.type);
  const typeColor = `${typeColorBase}.500`; // Use the 500 variant for stronger color
  const typeName = getTypeName(workout.type);
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue(
    `${typeColorBase}.500`,
    `${typeColorBase}.400`
  );
  const infoColor = useColorModeValue('gray.600', 'gray.200');
  const loadingTextColor = useColorModeValue('gray.500', 'gray.300');
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const exerciseTextColor = useColorModeValue('gray.700', 'gray.200');
  const cardShadow = useColorModeValue('none', 'lg');
  
  // Format schedule date
  const formattedScheduleDate = workout.date 
    ? format(new Date(workout.date), 'MMM d, yyyy')
    : 'No date set';

  // Ensure exercises is always an array and get first few for display
  const displayExercises = Array.isArray(workout.exercises) 
    ? workout.exercises.slice(0, 3) 
    : [];

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
            {isTemplate ? 'Template' : typeName}
          </Badge>
        </HStack>
        
        {/* Action buttons */}
        <HStack>
          {isCoach && onEdit && (
            <IconButton 
              icon={<FaEdit />} 
              aria-label="Edit" 
              size="md" 
              variant="ghost" 
              color="white" 
              onClick={onEdit} 
            />
          )}
          {!isCoach && (
            <IconButton 
              icon={<FaEdit />} 
              aria-label="Edit" 
              size="md" 
              variant="ghost" 
              color="white" 
              as={RouterLink}
              to={`/athlete/workout-creator?edit=${workout.id}`}
            />
          )}
          {isCoach && onDelete && (
            <IconButton 
              icon={<FaTrash />} 
              aria-label="Delete" 
              size="md" 
              variant="ghost" 
              color="white" 
              onClick={onDelete} 
            />
          )}
          {!isTemplate && showRefresh && onRefresh && (
            <IconButton 
              icon={<FaRedo />} 
              aria-label="Refresh progress" 
              size="md" 
              variant="ghost" 
              color="white" 
              onClick={onRefresh}
              title="Sync progress with database" 
            />
          )}
        </HStack>
      </Box>
      
      {/* Card content */}
      <CardBody px={4} py={4}>
        <VStack align="start" spacing={4} height="100%" justify="space-between">
          <VStack align="start" spacing={4} width="100%">
            {/* Title */}
            <Heading size="lg" mt={1} noOfLines={1} color={titleColor}>{workout.name}</Heading>
            
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
            
            {/* Exercises info */}
            <Box width="100%" py={2}>
              <Flex align="center" mb={2}>
                <Icon as={FaTasks} mr={2} color={typeColor} boxSize={4} />
                <Text fontSize="md" fontWeight="medium" color={exerciseTextColor}>
                  Exercises: {displayExercises.length}
                </Text>
              </Flex>
              {displayExercises.length > 0 && (
                <Box maxH="100px" overflowY="auto" fontSize="sm" color={infoColor} pl={6}>
                  {displayExercises.slice(0, 3).map((ex, idx) => (
                    <Text key={idx} noOfLines={1} mb={1} color={exerciseTextColor}>
                      • {ex.name} ({ex.sets}×{ex.reps})
                    </Text>
                  ))}
                  {displayExercises.length > 3 && (
                    <Text fontStyle="italic" color={exerciseTextColor}>+{displayExercises.length - 3} more...</Text>
                  )}
                </Box>
              )}
            </Box>
            
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
            
            {/* Card description/notes */}
            {(workout.notes || workout.description) && (
              <Box width="100%" bg={useColorModeValue('gray.50', 'gray.700')} p={3} borderRadius="md">
                <Text fontSize="sm" color={infoColor} noOfLines={3}>
                  {workout.notes || workout.description}
                </Text>
              </Box>
            )}
          </VStack>
          
          {/* Bottom section with progress bar and action button - Hide progress for templates */}
          <VStack width="100%" spacing={2}>
            {/* Progress bar - Only show for non-templates */}
            {!isTemplate && (
              <Box width="100%">
                <Flex justifyContent="space-between" alignItems="center" mb={2}>
                  {!detailedProgress && (
                    <Text fontSize="sm" color={infoColor} fontWeight="medium">
                      {isCoach ? 'Athlete Completion' : 'Your Progress'}
                    </Text>
                  )}
                  {detailedProgress && (
                    <Text fontSize="sm" color={infoColor} fontWeight="medium">
                      Progress
                    </Text>
                  )}
                  {!detailedProgress && showRefresh && onRefresh && (
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
                
                {detailedProgress && isCoach ? (
                  <>
                    <ProgressBar
                      completed={progress.completed}
                      total={progress.total}
                      percentage={progress.percentage}
                      colorScheme={progress.completed === progress.total && progress.total > 0 ? "green" : "primary"}
                      itemLabel="athlete(s)"
                      textColor={infoColor}
                      showText={false}
                    />
                    
                    {statsLoading && (
                      <Text fontSize="xs" color={loadingTextColor} mt={1}>
                        Updating progress...
                      </Text>
                    )}
                  </>
                ) : (
                  <ProgressBar
                    completed={progress.completed}
                    total={progress.total}
                    percentage={progress.percentage}
                    colorScheme={progress.completed === progress.total && progress.total > 0 ? "green" : "primary"}
                    itemLabel={isCoach ? "athlete(s)" : "exercises"}
                    textColor={infoColor}
                  />
                )}
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
                      : !isCoach && progress.completed > 0 
                        ? "Continue Workout" 
                        : "Start Workout"}
                  </Button>
                )}
                
                {/* Reset Progress Button - Hide for templates */}
                {!isTemplate && !isCoach && onReset && progress.completed > 0 && (
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
    </Card>
  );
} 