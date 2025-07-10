import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  Button,
  SimpleGrid,
  Skeleton,
  useColorModeValue,
  Heading,
  Divider,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Flex,
  Tag,
  useToast
} from '@chakra-ui/react';
import { FaRunning, FaCalendarAlt, FaArrowRight, FaClock, FaFire, FaBed, FaDumbbell } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { UnifiedAssignmentCard } from './UnifiedAssignmentCard';
import { UnifiedWorkoutExecution } from './UnifiedWorkoutExecution';
import { useAuth } from '../contexts/AuthContext';
import { useUnifiedAssignments, useUnifiedTodaysWorkout } from './unified';

interface TodayWorkoutsCardProps {
  profile: any;
  profileLoading: boolean;
}

const TodayWorkoutsCard: React.FC<TodayWorkoutsCardProps> = ({
  profile,
  profileLoading
}) => {
  const { user } = useAuth();
  const toast = useToast();
  
  // Unified assignment system hooks
  const { 
    data: assignments, 
    isLoading: assignmentsLoading, 
    error: assignmentsError 
  } = useUnifiedAssignments(user?.id);
  
  const { 
    data: todaysWorkout, 
    isLoading: todaysWorkoutLoading,
    error: todaysWorkoutError 
  } = useUnifiedTodaysWorkout(user?.id);

  // State for workout execution
  const [executingAssignmentId, setExecutingAssignmentId] = useState<string | null>(null);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const cardShadow = useColorModeValue('none', 'lg');
  const emptyStateBg = useColorModeValue('gray.50', 'gray.700');
  const todayBg = useColorModeValue('teal.50', 'teal.900');
  const todayBorder = useColorModeValue('teal.200', 'teal.700');

  // Filter assignments by date
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAssignments = assignments?.filter(assignment => 
    assignment.start_date?.startsWith(todayStr)
  ) || [];
  
  const upcomingAssignments = assignments?.filter(assignment => 
    assignment.start_date && !assignment.start_date.startsWith(todayStr)
  ) || [];

  // Calculate stats
  const totalWorkouts = todayAssignments.length + upcomingAssignments.length + (todaysWorkout ? 1 : 0);
  const completedToday = todayAssignments.filter(a => a.status === 'completed').length + 
                         (todaysWorkout?.status === 'completed' ? 1 : 0);

  // Handle workout execution
  const handleExecuteWorkout = (assignmentId: string) => {
    setExecutingAssignmentId(assignmentId);
  };

  const handleCloseExecution = () => {
    setExecutingAssignmentId(null);
  };

  // Loading state
  if (assignmentsLoading || todaysWorkoutLoading || profileLoading) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={{ base: 4, md: 6 }}
        border="1px solid"
        borderColor={borderColor}
        boxShadow={cardShadow}
        mb={10}
      >
        <VStack spacing={4}>
          <Skeleton height="24px" width="200px" />
          <Skeleton height="100px" width="100%" />
          <Skeleton height="100px" width="100%" />
        </VStack>
      </Box>
    );
  }

  // Error state
  if (assignmentsError || todaysWorkoutError) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={{ base: 4, md: 6 }}
        border="1px solid"
        borderColor={borderColor}
        boxShadow={cardShadow}
        mb={10}
      >
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <VStack align="start" spacing={1} flex="1">
            <Text fontSize="sm" fontWeight="medium">
              Unable to load workout assignments
            </Text>
            <Text fontSize="xs" color={subtitleColor}>
              {assignmentsError?.message || todaysWorkoutError?.message || 'Please try refreshing the page'}
            </Text>
          </VStack>
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={{ base: 4, md: 6 }}
      border="1px solid"
      borderColor={borderColor}
      boxShadow={cardShadow}
      mb={10}
      w="100%"
      maxW="100%"
      overflowX="hidden"
    >
      <VStack spacing={6} align="stretch">
        {/* Today's Workout from Monthly Plan */}
        {todaysWorkout && (
          <Box>
            <Box 
              bg={todayBg} 
              p={4} 
              borderRadius="lg" 
              border="1px solid" 
              borderColor={todayBorder}
            >
              <VStack spacing={4} align="stretch">
                <Flex justify="space-between" align="center">
                  <HStack spacing={3}>
                    <Icon as={FaFire} color="teal.500" boxSize={5} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>
                        Today's Training Plan
                      </Text>
                      <Text fontSize="sm" color={subtitleColor}>
                        From your monthly plan
                      </Text>
                    </VStack>
                  </HStack>
                  <Badge 
                    colorScheme={todaysWorkout.status === 'completed' ? 'green' : 'orange'} 
                    variant="solid"
                  >
                    {todaysWorkout.status === 'completed' ? 'Completed' : 
                     todaysWorkout.status === 'in_progress' ? 'In Progress' : 'Assigned'}
                  </Badge>
                </Flex>
                
                <UnifiedAssignmentCard
                  assignment={todaysWorkout}
                  onExecute={handleExecuteWorkout}
                  showActions={true}
                  compact={false}
                />
              </VStack>
            </Box>
            
            {todayAssignments.length > 0 && <Divider />}
          </Box>
        )}

        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaRunning} boxSize={6} color="green.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {todaysWorkout ? "Additional Assignments" : "Today's Assignments"}
              </Text>
              <Text fontSize="sm" color={subtitleColor}>
                {totalWorkouts > 0 
                  ? `${completedToday} of ${totalWorkouts} completed`
                  : 'No assignments scheduled'
                }
              </Text>
            </VStack>
          </HStack>
          <VStack spacing={1} align="end">
            <Badge 
              colorScheme="green" 
              variant="solid" 
              fontSize="xs"
              px={2}
              py={1}
            >
              {totalWorkouts} Total
            </Badge>
            {totalWorkouts > 0 && (
              <Badge 
                colorScheme={completedToday === totalWorkouts ? "green" : "orange"} 
                variant="outline" 
                fontSize="xs"
                px={2}
                py={1}
              >
                {completedToday}/{totalWorkouts} Done
              </Badge>
            )}
          </VStack>
        </HStack>

        {/* Today's Assignments */}
        {todayAssignments.length > 0 ? (
          <Box>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {todayAssignments.map((assignment) => (
                <UnifiedAssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onExecute={handleExecuteWorkout}
                  showActions={true}
                  compact={false}
                />
              ))}
            </SimpleGrid>
          </Box>
        ) : !todaysWorkout && (
          <Box
            bg={emptyStateBg}
            p={6}
            borderRadius="lg"
            textAlign="center"
          >
            <VStack spacing={3}>
              <Icon as={FaCalendarAlt} boxSize={8} color={subtitleColor} />
              <Text fontSize="lg" fontWeight="medium" color={textColor}>
                No assignments scheduled for today
              </Text>
              <Text fontSize="sm" color={subtitleColor}>
                {upcomingAssignments.length > 0 
                  ? 'Check your upcoming assignments below'
                  : 'New assignments will appear here when available'
                }
              </Text>
            </VStack>
          </Box>
        )}

        {/* Upcoming Assignments */}
        {upcomingAssignments.length > 0 && (
          <Box>
            <HStack justify="space-between" align="center" mb={4}>
              <HStack spacing={2}>
                <Icon as={FaCalendarAlt} color="blue.500" fontSize="lg" />
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  Upcoming Assignments
                </Text>
              </HStack>
              <Badge 
                colorScheme="blue" 
                variant="outline" 
                fontSize="xs"
                px={2}
                py={1}
              >
                {upcomingAssignments.length} upcoming
              </Badge>
            </HStack>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {upcomingAssignments.slice(0, 6).map((assignment) => (
                <UnifiedAssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onExecute={handleExecuteWorkout}
                  showActions={true}
                  compact={true}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Action Button */}
        {totalWorkouts === 0 && (
          <Button
            as={RouterLink}
            to="/athlete/workouts"
            colorScheme="green"
            size="lg"
            leftIcon={<Icon as={FaRunning} />}
            rightIcon={<Icon as={FaArrowRight} />}
          >
            View All Assignments
          </Button>
        )}
      </VStack>

      {/* Unified Workout Execution Modal */}
      {executingAssignmentId && (
        <UnifiedWorkoutExecution
          assignment={
            (todaysWorkout?.id === executingAssignmentId ? todaysWorkout : 
             [...todayAssignments, ...upcomingAssignments].find(a => a.id === executingAssignmentId)) || 
            todaysWorkout!
          }
          isOpen={!!executingAssignmentId}
          onExit={handleCloseExecution}
          onComplete={handleCloseExecution}
        />
      )}
    </Box>
  );
};

export default TodayWorkoutsCard; 