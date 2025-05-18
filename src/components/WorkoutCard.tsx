import React from 'react';
import {
  Box, Card, CardBody, Heading, Text, Icon, Flex, HStack, VStack, 
  Button, Badge, IconButton, useColorModeValue, Tooltip
} from '@chakra-ui/react';
import { FaRunning, FaDumbbell, FaLeaf, FaRedo, FaEdit, FaTrash, FaPlayCircle, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaTasks } from 'react-icons/fa';
import type { Workout, Exercise } from '../services/api';
import { dateUtils } from '../utils/date';
import { ProgressBar } from './ProgressBar';
import { Link as RouterLink } from 'react-router-dom';

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
  return type || 'General';
}

export function formatDate(dateStr: string | undefined) {
  if (!dateStr) return 'N/A';
  
  try {
    // Use our date utilities to properly handle timezone issues
    return dateUtils.format(dateUtils.parseLocalDate(dateStr), 'MMM d, yyyy');
  } catch (e) {
    console.error(`Error formatting date: ${dateStr}`, e);
    return 'Error';
  }
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
  detailedProgress = false
}: WorkoutCardProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const iconBgColor = useColorModeValue('white', 'gray.800');
  const typeColorBase = getTypeColor(workout.type);
  const typeColor = `${typeColorBase}.500`; // Use the 500 variant for stronger color
  const typeName = getTypeName(workout.type);
  const cardBg = useColorModeValue('white', 'gray.800');
  const infoColor = useColorModeValue('gray.600', 'gray.400');
  
  // Get formatted date
  const formattedScheduleDate = formatDate(workout.date);
  
  // Log the raw date to help with debugging
  console.log(`WorkoutCard - Raw date: ${workout.date}, Formatted: ${formattedScheduleDate}`);
  
  return (
    <Card 
      borderRadius="xl" 
      overflow="hidden" 
      boxShadow="lg" 
      borderWidth="1px" 
      borderColor={borderColor}
      bg={cardBg}
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
      h="100%"
    >
      {/* Card header with type info and actions */}
      <Box 
        bg={typeColor}
        px={4} 
        py={4} 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between"
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
            {typeName}
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
              to={`/athlete/workouts/edit/${workout.id}`}
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
          {showRefresh && onRefresh && (
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
      <CardBody>
        <VStack align="start" spacing={4} height="100%">
          {/* Title */}
          <Heading size="lg" mt={1} noOfLines={1}>{workout.name}</Heading>
          
          {/* Date and time */}
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
          
          {/* Duration and location info */}
          <HStack spacing={4} fontSize="md" color={infoColor} width="100%">
            <Flex align="center">
              <Icon as={FaClock} mr={2} color={typeColor} boxSize={4} />
              <Text>{workout.duration}</Text>
            </Flex>
            {(workout as any).location && (
              <Flex align="center">
                <Icon as={FaMapMarkerAlt} mr={2} color={typeColor} boxSize={4} />
                <Text>{(workout as any).location}</Text>
              </Flex>
            )}
          </HStack>
          
          {/* Exercises info */}
          <Box width="100%" py={2}>
            <Flex align="center" mb={2}>
              <Icon as={FaTasks} mr={2} color={typeColor} boxSize={4} />
              <Text fontSize="md" fontWeight="medium">
                Exercises: {workout.exercises?.length || 0}
              </Text>
            </Flex>
            {workout.exercises && workout.exercises.length > 0 && (
              <Box maxH="100px" overflowY="auto" fontSize="sm" color={infoColor} pl={6}>
                {workout.exercises.slice(0, 3).map((ex, idx) => (
                  <Text key={idx} noOfLines={1} mb={1}>
                    • {ex.name} ({ex.sets}×{ex.reps})
                  </Text>
                ))}
                {workout.exercises.length > 3 && (
                  <Text fontStyle="italic">+{workout.exercises.length - 3} more...</Text>
                )}
              </Box>
            )}
          </Box>
          
          {/* Assigned to (for coach view) */}
          {isCoach && (
            <Flex align="center" width="100%">
              <Icon as={FaUsers} mr={2} color={typeColor} boxSize={4} />
              <Text fontSize="md" color={infoColor} noOfLines={1} title={assignedTo}>
                Assigned to: {assignedTo}
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
          
          {/* Progress bar */}
          <Box width="100%" mt={2}>
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
                  colorScheme={typeColorBase}
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
                  colorScheme={progress.completed === progress.total && progress.total > 0 ? "green" : typeColorBase}
                  itemLabel="athlete(s)"
                  textColor={infoColor}
                  showText={false}
                />
                
                {statsLoading && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Updating progress...
                  </Text>
                )}
              </>
            ) : (
              <ProgressBar
                completed={progress.completed}
                total={progress.total}
                percentage={progress.percentage}
                colorScheme={progress.completed === progress.total && progress.total > 0 ? "green" : typeColorBase}
                itemLabel={isCoach ? "athlete(s)" : "exercises"}
                textColor={infoColor}
              />
            )}
          </Box>
          
          {/* Action button */}
          {onStart && (
            <Button 
              mt="auto"
              width="100%" 
              colorScheme={progress.completed === progress.total && progress.total > 0 ? "green" : typeColorBase} 
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
        </VStack>
      </CardBody>
    </Card>
  );
} 