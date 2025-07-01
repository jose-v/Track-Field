import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardBody, Heading, Text, Icon, Flex, HStack, VStack, 
  Button, Badge, IconButton, useColorModeValue, Tooltip, SimpleGrid, Skeleton,
  Menu, MenuButton, MenuList, MenuItem
} from '@chakra-ui/react';
import { FaCalendarAlt, FaEdit, FaTrash, FaUsers, FaClock, FaPlayCircle, FaDumbbell, FaChartLine, FaListAlt, FaEllipsisV, FaEye } from 'react-icons/fa';
import type { TrainingPlan } from '../services/dbSchema';
import { dateUtils } from '../utils/date';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';

// Helper function to get month name
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
}

// Helper functions for week counting
function getActiveWeekCount(weeks: any[]): number {
  if (!Array.isArray(weeks)) return 0;
  return weeks.filter(week => !week.is_rest_week).length;
}

function getRestWeekCount(weeks: any[]): number {
  if (!Array.isArray(weeks)) return 0;
  return weeks.filter(week => week.is_rest_week).length;
}

interface MonthlyPlanCardProps {
  monthlyPlan: TrainingPlan;
  isCoach?: boolean;
  assignmentCount?: number;
  completionStats?: {
    totalAssigned: number;
    completed: number;
    inProgress: number;
    percentage: number;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
  onView?: () => void;
  statsLoading?: boolean;
}

export function MonthlyPlanCard({
  monthlyPlan,
  isCoach = false,
  assignmentCount = 0,
  completionStats,
  onEdit,
  onDelete,
  onAssign,
  onView,
  statsLoading = false
}: MonthlyPlanCardProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('blue.700', 'blue.700');
  const infoColor = useColorModeValue('gray.600', 'gray.200');
  const loadingTextColor = useColorModeValue('gray.500', 'gray.300');
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const cardShadow = useColorModeValue('none', 'lg');
  const weekBadgeBg = useColorModeValue('gray.100', 'gray.700');
  const weekBadgeColor = useColorModeValue('gray.700', 'gray.200');
  const restBadgeBg = useColorModeValue('orange.100', 'orange.800');
  const restBadgeColor = useColorModeValue('orange.700', 'orange.200');

  // State for workout names
  const [workoutNames, setWorkoutNames] = useState<string[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  // Extract month and year from start_date
  const startDate = new Date(monthlyPlan.start_date);
  const monthName = getMonthName(startDate.getMonth() + 1); // getMonth() returns 0-11, so add 1
  const year = startDate.getFullYear();
  
  const activeWeeks = getActiveWeekCount(monthlyPlan.weeks);
  const restWeeks = getRestWeekCount(monthlyPlan.weeks);
  const totalWeeks = monthlyPlan.weeks.length;

  // Load workout names
  useEffect(() => {
    const loadWorkoutNames = async () => {
      if (!monthlyPlan.weeks || monthlyPlan.weeks.length === 0) {
        return;
      }

      try {
        setLoadingWorkouts(true);
        // Get unique workout IDs from weeks
        const workoutIds = monthlyPlan.weeks
          .filter(week => !week.is_rest_week && week.workout_id)
          .map(week => week.workout_id);
        const uniqueWorkoutIds = [...new Set(workoutIds)];
        
        if (uniqueWorkoutIds.length === 0) {
          setWorkoutNames([]);
          return;
        }
        
        // Fetch workout details - we'll need to call the API for each workout
        const workoutPromises = uniqueWorkoutIds.map(async (workoutId) => {
          try {
            const { data, error } = await supabase
              .from('workouts')
              .select('name')
              .eq('id', workoutId)
              .single();
            
            if (error) throw error;
            return data?.name || 'Unknown Workout';
          } catch (error) {
            console.error(`Error fetching workout ${workoutId}:`, error);
            return 'Unknown Workout';
          }
        });

        const names = await Promise.all(workoutPromises);
        setWorkoutNames(names);
      } catch (error) {
        console.error('Error loading workout names:', error);
      } finally {
        setLoadingWorkouts(false);
      }
    };

    loadWorkoutNames();
  }, [monthlyPlan.weeks]);

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
      {/* Card header with plan info and actions */}
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
              as={FaCalendarAlt} 
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
            Monthly Plan
          </Badge>
        </HStack>
        
        {/* Action menu */}
        {isCoach && (
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FaEllipsisV />}
              variant="ghost" 
              color="white" 
              size="sm"
              aria-label="Plan actions"
              _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
            />
            <MenuList>
              {onAssign && (
                <MenuItem icon={<FaUsers />} onClick={onAssign}>
                  Assign Athletes
                </MenuItem>
              )}
              {onEdit && (
                <MenuItem icon={<FaEdit />} onClick={onEdit}>
                  Edit
                </MenuItem>
          )}
              {onView && (
                <MenuItem icon={<FaEye />} onClick={onView}>
                  View Details
                </MenuItem>
              )}
              {onDelete && (
                <MenuItem icon={<FaTrash />} onClick={onDelete} color="red.500">
                  Delete
                </MenuItem>
          )}
            </MenuList>
          </Menu>
        )}
      </Box>

      <CardBody p={5}>
        <VStack align="stretch" spacing={4}>
          {/* Plan title and period */}
          <VStack align="start" spacing={2}>
            <Heading size="md" color={titleColor} lineHeight="1.2">
              {monthlyPlan.name}
            </Heading>
            <HStack spacing={3}>
              <HStack spacing={1}>
                <Icon as={FaCalendarAlt} color={infoColor} boxSize={4} />
                <Text fontSize="sm" color={infoColor} fontWeight="medium">
                  {monthName} {year}
                </Text>
              </HStack>
              <HStack spacing={1}>
                <Icon as={FaClock} color={infoColor} boxSize={4} />
                <Text fontSize="sm" color={infoColor}>
                  {totalWeeks} weeks
                </Text>
              </HStack>
            </HStack>
          </VStack>

          {/* Athletes Assigned - Prominent display */}
          {isCoach && (
            <Box 
              bg={useColorModeValue('blue.50', 'blue.900')} 
              borderColor={useColorModeValue('blue.200', 'blue.700')}
              borderWidth="1px"
              borderRadius="md"
              p={3}
            >
              <HStack justify="space-between" align="center">
                <HStack spacing={2}>
                  <Icon as={FaUsers} color="blue.500" boxSize={4} />
                  <Text fontSize="sm" fontWeight="semibold" color={titleColor}>
                    Athletes Assigned
                  </Text>
                </HStack>
                <Badge colorScheme="blue" fontSize="md" px={3} py={1} borderRadius="full">
                  {completionStats?.totalAssigned || assignmentCount || 0}
                </Badge>
              </HStack>
            </Box>
          )}

          {/* Description */}
          {monthlyPlan.description && (
            <Text fontSize="sm" color={infoColor} lineHeight="1.4">
              {monthlyPlan.description}
            </Text>
          )}

          {/* Weekly Workouts */}
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between" align="center">
              <Text fontSize="sm" fontWeight="semibold" color={titleColor}>
                <Icon as={FaListAlt} mr={2} />
                Weekly Workouts
              </Text>
              {loadingWorkouts && <Skeleton height="16px" width="60px" />}
            </HStack>
            
            {workoutNames.length > 0 ? (
              <Box maxH="80px" overflowY="auto">
                <VStack align="start" spacing={1}>
                  {workoutNames.slice(0, 3).map((name, index) => (
                    <Text key={index} fontSize="xs" color={infoColor} noOfLines={1}>
                      • {name}
                    </Text>
                  ))}
                  {workoutNames.length > 3 && (
                    <Text fontSize="xs" color={infoColor} fontStyle="italic">
                      +{workoutNames.length - 3} more workouts
                    </Text>
                  )}
                </VStack>
              </Box>
            ) : (
              <Text fontSize="xs" color={infoColor}>
                {activeWeeks} training weeks, {restWeeks} rest weeks
              </Text>
            )}
          </VStack>

          {/* Week breakdown */}
          <VStack align="stretch" spacing={3}>
            <Text fontSize="sm" fontWeight="semibold" color={titleColor}>
              Week Structure
            </Text>
            <SimpleGrid columns={2} spacing={2}>
              <HStack spacing={2}>
                <Badge 
                  bg={weekBadgeBg} 
                  color={weekBadgeColor} 
                  px={2} 
                  py={1} 
                  borderRadius="md"
                  fontSize="xs"
                >
                  <Icon as={FaDumbbell} mr={1} />
                  {activeWeeks} Active
                </Badge>
              </HStack>
              {restWeeks > 0 && (
                <HStack spacing={2}>
                  <Badge 
                    bg={restBadgeBg} 
                    color={restBadgeColor} 
                    px={2} 
                    py={1} 
                    borderRadius="md"
                    fontSize="xs"
                  >
                    <Icon as={FaClock} mr={1} />
                    {restWeeks} Rest
                  </Badge>
                </HStack>
              )}
            </SimpleGrid>
          </VStack>

          {/* Assignment statistics for coaches */}
          {isCoach && completionStats && completionStats.totalAssigned > 0 && (
            <VStack align="stretch" spacing={3}>
              <Text fontSize="sm" fontWeight="semibold" color={titleColor}>
                Progress Summary
              </Text>
              
              {statsLoading ? (
                <Text fontSize="sm" color={loadingTextColor}>
                  Loading statistics...
                </Text>
              ) : (
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color={infoColor}>Completed:</Text>
                    <Text fontSize="sm" fontWeight="semibold" color="green.500">
                      {completionStats.completed}/{completionStats.totalAssigned}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color={infoColor}>In Progress:</Text>
                    <Text fontSize="sm" fontWeight="semibold" color="blue.500">
                      {completionStats.inProgress}
                    </Text>
                  </HStack>
                  {completionStats.percentage > 0 && (
                    <Box>
                      <Text fontSize="xs" color={infoColor} mb={1}>
                        Overall: {completionStats.percentage.toFixed(1)}%
                      </Text>
                      <Box bg={weekBadgeBg} borderRadius="full" h={2}>
                        <Box 
                          bg="green.400" 
                          h="100%" 
                          borderRadius="full" 
                          width={`${completionStats.percentage}%`}
                          transition="width 0.3s ease"
                        />
                      </Box>
                    </Box>
                  )}
                </VStack>
              )}
            </VStack>
          )}


        </VStack>
      </CardBody>
    </Card>
  );
} 