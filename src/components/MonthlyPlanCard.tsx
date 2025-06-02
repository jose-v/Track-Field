import React from 'react';
import {
  Box, Card, CardBody, Heading, Text, Icon, Flex, HStack, VStack, 
  Button, Badge, IconButton, useColorModeValue, Tooltip, SimpleGrid
} from '@chakra-ui/react';
import { FaCalendarAlt, FaEdit, FaTrash, FaUsers, FaClock, FaPlayCircle, FaDumbbell, FaChartLine } from 'react-icons/fa';
import type { MonthlyPlan } from '../services/dbSchema';
import { dateUtils } from '../utils/date';

// Helper function to get month name
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
}

// Helper function to count active weeks (non-rest weeks)
function getActiveWeekCount(weeks: any[]): number {
  return weeks.filter(week => !week.is_rest_week).length;
}

// Helper function to count rest weeks
function getRestWeekCount(weeks: any[]): number {
  return weeks.filter(week => week.is_rest_week).length;
}

interface MonthlyPlanCardProps {
  monthlyPlan: MonthlyPlan;
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
  const headerBg = useColorModeValue('teal.500', 'teal.400');
  const infoColor = useColorModeValue('gray.600', 'gray.200');
  const loadingTextColor = useColorModeValue('gray.500', 'gray.300');
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const cardShadow = useColorModeValue('none', 'lg');
  const weekBadgeBg = useColorModeValue('gray.100', 'gray.700');
  const weekBadgeColor = useColorModeValue('gray.700', 'gray.200');
  const restBadgeBg = useColorModeValue('orange.100', 'orange.800');
  const restBadgeColor = useColorModeValue('orange.700', 'orange.200');

  const monthName = getMonthName(monthlyPlan.month);
  const activeWeeks = getActiveWeekCount(monthlyPlan.weeks);
  const restWeeks = getRestWeekCount(monthlyPlan.weeks);
  const totalWeeks = monthlyPlan.weeks.length;

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
        
        {/* Action buttons */}
        <HStack>
          {isCoach && onEdit && (
            <IconButton 
              icon={<FaEdit />} 
              aria-label="Edit plan" 
              size="md" 
              variant="ghost" 
              color="white" 
              onClick={onEdit} 
            />
          )}
          {isCoach && onAssign && (
            <IconButton 
              icon={<FaUsers />} 
              aria-label="Assign to athletes" 
              size="md" 
              variant="ghost" 
              color="white" 
              onClick={onAssign} 
            />
          )}
          {isCoach && onDelete && (
            <IconButton 
              icon={<FaTrash />} 
              aria-label="Delete plan" 
              size="md" 
              variant="ghost" 
              color="white" 
              onClick={onDelete} 
            />
          )}
        </HStack>
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
                  {monthName} {monthlyPlan.year}
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

          {/* Description */}
          {monthlyPlan.description && (
            <Text fontSize="sm" color={infoColor} lineHeight="1.4">
              {monthlyPlan.description}
            </Text>
          )}

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
          {isCoach && (
            <VStack align="stretch" spacing={3}>
              <Text fontSize="sm" fontWeight="semibold" color={titleColor}>
                Assignment Status
              </Text>
              
              {statsLoading ? (
                <Text fontSize="sm" color={loadingTextColor}>
                  Loading statistics...
                </Text>
              ) : completionStats ? (
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color={infoColor}>Athletes assigned:</Text>
                    <Text fontSize="sm" fontWeight="semibold" color={titleColor}>
                      {completionStats.totalAssigned}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color={infoColor}>Completed:</Text>
                    <Text fontSize="sm" fontWeight="semibold" color="green.500">
                      {completionStats.completed}
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
                        Overall Progress: {completionStats.percentage.toFixed(1)}%
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
              ) : (
                <Text fontSize="sm" color={infoColor}>
                  {assignmentCount > 0 ? `Assigned to ${assignmentCount} athletes` : 'Not assigned yet'}
                </Text>
              )}
            </VStack>
          )}

          {/* Action buttons */}
          <Flex justify="space-between" pt={2}>
            {onView && (
              <Button
                size="sm"
                variant="outline"
                colorScheme="teal"
                leftIcon={<FaChartLine />}
                onClick={onView}
                flex={1}
                mr={onAssign ? 2 : 0}
              >
                View Details
              </Button>
            )}
            
            {isCoach && onAssign && (
              <Button
                size="sm"
                colorScheme="teal"
                leftIcon={<FaUsers />}
                onClick={onAssign}
                flex={1}
                ml={onView ? 2 : 0}
              >
                Assign Plan
              </Button>
            )}
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  );
} 