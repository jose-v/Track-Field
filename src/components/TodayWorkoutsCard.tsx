import React, { useState, useEffect } from 'react';
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
  Progress,
  Divider,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Flex,
  CircularProgress,
  CircularProgressLabel,
  Tag,
  useToast
} from '@chakra-ui/react';
import { FaRunning, FaCalendarAlt, FaArrowRight, FaClock, FaFire, FaCheck, FaBed, FaPlus } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { WorkoutCard } from './WorkoutCard';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface TodayWorkoutsCardProps {
  todayWorkouts: any[];
  upcomingWorkouts: any[];
  profile: any;
  getWorkoutProgressData: (workout: any) => any;
  handleStartWorkout: (workout: any) => void;
  handleResetProgress?: (workoutId: string, workoutName: string) => void;
  workoutsLoading: boolean;
  profileLoading: boolean;
}

const TodayWorkoutsCard: React.FC<TodayWorkoutsCardProps> = ({
  todayWorkouts,
  upcomingWorkouts,
  profile,
  getWorkoutProgressData,
  handleStartWorkout,
  handleResetProgress,
  workoutsLoading,
  profileLoading
}) => {
  const { user } = useAuth();
  const toast = useToast();
  
  // State for daily workout from monthly plans
  const [dailyWorkout, setDailyWorkout] = useState<any>(null);
  const [dailyWorkoutLoading, setDailyWorkoutLoading] = useState(false);
  const [dailyWorkoutError, setDailyWorkoutError] = useState<string | null>(null);

  // State for controlling workout display
  const [showAllTodayWorkouts, setShowAllTodayWorkouts] = useState(false);
  const [showAllUpcomingWorkouts, setShowAllUpcomingWorkouts] = useState(false);
  const INITIAL_WORKOUT_COUNT = 3;

  // Color mode values matching quick-log cards
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const cardShadow = useColorModeValue('none', 'lg');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');
  const emptyStateBg = useColorModeValue('gray.50', 'gray.700');
  const dailyWorkoutBg = useColorModeValue('teal.50', 'teal.900');
  const dailyWorkoutBorder = useColorModeValue('teal.200', 'teal.700');
  const exerciseBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch today's daily workout from monthly plans
  useEffect(() => {
    const fetchDailyWorkout = async () => {
      if (!user?.id || profile?.role !== 'athlete') return;

      try {
        setDailyWorkoutLoading(true);
        setDailyWorkoutError(null);
        
        const result = await api.monthlyPlanAssignments.getTodaysWorkout(user.id);
        setDailyWorkout(result);
      } catch (error) {
        console.error('Error fetching daily workout:', error);
        setDailyWorkoutError('Failed to load daily workout');
      } finally {
        setDailyWorkoutLoading(false);
      }
    };

    fetchDailyWorkout();
  }, [user?.id, profile?.role]);

  // Helper function to format exercise count
  const getExerciseCountText = (exercises: any[]) => {
    if (!exercises || exercises.length === 0) return 'No exercises';
    return exercises.length === 1 ? '1 exercise' : `${exercises.length} exercises`;
  };

  // Helper function to get day name
  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

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

  // Calculate how many workouts to display
  const todayWorkoutsToShow = showAllTodayWorkouts ? todayWorkouts : todayWorkouts.slice(0, INITIAL_WORKOUT_COUNT);
  const upcomingWorkoutsToShow = showAllUpcomingWorkouts ? upcomingWorkouts : upcomingWorkouts.slice(0, INITIAL_WORKOUT_COUNT);

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
        {/* Daily Workout from Monthly Plan - Athletes Only */}
        {profile?.role === 'athlete' && (
          <Box>
            {dailyWorkoutLoading ? (
              <Box bg={dailyWorkoutBg} p={4} borderRadius="lg" border="1px solid" borderColor={dailyWorkoutBorder}>
                <HStack spacing={3} mb={3}>
                  <Icon as={FaFire} color="teal.500" boxSize={5} />
                  <Skeleton height="24px" width="200px" />
                </HStack>
                <Skeleton height="16px" width="100%" />
              </Box>
            ) : dailyWorkout?.hasWorkout ? (
              <Box bg={dailyWorkoutBg} p={4} borderRadius="lg" border="1px solid" borderColor={dailyWorkoutBorder}>
                <VStack spacing={4} align="stretch">
                  {/* Daily Workout Header */}
                  <HStack justify="space-between" align="center">
                    <HStack spacing={3}>
                      <Icon as={FaFire} color="teal.500" boxSize={5} />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="lg" fontWeight="bold" color={textColor}>
                          Today's Training Plan
                        </Text>
                        <Text fontSize="sm" color={subtitleColor}>
                          {dailyWorkout.primaryWorkout?.description}
                        </Text>
                      </VStack>
                    </HStack>
                    <VStack spacing={1} align="end">
                      <Badge colorScheme="teal" variant="solid" fontSize="xs" px={2} py={1}>
                        {getDayName()}
                      </Badge>
                      <Text fontSize="xs" color={subtitleColor}>
                        Week {dailyWorkout.primaryWorkout?.progress?.currentWeek} of {dailyWorkout.primaryWorkout?.progress?.totalWeeks}
                      </Text>
                    </VStack>
                  </HStack>

                  {/* Progress */}
                  <HStack spacing={4}>
                    <Box flex="1">
                      <HStack justify="space-between" mb={1}>
                        <Text fontSize="sm" color={subtitleColor}>Week Progress</Text>
                        <Text fontSize="sm" color={textColor} fontWeight="medium">
                          {Math.round(dailyWorkout.primaryWorkout?.progress?.weekProgress || 0)}%
                        </Text>
                      </HStack>
                      <Progress 
                        value={dailyWorkout.primaryWorkout?.progress?.weekProgress || 0} 
                        colorScheme="teal" 
                        size="sm" 
                        borderRadius="full"
                      />
                    </Box>
                    <Box flex="1">
                      <HStack justify="space-between" mb={1}>
                        <Text fontSize="sm" color={subtitleColor}>Overall Progress</Text>
                        <Text fontSize="sm" color={textColor} fontWeight="medium">
                          {Math.round(dailyWorkout.primaryWorkout?.progress?.overallProgress || 0)}%
                        </Text>
                      </HStack>
                      <Progress 
                        value={dailyWorkout.primaryWorkout?.progress?.overallProgress || 0} 
                        colorScheme="green" 
                        size="sm" 
                        borderRadius="full"
                      />
                    </Box>
                  </HStack>

                  {/* Workout Details */}
                  {dailyWorkout.primaryWorkout?.dailyResult?.dailyWorkout?.exercises && (
                    <Card 
                      bg={cardBg} 
                      borderColor={borderColor} 
                      borderWidth="1px"
                      boxShadow="sm"
                    >
                      <CardBody p={4}>
                        <VStack spacing={4} align="stretch">
                          {/* Header with exercise count */}
                          <HStack justify="space-between" align="center">
                            <VStack align="start" spacing={1}>
                              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                                {getExerciseCountText(dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises)}
                              </Text>
                              <Text fontSize="sm" color={subtitleColor}>
                                From: {dailyWorkout.primaryWorkout?.monthlyPlan?.name}
                              </Text>
                            </VStack>
                            <Button
                              size="sm"
                              colorScheme="teal"
                              leftIcon={<Icon as={FaRunning} />}
                              onClick={() => {
                                // Create a workout-like object to pass to existing handler
                                const workoutObj = {
                                  id: `daily-${dailyWorkout.primaryWorkout?.weeklyWorkout?.id || 'unknown'}`,
                                  name: `${getDayName()}'s Training`,
                                  exercises: dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises,
                                  description: dailyWorkout.primaryWorkout.description,
                                  type: 'Daily Training',
                                  duration: dailyWorkout.primaryWorkout?.weeklyWorkout?.duration || '45 mins'
                                };
                                handleStartWorkout(workoutObj);
                              }}
                            >
                              Start Training
                            </Button>
                          </HStack>

                          {/* Exercise List Preview */}
                          <VStack spacing={2} align="stretch">
                            <Text fontSize="sm" fontWeight="medium" color={textColor}>
                              Today's Exercises:
                            </Text>
                            <VStack spacing={1} align="stretch" maxH="120px" overflowY="auto">
                              {dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises.slice(0, 4).map((exercise: any, index: number) => (
                                <HStack key={index} spacing={3} p={2} bg={exerciseBg} borderRadius="md">
                                  <Badge 
                                    colorScheme="teal" 
                                    variant="solid" 
                                    fontSize="xs" 
                                    minW="20px" 
                                    textAlign="center"
                                    borderRadius="full"
                                  >
                                    {index + 1}
                                  </Badge>
                                  <Text fontSize="sm" color={textColor} flex="1">
                                    {exercise.name || 'Exercise'}
                                  </Text>
                                  {exercise.sets && exercise.reps && (
                                    <Text fontSize="xs" color={subtitleColor}>
                                      {exercise.sets} × {exercise.reps}
                                    </Text>
                                  )}
                                  {exercise.distance && (
                                    <Text fontSize="xs" color={subtitleColor}>
                                      {exercise.distance}
                                    </Text>
                                  )}
                                </HStack>
                              ))}
                              {dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises.length > 4 && (
                                <Text fontSize="xs" color={subtitleColor} textAlign="center" fontStyle="italic">
                                  +{dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises.length - 4} more exercises
                                </Text>
                              )}
                            </VStack>
                          </VStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  )}
                </VStack>
              </Box>
            ) : dailyWorkout?.message ? (
              <Box bg={emptyStateBg} p={4} borderRadius="lg" textAlign="center">
                <HStack justify="center" spacing={3} mb={2}>
                  <Icon as={dailyWorkout.message.includes('Rest') ? FaBed : FaCalendarAlt} 
                        color={subtitleColor} boxSize={5} />
                  <Text fontSize="md" fontWeight="medium" color={textColor}>
                    {dailyWorkout.message}
                  </Text>
                </HStack>
                {dailyWorkout.message.includes('Rest') && (
                  <Text fontSize="sm" color={subtitleColor}>
                    Recovery is an important part of training!
                  </Text>
                )}
              </Box>
            ) : null}
            
            {/* Divider between daily workout and regular workouts */}
            {(dailyWorkout?.hasWorkout || dailyWorkout?.message) && (todayWorkouts.length > 0 || upcomingWorkouts.length > 0) && (
              <Divider />
            )}
          </Box>
        )}

        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaRunning} boxSize={6} color="green.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {profile?.role === 'athlete' && (dailyWorkout?.hasWorkout || dailyWorkout?.message) 
                  ? "Additional Workouts" 
                  : "Today's Workouts"
                }
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
              {todayWorkoutsToShow.map((workout, idx) => (
                <WorkoutCard
                  key={workout.id || idx}
                  workout={workout}
                  isCoach={profile?.role === 'coach'}
                  progress={getWorkoutProgressData(workout)}
                  onStart={() => handleStartWorkout(workout)}
                  onReset={handleResetProgress ? () => handleResetProgress(workout.id, workout.name) : undefined}
                />
              ))}
            </SimpleGrid>
          </Box>
        ) : (
          <Box
            bg={emptyStateBg}
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
                {showAllUpcomingWorkouts ? upcomingWorkouts.length : Math.min(upcomingWorkouts.length, INITIAL_WORKOUT_COUNT)} of {upcomingWorkouts.length}
              </Badge>
            </HStack>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {upcomingWorkoutsToShow.map((workout, idx) => (
                <WorkoutCard
                  key={workout.id || idx}
                  workout={workout}
                  isCoach={profile?.role === 'coach'}
                  progress={getWorkoutProgressData(workout)}
                  onStart={() => handleStartWorkout(workout)}
                  onReset={handleResetProgress ? () => handleResetProgress(workout.id, workout.name) : undefined}
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
          <HStack spacing={3} justify="center" flexWrap="wrap">
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

            {/* Load More Today's Workouts Button */}
            {todayWorkouts.length > INITIAL_WORKOUT_COUNT && (
              <Button
                variant="outline"
                colorScheme="blue"
                size="sm"
                leftIcon={<Icon as={FaPlus} />}
                onClick={() => setShowAllTodayWorkouts(!showAllTodayWorkouts)}
              >
                {showAllTodayWorkouts ? 'Show Less' : `Load More Today (${todayWorkouts.length - INITIAL_WORKOUT_COUNT})`}
              </Button>
            )}

            {/* Load More Upcoming Workouts Button */}
            {upcomingWorkouts.length > INITIAL_WORKOUT_COUNT && (
              <Button
                variant="outline"
                colorScheme="orange"
                size="sm"
                leftIcon={<Icon as={FaPlus} />}
                onClick={() => setShowAllUpcomingWorkouts(!showAllUpcomingWorkouts)}
              >
                {showAllUpcomingWorkouts ? 'Show Less' : `Load More Upcoming (${upcomingWorkouts.length - INITIAL_WORKOUT_COUNT})`}
              </Button>
            )}
            
            {profile?.role === 'coach' && (
              <Button
                as={RouterLink}
                to="/coach/workouts"
                variant="outline"
                colorScheme="purple"
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