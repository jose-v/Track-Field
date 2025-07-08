import React, { useState, useEffect, useMemo } from 'react';
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
import { FaRunning, FaCalendarAlt, FaArrowRight, FaClock, FaFire, FaCheck, FaBed, FaPlus, FaDumbbell } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { WorkoutCard } from './WorkoutCard';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useWorkoutStore } from '../lib/workoutStore';
import { getMonthlyPlanCompletionFromDB } from '../utils/monthlyPlanWorkoutHelper';
import { syncRegularWorkoutCompletionFromDB } from '../utils/regularWorkoutHelper';

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

  // Force re-render when workout store changes - memoize the workout ID to prevent infinite loops
  const todaysWorkoutId = React.useMemo(() => {
    if (!dailyWorkout?.primaryWorkout?.weeklyWorkout?.id) return 'fallback';
    return `daily-${dailyWorkout.primaryWorkout.weeklyWorkout.id}`;
  }, [dailyWorkout?.primaryWorkout?.weeklyWorkout?.id]);

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
        const workoutData = await api.monthlyPlanAssignments.getTodaysWorkout(user.id);
        
        // If the API returns no workout data, set to null (don't create fake workout)
        if (!workoutData || !workoutData.hasWorkout) {
          console.log('🔍 No workout data returned, athlete has no assignments for today');
          setDailyWorkout(null);
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
          console.log('🔍 API error, no fallback workout - athlete should see no assignments');
          setDailyWorkoutError('Unable to load workout assignments. Please check with your coach.');
          setDailyWorkout(null);
        }
      } finally {
        setDailyWorkoutLoading(false);
      }
    };

    getTodaysWorkout();
  }, [user?.id, profile?.role, profileLoading]);

  // Initialize workout progress when daily workout is loaded and sync with database
  useEffect(() => {
    const syncCompletionWithDatabase = async () => {
      if (dailyWorkout?.hasWorkout && dailyWorkout.primaryWorkout?.exercises && user?.id) {
        const workoutId = getTodaysWorkoutId();
        const todaysExercises = getTodaysExercises(dailyWorkout.primaryWorkout.exercises);
        
        // Initialize progress if it doesn't exist
        if (!getProgress(workoutId) && todaysExercises.length > 0) {
          updateProgress(workoutId, 0, todaysExercises.length);
        }
        
        // Load completion status from database (source of truth)
        try {
          const completedExercisesFromDB = await getMonthlyPlanCompletionFromDB(user.id);
          console.log('🔍 [TodayWorkoutsCard] Loaded completion from DB:', completedExercisesFromDB);
          
          // Sync database completion status to local store
          if (completedExercisesFromDB.length > 0) {
            console.log('🔍 [TodayWorkoutsCard] Syncing DB completion to local store');
            completedExercisesFromDB.forEach(exerciseIdx => {
              storeMarkCompleted(workoutId, exerciseIdx);
            });
            updateProgress(
              workoutId, 
              completedExercisesFromDB.length, 
              todaysExercises.length,
              completedExercisesFromDB.length >= todaysExercises.length
            );
          }
        } catch (error) {
          console.error('🔥 [TodayWorkoutsCard] Error loading completion from DB:', error);
        }
      }
    };
    
    syncCompletionWithDatabase();
  }, [dailyWorkout?.hasWorkout, dailyWorkout?.primaryWorkout?.weeklyWorkout?.id, user?.id]);

  // Sync regular workouts with database
  useEffect(() => {
    const syncRegularWorkoutsWithDatabase = async () => {
      if (!user?.id) return;
      
      // Sync all today's workouts and upcoming workouts
      const allWorkouts = [...todayWorkouts, ...upcomingWorkouts];
      
      for (const workout of allWorkouts) {
        if (workout.id && !workout.id.startsWith('daily-')) {
          // Get exercise count for this workout
          const exerciseCount = workout.exercises ? workout.exercises.length : 0;
          
          // Sync completion from database
          try {
            await syncRegularWorkoutCompletionFromDB(
              user.id, 
              workout.id, 
              { getProgress, markExerciseCompleted: storeMarkCompleted, updateProgress }, 
              exerciseCount
            );
            console.log(`✅ [TodayWorkoutsCard] Synced regular workout ${workout.id} with database`);
          } catch (error) {
            console.error(`🔥 [TodayWorkoutsCard] Error syncing regular workout ${workout.id}:`, error);
          }
        }
      }
    };
    
    syncRegularWorkoutsWithDatabase();
  }, [todayWorkouts, upcomingWorkouts, user?.id]);

  // Helper function to format exercise count
  const getExerciseCountText = (exercises: any[]) => {
    if (!exercises || exercises.length === 0) return 'No exercises';
    
    // For the main display, we want to show today's exercise count
    const todaysExercises = getTodaysExercises(exercises);
    return todaysExercises.length === 1 ? '1 exercise' : `${todaysExercises.length} exercises`;
  };

  // Helper function to get workout ID for today's workout (memoized)
  const getTodaysWorkoutId = React.useCallback(() => {
    return todaysWorkoutId;
  }, [todaysWorkoutId]);

  // Helper function to get completed exercises count from workout store (memoized)
  const getCompletedExercisesCount = React.useCallback(() => {
    const progress = getProgress(todaysWorkoutId);
    const count = progress?.completedExercises?.length || 0;
    return count;
  }, [todaysWorkoutId, getProgress]);

  // Helper function to safely calculate today's progress percentage
  const getTodaysProgressPercentage = React.useCallback((todaysExercises: any[]) => {
    if (!todaysExercises || todaysExercises.length === 0) return 0;
    
    const completedCount = getCompletedExercisesCount();
    const totalCount = todaysExercises.length;
    
    // Ensure we don't exceed 100% and handle edge cases
    const percentage = Math.min(100, Math.max(0, (completedCount / totalCount) * 100));
    return Math.round(percentage);
  }, [getCompletedExercisesCount]);

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

  // Filter exercises to get only today's exercises
  const getTodaysExercises = (exercises: any[]) => {
    if (!exercises || exercises.length === 0) return [];
    
    // For weekly workout structure, exercises are already for the whole week
    // We'll need to create a daily structure from the weekly exercises
    // For now, return all exercises as today's workout
    return exercises;
  };

  // Helper function to get day name
  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  // Get weekly overview for display - use actual weekly data if available (memoized)
  const getWeeklyOverview = useMemo(() => {
    const exercises = dailyWorkout?.primaryWorkout?.exercises || dailyWorkout?.primaryWorkout?.dailyResult?.dailyWorkout?.exercises || [];
    
    if (!exercises || exercises.length === 0) return [];
    
    const todayName = getDayName().toLowerCase();
    
    // Check if we have the original weekly structure from the API
    const weeklyData = dailyWorkout?.primaryWorkout?.dailyResult?.originalWeeklyData || 
                      dailyWorkout?.primaryWorkout?.weeklyData;
    
    if (weeklyData && Array.isArray(weeklyData) && weeklyData[0]?.day) {
      // Use the actual weekly structure
      return weeklyData.map(dayData => ({
        day: dayData.day,
        exerciseCount: dayData.isRestDay ? 0 : (dayData.exercises?.length || 0),
        isRestDay: dayData.isRestDay || false,
        isToday: dayData.day?.toLowerCase() === todayName
      }));
    }
    
    // Fallback: create a stable 7-day structure (no random values)
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return daysOfWeek.map((day, index) => {
      // Use today's exercise count for today, and a stable pattern for other days
      let exerciseCount;
      if (day === todayName) {
        exerciseCount = exercises.length;
      } else {
        // Use a stable pattern based on day index instead of random
        const baseCount = Math.max(1, exercises.length || 3);
        exerciseCount = Math.max(1, baseCount + (index % 3) - 1); // Varies between baseCount-1 to baseCount+1
      }
      
      const isRestDay = day === 'sunday';
      
      return {
        day: day,
        exerciseCount: isRestDay ? 0 : exerciseCount,
        isRestDay,
        isToday: day === todayName
      };
    });
  }, [dailyWorkout?.primaryWorkout]);

  // Calculate total weekly exercises - simplified and more robust
  const getTotalWeeklyExercises = (exercises: any[]) => {
    if (!exercises || exercises.length === 0) return 0;
    
    // Check if exercises have a weekly structure (with .day property)
    const hasWeeklyStructure = exercises.some(ex => ex.day);
    
    if (hasWeeklyStructure) {
    return exercises
      .filter(exercise => exercise.day && !exercise.isRestDay)
      .reduce((total, dayExercise) => {
        return total + (dayExercise.exercises ? dayExercise.exercises.length : 0);
      }, 0);
    } else {
      // If no weekly structure, assume exercises are for today only
      // Estimate weekly total as 7x today's exercises (simple approximation)
      return exercises.length * 5; // 5 workout days per week
    }
  };

  // Calculate weekly progress based on completed exercises - simplified and safer
  const getWeeklyProgress = (exercises: any[]) => {
    if (!exercises || exercises.length === 0) return 0;
    
    const totalWeeklyExercises = getTotalWeeklyExercises(exercises);
    if (totalWeeklyExercises === 0) return 0;
    
    const completedToday = getCompletedExercisesCount();
    
    // Simple calculation: today's completed exercises as a fraction of weekly total
    const weeklyProgressPercentage = Math.min(100, Math.max(0, (completedToday / totalWeeklyExercises) * 100));
    
    return Math.round(weeklyProgressPercentage);
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

  // Filter tomorrow's workouts for preview
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const tomorrowWorkouts = upcomingWorkouts.filter(workout => {
    if (!workout.date) return false;
    const workoutDate = new Date(workout.date).toISOString().split('T')[0];
    return workoutDate === getTomorrowDate();
  });

  // Get tomorrow's workout from monthly plan
  const getTomorrowFromMonthlyPlan = () => {
    if (!dailyWorkout?.primaryWorkout) return null;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][tomorrow.getDay()];
    
    // Check multiple possible locations for weekly data
    const weeklyData = 
      dailyWorkout.primaryWorkout.weeklyData || 
      dailyWorkout.primaryWorkout.dailyResult?.originalWeeklyData ||
      dailyWorkout.primaryWorkout.exercises; // exercises might contain weekly data
    
    if (!weeklyData || !Array.isArray(weeklyData)) return null;
    
    const tomorrowData = weeklyData.find((dayData: any) => dayData.day?.toLowerCase() === tomorrowDayName);
    
    if (!tomorrowData) return null;
    
    return {
      name: `${tomorrowDayName.charAt(0).toUpperCase() + tomorrowDayName.slice(1)} Training`,
      exercises: tomorrowData.exercises || [],
      isRestDay: tomorrowData.isRestDay || false,
      source: 'monthly-plan',
      planName: dailyWorkout.primaryWorkout?.monthlyPlan?.name || 'Training Plan',
      weekName: dailyWorkout.primaryWorkout?.weeklyWorkout?.name || `Week ${dailyWorkout.primaryWorkout?.week || ''}`,
    };
  };

  const tomorrowFromMonthlyPlan = getTomorrowFromMonthlyPlan();

  // Helper function to analyze workout type and generate preview
  const getWorkoutPreview = (workout: any) => {
    const exercises = workout.exercises || [];
    const exerciseCount = exercises.length;
    
    // Determine workout type based on exercises
    let workoutType = 'Mixed Training';
    let icon = FaRunning;
    let colorScheme = 'blue';
    
    if (exercises.length === 0) {
      workoutType = 'Rest Day';
      icon = FaBed;
      colorScheme = 'purple';
    } else {
      // Analyze exercise types
      const exerciseNames = exercises.map(ex => ex.name?.toLowerCase() || '').join(' ');
      
      if (exerciseNames.includes('run') || exerciseNames.includes('sprint') || exerciseNames.includes('jog')) {
        workoutType = 'Running Session';
        icon = FaRunning;
        colorScheme = 'green';
             } else if (exerciseNames.includes('strength') || exerciseNames.includes('lift') || exerciseNames.includes('weight')) {
         workoutType = 'Strength Training';
         icon = FaDumbbell;
         colorScheme = 'orange';
      } else if (exerciseNames.includes('recovery') || exerciseNames.includes('stretch') || exerciseNames.includes('mobility')) {
        workoutType = 'Recovery Session';
        icon = FaBed;
        colorScheme = 'purple';
      }
    }
    
    return {
      type: workoutType,
      icon,
      colorScheme,
      exerciseCount,
      duration: workout.duration || 'TBD',
      time: workout.time || 'Any time',
      location: workout.location || 'Not specified',
      intensity: exercises.length > 5 ? 'High' : exercises.length > 2 ? 'Medium' : 'Light'
    };
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
              <Box 
                bg={{ base: "transparent", md: dailyWorkoutBg }} 
                p={{ base: 2, md: 4 }} 
                borderRadius={{ base: "none", md: "lg" }} 
                border={{ base: "none", md: "1px solid" }} 
                borderColor={{ base: "transparent", md: dailyWorkoutBorder }}
              >
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
                          {/* Smart icon based on workout type */}
                          <Icon 
                            as={
                              dailyWorkout.primaryWorkout?.dailyResult?.isNoTrainingToday ? FaCalendarAlt :
                              dailyWorkout.primaryWorkout?.dailyResult?.isRestDay ? FaBed :
                              dailyWorkout.primaryWorkout?.dailyResult?.isPreview ? FaClock :
                              FaFire
                            } 
                            color={
                              dailyWorkout.primaryWorkout?.dailyResult?.isNoTrainingToday ? "gray.500" :
                              dailyWorkout.primaryWorkout?.dailyResult?.isRestDay ? "purple.500" :
                              dailyWorkout.primaryWorkout?.dailyResult?.isPreview ? "orange.500" :
                              "teal.500"
                            } 
                            boxSize={5} 
                          />
                          <Text fontSize="lg" fontWeight="bold" color={textColor}>
                            {dailyWorkout.primaryWorkout?.title || "Today's Training Plan"}
                          </Text>
                          {/* Show appropriate status badge */}
                          {dailyWorkout.primaryWorkout?.dailyResult?.isNoTrainingToday && (
                            <Badge colorScheme="gray" variant="solid" fontSize="xs">
                              No Training
                            </Badge>
                          )}
                          {dailyWorkout.primaryWorkout?.dailyResult?.isPreview && (
                            <Badge colorScheme="orange" variant="solid" fontSize="xs">
                              Preview
                            </Badge>
                          )}
                          {dailyWorkout.primaryWorkout?.dailyResult?.isRestDay && (
                            <Badge colorScheme="purple" variant="solid" fontSize="xs">
                              Rest Day
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="sm" color={subtitleColor}>
                          {dailyWorkout.primaryWorkout?.description}
                        </Text>
                        {/* Add Monthly Plan and Weekly Workout Names */}
                        <Flex 
                          direction="row" 
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
                    </VStack>
                  </Flex>

                  {/* Progress - Stack vertically on mobile */}
                  <Flex 
                    direction={{ base: "column", md: "row" }} 
                    gap={4}
                  >
                    <Box flex="1">
                      <HStack justify="space-between" mb={1}>
                        <Text fontSize="sm" color={subtitleColor}>
                          {dailyWorkout.primaryWorkout?.dailyResult?.isNoTrainingToday ? "No Training" :
                           dailyWorkout.primaryWorkout?.dailyResult?.isRestDay ? "Rest Day" : 
                           "Today's Progress"}
                        </Text>
                        <Text fontSize="sm" color={textColor} fontWeight="medium">
                          {(() => {
                            if (dailyWorkout.primaryWorkout?.dailyResult?.isNoTrainingToday) {
                              return "N/A";
                            }
                            if (dailyWorkout.primaryWorkout?.dailyResult?.isRestDay) {
                              return "Complete";
                            }
                            const todaysExercises = dailyWorkout.primaryWorkout?.exercises || dailyWorkout.primaryWorkout?.dailyResult?.dailyWorkout?.exercises || [];
                            const progress = getTodaysProgressPercentage(todaysExercises);
                            return `${progress}%`;
                          })()}
                        </Text>
                      </HStack>
                      <Progress 
                        value={(() => {
                          if (dailyWorkout.primaryWorkout?.dailyResult?.isNoTrainingToday) {
                            return 0; // No training scheduled
                          }
                          if (dailyWorkout.primaryWorkout?.dailyResult?.isRestDay) {
                            return 100; // Rest days are always "complete"
                          }
                          const todaysExercises = dailyWorkout.primaryWorkout?.exercises || dailyWorkout.primaryWorkout?.dailyResult?.dailyWorkout?.exercises || [];
                          return getTodaysProgressPercentage(todaysExercises);
                        })()} 
                        colorScheme={
                          dailyWorkout.primaryWorkout?.dailyResult?.isNoTrainingToday ? "gray" :
                          dailyWorkout.primaryWorkout?.dailyResult?.isRestDay ? "purple" : 
                          "teal"
                        } 
                        size="sm" 
                        borderRadius="full"
                      />
                    </Box>
                    <Box flex="1">
                      <HStack justify="space-between" mb={1}>
                        <Text fontSize="sm" color={subtitleColor}>Weekly Progress</Text>
                        <Text fontSize="sm" color={textColor} fontWeight="medium">
                          {getWeeklyProgress(dailyWorkout.primaryWorkout?.exercises || dailyWorkout.primaryWorkout?.dailyResult?.dailyWorkout?.exercises || [])}%
                        </Text>
                      </HStack>
                      <Progress 
                        value={getWeeklyProgress(dailyWorkout.primaryWorkout?.exercises || dailyWorkout.primaryWorkout?.dailyResult?.dailyWorkout?.exercises || [])} 
                        colorScheme="green" 
                        size="sm" 
                        borderRadius="full"
                      />
                    </Box>
                  </Flex>

                  {/* Workout Details */}
                  {(dailyWorkout.primaryWorkout?.exercises || dailyWorkout.primaryWorkout?.dailyResult?.dailyWorkout?.exercises) && (
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
                                {getExerciseCountText(dailyWorkout.primaryWorkout?.exercises || dailyWorkout.primaryWorkout?.dailyResult?.dailyWorkout?.exercises || [])}
                              </Text>
                              <Badge 
                                colorScheme={(() => {
                                  const todaysExercises = dailyWorkout.primaryWorkout?.exercises || dailyWorkout.primaryWorkout?.dailyResult?.dailyWorkout?.exercises || [];
                                  const completedCount = Math.min(getCompletedExercisesCount(), todaysExercises.length);
                                  return completedCount === todaysExercises.length ? "green" : "orange";
                                })()} 
                                variant="outline" 
                                fontSize="xs"
                              >
                                {(() => {
                                  const todaysExercises = dailyWorkout.primaryWorkout?.exercises || dailyWorkout.primaryWorkout?.dailyResult?.dailyWorkout?.exercises || [];
                                  const completedCount = Math.min(getCompletedExercisesCount(), todaysExercises.length);
                                  return `${completedCount}/${todaysExercises.length} Done`;
                                })()}
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color={subtitleColor}>
                              From: {dailyWorkout.primaryWorkout?.monthlyPlan?.name}
                            </Text>
                          </VStack>
                        </Flex>

                        {/* Responsive Start Training Button - Full width on mobile, regular on desktop */}
                        <Flex justify={{ base: "stretch", md: "flex-end" }}>
                          <Button
                          size={{ base: "md", md: "sm" }}
                          width={{ base: "100%", md: "auto" }}
                          colorScheme={
                            dailyWorkout.primaryWorkout?.dailyResult?.isNoTrainingToday ? "gray" :
                            dailyWorkout.primaryWorkout?.dailyResult?.isRestDay ? "purple" :
                            dailyWorkout.primaryWorkout?.dailyResult?.isPreview ? "orange" :
                            "teal"
                          }
                          variant={
                            (dailyWorkout.primaryWorkout?.dailyResult?.isNoTrainingToday || 
                             dailyWorkout.primaryWorkout?.dailyResult?.isRestDay) ? "outline" : "solid"
                          }
                          leftIcon={
                            <Icon as={
                              dailyWorkout.primaryWorkout?.dailyResult?.isNoTrainingToday ? FaCalendarAlt :
                              dailyWorkout.primaryWorkout?.dailyResult?.isRestDay ? FaBed :
                              dailyWorkout.primaryWorkout?.dailyResult?.isPreview ? FaClock :
                              FaRunning
                            } />
                          }
                          isDisabled={
                            dailyWorkout.primaryWorkout?.dailyResult?.isNoTrainingToday ||
                            dailyWorkout.primaryWorkout?.dailyResult?.isRestDay
                          }
                          onClick={() => {
                            if (dailyWorkout.primaryWorkout?.dailyResult?.isRestDay || 
                                dailyWorkout.primaryWorkout?.dailyResult?.isNoTrainingToday) return;
                            
                            // Get today's exercises for the modal
                            const todaysExercises = dailyWorkout.primaryWorkout?.exercises || dailyWorkout.primaryWorkout?.dailyResult?.dailyWorkout?.exercises || [];
                            
                            // Create a workout-like object to pass to existing handler
                            const workoutObj = {
                              id: `daily-${dailyWorkout.primaryWorkout?.weeklyWorkout?.id || 'unknown'}`,
                              name: dailyWorkout.primaryWorkout?.title || `${getDayName()}'s Training`,
                              exercises: todaysExercises,
                              description: dailyWorkout.primaryWorkout?.description || 'Your training session for today',
                              type: 'Daily Training',
                              duration: '45 mins'
                            };
                            console.log('🔍 Starting workout with data:', workoutObj);
                            handleStartWorkout(workoutObj);
                          }}
                        >
                          {dailyWorkout.primaryWorkout?.dailyResult?.isNoTrainingToday ? "No Training Today" :
                           dailyWorkout.primaryWorkout?.dailyResult?.isRestDay ? "Rest Day" :
                           dailyWorkout.primaryWorkout?.dailyResult?.isPreview ? "Preview Tomorrow" :
                           "Start Training"}
                          </Button>
                        </Flex>

                        {/* Two Column Layout: Today's Exercises + Weekly Overview - Stack on mobile, side by side on desktop */}
                        <Flex 
                          direction={{ base: "column", lg: "row" }} 
                          gap={4} 
                          align="start"
                        >
                          {/* Today's Exercises */}
                          <VStack spacing={2} align="stretch" flex={{ base: "1", lg: "2" }} w="100%">
                            <Text fontSize="sm" fontWeight="medium" color={textColor}>
                              Today's Exercises:
                            </Text>
                            <VStack spacing={1} align="stretch" maxH="200px" overflowY="auto">
                              {(() => {
                                const todaysExercises = dailyWorkout.primaryWorkout?.exercises || dailyWorkout.primaryWorkout?.dailyResult?.dailyWorkout?.exercises || [];
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

                          {/* Weekly Overview - Side by side on desktop, full width on mobile */}
                          <VStack spacing={2} align="stretch" flex="1" w={{ base: "100%", lg: "auto" }}>
                            <Text fontSize="sm" fontWeight="medium" color={textColor}>
                              This Week:
                            </Text>
                            <VStack spacing={1} align="stretch">
                              {getWeeklyOverview.map((dayInfo, index) => (
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

        {/* Tomorrow's Preview */}
        {(tomorrowWorkouts.length > 0 || tomorrowFromMonthlyPlan) && (
          <Box>
                         <HStack justify="space-between" align="center" mb={4}>
               <HStack spacing={2}>
                 <Icon as={FaArrowRight} color="blue.500" fontSize="lg" />
                 <Text fontSize="lg" fontWeight="bold" color={textColor}>
                   Tomorrow's Preview
                 </Text>
               </HStack>
               <Badge 
                 colorScheme="blue" 
                 variant="outline" 
                 fontSize="xs"
                 px={2}
                 py={1}
               >
                 {(tomorrowWorkouts.length + (tomorrowFromMonthlyPlan ? 1 : 0))} workout{(tomorrowWorkouts.length + (tomorrowFromMonthlyPlan ? 1 : 0)) !== 1 ? 's' : ''}
               </Badge>
            </HStack>
            
                         <VStack spacing={3} align="stretch">
               {/* Tomorrow from Monthly Plan */}
               {tomorrowFromMonthlyPlan && (
                 <Box
                   bg={exerciseBg}
                   border="1px solid"
                   borderColor={borderColor}
                   borderRadius="lg"
                   p={4}
                 >
                   <HStack justify="space-between" align="start" spacing={4}>
                     <HStack spacing={3} flex="1">
                       <Icon 
                         as={tomorrowFromMonthlyPlan.isRestDay ? FaBed : FaRunning} 
                         color={tomorrowFromMonthlyPlan.isRestDay ? "purple.500" : "green.500"} 
                         boxSize={5} 
                       />
                       <VStack align="start" spacing={1} flex="1">
                         <HStack spacing={2} wrap="wrap">
                           <Text fontSize="md" fontWeight="semibold" color={textColor}>
                             {tomorrowFromMonthlyPlan.name}
                           </Text>
                           <Badge 
                             colorScheme={tomorrowFromMonthlyPlan.isRestDay ? "purple" : "green"} 
                             variant="solid" 
                             fontSize="xs"
                           >
                             {tomorrowFromMonthlyPlan.isRestDay ? "Rest Day" : "Training Day"}
                           </Badge>
                         </HStack>
                         <Text fontSize="sm" color={subtitleColor}>
                           {tomorrowFromMonthlyPlan.isRestDay 
                             ? "Scheduled rest and recovery day" 
                             : `${tomorrowFromMonthlyPlan.exercises.length} exercise${tomorrowFromMonthlyPlan.exercises.length !== 1 ? 's' : ''} planned`
                           }
                         </Text>
                         <Text fontSize="xs" color={subtitleColor}>
                           From: {tomorrowFromMonthlyPlan.planName} • {tomorrowFromMonthlyPlan.weekName}
                         </Text>
                       </VStack>
                     </HStack>
                     <VStack spacing={1} align="end" minW="80px">
                       <Badge colorScheme="teal" variant="outline" fontSize="xs">
                         Monthly Plan
                       </Badge>
                     </VStack>
                   </HStack>
                 </Box>
               )}
               
               {/* Tomorrow from Regular Workouts */}
               {tomorrowWorkouts.map((workout, idx) => {
                const preview = getWorkoutPreview(workout);
                return (
                                     <Box
                     key={workout.id || idx}
                     bg={exerciseBg}
                     border="1px solid"
                     borderColor={borderColor}
                     borderRadius="lg"
                     p={4}
                   >
                    <HStack justify="space-between" align="start" spacing={4}>
                      <HStack spacing={3} flex="1">
                        <Icon as={preview.icon} color={`${preview.colorScheme}.500`} boxSize={5} />
                        <VStack align="start" spacing={1} flex="1">
                          <HStack spacing={2} wrap="wrap">
                            <Text fontSize="md" fontWeight="semibold" color={textColor}>
                              {workout.name}
                            </Text>
                            <Badge colorScheme={preview.colorScheme} variant="solid" fontSize="xs">
                              {preview.type}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color={subtitleColor}>
                            {preview.exerciseCount} exercise{preview.exerciseCount !== 1 ? 's' : ''} • {preview.duration} • {preview.intensity} intensity
                          </Text>
                        </VStack>
                      </HStack>
                      <VStack spacing={1} align="end" minW="100px">
                        <HStack spacing={1}>
                          <Icon as={FaClock} color={subtitleColor} fontSize="xs" />
                          <Text fontSize="xs" color={subtitleColor}>
                            {preview.time}
                          </Text>
                        </HStack>
                        {preview.location !== 'Not specified' && (
                          <Text fontSize="xs" color={subtitleColor}>
                            📍 {preview.location}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
            
            <Text fontSize="xs" color={subtitleColor} textAlign="center" mt={2}>
              💡 Prepare your gear and plan ahead for tomorrow's training
            </Text>
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