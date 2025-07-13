import React from 'react';
import {
  Box, HStack, VStack, Text, Icon, Badge, IconButton, 
  useColorModeValue, Menu, MenuButton, MenuList, MenuItem, Portal
} from '@chakra-ui/react';
import { FaCalendarAlt, FaEdit, FaTrash, FaEye, FaUsers, FaEllipsisV, FaCalendarWeek } from 'react-icons/fa';
import type { TrainingPlan } from '../services/dbSchema';
import { format } from 'date-fns';

interface MonthlyPlanWithStats extends TrainingPlan {
  totalAssignments: number;
  activeAssignments: number;
  completedAssignments: number;
}

interface MonthlyPlanListItemProps {
  monthlyPlan: MonthlyPlanWithStats;
  isCoach?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
  onView?: () => void;
  completionStats?: {
    totalAssigned: number;
    completed: number;
    inProgress: number;
    percentage: number;
  };
  statsLoading?: boolean;
}

export function MonthlyPlanListItem({
  monthlyPlan,
  isCoach = false,
  onEdit,
  onDelete,
  onAssign,
  onView,
  completionStats,
  statsLoading = false
}: MonthlyPlanListItemProps) {
  // Theme colors
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const infoColor = useColorModeValue('gray.500', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Format dates
  const startDate = new Date(monthlyPlan.start_date);
  const formattedStartDate = format(startDate, 'MMM yyyy');
  
  // Calculate active weeks
  const activeWeeks = monthlyPlan.weeks.filter(week => !week.is_rest_week).length;
  const totalWeeks = monthlyPlan.weeks.length;

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
      onClick={onView}
    >
      <HStack spacing={4} align="center">
        {/* Icon and Type Badge */}
        <VStack spacing={2} align="center" minW="80px">
          <Box
            bg="blue.500"
            borderRadius="full"
            p={2}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon 
              as={FaCalendarAlt} 
              color="white" 
              boxSize={4} 
            />
          </Box>
          <Badge 
            colorScheme="blue"
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="md"
          >
            MONTHLY
          </Badge>
        </VStack>

        {/* Main Content */}
        <VStack align="start" spacing={1} flex="1" minW="0">
          {/* Title */}
          <Text 
            fontSize="lg" 
            fontWeight="bold" 
            color={titleColor}
            noOfLines={1}
            flex="1"
          >
            {monthlyPlan.name}
          </Text>

          {/* Info Row */}
          <HStack spacing={4} fontSize="sm" color={subtitleColor} wrap="wrap">
            <HStack spacing={1}>
              <Icon as={FaCalendarAlt} boxSize={3} />
              <Text>{formattedStartDate}</Text>
            </HStack>
            <HStack spacing={1}>
              <Icon as={FaCalendarWeek} boxSize={3} />
              <Text>{totalWeeks} weeks ({activeWeeks} active)</Text>
            </HStack>
            {completionStats && (
              <HStack spacing={1}>
                <Icon as={FaUsers} boxSize={3} />
                <Text>
                  {completionStats.totalAssigned} assigned
                  {completionStats.completed > 0 && ` • ${completionStats.completed} completed`}
                </Text>
              </HStack>
            )}
          </HStack>

          {/* Description */}
          {monthlyPlan.description && (
            <Text 
              fontSize="sm" 
              color={infoColor} 
              noOfLines={1}
              maxW="100%"
            >
              {monthlyPlan.description}
            </Text>
          )}
        </VStack>

        {/* Progress Badge */}
        {completionStats && completionStats.totalAssigned > 0 && (
          <Badge
            colorScheme={completionStats.percentage === 100 ? 'green' : 'blue'}
            fontSize="xs"
            px={2}
            py={1}
          >
            {Math.round(completionStats.percentage)}% Complete
          </Badge>
        )}

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
            aria-label="Plan actions"
            onClick={(e) => e.stopPropagation()}
          />
          <Portal>
            <MenuList 
              zIndex={1000}
            >
            {onEdit && (
              <MenuItem 
                icon={<FaEdit />} 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  onEdit(); 
                }}
              >
                Edit
              </MenuItem>
            )}
            {onView && (
              <MenuItem 
                icon={<FaEye />} 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  onView(); 
                }}
              >
                View Details
              </MenuItem>
            )}
            {onAssign && (
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
            </MenuList>
          </Portal>
        </Menu>
      </HStack>
    </Box>
  );
} 