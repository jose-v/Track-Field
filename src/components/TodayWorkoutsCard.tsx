import React from 'react';
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
} from '@chakra-ui/react';
import { FaRunning, FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { WorkoutCard } from './WorkoutCard';

interface TodayWorkoutsCardProps {
  todayWorkouts: any[];
  upcomingWorkouts: any[];
  profile: any;
  getWorkoutProgressData: (workout: any) => any;
  handleStartWorkout: (workout: any) => void;
  workoutsLoading: boolean;
  profileLoading: boolean;
}

const TodayWorkoutsCard: React.FC<TodayWorkoutsCardProps> = ({
  todayWorkouts,
  upcomingWorkouts,
  profile,
  getWorkoutProgressData,
  handleStartWorkout,
  workoutsLoading,
  profileLoading
}) => {
  // Color mode values matching quick-log cards
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const cardShadow = useColorModeValue('none', 'lg');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  if (profileLoading || workoutsLoading) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow={cardShadow}
        mb={10}
        minH="300px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color={statLabelColor}>Loading workouts...</Text>
      </Box>
    );
  }

  const getTotalWorkouts = () => todayWorkouts.length + upcomingWorkouts.length;
  const getCompletedToday = () => {
    return todayWorkouts.filter(workout => {
      const progress = getWorkoutProgressData(workout);
      return progress.percentage === 100;
    }).length;
  };

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
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaRunning} boxSize={6} color="green.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                Today's Workouts
              </Text>
              <Text fontSize="sm" color={subtitleColor}>
                {todayWorkouts.length > 0 
                  ? `${getCompletedToday()} of ${todayWorkouts.length} completed today`
                  : 'Plan your training session'
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
              {getTotalWorkouts()} Total
            </Badge>
            {todayWorkouts.length > 0 && (
              <Badge 
                colorScheme={getCompletedToday() === todayWorkouts.length ? "green" : "orange"} 
                variant="outline" 
                fontSize="xs"
                px={2}
                py={1}
              >
                {getCompletedToday()}/{todayWorkouts.length} Done
              </Badge>
            )}
          </VStack>
        </HStack>

        {/* Today's Workouts */}
        {todayWorkouts.length > 0 ? (
          <Box>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {todayWorkouts.map((workout, idx) => (
                <WorkoutCard
                  key={workout.id || idx}
                  workout={workout}
                  isCoach={profile?.role === 'coach'}
                  progress={getWorkoutProgressData(workout)}
                  onStart={() => handleStartWorkout(workout)}
                />
              ))}
            </SimpleGrid>
          </Box>
        ) : (
          <Box
            bg={useColorModeValue('gray.50', 'gray.700')}
            p={6}
            borderRadius="lg"
            textAlign="center"
          >
            <VStack spacing={3}>
              <Icon as={FaCalendarAlt} boxSize={8} color={subtitleColor} />
              <Text fontSize="lg" fontWeight="medium" color={textColor}>
                No workouts scheduled for today
              </Text>
              <Text fontSize="sm" color={subtitleColor}>
                {upcomingWorkouts.length > 0 
                  ? 'Check your upcoming workouts below'
                  : 'Create or browse available workouts to get started'
                }
              </Text>
            </VStack>
          </Box>
        )}

        {/* Upcoming Workouts */}
        {upcomingWorkouts.length > 0 && (
          <Box>
            <HStack justify="space-between" align="center" mb={4}>
              <HStack spacing={2}>
                <Icon as={FaCalendarAlt} color="blue.500" fontSize="lg" />
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  Upcoming Workouts
                </Text>
              </HStack>
              <Badge 
                colorScheme="blue" 
                variant="outline" 
                fontSize="xs"
                px={2}
                py={1}
              >
                Next {Math.min(upcomingWorkouts.length, 3)}
              </Badge>
            </HStack>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {upcomingWorkouts.slice(0, 3).map((workout, idx) => (
                <WorkoutCard
                  key={workout.id || idx}
                  workout={workout}
                  isCoach={profile?.role === 'coach'}
                  progress={getWorkoutProgressData(workout)}
                  onStart={() => handleStartWorkout(workout)}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Action Button */}
        {(todayWorkouts.length === 0 && upcomingWorkouts.length === 0) && (
          <Button
            as={RouterLink}
            to={profile?.role === 'coach' ? "/coach/workouts" : "/athlete/workouts"}
            colorScheme="green"
            size="lg"
            leftIcon={<Icon as={FaRunning} />}
            rightIcon={<Icon as={FaArrowRight} />}
          >
            {profile?.role === 'coach' ? "Create Workouts" : "View Available Workouts"}
          </Button>
        )}

        {/* Quick Actions for when there are workouts */}
        {(todayWorkouts.length > 0 || upcomingWorkouts.length > 0) && (
          <HStack spacing={3} justify="center">
            <Button
              as={RouterLink}
              to={profile?.role === 'coach' ? "/coach/workouts" : "/athlete/workouts"}
              variant="outline"
              colorScheme="green"
              size="sm"
              leftIcon={<Icon as={FaCalendarAlt} />}
            >
              View All Workouts
            </Button>
            {profile?.role === 'coach' && (
              <Button
                as={RouterLink}
                to="/coach/workouts"
                variant="outline"
                colorScheme="blue"
                size="sm"
                leftIcon={<Icon as={FaRunning} />}
              >
                Create New Workout
              </Button>
            )}
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export default TodayWorkoutsCard; 