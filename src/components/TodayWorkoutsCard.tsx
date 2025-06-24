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
import { useWorkoutStore } from '../lib/workoutStore';

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
  
  // Workout store for shared completion state
  const { 
    getProgress, 
    isExerciseCompleted, 
    markExerciseCompleted: storeMarkCompleted, 
    updateProgress 
  } = useWorkoutStore();
  
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
  
  // Today's day highlighting colors
  const todayBg = useColorModeValue('teal.50', 'teal.800');
  const todayBorder = useColorModeValue('teal.200', 'teal.600');
  const todayTextColor = useColorModeValue('teal.800', 'teal.100');
  const todaySubtextColor = useColorModeValue('teal.600', 'teal.200');

  // Force re-render when workout store changes
  useEffect(() => {
    const workoutId = getTodaysWorkoutId();
    const progress = getProgress(workoutId);
    // This effect ensures the component re-renders when workout progress changes
  }, [dailyWorkout]);

  // Check conditions before making API call
  useEffect(() => {
    // Enhanced debugging to see what profile data we're getting
    console.log('🔍 TodayWorkoutsCard: Profile check debug:', {
      hasUser: !!user?.id,
      userId: user?.id,
      profileExists: !!profile,
      profileRole: profile?.role,
      profileLoading: profileLoading,
      fullProfile: profile,
      conditionCheck: !user?.id || profile?.role !== 'athlete',
      shouldFetchWorkout: user?.id && profile?.role === 'athlete'
    });

    const getTodaysWorkout = async () => {
      if (!user?.id || profile?.role !== 'athlete') {
        console.log('❌ Skipping daily workout fetch - conditions not met. Details:', {
          hasUser: !!user?.id,
          profileRole: profile?.role,
          isAthlete: profile?.role === 'athlete'
        });
        return;
      }

      console.log('✅ Starting getTodaysWorkout for athlete:', user.id);
      setDailyWorkoutLoading(true);
      setDailyWorkoutError(null);
      
      try {
        console.log('🔍 Calling getTodaysWorkout for athlete:', user.id);
        const workoutData = await api.monthlyPlanAssignments.getTodaysWorkout(user.id);
        console.log('🔍 getTodaysWorkout response:', workoutData);
        
        // If the API returns no workout data, create a fallback
        if (!workoutData || !workoutData.hasWorkout) {
          console.log('🔍 No workout data returned, creating fallback');
          setDailyWorkout({
            hasWorkout: true,
            primaryWorkout: {
              title: 'Today\'s Training Session',
              description: 'Your scheduled training for today',
              exercises: [
                { name: 'Warm-up', sets: 1, reps: '10-15 minutes', weight: null, notes: 'Dynamic stretching and light movement' },
                { name: 'Main workout', sets: 1, reps: 'As assigned by coach', weight: null, notes: 'Complete your planned training session' },
                { name: 'Cool-down', sets: 1, reps: '10 minutes', weight: null, notes: 'Static stretching and recovery' }
              ],
              progress: { completed: false },
              monthlyPlan: { name: 'Current Training Plan', id: 'fallback' },
              weeklyWorkout: { name: 'This Week', id: 'fallback' },
              dailyResult: {
                dailyWorkout: {
                  exercises: [
                    { name: 'Warm-up', sets: 1, reps: '10-15 minutes', notes: 'Dynamic stretching and light movement' },
                    { name: 'Main workout', sets: 1, reps: 'As assigned by coach', notes: 'Complete your planned training session' },
                    { name: 'Cool-down', sets: 1, reps: '10 minutes', notes: 'Static stretching and recovery' }
                  ]
                }
              }
            }
          });
        } else {
          setDailyWorkout(workoutData);
        }
        setDailyWorkoutError(null);
      } catch (err: any) {
        console.error('Error fetching today\'s workout:', err);
        
        // Handle timeout errors gracefully
        if (err.code === '57014' || err.message?.includes('timeout')) {
          setDailyWorkoutError('Service temporarily unavailable. Please try refreshing in a moment.');
          toast({
            title: 'Connection Issue',
            description: 'Having trouble connecting to our servers. Your data is safe and we\'re working to resolve this.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        } else {
          console.log('🔍 API error, setting fallback workout data');
          setDailyWorkoutError(null); // Don't show error, show fallback instead
          
          // Create a fallback workout so athletes always see something
          setDailyWorkout({
            hasWorkout: true,
            primaryWorkout: {
              title: 'Today\'s Training Session',
              description: 'Your scheduled training for today',
              exercises: [
                { name: 'Warm-up', sets: 1, reps: '10-15 minutes', weight: null, notes: 'Dynamic stretching and light movement' },
                { name: 'Main workout', sets: 1, reps: 'As assigned by coach', weight: null, notes: 'Complete your planned training session' },
                { name: 'Cool-down', sets: 1, reps: '10 minutes', weight: null, notes: 'Static stretching and recovery' }
              ],
              progress: { completed: false },
              monthlyPlan: { name: 'Current Training Plan', id: 'fallback' },
              weeklyWorkout: { name: 'This Week', id: 'fallback' },
              dailyResult: {
                dailyWorkout: {
                  exercises: [
                    { name: 'Warm-up', sets: 1, reps: '10-15 minutes', notes: 'Dynamic stretching and light movement' },
                    { name: 'Main workout', sets: 1, reps: 'As assigned by coach', notes: 'Complete your planned training session' },
                    { name: 'Cool-down', sets: 1, reps: '10 minutes', notes: 'Static stretching and recovery' }
                  ]
                }
              }
            }
          });
        }
      } finally {
        setDailyWorkoutLoading(false);
      }
    };

    getTodaysWorkout();
  }, [user?.id, profile?.role, profileLoading, toast]);

  // Initialize workout progress when daily workout is loaded
  useEffect(() => {
    if (dailyWorkout?.hasWorkout && dailyWorkout.primaryWorkout?.exercises) {
      const workoutId = getTodaysWorkoutId();
      const todaysExercises = getTodaysExercises(dailyWorkout.primaryWorkout.exercises);
      
      // Initialize progress if it doesn't exist
      if (!getProgress(workoutId) && todaysExercises.length > 0) {
        updateProgress(workoutId, 0, todaysExercises.length);
      }
    }
  }, [dailyWorkout?.hasWorkout, dailyWorkout?.primaryWorkout?.exercises]);

  // Helper function to format exercise count
  const getExerciseCountText = (exercises: any[]) => {
    if (!exercises || exercises.length === 0) return 'No exercises';
    
    // For the main display, we want to show today's exercise count
    const todaysExercises = getTodaysExercises(exercises);
    return todaysExercises.length === 1 ? '1 exercise' : `${todaysExercises.length} exercises`;
  };

  // Helper function to get workout ID for today's workout
  const getTodaysWorkoutId = () => {
    // Use the same ID format as the workout object passed to the modal
    const workoutId = `daily-${dailyWorkout?.primaryWorkout?.weeklyWorkout?.id || 'unknown'}`;
    return workoutId;
  };

  // Helper function to get completed exercises count from workout store
  const getCompletedExercisesCount = () => {
    const workoutId = getTodaysWorkoutId();
    const progress = getProgress(workoutId);
    const count = progress?.completedExercises?.length || 0;
    return count;
  };

  // Helper function to check if exercise is completed
  const isExerciseCompletedByIndex = (index: number) => {
    const workoutId = getTodaysWorkoutId();
    return isExerciseCompleted(workoutId, index);
  };

  // Helper function to mark exercise as completed (for testing)
  const markExerciseCompleted = (exerciseIndex: number) => {
    const workoutId = getTodaysWorkoutId();
    const todaysExercises = getTodaysExercises(dailyWorkout?.primaryWorkout?.exercises || []);
    
    // Mark exercise as completed - updateProgress will be called if needed
    storeMarkCompleted(workoutId, exerciseIndex);
  };

  // Helper function to reset workout progress (for testing)
  const resetWorkoutProgress = () => {
    const workoutId = getTodaysWorkoutId();
    const { resetProgress } = useWorkoutStore.getState();
    resetProgress(workoutId);
    console.log('Reset workout progress for:', workoutId);
  };

  // Filter exercises to get only today's exercises (Tuesday)
  const getTodaysExercises = (exercises: any[]) => {
    if (!exercises || exercises.length === 0) return [];
    
    // Check if this is a weekly plan structure
    const todayName = getDayName().toLowerCase(); // "tuesday"
    
    // Find today's exercises from the weekly plan
    const todaysDay = exercises.find(exercise => 
      exercise.day && exercise.day.toLowerCase() === todayName
    );
    
    if (todaysDay && todaysDay.exercises && Array.isArray(todaysDay.exercises)) {
      return todaysDay.exercises;
    }
    
    // If not a weekly structure, return all exercises
    return exercises;
  };

  // Get weekly overview for display
  const getWeeklyOverview = (exercises: any[]) => {
    if (!exercises || exercises.length === 0) return [];
    
    return exercises.filter(exercise => exercise.day).map(dayExercise => ({
      day: dayExercise.day,
      exerciseCount: dayExercise.exercises ? dayExercise.exercises.length : 0,
      isRestDay: dayExercise.isRestDay || false,
      isToday: dayExercise.day.toLowerCase() === getDayName().toLowerCase()
    }));
  };

  // Calculate total weekly exercises
  const getTotalWeeklyExercises = (exercises: any[]) => {
    if (!exercises || exercises.length === 0) return 0;
    
    return exercises
      .filter(exercise => exercise.day && !exercise.isRestDay)
      .reduce((total, dayExercise) => {
        return total + (dayExercise.exercises ? dayExercise.exercises.length : 0);
      }, 0);
  };

  // Calculate weekly progress based on completed exercises
  const getWeeklyProgress = (exercises: any[]) => {
    const totalExercises = getTotalWeeklyExercises(exercises);
    if (totalExercises === 0) return 0;
    
    // For now, we'll use today's completed exercises as a proxy
    // In a full implementation, this would track completion across all days
    const todaysExercises = getTodaysExercises(exercises);
    const todaysWeight = todaysExercises.length / totalExercises;
    const todaysProgress = getCompletedExercisesCount() / todaysExercises.length;
    
    return Math.round(todaysProgress * todaysWeight * 100);
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
            {/* Service Status Alert for timeout errors */}
            {dailyWorkoutError?.includes('temporarily unavailable') && (
              <Alert status="warning" borderRadius="lg" mb={4}>
                <AlertIcon />
                <VStack align="start" spacing={1} flex="1">
                  <Text fontSize="sm" fontWeight="medium">
                    Service Connectivity Issue
                  </Text>
                  <Text fontSize="xs" color={subtitleColor}>
                    {dailyWorkoutError} This is a temporary infrastructure issue on our end.
                  </Text>
                </VStack>
              </Alert>
            )}
            
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
                  <Flex 
                    direction={{ base: "column", md: "row" }} 
                    justify="space-between" 
                    align={{ base: "start", md: "center" }}
                    gap={{ base: 3, md: 0 }}
                  >
                    <HStack spacing={3} flex="1">
                      <VStack align="start" spacing={0} flex="1">
                        <HStack spacing={2} align="center">
                          <Icon as={FaFire} color="teal.500" boxSize={5} />
                          <Text fontSize="lg" fontWeight="bold" color={textColor}>
                            Today's Training Plan
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color={subtitleColor}>
                          {dailyWorkout.primaryWorkout?.description}
                        </Text>
                        {/* Add Monthly Plan and Weekly Workout Names */}
                        <Flex 
                          direction={{ base: "column", sm: "row" }} 
                          gap={2} 
                          mt={1}
                          wrap="wrap"
                        >
                          {dailyWorkout.primaryWorkout?.monthlyPlan?.name && (
                            <Badge colorScheme="blue" variant="outline" fontSize="xs" px={2} py={1}>
                              Plan: {dailyWorkout.primaryWorkout.monthlyPlan.name}
                            </Badge>
                          )}
                          {dailyWorkout.primaryWorkout?.weeklyWorkout?.name && (
                            <Badge colorScheme="green" variant="outline" fontSize="xs" px={2} py={1}>
                              Week: {dailyWorkout.primaryWorkout.weeklyWorkout.name}
                            </Badge>
                          )}
                        </Flex>
                      </VStack>
                    </HStack>
                    <VStack spacing={1} align={{ base: "start", md: "end" }}>
                      <Badge colorScheme="teal" variant="solid" fontSize="xs" px={2} py={1}>
                        {getDayName()}
                      </Badge>
                      <Text fontSize="xs" color={subtitleColor}>
                        Week {dailyWorkout.primaryWorkout?.progress?.currentWeek} of {dailyWorkout.primaryWorkout?.progress?.totalWeeks}
                      </Text>
                    </VStack>
                  </Flex>

                  {/* Progress - Stack vertically on mobile */}
                  <Flex 
                    direction={{ base: "column", md: "row" }} 
                    gap={4}
                  >
                    <Box flex="1">
                      <HStack justify="space-between" mb={1}>
                        <Text fontSize="sm" color={subtitleColor}>Today's Progress</Text>
                        <Text fontSize="sm" color={textColor} fontWeight="medium">
                          {(() => {
                            const todaysExercises = getTodaysExercises(dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises);
                            const progress = todaysExercises.length > 0 ? Math.round((getCompletedExercisesCount() / todaysExercises.length) * 100) : 0;
                            return `${progress}%`;
                          })()}
                        </Text>
                      </HStack>
                      <Progress 
                        value={(() => {
                          const todaysExercises = getTodaysExercises(dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises);
                          return todaysExercises.length > 0 ? (getCompletedExercisesCount() / todaysExercises.length) * 100 : 0;
                        })()} 
                        colorScheme="teal" 
                        size="sm" 
                        borderRadius="full"
                      />
                    </Box>
                    <Box flex="1">
                      <HStack justify="space-between" mb={1}>
                        <Text fontSize="sm" color={subtitleColor}>Weekly Progress</Text>
                        <Text fontSize="sm" color={textColor} fontWeight="medium">
                          {getWeeklyProgress(dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises)}%
                        </Text>
                      </HStack>
                      <Progress 
                        value={getWeeklyProgress(dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises)} 
                        colorScheme="green" 
                        size="sm" 
                        borderRadius="full"
                      />
                    </Box>
                  </Flex>

                  {/* Workout Details */}
                  {dailyWorkout.primaryWorkout?.dailyResult?.dailyWorkout?.exercises && (
                    <Box
                      bg={{ base: "transparent", md: cardBg }}
                      borderColor={{ base: "transparent", md: borderColor }}
                      borderWidth={{ base: "0", md: "1px" }}
                      boxShadow={{ base: "none", md: "sm" }}
                      borderRadius={{ base: "none", md: "md" }}
                      p={{ base: 0, md: 4 }}
                    >
                      <VStack spacing={4} align="stretch">
                        {/* Header with exercise count - Stack on mobile */}
                        <Flex 
                          direction={{ base: "column", md: "row" }} 
                          justify="space-between" 
                          align={{ base: "start", md: "center" }}
                          gap={{ base: 3, md: 0 }}
                        >
                          <VStack align="start" spacing={1} flex="1">
                            <HStack spacing={2} flexWrap="wrap">
                              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                                {getExerciseCountText(dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises)}
                              </Text>
                              <Badge 
                                colorScheme={(() => {
                                  const todaysExercises = getTodaysExercises(dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises);
                                  return getCompletedExercisesCount() === todaysExercises.length ? "green" : "orange";
                                })()} 
                                variant="outline" 
                                fontSize="xs"
                              >
                                {(() => {
                                  const todaysExercises = getTodaysExercises(dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises);
                                  return `${getCompletedExercisesCount()}/${todaysExercises.length} Done`;
                                })()}
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color={subtitleColor}>
                              From: {dailyWorkout.primaryWorkout?.monthlyPlan?.name}
                            </Text>
                          </VStack>
                          <Flex 
                            direction={{ base: "row", md: "row" }} 
                            gap={2}
                            flexWrap="wrap"
                            justify={{ base: "start", md: "end" }}
                          >
                            <Button
                              size="sm"
                              colorScheme="teal"
                              leftIcon={<Icon as={FaRunning} />}
                              onClick={() => {
                                // Get only today's exercises for the modal
                                const todaysExercises = getTodaysExercises(dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises);
                                
                                // Create a workout-like object to pass to existing handler
                                const workoutObj = {
                                  id: `daily-${dailyWorkout.primaryWorkout?.weeklyWorkout?.id || 'unknown'}`,
                                  name: `${getDayName()}'s Training`,
                                  exercises: todaysExercises, // Use filtered exercises instead of full weekly plan
                                  description: dailyWorkout.primaryWorkout.description,
                                  type: 'Daily Training',
                                  duration: dailyWorkout.primaryWorkout?.weeklyWorkout?.duration || '45 mins'
                                };
                                handleStartWorkout(workoutObj);
                              }}
                            >
                              Start Training
                            </Button>
                            
                            {/* Test button to simulate completion */}
                            <Button
                              size="sm"
                              colorScheme="green"
                              variant="outline"
                              onClick={() => {
                                // Mark first few exercises as completed for testing
                                const todaysExercises = getTodaysExercises(dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises);
                                const nextExercise = getCompletedExercisesCount();
                                if (nextExercise < todaysExercises.length) {
                                  markExerciseCompleted(nextExercise);
                                }
                              }}
                            >
                              Test Complete
                            </Button>
                            
                            {/* Reset button for testing */}
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              onClick={resetWorkoutProgress}
                            >
                              Reset
                            </Button>
                          </Flex>
                        </Flex>

                        {/* Two Column Layout: Today's Exercises + Weekly Overview - Stack on mobile */}
                        <Flex 
                          direction={{ base: "column", lg: "row" }} 
                          gap={4} 
                          align="start"
                        >
                          {/* Today's Exercises */}
                          <VStack spacing={2} align="stretch" flex={{ base: "1", lg: "2" }}>
                            <Text fontSize="sm" fontWeight="medium" color={textColor}>
                              Today's Exercises:
                            </Text>
                            <VStack spacing={1} align="stretch" maxH="200px" overflowY="auto">
                              {(() => {
                                const todaysExercises = getTodaysExercises(dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises);
                                return todaysExercises.map((exercise: any, index: number) => {
                                  const isCompleted = isExerciseCompletedByIndex(index);
                                  return (
                                    <HStack key={index} spacing={3} p={2} bg={exerciseBg} borderRadius="md" opacity={isCompleted ? 0.7 : 1}>
                                      <Badge 
                                        colorScheme={isCompleted ? "green" : "teal"} 
                                        variant="solid" 
                                        fontSize="xs" 
                                        minW="20px" 
                                        textAlign="center"
                                        borderRadius="full"
                                      >
                                        {isCompleted ? <Icon as={FaCheck} boxSize={2} /> : index + 1}
                                      </Badge>
                                      <Text 
                                        fontSize="sm" 
                                        color={textColor} 
                                        flex="1"
                                        textDecoration={isCompleted ? "line-through" : "none"}
                                      >
                                        {exercise.name || `Exercise ${index + 1}`}
                                      </Text>
                                      <Flex 
                                        direction={{ base: "column", sm: "row" }} 
                                        gap={1}
                                        align={{ base: "end", sm: "center" }}
                                      >
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
                                      </Flex>
                                      {isCompleted && (
                                        <Icon as={FaCheck} color="green.500" boxSize={3} />
                                      )}
                                    </HStack>
                                  );
                                });
                              })()}
                            </VStack>
                          </VStack>

                          {/* Weekly Overview - Full width on mobile */}
                          <VStack spacing={2} align="stretch" flex="1" w={{ base: "100%", lg: "auto" }}>
                            <Text fontSize="sm" fontWeight="medium" color={textColor}>
                              This Week:
                            </Text>
                            <VStack spacing={1} align="stretch">
                              {getWeeklyOverview(dailyWorkout.primaryWorkout.dailyResult.dailyWorkout.exercises).map((dayInfo, index) => (
                                <HStack 
                                  key={index} 
                                  spacing={2} 
                                  p={2} 
                                  bg={dayInfo.isToday ? todayBg : exerciseBg} 
                                  borderRadius="md" 
                                  border={dayInfo.isToday ? '1px solid' : 'none'} 
                                  borderColor={dayInfo.isToday ? todayBorder : 'transparent'}
                                  w="100%"
                                >
                                  <Badge 
                                    colorScheme={dayInfo.isToday ? "teal" : "gray"} 
                                    variant={dayInfo.isToday ? "solid" : "outline"}
                                    fontSize="xs" 
                                    minW="16px"
                                    textAlign="center"
                                    borderRadius="full"
                                  >
                                    {dayInfo.day.charAt(0).toUpperCase()}
                                  </Badge>
                                  <Text 
                                    fontSize="xs" 
                                    color={dayInfo.isToday ? todayTextColor : textColor} 
                                    flex="1"
                                    fontWeight={dayInfo.isToday ? "semibold" : "normal"}
                                  >
                                    {dayInfo.day.charAt(0).toUpperCase() + dayInfo.day.slice(1)}
                                  </Text>
                                  <Text 
                                    fontSize="xs" 
                                    color={dayInfo.isToday ? todaySubtextColor : subtitleColor}
                                    fontWeight={dayInfo.isToday ? "medium" : "normal"}
                                  >
                                    {dayInfo.isRestDay ? 'Rest' : `${dayInfo.exerciseCount} ex`}
                                  </Text>
                                </HStack>
                              ))}
                            </VStack>
                          </VStack>
                        </Flex>
                      </VStack>
                    </Box>
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