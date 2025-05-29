import React, { useState, useEffect, useRef } from 'react'
import {
  Box, Container, Flex, Heading, Text, VStack, Grid, GridItem, Icon, Badge, Card, CardHeader, CardBody, Image, Tag,
  Button, SimpleGrid, Progress, HStack, Stack, Spinner, Divider, Stat, StatLabel, StatNumber, StatHelpText, useToast,
  useColorModeValue, Skeleton, SkeletonText, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody
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
  <Card borderRadius="lg" overflow="hidden" boxShadow={useColorModeValue('none', 'md')} h={height}>
    <Skeleton height="80px" />
    <CardBody pt={6}>
      <SkeletonText mt="2" noOfLines={1} spacing="2" skeletonHeight="3" width="40%" mx="auto" />
      <VStack spacing={4} mt={4}>
        <Skeleton height="20px" width="100%" />
        <Skeleton height="20px" width="100%" />
        <Skeleton height="20px" width="100%" />
        <Skeleton height="20px" width="100%" />
        <Skeleton height="40px" width="120px" mx="auto" />
      </VStack>
    </CardBody>
  </Card>
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
    <Box pt={0} pb={10} bg={useColorModeValue('gray.50', 'gray.900')}>
      <Container maxW="container.xl" px={0} pt={0} mt={0}>
        {/* Header with personal greeting */}
        <Box mb={8} display="flex" alignItems="center" justifyContent="space-between" mt={0} pt={0}>
          <Box>
            <Skeleton isLoaded={!profileLoading} fadeDuration={1}>
              <Heading as="h1" size="xl" mb={1}>
                Welcome back, {profile?.first_name || user?.email?.split('@')[0] || 'Athlete'}
              </Heading>
            </Skeleton>
            <Skeleton isLoaded={!profileLoading} fadeDuration={1}>
              <Text color={useColorModeValue('gray.600', 'gray.200')}>
                {profile?.role === 'athlete' ? 'Athlete Dashboard' : 'Dashboard'}
              </Text>
            </Skeleton>
          </Box>
          {/* Weather Info Inline */}
          <Box minW="390px" maxW="442px" ml={6}>
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
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} my={10}>
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

        {/* Exercise Execution Modal */}
        <Modal isOpen={execModal.isOpen} onClose={() => setExecModal({ ...execModal, isOpen: false })} isCentered>
          <ModalOverlay />
          <ModalContent borderRadius="lg" overflow="hidden" p="0">
            {/* Hero Background */}
            <Box 
              h="80px" 
              bg={execModal.running ? "linear-gradient(135deg, #38A169 0%, #68D391 100%)" : "linear-gradient(135deg, #4299E1 0%, #90CDF4 100%)"} 
              position="relative"
              margin="0"
              width="100%"
              borderTopLeftRadius="inherit"
              borderTopRightRadius="inherit"
            >
              <Flex 
                position="absolute" 
                top="50%" 
                left="50%" 
                transform="translate(-50%, -50%)"
                bg={useColorModeValue('white', 'gray.800')} 
                borderRadius="full" 
                w="50px" 
                h="50px" 
                justifyContent="center" 
                alignItems="center"
                boxShadow={cardShadow}
              >
                <Icon as={execModal.running ? FaRunning : FaRegClock} w={6} h={6} color={execModal.running ? "green.500" : "blue.500"} />
              </Flex>
              
              {/* Progress indicator */}
              {execModal.workout && (
                <Box position="absolute" bottom="0" left="0" right="0">
                  <Progress 
                    value={((execModal.exerciseIdx + 1) / execModal.workout.exercises.length) * 100} 
                    size="xs" 
                    colorScheme={execModal.running ? "green" : "blue"} 
                    backgroundColor="rgba(255,255,255,0.3)"
                  />
                </Box>
              )}
            </Box>
            
            <ModalHeader textAlign="center" pt={8}>Exercise Execution</ModalHeader>
            <ModalCloseButton top="85px" onClick={() => setExecModal({ ...execModal, isOpen: false })} />
            <ModalBody pb={6}>
              {execModal.workout && (
                <VStack spacing={4} align="center">
                  <Heading size="md">
                    {execModal.workout.exercises[execModal.exerciseIdx]?.name}
                  </Heading>
                  
                  <HStack 
                    spacing={4} 
                    p={3} 
                    bg="gray.50" 
                    w="100%" 
                    borderRadius="md" 
                    justify="center"
                  >
                    <VStack>
                      <Text color={useColorModeValue('gray.500', 'gray.300')} fontSize="sm">Sets</Text>
                      <Text fontWeight="bold">{execModal.workout.exercises[execModal.exerciseIdx]?.sets}</Text>
                    </VStack>
                    <VStack>
                      <Text color={useColorModeValue('gray.500', 'gray.300')} fontSize="sm">Reps</Text>
                      <Text fontWeight="bold">{execModal.workout.exercises[execModal.exerciseIdx]?.reps}</Text>
                    </VStack>
                    {execModal.workout.exercises[execModal.exerciseIdx]?.weight && (
                      <VStack>
                        <Text color={useColorModeValue('gray.500', 'gray.300')} fontSize="sm">Weight</Text>
                        <Text fontWeight="bold">{execModal.workout.exercises[execModal.exerciseIdx]?.weight} kg</Text>
                      </VStack>
                    )}
                  </HStack>
                  
                  <Box 
                    bg={execModal.running ? "green.50" : "blue.50"} 
                    p={4} 
                    borderRadius="full" 
                    boxShadow={cardShadowSm} 
                    mb={2}
                  >
                    <Text fontSize="2xl" fontWeight="bold" color={execModal.running ? "green.500" : "blue.500"}>
                      {Math.floor(execModal.timer / 60)
                        .toString()
                        .padStart(2, '0')}
                      :
                      {(execModal.timer % 60).toString().padStart(2, '0')}
                    </Text>
                  </Box>
                  
                  {/* Exercise control buttons */}
                  <HStack spacing={3} width="100%" justifyContent="center">
                    {execModal.running ? (
                      <Button 
                        colorScheme="yellow" 
                        flex="1" 
                        maxW="120px"
                        leftIcon={<Icon as={FaRegClock} />}
                        onClick={() => setExecModal({ ...execModal, running: false })}
                      >
                        Stop
                      </Button>
                    ) : (
                      <Button 
                        colorScheme="blue" 
                        flex="1" 
                        maxW="120px"
                        leftIcon={<Icon as={FaRunning} />}
                        onClick={() => setExecModal({ ...execModal, running: true })}
                      >
                        Start
                      </Button>
                    )}
                    <Button 
                      colorScheme="green" 
                      flex="1" 
                      maxW="120px"
                      leftIcon={<Icon as={CheckIcon} />}
                      onClick={handleDone}
                    >
                      {execModal.exerciseIdx + 1 < execModal.workout.exercises.length ? 'Next' : 'Finish'}
                    </Button>
                    <Button
                      colorScheme="purple"
                      flex="1"
                      maxW="120px"
                      leftIcon={<Icon as={FaPlayCircle} />}
                      onClick={() => setVideoModal({
                        isOpen: true,
                        videoUrl: getVideoUrl(execModal.workout.exercises[execModal.exerciseIdx]?.name),
                        exerciseName: execModal.workout.exercises[execModal.exerciseIdx]?.name || '',
                      })}
                    >
                      How to
                    </Button>
                  </HStack>
                  
                  <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.300')} mt={4} textAlign="center">
                    Exercise {execModal.exerciseIdx + 1} of {execModal.workout.exercises.length}
                  </Text>
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

      </Container>
    </Box>
  )
} 