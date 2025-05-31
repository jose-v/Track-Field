import React, { useState, useEffect, useRef } from 'react'
import {
  Box, Container, Flex, Heading, Text, VStack, Grid, GridItem, Icon, Badge, Card, CardHeader, CardBody, Image, Tag,
  Button, SimpleGrid, Progress, HStack, Stack, Spinner, Divider, Stat, StatLabel, StatNumber, StatHelpText, useToast,
  useColorModeValue, Skeleton, SkeletonText, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, IconButton
} from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import { dateUtils } from '../utils/date'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useSleepStats, getQualityText } from '../hooks/useSleepRecords'
import { useNutritionStats } from '../hooks/useNutritionRecords'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useWorkouts } from '../hooks/useWorkouts'
import { MdPerson, MdOutlineWbSunny, MdKeyboardArrowRight } from 'react-icons/md'
import { FaCalendarAlt, FaRunning, FaBolt, FaMedal, FaListAlt, FaUsers, FaMapMarkerAlt, FaChartLine, FaCloudRain, FaSnowflake, FaSun, FaCloudSun, FaCloudMeatball, FaRegClock, FaPlayCircle } from 'react-icons/fa'
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
  TodaysCheckInSection
} from '../components'
import { supabase } from '../lib/supabase'
import TodayWorkoutsCard from '../components/TodayWorkoutsCard'

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
  switch (mealType) {
    case 'breakfast': return 'Breakfast';
    case 'lunch': return 'Lunch';
    case 'dinner': return 'Dinner';
    case 'snack': return 'Snack';
    default: return 'Meal';
  }
}

