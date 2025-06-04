import React, { useState, useEffect, useRef } from 'react'
import {
  Box, Container, Flex, Heading, Text, VStack, Grid, GridItem, Icon, Badge, Card, CardHeader, CardBody, Image, Tag,
  Button, SimpleGrid, Progress, HStack, Stack, Spinner, Divider, Stat, StatLabel, StatNumber, StatHelpText, useToast,
  useColorModeValue, Skeleton, SkeletonText, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, IconButton, useDisclosure, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter
} from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import { dateUtils } from '../utils/date'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useSleepStats, getQualityText } from '../hooks/useSleepRecords'
import { useNutritionStats } from '../hooks/useNutritionRecords'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useWorkouts } from '../hooks/useWorkouts'
import { useScrollDirection } from '../hooks/useScrollDirection'
import { MdPerson, MdOutlineWbSunny, MdKeyboardArrowRight } from 'react-icons/md'
import { FaCalendarAlt, FaRunning, FaBolt, FaMedal, FaListAlt, FaUsers, FaMapMarkerAlt, FaChartLine, FaCloudRain, FaSnowflake, FaSun, FaCloudSun, FaCloudMeatball, FaRegClock, FaPlayCircle, FaRobot } from 'react-icons/fa'
import { CheckIcon } from '@chakra-ui/icons'
import { useWorkoutStore } from '../lib/workoutStore'
import { 
  WeatherCard, 
  SleepStatsCard, 
  NutritionStatsCard, 
  WorkoutCard, 
  TeamCard,
  ProgressBar,
  TrackMeetsCard,
  TodaysCheckInSection,
  AIModal,
  SparkleIcon,
  MobileHeader,
  ExerciseExecutionModal,
  MonthlyPlanAssignments
} from '../components'
import { supabase } from '../lib/supabase'
import TodayWorkoutsCard from '../components/TodayWorkoutsCard'
import usePageClass from '../hooks/usePageClass'
import { api } from '../services/api'

// Function to format date in "Month Day, Year" format
function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A'
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date)
  } catch (e) {
    console.error('Error formatting date:', e)
    return dateStr
  }
}

// Helper to format date string to YYYY-MM-DD for comparison
function formatDateForComparison(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    return dateUtils.localDateString(dateUtils.parseLocalDate(dateStr));
  } catch (e) {
    console.error('Error formatting date for comparison:', e);
    return '';
  }
}

// Function to get meal type text for nutrition records
function getMealTypeText(mealType: string): string {
  switch (mealType?.toLowerCase()) {
    case 'breakfast': return 'Breakfast';
    case 'lunch': return 'Lunch';
    case 'dinner': return 'Dinner';
    case 'snack': return 'Snack';
    default: return 'Meal';
  }
}

// Create a skeleton card component for loading states
const SkeletonCard = ({ 
  height = "330px",
  cardBg,
  borderColor, 
  cardShadow,
  skeletonStartColor,
  skeletonEndColor
}: { 
  height?: string;
  cardBg: string;
  borderColor: string;
  cardShadow: string;
  skeletonStartColor: string;
  skeletonEndColor: string;
}) => (
  <Box
    bg={cardBg}
    borderRadius="xl"
    p={6}
    border="1px solid"
    borderColor={borderColor}
    boxShadow={cardShadow}
    h={height}
  >
    <Skeleton 
      height="80px" 
      borderRadius="lg"
      mb={4}
      startColor={skeletonStartColor}
      endColor={skeletonEndColor}
    />
    <VStack spacing={4} align="stretch">
      <SkeletonText 
        mt="2" 
        noOfLines={1} 
        spacing="2" 
        skeletonHeight="4" 
        width="60%" 
        startColor={skeletonStartColor}
        endColor={skeletonEndColor}
      />
      <VStack spacing={3} align="stretch">
        <Skeleton 
          height="16px" 
          width="100%" 
          borderRadius="md"
          startColor={skeletonStartColor}
          endColor={skeletonEndColor}
        />
        <Skeleton 
          height="16px" 
          width="90%" 
          borderRadius="md"
          startColor={skeletonStartColor}
          endColor={skeletonEndColor}
        />
        <Skeleton 
          height="16px" 
          width="75%" 
          borderRadius="md"
          startColor={skeletonStartColor}
          endColor={skeletonEndColor}
        />
        <Skeleton 
          height="40px" 
          width="120px" 
          borderRadius="lg"
          mx="auto"
          mt={4}
          startColor={skeletonStartColor}
          endColor={skeletonEndColor}
        />
      </VStack>
    </VStack>
  </Box>
);

