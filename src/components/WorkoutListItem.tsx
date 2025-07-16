import React, { useState } from 'react';
import {
  Box, HStack, VStack, Text, Icon, Flex, Button, Badge, IconButton, 
  useColorModeValue, Tooltip, Menu, MenuButton, MenuList, MenuItem, Portal
} from '@chakra-ui/react';
import { FaRunning, FaDumbbell, FaLeaf, FaRedo, FaEdit, FaTrash, FaEye, FaUsers, FaTasks, FaLayerGroup, FaEllipsisV, FaExchangeAlt } from 'react-icons/fa';
import type { Workout } from '../services/api';
import { getTypeIcon, getTypeColor, getTypeName } from './WorkoutCard';
import { getExercisesFromWorkout, getBlocksFromWorkout } from '../utils/workoutUtils';
import { dateUtils } from '../utils/date';
import { format } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { WorkoutDetailsDrawer } from './WorkoutDetailsDrawer';

interface WorkoutListItemProps {
  workout: Workout;
  isCoach?: boolean;
  assignedTo?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
  onViewDetails?: () => void;
  isTemplate?: boolean;
  currentUserId?: string;
  monthlyPlanUsage?: {
    isUsed: boolean;
    monthlyPlans: { id: string; name: string }[];
  };
  onConvertToWorkout?: () => void;
}

export function WorkoutListItem({
  workout,
  isCoach = false,
  assignedTo = 'Unassigned',
  onEdit,
  onDelete,
  onAssign,
  onViewDetails,
  isTemplate = false,
  currentUserId,
  monthlyPlanUsage,
  onConvertToWorkout
}: WorkoutListItemProps) {
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
  // Theme colors
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const infoColor = useColorModeValue('gray.500', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Derived values
  const typeColorBase = getTypeColor(workout.type);
  const typeColor = `${typeColorBase}.500`;
  const typeName = getTypeName(workout.type);
  
  // Format date
  const formattedDate = workout.date 
    ? dateUtils.format(workout.date, 'MMM d, yyyy')
    : 'No date';

  // Get exercises and blocks info
  const allExercises = getExercisesFromWorkout(workout);
  const workoutBlocks = getBlocksFromWorkout(workout);
  
  // Calculate display text for exercises/blocks
  const exerciseInfo = (workout as any).is_block_based && workoutBlocks.length > 0
    ? `${workoutBlocks.length} Block${workoutBlocks.length !== 1 ? 's' : ''}`
    : `${workout.template_type === 'monthly' && (workout as any)._planTotalExercises ? 
        (workout as any)._planTotalExercises : allExercises.length} Exercise${
        (workout.template_type === 'monthly' && (workout as any)._planTotalExercises ? 
          (workout as any)._planTotalExercises : allExercises.length) !== 1 ? 's' : ''}`;

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      transition="all 0.2s"
      _hover={{ bg: hoverBg, transform: 'translateY(-1px)' }}
      cursor="pointer"
      onClick={handleViewDetails}
    >
      <HStack spacing={4} align="center">
        {/* Icon and Type Badge */}
        <VStack spacing={2} align="center" minW="80px">
          <Box
            bg={typeColor}
            borderRadius="full"
            p={2}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon 
              as={workout.type ? getTypeIcon(workout.type).type : FaRunning} 
              color="white" 
              boxSize={4} 
            />
          </Box>
          <Badge 
            colorScheme={typeColorBase}
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="md"
          >
            {workout.template_type === 'weekly' ? 'Weekly' : 
             workout.template_type === 'monthly' ? 'Monthly' : 
             isTemplate ? 'Template' : typeName}
          </Badge>
        </VStack>

        {/* Main Content */}
        <VStack align="start" spacing={1} flex="1" minW="0">
          {/* Title and Template Badge */}
          <HStack spacing={2} align="center" w="100%">
            <Text 
              fontSize="lg" 
              fontWeight="bold" 
              color={titleColor}
              noOfLines={1}
              flex="1"
            >
              {workout.name}
            </Text>
            {isTemplate && (
              <Badge colorScheme="purple" fontSize="xs" px={2} py={1}>
                TEMPLATE
              </Badge>
            )}
            {(workout as any).is_block_based && (
              <Badge colorScheme="green" fontSize="xs" px={2} py={1}>
                <Icon as={FaLayerGroup} mr={1} boxSize={2} />
                BLOCK
              </Badge>
            )}
          </HStack>

          {/* Info Row */}
          <HStack spacing={4} fontSize="sm" color={subtitleColor} wrap="wrap">
            {!isTemplate && (
              <Text>{formattedDate}</Text>
            )}
            {workout.time && !isTemplate && (
              <Text>{workout.time}</Text>
            )}
            {workout.duration && (
              <Text>{isTemplate ? `~${workout.duration}` : workout.duration}</Text>
            )}
            <Text>{exerciseInfo}</Text>
            {isCoach && !isTemplate && (
              <Text noOfLines={1} maxW="200px">
                Assigned: {assignedTo}
              </Text>
            )}
          </HStack>

          {/* Monthly Plan Usage */}
          {isCoach && monthlyPlanUsage?.isUsed && (
            <Text fontSize="xs" color="orange.500">
              Used in {monthlyPlanUsage.monthlyPlans.length} monthly plan{monthlyPlanUsage.monthlyPlans.length !== 1 ? 's' : ''}
            </Text>
          )}

          {/* Description */}
          {(workout.notes || workout.description) && (
            <Text 
              fontSize="sm" 
              color={infoColor} 
              noOfLines={1}
              maxW="100%"
            >
              {workout.notes || workout.description}
            </Text>
          )}
        </VStack>

        {/* Actions Menu */}
        <Menu 
          placement="bottom-end"
          closeOnSelect={true}
        >
          <MenuButton
            as={IconButton}
            icon={<FaEllipsisV />}
            variant="ghost"
            size="sm"
            aria-label="Workout actions"
            onClick={(e) => e.stopPropagation()}
          />
          <Portal>
            <MenuList 
              zIndex={1000}
            >
            <MenuItem 
              icon={<FaEdit />} 
              as={RouterLink}
              to={isCoach ? `/coach/workout-creator-new?edit=${workout.id}` : `/athlete/workout-creator-new?edit=${workout.id}`}
            >
              Edit
            </MenuItem>
            <MenuItem 
              icon={<FaEye />} 
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                handleViewDetails(); 
              }}
            >
              View Details
            </MenuItem>
            {isTemplate && onConvertToWorkout && (
              <MenuItem 
                icon={<FaExchangeAlt />} 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  onConvertToWorkout(); 
                }}
              >
                Convert to Workout
              </MenuItem>
            )}
            {onAssign && !isTemplate && !(workout as any).is_template && (
              <MenuItem 
                icon={<FaUsers />} 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  onAssign(); 
                }}
              >
                Assign Athletes
              </MenuItem>
            )}
            {isCoach && onDelete && (
              <MenuItem 
                icon={<FaTrash />} 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  onDelete(); 
                }} 
                color="red.500"
              >
                Delete
              </MenuItem>
            )}
            {!isCoach && onDelete && currentUserId && (
              <MenuItem 
                icon={<FaTrash />} 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  onDelete(); 
                }} 
                color="red.500"
                isDisabled={workout.user_id !== currentUserId}
                opacity={workout.user_id !== currentUserId ? 0.6 : 1}
              >
                Delete
              </MenuItem>
            )}
            </MenuList>
          </Portal>
        </Menu>
      </HStack>

      {/* Workout Details Drawer */}
      <WorkoutDetailsDrawer
        isOpen={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        workout={workout}
      />
    </Box>
  );
} 