// Create a skeleton card component for loading states
const SkeletonCard = ({ height = "330px" }: { height?: string }) => (
  <Box
    bg={useColorModeValue('white', 'gray.800')}
    borderRadius="xl"
    p={6}
    border="1px solid"
    borderColor={useColorModeValue('gray.200', 'gray.700')}
    boxShadow={useColorModeValue('none', 'lg')}
    h={height}
  >
    <Skeleton 
      height="80px" 
      borderRadius="lg"
      mb={4}
      startColor={useColorModeValue('gray.200', 'gray.700')}
      endColor={useColorModeValue('gray.300', 'gray.600')}
    />
    <VStack spacing={4} align="stretch">
      <SkeletonText 
        mt="2" 
        noOfLines={1} 
        spacing="2" 
        skeletonHeight="4" 
        width="60%" 
        startColor={useColorModeValue('gray.200', 'gray.700')}
        endColor={useColorModeValue('gray.300', 'gray.600')}
      />
      <VStack spacing={3} align="stretch">
        <Skeleton 
          height="16px" 
          width="100%" 
          borderRadius="md"
          startColor={useColorModeValue('gray.200', 'gray.700')}
          endColor={useColorModeValue('gray.300', 'gray.600')}
        />
        <Skeleton 
          height="16px" 
          width="90%" 
          borderRadius="md"
          startColor={useColorModeValue('gray.200', 'gray.700')}
          endColor={useColorModeValue('gray.300', 'gray.600')}
        />
        <Skeleton 
          height="16px" 
          width="75%" 
          borderRadius="md"
          startColor={useColorModeValue('gray.200', 'gray.700')}
          endColor={useColorModeValue('gray.300', 'gray.600')}
        />
        <Skeleton 
          height="40px" 
          width="120px" 
          borderRadius="lg"
          mx="auto"
          mt={4}
          startColor={useColorModeValue('gray.200', 'gray.700')}
          endColor={useColorModeValue('gray.300', 'gray.600')}
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
  const [teamInfo, setTeamInfo] = useState<any>(null)
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)
  // Default weather data as fallback
  const [weather] = useState({
    temp: '72',
    condition: 'Loading...',
    description: 'Fetching current conditions'
  })
  const navigate = useNavigate()

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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic
  useEffect(() => {
    if (execModal.isOpen && execModal.running) {
      timerRef.current = setInterval(() => {
        setExecModal((prev) => ({ ...prev, timer: prev.timer + 1 }));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [execModal.isOpen, execModal.running]);

  // Handle DONE button
  const handleDone = async () => {
    if (!execModal.workout) return;
    const workoutId = execModal.workout.id;
    const exIdx = execModal.exerciseIdx;
    
    // Mark current exercise as completed
    workoutStore.markExerciseCompleted(workoutId, exIdx);
    
    // Move to next exercise
    if (exIdx + 1 < execModal.workout.exercises.length) {
      // Update progress in store - DON'T mark as completed (false)
      workoutStore.updateProgress(workoutId, exIdx + 1, execModal.workout.exercises.length, false);
      
      // Update modal state
      setExecModal({
        ...execModal,
        exerciseIdx: exIdx + 1,
        timer: 0,
        running: true,
      });
    } else {
      // Workout completed
      workoutStore.updateProgress(workoutId, execModal.workout.exercises.length, execModal.workout.exercises.length);
      
      // Close modal
      setExecModal({
        isOpen: false,
        workout: null,
        exerciseIdx: 0,
        timer: 0,
        running: false,
      });
    }
  };

  // Function to get video URL for exercise
  function getVideoUrl(exerciseName: string) {
    const exercise = exerciseName.toLowerCase();
    
    if (exercise.includes('warm up') || exercise.includes('warmup')) {
      return 'https://www.youtube.com/embed/R0mMyV5OtcM'; // Track warmup
    }
    
    // Default video if no match is found
    return 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // General workout video
  }

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

  return (
    <Box 
      pt={0} 
      pb={10} 
      bg={useColorModeValue('gray.50', 'gray.900')} 
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
          {/* Mobile Header Row */}
          <Box
            display={{ base: "block", lg: "none" }}
            ml="56px" // Account for hamburger icon (16px left + 24px icon + 16px spacing)
            mr={4}
            mb={4}
          >
            <Skeleton isLoaded={!profileLoading} fadeDuration={1}>
              <Heading 
                as="h1" 
                size="md"
                mb={1}
                color={useColorModeValue('gray.800', 'white')}
                lineHeight="1.2"
              >
                Welcome back, {profile?.first_name || user?.email?.split('@')[0] || 'Athlete'}
              </Heading>
            </Skeleton>
            <Skeleton isLoaded={!profileLoading} fadeDuration={1}>
              <Text 
                color={useColorModeValue('gray.600', 'gray.200')}
                fontSize="xs"
              >
                {profile?.role === 'athlete' ? 'Athlete Dashboard' : 'Dashboard'}
              </Text>
            </Skeleton>
          </Box>

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
              <Skeleton isLoaded={!profileLoading} fadeDuration={1}>
                <Heading 
                  as="h1" 
                  size="xl"
                  mb={1}
                  color={useColorModeValue('gray.800', 'white')}
                >
                  Welcome back, {profile?.first_name || user?.email?.split('@')[0] || 'Athlete'}
                </Heading>
              </Skeleton>
              <Skeleton isLoaded={!profileLoading} fadeDuration={1}>
                <Text 
                  color={useColorModeValue('gray.600', 'gray.200')}
                  fontSize="md"
                >
                  {profile?.role === 'athlete' ? 'Athlete Dashboard' : 'Dashboard'}
                </Text>
              </Skeleton>
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
            mt={2}
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
          <TrackMeetsCard viewAllLink="/athlete/events" />

          {/* Sleep Card */}
          {profileLoading ? (
            <SkeletonCard />
          ) : (
            <SleepStatsCard />
          )}

          {/* Nutrition Card */}
          {(profileLoading || nutritionLoading) ? (
            <SkeletonCard />
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
                    <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.900', 'gray.100')}>
                      Gamification Preview
                    </Text>
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
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
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
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

        {/* Exercise Execution Modal - Redesigned with modern styling */}
        <Modal isOpen={execModal.isOpen} onClose={() => setExecModal({ ...execModal, isOpen: false })} isCentered size="md">
          <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
          <ModalContent 
            borderRadius="2xl" 
            overflow="hidden" 
            boxShadow="2xl"
            bg={useColorModeValue('white', 'gray.800')}
            mx={4}
          >
            {/* Hero Header with Gradient */}
            <Box 
              h="120px" 
              bg={execModal.running 
                ? "linear-gradient(135deg, #38A169 0%, #68D391 50%, #4FD1C7 100%)" 
                : "linear-gradient(135deg, #4299E1 0%, #90CDF4 50%, #A78BFA 100%)"
              } 
              position="relative"
              overflow="hidden"
            >
              {/* Animated background pattern */}
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                opacity="0.1"
                bgImage="radial-gradient(circle at 2px 2px, white 1px, transparent 0)"
                bgSize="20px 20px"
              />
              
              {/* Central Icon */}
              <Flex 
                position="absolute" 
                top="50%" 
                left="50%" 
                transform="translate(-50%, -50%)"
                bg={useColorModeValue('white', 'gray.800')} 
                borderRadius="full" 
                w="70px" 
                h="70px" 
                justifyContent="center" 
                alignItems="center"
                boxShadow="xl"
                border="4px solid"
                borderColor="white"
              >
                <Icon 
                  as={execModal.running ? FaRunning : FaRegClock} 
                  w={8} 
                  h={8} 
                  color={execModal.running ? "green.500" : "blue.500"} 
                />
              </Flex>
              
              {/* Progress Bar */}
              {execModal.workout && execModal.workout.exercises && (
                <Box position="absolute" bottom="0" left="0" right="0">
                  <Progress 
                    value={((execModal.exerciseIdx + 1) / execModal.workout.exercises.length) * 100} 
                    size="sm" 
                    height="8px"
                    colorScheme={execModal.running ? "green" : "blue"} 
                    backgroundColor="rgba(255,255,255,0.2)"
                    borderRadius="0"
                  />
                </Box>
              )}
              
              {/* Close Button */}
              <IconButton
                aria-label="Close"
                icon={<Box as="span" fontSize="24px" color="white">×</Box>}
                position="absolute"
                top={4}
                right={4}
                variant="ghost"
                colorScheme="whiteAlpha"
                size="lg"
                onClick={() => setExecModal({ ...execModal, isOpen: false })}
                _hover={{ bg: 'whiteAlpha.200' }}
              />
            </Box>

            {/* Modal Body */}
            <ModalBody p={8}>
              {execModal.workout && execModal.workout.exercises && execModal.workout.exercises[execModal.exerciseIdx] && (
                <VStack spacing={6} align="center">
                  {/* Exercise Title */}
                  <VStack spacing={2}>
                    <Text 
                      fontSize="sm" 
                      fontWeight="medium" 
                      color={useColorModeValue('gray.500', 'gray.400')}
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Exercise Execution
                    </Text>
                    <Heading 
                      size="lg" 
                      textAlign="center"
                      color={useColorModeValue('gray.800', 'white')}
                      lineHeight="shorter"
                    >
                      {execModal.workout.exercises[execModal.exerciseIdx].name}
                    </Heading>
                  </VStack>

                  {/* Exercise Details Card */}
                  <Box 
                    bg={useColorModeValue('gray.50', 'gray.700')} 
                    borderRadius="xl" 
                    p={6} 
                    w="100%"
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    <HStack spacing={6} justify="center">
                      <VStack spacing={1}>
                        <Text 
                          color={useColorModeValue('gray.500', 'gray.400')} 
                          fontSize="sm"
                          fontWeight="medium"
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          Sets
                        </Text>
                        <Text 
                          fontWeight="bold" 
                          fontSize="2xl"
                          color={useColorModeValue('gray.800', 'white')}
                        >
                          {execModal.workout.exercises[execModal.exerciseIdx].sets}
                        </Text>
                      </VStack>
                      
                      <Divider orientation="vertical" h="50px" />
                      
                      <VStack spacing={1}>
                        <Text 
                          color={useColorModeValue('gray.500', 'gray.400')} 
                          fontSize="sm"
                          fontWeight="medium"
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          Reps
                        </Text>
                        <Text 
                          fontWeight="bold" 
                          fontSize="2xl"
                          color={useColorModeValue('gray.800', 'white')}
                        >
                          {execModal.workout.exercises[execModal.exerciseIdx].reps}
                        </Text>
                      </VStack>
                      
                      {execModal.workout.exercises[execModal.exerciseIdx].weight && (
                        <>
                          <Divider orientation="vertical" h="50px" />
                          <VStack spacing={1}>
                            <Text 
                              color={useColorModeValue('gray.500', 'gray.400')} 
                              fontSize="sm"
                              fontWeight="medium"
                              textTransform="uppercase"
                              letterSpacing="wider"
                            >
                              Weight
                            </Text>
                            <Text 
                              fontWeight="bold" 
                              fontSize="2xl"
                              color={useColorModeValue('gray.800', 'white')}
                            >
                              {execModal.workout.exercises[execModal.exerciseIdx].weight}
                              <Text as="span" fontSize="lg" color={useColorModeValue('gray.500', 'gray.400')}>
                                kg
                              </Text>
                            </Text>
                          </VStack>
                        </>
                      )}
                    </HStack>
                  </Box>

                  {/* Timer Display */}
                  <Box 
                    bg={execModal.running 
                      ? "linear-gradient(135deg, #F0FFF4, #C6F6D5)" 
                      : "linear-gradient(135deg, #EBF8FF, #BEE3F8)"
                    } 
                    borderRadius="2xl" 
                    p={6}
                    border="2px solid"
                    borderColor={execModal.running ? "green.200" : "blue.200"}
                    boxShadow="lg"
                    position="relative"
                    overflow="hidden"
                  >
                    {/* Timer glow effect */}
                    <Box
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      w="120px"
                      h="120px"
                      borderRadius="full"
                      bg={execModal.running ? "green.100" : "blue.100"}
                      opacity="0.3"
                      filter="blur(20px)"
                    />
                    
                    <Text 
                      fontSize="4xl" 
                      fontWeight="bold" 
                      color={execModal.running ? "green.600" : "blue.600"}
                      textAlign="center"
                      fontFamily="mono"
                      position="relative"
                      zIndex="1"
                    >
                      {Math.floor(execModal.timer / 60).toString().padStart(2, '0')}:
                      {(execModal.timer % 60).toString().padStart(2, '0')}
                    </Text>
                  </Box>

                  {/* Action Buttons */}
                  <VStack spacing={4} width="100%">
                    <HStack spacing={3} width="100%" justify="center">
                      {execModal.running ? (
                        <Button 
                          colorScheme="yellow" 
                          size="lg"
                          leftIcon={<Icon as={FaRegClock} />} 
                          onClick={() => setExecModal({ ...execModal, running: false })}
                          borderRadius="xl"
                          px={8}
                          py={6}
                          fontWeight="semibold"
                          boxShadow="lg"
                          _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                          transition="all 0.2s"
                        >
                          Pause
                        </Button>
                      ) : (
                        <Button 
                          colorScheme="blue" 
                          size="lg"
                          leftIcon={<Icon as={FaRunning} />} 
                          onClick={() => setExecModal({ ...execModal, running: true })}
                          borderRadius="xl"
                          px={8}
                          py={6}
                          fontWeight="semibold"
                          boxShadow="lg"
                          _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                          transition="all 0.2s"
                        >
                          Start
                        </Button>
                      )}
                      
                      <Button 
                        colorScheme="green" 
                        size="lg"
                        leftIcon={<Icon as={CheckIcon} />} 
                        onClick={handleDone}
                        borderRadius="xl"
                        px={8}
                        py={6}
                        fontWeight="semibold"
                        boxShadow="lg"
                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                        transition="all 0.2s"
                      >
                        {execModal.workout.exercises.length > 0 && execModal.exerciseIdx + 1 < execModal.workout.exercises.length ? 'Next' : 'Finish'}
                      </Button>
                    </HStack>
                    
                    <Button 
                      colorScheme="purple" 
                      variant="outline"
                      size="md"
                      leftIcon={<Icon as={FaPlayCircle} />} 
                      onClick={() => setVideoModal({
                        isOpen: true,
                        videoUrl: getVideoUrl(execModal.workout.exercises[execModal.exerciseIdx].name),
                        exerciseName: execModal.workout.exercises[execModal.exerciseIdx].name || ""
                      })}
                      borderRadius="xl"
                      px={6}
                      fontWeight="medium"
                      _hover={{ bg: "purple.50", transform: "translateY(-1px)" }}
                      transition="all 0.2s"
                    >
                      Watch Tutorial
                    </Button>
                  </VStack>

                  {/* Progress Indicator */}
                  <Box 
                    bg={useColorModeValue('gray.100', 'gray.700')} 
                    borderRadius="lg" 
                    px={4} 
                    py={2}
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    <Text 
                      fontSize="sm" 
                      color={useColorModeValue('gray.600', 'gray.300')} 
                      textAlign="center"
                      fontWeight="medium"
                    >
                      Exercise <Text as="span" fontWeight="bold" color={execModal.running ? "green.500" : "blue.500"}>
                        {execModal.exerciseIdx + 1}
                      </Text> of {execModal.workout.exercises.length}
                    </Text>
                  </Box>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

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

      </Box>
    </Box>
  )
} 