export function Dashboard() {
  const { user } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile()
  const { workouts, isLoading: workoutsLoading } = useWorkouts()
  const { stats: sleepStats, isLoading: sleepLoading } = useSleepStats()
  const { stats: nutritionStats, isLoading: nutritionLoading } = useNutritionStats()
  const { isHeaderVisible } = useScrollDirection(20)
  const [teamInfo, setTeamInfo] = useState<any>(null)
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  // Default weather data as fallback
  const [weather] = useState({
    temp: '72',
    condition: 'Loading...',
    description: 'Fetching current conditions'
  })
  const navigate = useNavigate()

  // State for reset confirmation modal
  const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();
  const [workoutToReset, setWorkoutToReset] = useState<{ id: string; name: string } | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Official USPS state codes mapping
  const STATE_ABBR: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
    'district of columbia': 'DC', 'washington dc': 'DC'
  };

  // Add state for exercise execution modal
  const [execModal, setExecModal] = useState({
    isOpen: false,
    workout: null as any,
    exerciseIdx: 0,
    timer: 0,
    running: false,
  });

  const [videoModal, setVideoModal] = useState({ isOpen: false, videoUrl: '', exerciseName: '' });

  // Modal control functions
  const handleUpdateTimer = (newTimer: number) => {
    setExecModal(prev => ({ ...prev, timer: newTimer }));
  };

  const handleUpdateRunning = (newRunning: boolean) => {
    setExecModal(prev => ({ ...prev, running: newRunning }));
  };

  const handleNextExercise = () => {
    const workoutId = execModal.workout.id;
    const exIdx = execModal.exerciseIdx;
    
    // Mark current exercise as completed
    workoutStore.markExerciseCompleted(workoutId, exIdx);
    
    // Update progress in store - DON'T mark as completed (false)
    workoutStore.updateProgress(workoutId, exIdx + 1, execModal.workout.exercises.length, false);
    
    // Update modal state
    setExecModal(prev => ({
      ...prev,
      exerciseIdx: exIdx + 1,
      timer: 0,
      running: true,
    }));
  };

  const handlePreviousExercise = () => {
    const exIdx = execModal.exerciseIdx;
    
    // Only allow going back if not on the first exercise
    if (exIdx > 0) {
      // Reset timer and pause when going back
      setExecModal(prev => ({
        ...prev,
        exerciseIdx: exIdx - 1,
        timer: 0,
        running: false, // Pause when going back
      }));
    }
  };

  const handleFinishWorkout = async () => {
    if (!execModal.workout) return;
    
    const workoutId = execModal.workout.id;
    const totalExercises = execModal.workout.exercises.length;
    const finalExerciseIdx = execModal.exerciseIdx;
    
    // Mark the final exercise as completed if it hasn't been marked yet
    workoutStore.markExerciseCompleted(workoutId, finalExerciseIdx);
    
    // Check current progress to ensure all exercises are actually completed
    const currentProgress = workoutStore.getProgress(workoutId);
    const completedCount = currentProgress?.completedExercises?.length || 0;
    
    // Only mark as fully completed if all exercises are actually done
    if (completedCount >= totalExercises) {
      // Mark workout as completed in store
      workoutStore.updateProgress(workoutId, totalExercises, totalExercises, true);
      
      // Update database assignment status
      if (user?.id) {
        try {
          await api.athleteWorkouts.updateAssignmentStatus(user.id, workoutId, 'completed');
          console.log(`Workout ${workoutId} marked as completed in database`);
        } catch (error) {
          console.error('Error updating workout completion status:', error);
        }
      }
    } else {
      console.warn(`Workout ${workoutId} not fully completed: ${completedCount}/${totalExercises} exercises done`);
      // Mark as in_progress instead
      if (user?.id) {
        try {
          await api.athleteWorkouts.updateAssignmentStatus(user.id, workoutId, 'in_progress');
          console.log(`Workout ${workoutId} marked as in_progress in database`);
        } catch (error) {
          console.error('Error updating workout progress status:', error);
        }
      }
    }
    
    // Close modal
    setExecModal({
      isOpen: false,
      workout: null,
      exerciseIdx: 0,
      timer: 0,
      running: false,
    });
  };

  const handleShowVideo = (exerciseName: string, videoUrl: string) => {
    setVideoModal({
      isOpen: true,
      videoUrl,
      exerciseName
    });
  };

  // Fetch today's and upcoming workouts
  const todayWorkouts = workouts?.filter((workout) => {
    const today = dateUtils.localDateString(new Date());
    const workoutDate = formatDateForComparison(workout.date);
    return workoutDate === today;
  }) || [];

  const upcomingWorkouts = workouts?.filter((workout) => {
    const today = dateUtils.localDateString(new Date());
    const workoutDate = formatDateForComparison(workout.date);
    return workoutDate > today;
  }).slice(0, 3) || [];

  // Fetch team information for the athlete
  useEffect(() => {
    const fetchTeamInfo = async () => {
      if (!user || !profile) return;
      
      setIsLoadingTeam(true);
      try {
        let teamData = null;
        
        if (profile.role === 'athlete' && profile.coach_id) {
          // For athletes, get their coach's team info
          const { data: coachProfile } = await supabase
            .from('profiles')
            .select('team_name, school_name, city, state')
            .eq('id', profile.coach_id)
            .single();
          
          if (coachProfile) {
            teamData = {
              name: coachProfile.team_name,
              school: coachProfile.school_name,
              location: `${coachProfile.city}, ${coachProfile.state}`,
              athleteCount: 0,
              recentActivity: 'View team dashboard for updates'
            };
            
            // Get athlete count for the team
            const { count } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('coach_id', profile.coach_id)
              .eq('role', 'athlete');
            
            teamData.athleteCount = count || 0;
          }
        } else if (profile.role === 'coach') {
          // For coaches, get their own team info
          teamData = {
            name: profile.team_name,
            school: profile.school_name,
            location: `${profile.city}, ${profile.state}`,
            athleteCount: 0,
            recentActivity: 'Manage your team and workouts'
          };
          
          // Get athlete count for the coach
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('coach_id', user.id)
            .eq('role', 'athlete');
          
          teamData.athleteCount = count || 0;
        }
        
        setTeamInfo(teamData);
      } catch (error) {
        console.error('Error fetching team info:', error);
        setTeamInfo(null);
      } finally {
        setIsLoadingTeam(false);
      }
    };

    fetchTeamInfo();
  }, [user, profile]);

  const workoutStore = useWorkoutStore();
  const toast = useToast();

  // Function to get completion count for a workout
  const getCompletionCount = (workoutId: string): number => {
    const progress = workoutStore.getProgress(workoutId);
    return progress ? progress.completedExercises.length : 0;
  };

  // Function to get completion percentage for a workout
  const getCompletionPercentage = (workout: any): number => {
    if (!workout || !workout.exercises || workout.exercises.length === 0) return 0;
    const completed = getCompletionCount(workout.id);
    return Math.round((completed / workout.exercises.length) * 100);
  };

  // Function to handle starting a workout
  const handleStartWorkout = (workout: any) => {
    if (profile?.role === 'coach') {
      // For coaches, navigate to workout details
      navigate(`/coach/workouts/${workout.id}`);
    } else {
      // For athletes, open the execution modal
      const progress = workoutStore.getProgress(workout.id);
      const currentIdx = progress ? progress.currentExerciseIndex : 0;
      const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
      
      setExecModal({
        isOpen: true,
        workout: workout,
        exerciseIdx: currentIdx >= exercises.length ? 0 : currentIdx,
        timer: 0,
        running: true,
      });
    }
  };

  // Function to get workout progress data formatted for WorkoutCard
  const getWorkoutProgressData = (workout: any) => {
    if (!workout || !workout.id) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = getCompletionCount(workout.id);
    const total = workout.exercises?.length || 0;
    
    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0
    };
  };

  // Helper to get state abbreviation
  function getStateAbbr(state?: string) {
    if (!state) return '';
    const key = state.trim().toLowerCase();
    return STATE_ABBR[key] || state.slice(0,2).toUpperCase();
  }

  const handleDataUpdate = () => {
    // This could trigger refetch of sleep/nutrition stats if needed
    // For now, just a placeholder for future data refresh functionality
  };

  // Colors
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const cardShadow = useColorModeValue('none', 'md')
  const cardShadowLg = useColorModeValue('none', 'lg')
  const cardShadowSm = useColorModeValue('none', 'sm')
  const skeletonStartColor = useColorModeValue('gray.200', 'gray.700')
  const skeletonEndColor = useColorModeValue('gray.300', 'gray.600')
  const dashboardBg = useColorModeValue('gray.50', 'gray.900')
  const textColor = useColorModeValue('gray.800', 'white')
  const subtextColor = useColorModeValue('gray.600', 'gray.200')
  const headingColor = useColorModeValue('gray.800', 'gray.100')
  const cardTextColor = useColorModeValue('gray.900', 'gray.100')
  const cardSubtextColor = useColorModeValue('gray.600', 'gray.300')

  // Add timeout for loading states to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (profileLoading) {
        console.warn('Profile loading taking too long, this may indicate an issue');
      }
      if (workoutsLoading) {
        console.warn('Workouts loading taking too long, this may indicate an issue');
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timer);
  }, [profileLoading, workoutsLoading]);

  // Function to handle resetting workout progress
  const handleResetProgress = async (workoutId: string, workoutName: string) => {
    // Set the workout to reset and open confirmation modal
    setWorkoutToReset({ id: workoutId, name: workoutName });
    onResetOpen();
  };

  const handleResetConfirm = async () => {
    if (!workoutToReset) return;
    
    try {
      console.log(`Resetting progress for workout ${workoutToReset.id}`);
      
      // Reset progress in the workout store
      workoutStore.resetProgress(workoutToReset.id);
      
      // Also reset in the database if the user has an assignment
      if (user?.id) {
        try {
          await api.athleteWorkouts.updateAssignmentStatus(user.id, workoutToReset.id, 'assigned');
          console.log(`Workout ${workoutToReset.id} status reset to 'assigned' in database`);
        } catch (error) {
          console.error('Error resetting workout status in database:', error);
        }
      }
      
      toast({
        title: 'Progress Reset',
        description: `"${workoutToReset.name}" progress has been reset. You can start from the beginning.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error resetting workout progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset workout progress. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      onResetClose();
      setWorkoutToReset(null);
    }
  };

  return (
    <Box 
      pt={0} 
      pb={10} 
      bg={dashboardBg} 
      w="100%"
      maxW="100%"
      overflowX="hidden"
      position="relative"
    >
      <Box 
        px={{ base: 4, md: 6 }} 
        pt={0} 
        mt={0} 
        w="100%"
        maxW="100%"
        overflowX="hidden"
        mx="auto"
      >
        {/* Header with personal greeting */}
        <Box w="100%" mb={8} pt={{ base: 4, md: 0 }}>
          {/* Mobile Header using reusable component */}
          <MobileHeader
            title={`Welcome back, ${(() => {
              // If profile has first_name, use it
              if (profile?.first_name) {
                return profile.first_name;
              }
              
              // Check for actual name in user object
              if (user && (user as any).name) {
                return (user as any).name.split(' ')[0];
              }
              
              // Check user metadata
              if (user?.user_metadata?.name) {
                return user.user_metadata.name.split(' ')[0];
              }
              
              // Check identity data
              if (user?.identities?.[0]?.identity_data?.name) {
                return user.identities[0].identity_data.name.split(' ')[0];
              }
              
              // Otherwise try to extract from email, but skip common prefixes
              if (user?.email) {
                const emailUsername = user.email.split('@')[0];
                const skipPrefixes = ['hello', 'contact', 'info', 'admin', 'support', 'team', 'user', 'test'];
                
                if (!skipPrefixes.includes(emailUsername.toLowerCase())) {
                  return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1).toLowerCase();
                } else {
                  console.log('🔍 Skipping email prefix:', emailUsername);
                }
              }
              
              return 'Athlete';
            })()}`}
            subtitle={profile?.role === 'athlete' ? 'Athlete Dashboard' : 'Dashboard'}
            isLoading={profileLoading}
          />

          {/* Desktop Header Row */}
          <Flex 
            display={{ base: "none", lg: "flex" }}
            direction="row"
            align="center" 
            justify="space-between" 
            gap={6}
            w="100%"
          >
            <Box flex="1">
              <HStack spacing={4} align="center">
                <VStack spacing={1} align="start" flex="1">
                  <Skeleton isLoaded={!profileLoading} fadeDuration={1}>
                    <Heading 
                      as="h1" 
                      size="xl"
                      mb={1}
                      color={textColor}
                    >
                      Welcome back, {(() => {
                        // If profile has first_name, use it
                        if (profile?.first_name) {
                          return profile.first_name;
                        }
                        
                        // Check for actual name in user object
                        if (user && (user as any).name) {
                          return (user as any).name.split(' ')[0];
                        }
                        
                        // Check user metadata
                        if (user?.user_metadata?.name) {
                          return user.user_metadata.name.split(' ')[0];
                        }
                        
                        // Check identity data
                        if (user?.identities?.[0]?.identity_data?.name) {
                          return user.identities[0].identity_data.name.split(' ')[0];
                        }
                        
                        // Otherwise try to extract from email, but skip common prefixes
                        if (user?.email) {
                          const emailUsername = user.email.split('@')[0];
                          const skipPrefixes = ['hello', 'contact', 'info', 'admin', 'support', 'team', 'user', 'test'];
                          
                          if (!skipPrefixes.includes(emailUsername.toLowerCase())) {
                            return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1).toLowerCase();
                          } else {
                            console.log('🔍 Skipping email prefix:', emailUsername);
                          }
                        }
                        
                        return 'Athlete';
                      })()}
                    </Heading>
                  </Skeleton>
                  <Skeleton isLoaded={!profileLoading} fadeDuration={1}>
                    <Text 
                      color={subtextColor}
                      fontSize="md"
                    >
                      {profile?.role === 'athlete' ? 'Athlete Dashboard' : 'Dashboard'}
                    </Text>
                  </Skeleton>
                </VStack>
                
                {/* Desktop AI Assistant Button */}
                <IconButton
                  aria-label="AI Assistant"
                  icon={<SparkleIcon boxSize={6} />}
                  size="lg"
                  colorScheme="purple"
                  variant="solid"
                  borderRadius="full"
                  onClick={() => setIsAIModalOpen(true)}
                  boxShadow="lg"
                  _hover={{ 
                    transform: 'scale(1.05)',
                    boxShadow: 'xl'
                  }}
                  transition="all 0.2s"
                  bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  color="white"
                  _active={{
                    transform: 'scale(0.95)'
                  }}
                />
              </HStack>
            </Box>
            
            {/* Weather Info - Desktop only initially, mobile below */}
            <Box 
              w="400px"
              minW="390px" 
              maxW="442px"
              flexShrink={1}
              overflow="hidden"
            >
              <WeatherCard 
                city={profile?.city || "Greensboro"}
                state={profile?.state ? getStateAbbr(profile.state) : "NC"}
                weather={{
                  temp: "71",
                  condition: "Clouds",
                  description: "scattered clouds"
                }}
                isLoading={profileLoading}
                fixedDate="Tuesday, May 20"
              />
            </Box>
          </Flex>

          {/* Mobile Weather Card */}
          <Box 
            display={{ base: "block", lg: "none" }}
            w="100%"
            mt={{ base: "20px", lg: 2 }}
          >
            <WeatherCard 
              city={profile?.city || "Greensboro"}
              state={profile?.state ? getStateAbbr(profile.state) : "NC"}
              weather={{
                temp: "71",
                condition: "Clouds",
                description: "scattered clouds"
              }}
              isLoading={profileLoading}
              fixedDate="Tuesday, May 20"
            />
          </Box>
        </Box>

        {/* Today's Workouts Card */}
        <TodayWorkoutsCard
          todayWorkouts={todayWorkouts}
          upcomingWorkouts={upcomingWorkouts}
          profile={profile}
          getWorkoutProgressData={getWorkoutProgressData}
          handleStartWorkout={handleStartWorkout}
          handleResetProgress={handleResetProgress}
          workoutsLoading={workoutsLoading}
          profileLoading={profileLoading}
        />

        {/* Today's Check-in Section */}
        <TodaysCheckInSection onDataUpdate={handleDataUpdate} />

        {/* Analytics & Info Cards */}
        <SimpleGrid 
          columns={{ base: 1, md: 2, lg: 3 }} 
          spacing={{ base: 4, md: 8 }} 
          my={{ base: 6, md: 10 }}
          w="100%"
        >
          {/* Track Meets Card */}
          <TrackMeetsCard viewAllLink="/athlete/meets" />

          {/* Sleep Card */}
          {profileLoading ? (
            <SkeletonCard
              height="330px"
              cardBg={cardBg}
              borderColor={borderColor}
              cardShadow={cardShadow}
              skeletonStartColor={skeletonStartColor}
              skeletonEndColor={skeletonEndColor}
            />
          ) : (
            <SleepStatsCard />
          )}

          {/* Nutrition Card */}
          {(profileLoading || nutritionLoading) ? (
            <SkeletonCard
              height="330px"
              cardBg={cardBg}
              borderColor={borderColor}
              cardShadow={cardShadow}
              skeletonStartColor={skeletonStartColor}
              skeletonEndColor={skeletonEndColor}
            />
          ) : (
            <NutritionStatsCard
              nutritionStats={nutritionStats}
              isLoading={nutritionLoading}
            />
          )}
        </SimpleGrid>

        {/* Gamification Test Page Link - Development Only */}
        {process.env.NODE_ENV !== 'production' && (
          <Box 
            bg={cardBg}
            borderRadius="xl"
            p={6}
            border="1px solid"
            borderColor={borderColor}
            boxShadow={cardShadowLg}
            mb={8}
          >
            <VStack spacing={5} align="stretch">
              {/* Header */}
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <Icon as={FaMedal} boxSize={6} color="purple.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight="bold" color={cardTextColor}>
                      Gamification Preview
                    </Text>
                    <Text fontSize="sm" color={cardSubtextColor}>
                      Track your progress and achievements
                    </Text>
                  </VStack>
                </HStack>
                <Badge 
                  colorScheme="purple" 
                  variant="solid" 
                  fontSize="xs"
                  px={2}
                  py={1}
                >
                  Preview
                </Badge>
              </HStack>

              {/* Content */}
              <Text fontSize="sm" color={cardSubtextColor}>
                View your points, badges, streaks, and leaderboard position
              </Text>

              {/* Action Button */}
              <Button 
                as={RouterLink} 
                to="/gamification" 
                colorScheme="purple"
                variant="outline"
                size="sm"
                leftIcon={<Icon as={FaMedal} />}
                rightIcon={<Icon as={MdKeyboardArrowRight} />}
              >
                View Gamification
              </Button>
            </VStack>
          </Box>
        )}

        {/* Exercise Execution Modal - Using shared component */}
        <ExerciseExecutionModal
          isOpen={execModal.isOpen}
          onClose={() => setExecModal({ ...execModal, isOpen: false })}
          workout={execModal.workout}
          exerciseIdx={execModal.exerciseIdx}
          timer={execModal.timer}
          running={execModal.running}
          onUpdateTimer={handleUpdateTimer}
          onUpdateRunning={handleUpdateRunning}
          onNextExercise={handleNextExercise}
          onPreviousExercise={handlePreviousExercise}
          onFinishWorkout={handleFinishWorkout}
          onShowVideo={handleShowVideo}
        />

        {/* Video Modal */}
        <Modal isOpen={videoModal.isOpen} onClose={() => setVideoModal({ ...videoModal, isOpen: false })} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>How to: {videoModal.exerciseName}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Box position="relative" paddingTop="56.25%">
                <iframe
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  src={videoModal.videoUrl}
                  title="Exercise Tutorial"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Desktop AI Modal - Mobile handled by MobileHeader */}
        <Box display={{ base: "none", lg: "block" }}>
          <AIModal 
            isOpen={isAIModalOpen} 
            onClose={() => setIsAIModalOpen(false)} 
          />
        </Box>

        {/* Reset Confirmation Modal */}
        <AlertDialog
          isOpen={isResetOpen}
          leastDestructiveRef={cancelRef}
          onClose={onResetClose}
          size="lg"
        >
          <AlertDialogOverlay>
            <AlertDialogContent minHeight="220px">
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Reset Workout Progress
              </AlertDialogHeader>

              <AlertDialogBody>
                <VStack spacing={4} minHeight="100px">
                  <Text>
                    Are you sure you want to reset your progress on <strong>{workoutToReset?.name}</strong>? 
                    This will clear all completed exercises and you'll start from the beginning.
                    This action cannot be undone.
                  </Text>
                </VStack>
                {/* Action buttons styled as a footer */}
                <HStack width="100%" justifyContent="flex-end" pt={4} spacing={4}>
                  <Button 
                    ref={cancelRef} 
                    onClick={onResetClose}
                    variant="ghost"
                    colorScheme="gray"
                  >
                    Cancel
                  </Button>
                  <Button 
                    colorScheme="orange" 
                    onClick={handleResetConfirm} 
                    variant="solid"
                  >
                    Reset Progress
                  </Button>
                </HStack>
              </AlertDialogBody>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

      </Box>
    </Box>
  )
} 