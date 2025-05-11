import {
  Box,
  Grid,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Card,
  CardBody,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  HStack,
  Progress,
  Image,
  Container,
  Button,
  Icon,
  Flex,
  Avatar,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
} from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useWorkouts } from '../hooks/useWorkouts'
import { useState, useRef, useCallback, useEffect } from 'react'
import { calculateAge } from './Profile'
import { Bar } from 'react-chartjs-2'
import 'chart.js/auto'
import React from 'react'
import { useWorkoutStore } from '../lib/workoutStore'
import { FaUser, FaRunning, FaUsers, FaCloudSun, FaCalendarAlt, FaTrophy, FaChartLine, FaRegClock, FaPlayCircle } from 'react-icons/fa'
import { CheckIcon } from '@chakra-ui/icons'

// Function to format date in "Month Day, Year" format
function formatDate(dateString: string): string {
  if (!dateString) return 'Not set';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Not set';
  
  // Get month name
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const month = monthNames[date.getMonth()];
  
  // Get day with ordinal suffix (1st, 2nd, 3rd, etc.)
  const day = date.getDate();
  let suffix = "th";
  if (day % 10 === 1 && day !== 11) suffix = "st";
  else if (day % 10 === 2 && day !== 12) suffix = "nd";
  else if (day % 10 === 3 && day !== 13) suffix = "rd";
  
  // Put it all together
  return `${month} ${day}${suffix}, ${date.getFullYear()}`;
}

// Create a skeleton card component for loading states
const SkeletonCard = ({ height = "330px" }: { height?: string }) => (
  <Card borderRadius="lg" overflow="hidden" boxShadow="md" h={height}>
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
  const [teamInfo, setTeamInfo] = useState<any>(null)
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)
  const [weather, setWeather] = useState({
    temp: '72',
    condition: 'Sunny',
    description: 'Perfect for running outdoors'
  })
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)

  // Debug profile structure
  React.useEffect(() => {
    if (profile) {
      console.log('Dashboard profile data:', profile);
      console.log('Role data:', profile.roleData);
      console.log('Events:', profile.roleData?.events);
    }
  }, [profile]);

  // Get all events as a formatted string
  const getFormattedEvents = () => {
    if (!profile?.roleData?.events || !Array.isArray(profile.roleData.events)) {
      return 'Not set';
    }
    
    return profile.roleData.events.join(', ') || 'None';
  };

  // Fetch team info if we have a team
  useEffect(() => {
    const fetchTeamInfo = async () => {
      if (!profile || !profile.team) return;
      
      setIsLoadingTeam(true);
      try {
        // This is a placeholder - implement actual team data fetching
        // For example: const teamData = await api.teams.getByName(profile.team);
        
        // For now, simulate some team data
        const teamData = {
          name: profile.team,
          accomplishments: [
            `${profile.team} placed 2nd in regional championship`,
            `3 ${profile.team} athletes qualified for state finals`,
            `New team record in 4x100m relay`
          ]
        };
        
        setTeamInfo(teamData);
      } catch (error) {
        console.error('Error fetching team info:', error);
      } finally {
        setIsLoadingTeam(false);
      }
    };
    
    fetchTeamInfo();
  }, [profile]);

  // Find ONLY today's workout - no next workout
  const today = new Date().toISOString().slice(0, 10)
  let todayWorkout = null
  if (workouts && workouts.length > 0) {
    // Debug workouts
    console.log('Today is:', today);
    console.log('All workouts:', workouts);
    
    // More flexible date matching (format might differ based on how it's stored)
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time part to compare dates only
    
    todayWorkout = workouts.find(workout => {
      // Try to parse the workout date and compare with today
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);
      return workoutDate.getTime() === currentDate.getTime();
    });
    
    // If no exact match, log for debugging
    console.log('Found today workout:', todayWorkout);
    
    // If still no workout, use the one with closest date
    if (!todayWorkout && workouts.length > 0) {
      // First check if any workout date is after or equal to today
      const futureWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() >= currentDate.getTime();
      });
      
      if (futureWorkouts.length > 0) {
        // Sort by closest date
        futureWorkouts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        todayWorkout = futureWorkouts[0];
        console.log('Using nearest future workout instead:', todayWorkout);
      }
    }
  }

  // Use our centralized workout store for progress tracking
  const workoutStore = useWorkoutStore();
  
  // Get progress for today's workout
  const todayProgress = todayWorkout ? workoutStore.getProgress(todayWorkout.id) : null;
  const todayProgressIdx = todayProgress ? todayProgress.currentExerciseIndex : 0;
  
  // Function to get completion count for a workout
  const getCompletionCount = (workoutId: string): number => {
    const progress = workoutStore.getProgress(workoutId);
    return progress?.completedExercises?.length || 0;
  };
  
  // Initialize workout in store if needed
  useEffect(() => {
    if (todayWorkout && todayWorkout.exercises) {
      // Debug current workout store
      workoutStore.debugStore();
      
      // If workout exists but not in store, initialize it
      const currentProgress = workoutStore.getProgress(todayWorkout.id);
      if (!currentProgress) {
        console.log(`Initializing workout ${todayWorkout.id} in store with ${todayWorkout.exercises.length} exercises`);
        workoutStore.updateProgress(todayWorkout.id, 0, todayWorkout.exercises.length);
      }
    }
  }, [todayWorkout, workoutStore]);

  // Mock stats for graph
  const statsData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Workouts',
        data: [1, 2, 1, 0, 2, 1, 0],
        backgroundColor: 'rgba(66, 153, 225, 0.6)',
      },
    ],
  }

  // --- Exercise Execution State (copied from Workouts) ---
  const [execModal, setExecModal] = useState({
    isOpen: false,
    workout: null as any,
    exerciseIdx: 0,
    timer: 0,
    running: false,
  })
  
  const [videoModal, setVideoModal] = useState({ isOpen: false, videoUrl: '', exerciseName: '' })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Reset progress if workout changes (but read from localStorage first)
  React.useEffect(() => {
    // Only update progress in the store if the modal was just closed
    // and we have a valid workout reference
    if (!execModal.isOpen && execModal.workout && todayWorkout && 
        execModal.workout.id === todayWorkout.id && 
        execModal.exerciseIdx > 0) { // Ensure we only update if we've completed at least one exercise
      
      // Use a ref to track if we've already done this update for this closing event
      // to prevent infinite loops of state updates
      const workoutId = execModal.workout.id;
      const currIdx = execModal.exerciseIdx;
      const totalExercises = execModal.workout.exercises.length;
      
      // Use setTimeout to break the React render cycle
      setTimeout(() => {
        workoutStore.updateProgress(workoutId, currIdx, totalExercises);
      }, 0);
    }
  }, [execModal.isOpen]); // Only depend on isOpen, not all the other state values

  // Timer logic
  React.useEffect(() => {
    if (execModal.isOpen && execModal.running) {
      timerRef.current = setInterval(() => {
        setExecModal((prev) => ({ ...prev, timer: prev.timer + 1 }))
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [execModal.isOpen, execModal.running])

  // Handle DONE button
  const handleDone = () => {
    if (!execModal.workout) return
    const nextIdx = execModal.exerciseIdx + 1
    
    // Mark current exercise as completed
    workoutStore.markExerciseCompleted(execModal.workout.id, execModal.exerciseIdx);
    
    if (nextIdx < execModal.workout.exercises.length) {
      // Update progress in store
      workoutStore.updateProgress(execModal.workout.id, nextIdx, execModal.workout.exercises.length, true);
      
      // Update modal state
      setExecModal({
        ...execModal,
        exerciseIdx: nextIdx,
        timer: 0,
        running: true,
      })
    } else {
      // Workout completed
      workoutStore.updateProgress(execModal.workout.id, execModal.workout.exercises.length, execModal.workout.exercises.length);
      
      // Close modal
      setExecModal({
        isOpen: false,
        workout: null,
        exerciseIdx: 0,
        timer: 0,
        running: false,
      })
    }
  }

  // Helper: get video URL for an exercise (mock for now)
  function getVideoUrl(exerciseName: string) {
    // Convert to lowercase for case-insensitive matching
    const exercise = exerciseName.toLowerCase();
    
    // Track & Field specific exercises
    if (exercise.includes('sprint') || exercise.includes('dash')) {
      return 'https://www.youtube.com/embed/6kNvYDTT-NU' // Sprint technique
    }
    if (exercise.includes('hurdle')) {
      return 'https://www.youtube.com/embed/6Wk65Jf_qSc' // Hurdle technique
    }
    if (exercise.includes('jump') || exercise.includes('leap')) {
      return 'https://www.youtube.com/embed/7O454Z8efs0' // Long jump technique
    }
    if (exercise.includes('shot put') || exercise.includes('throw')) {
      return 'https://www.youtube.com/embed/axc0FXuTdI8' // Shot put technique
    }
    if (exercise.includes('javelin')) {
      return 'https://www.youtube.com/embed/ZG3_Rfo6_VE' // Javelin technique
    }
    
    // Common strength exercises
    if (exercise.includes('squat')) {
      return 'https://www.youtube.com/embed/aclHkVaku9U' // Squats
    }
    if (exercise.includes('push') || exercise.includes('pushup')) {
      return 'https://www.youtube.com/embed/_l3ySVKYVJ8' // Pushups
    }
    if (exercise.includes('lunge')) {
      return 'https://www.youtube.com/embed/QOVaHwm-Q6U' // Lunges
    }
    if (exercise.includes('plank')) {
      return 'https://www.youtube.com/embed/pSHjTRCQxIw' // Planks
    }
    if (exercise.includes('deadlift')) {
      return 'https://www.youtube.com/embed/r4MzxtBKyNE' // Deadlifts
    }
    if (exercise.includes('bench press')) {
      return 'https://www.youtube.com/embed/SCVCLChPQFY' // Bench press
    }
    
    // Warmup/mobility exercises
    if (exercise.includes('stretch') || exercise.includes('dynamic')) {
      return 'https://www.youtube.com/embed/nPHfEnZD1Wk' // Dynamic stretching
    }
    if (exercise.includes('warm up') || exercise.includes('warmup')) {
      return 'https://www.youtube.com/embed/R0mMyV5OtcM' // Track warmup
    }
    
    // Default video if no match is found
    return 'https://www.youtube.com/embed/dQw4w9WgXcQ' // General workout video
  }

  // Helper function to get user's full name
  const getUserFullName = () => {
    if (profile?.first_name) {
      return profile.first_name;
    }
    return user?.email?.split('@')[0] || user?.email || 'Athlete';
  };

  // Fetch weather when profile updates
  useEffect(() => {
    const fetchWeather = async () => {
      if (!profile?.city) return;
      
      try {
        setIsLoadingWeather(true);
        // Note: In a real app, you would call a weather API here
        // This is just a simulation
        console.log(`Fetching weather for ${profile.city}`);
        
        // Simulate weather API response with some randomness
        const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Stormy'];
        const descriptions = [
          'Perfect for running outdoors',
          'Good conditions for training',
          'Consider indoor activities today',
          'Take caution if training outside',
          'Indoor training recommended'
        ];
        
        const randomTemp = Math.floor(Math.random() * 30) + 50; // 50-80 F
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        setWeather({
          temp: randomTemp.toString(),
          condition: randomCondition,
          description: randomDescription
        });
        
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        setIsLoadingWeather(false);
      }
    };

    if (profile) {
      fetchWeather();
    }
  }, [profile]);

  // Add a safe close handler function
  const handleModalClose = () => {
    // Stop the timer if it's running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset the modal state in a way that won't trigger the useEffect loop
    setExecModal({
      isOpen: false,
      workout: null,
      exerciseIdx: 0,
      timer: 0,
      running: false,
    });
  };

  return (
    <Box pt={8}>
      <Container maxW="container.xl">
        {/* Header with personal greeting */}
        <Box mb={8}>
          <Skeleton isLoaded={!profileLoading} fadeDuration={1}>
            <Heading as="h1" size="xl" mb={1}>
              Welcome back, {getUserFullName()}
            </Heading>
          </Skeleton>
          <Skeleton isLoaded={!profileLoading} fadeDuration={1}>
            <Text color="gray.600">
              {profile?.role === 'athlete' ? 'Athlete Dashboard' : 'Dashboard'}
            </Text>
          </Skeleton>
        </Box>

        {/* Dashboard Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
          {/* Today's Workout Card */}
          {(profileLoading || workoutsLoading) ? (
            <SkeletonCard />
          ) : (
            <Card 
              borderRadius="lg" 
              overflow="hidden" 
              boxShadow="md"
            >
              {/* Hero Background */}
              <Box 
                h="80px" 
                bg="linear-gradient(135deg, #4FD1C5 0%, #68D391 100%)" 
                position="relative"
              >
                <Flex 
                  position="absolute" 
                  top="50%" 
                  left="50%" 
                  transform="translate(-50%, -50%)"
                  bg="white" 
                  borderRadius="full" 
                  w="50px" 
                  h="50px" 
                  justifyContent="center" 
                  alignItems="center"
                  boxShadow="md"
                >
                  <Icon as={FaRunning} w={6} h={6} color="green.400" />
                </Flex>
              </Box>
              <CardBody pt={6}>
                <Heading size="sm" mb={4} textAlign="center">Today</Heading>
                {todayWorkout ? (
                  <VStack spacing={2} align="stretch">
                    <Text fontWeight="bold" textAlign="center">{todayWorkout.name}</Text>
                    <HStack justify="center">
                      <Text>{todayWorkout.type} • {todayWorkout.duration}</Text>
                    </HStack>
                    <HStack justify="center">
                      <Text fontSize="sm">{todayWorkout.date}</Text>
                      <Text fontSize="sm">{todayWorkout.time ? todayWorkout.time : 'Time: Not set'}</Text>
                    </HStack>
                    {todayWorkout.notes && (
                      <Text fontSize="sm" textAlign="center" color="gray.600" mt={1}>{todayWorkout.notes}</Text>
                    )}
                    
                    {/* Progress Bar */}
                    {todayWorkout.exercises && todayWorkout.exercises.length > 0 && (
                      <Box mt={3} mb={2}>
                        <Progress
                          value={execModal.isOpen && execModal.workout?.id === todayWorkout.id
                            ? ((execModal.exerciseIdx) / todayWorkout.exercises.length) * 100
                            : (todayProgressIdx / todayWorkout.exercises.length) * 100}
                          size="sm"
                          colorScheme="green"
                          borderRadius="md"
                        />
                        <Text fontSize="xs" textAlign="center" mt={1}>
                          {execModal.isOpen && execModal.workout?.id === todayWorkout.id
                            ? `Exercise ${Math.min(execModal.exerciseIdx + 1, todayWorkout.exercises.length)} of ${todayWorkout.exercises.length}`
                            : todayProgressIdx > 0
                              ? `Exercise ${Math.min(todayProgressIdx + 1, todayWorkout.exercises.length)} of ${todayWorkout.exercises.length}`
                              : `Exercise 1 of ${todayWorkout.exercises.length}`}
                        </Text>
                      </Box>
                    )}
                    
                    <Box mt={4} display="flex" justifyContent="center">
                      <Button
                        colorScheme={todayProgressIdx >= todayWorkout.exercises?.length ? "green" : "blue"}
                        size="md"
                        onClick={() => {
                          // If workout is complete and user clicks "Done", reset progress
                          if (todayProgressIdx >= todayWorkout.exercises.length) {
                            // Reset progress
                            workoutStore.updateProgress(todayWorkout.id, 0, todayWorkout.exercises.length);
                          }
                          
                          setExecModal({
                            isOpen: true,
                            workout: todayWorkout,
                            exerciseIdx: todayProgressIdx >= todayWorkout.exercises.length ? 0 : todayProgressIdx,
                            timer: 0,
                            running: true,
                          });
                        }}
                      >
                        {todayProgressIdx >= todayWorkout.exercises?.length 
                          ? 'Done' 
                          : (todayProgressIdx > 0 && todayProgressIdx < todayWorkout.exercises.length 
                            ? `Continue (${todayProgressIdx}/${todayWorkout.exercises.length})` 
                            : 'Start Workout')}
                      </Button>
                    </Box>
                  </VStack>
                ) : (
                  <Text textAlign="center">No workout scheduled for today.</Text>
                )}
              </CardBody>
            </Card>
          )}

          {/* Team Card */}
          {profileLoading ? (
            <SkeletonCard />
          ) : (
            <Card 
              borderRadius="lg" 
              overflow="hidden" 
              boxShadow="md"
            >
              {/* Hero Background */}
              <Box 
                h="80px" 
                bg="linear-gradient(135deg, #805AD5 0%, #B794F4 100%)" 
                position="relative"
              >
                <Flex 
                  position="absolute" 
                  top="50%" 
                  left="50%" 
                  transform="translate(-50%, -50%)"
                  bg="white" 
                  borderRadius="full" 
                  w="50px" 
                  h="50px" 
                  justifyContent="center" 
                  alignItems="center"
                  boxShadow="md"
                >
                  <Icon as={FaUsers} w={6} h={6} color="purple.500" />
                </Flex>
              </Box>
              <CardBody pt={6}>
                <Heading size="sm" mb={4} textAlign="center">Team</Heading>
                <VStack spacing={2} align="start">
                  <HStack w="100%">
                    <Text fontWeight="medium" minW="80px">Team:</Text>
                    <Text>{profile?.team || 'Not set'}</Text>
                  </HStack>
                  <HStack w="100%" alignItems="flex-start">
                    <Text fontWeight="medium" minW="80px">Events:</Text>
                    <Text>{getFormattedEvents()}</Text>
                  </HStack>
                  <HStack w="100%">
                    <Text fontWeight="medium" minW="80px">School:</Text>
                    <Text>{profile?.school || 'Not set'}</Text>
                  </HStack>
                  <HStack w="100%">
                    <Text fontWeight="medium" minW="80px">Coach:</Text>
                    <Text>{profile?.coach || 'Not assigned'}</Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Weather Card */}
          {profileLoading || isLoadingWeather ? (
            <SkeletonCard height="280px" />
          ) : (
            <Card 
              borderRadius="lg" 
              overflow="hidden" 
              boxShadow="md"
            >
              {/* Hero Background */}
              <Box 
                h="80px" 
                bg="linear-gradient(135deg, #DD6B20 0%, #F6AD55 100%)" 
                position="relative"
              >
                <Flex 
                  position="absolute" 
                  top="50%" 
                  left="50%" 
                  transform="translate(-50%, -50%)"
                  bg="white" 
                  borderRadius="full" 
                  w="50px" 
                  h="50px" 
                  justifyContent="center" 
                  alignItems="center"
                  boxShadow="md"
                >
                  <Icon as={FaCloudSun} w={6} h={6} color="orange.500" />
                </Flex>
              </Box>
              <CardBody pt={6}>
                <Heading size="sm" mb={4} textAlign="center">Weather</Heading>
                <VStack spacing={1}>
                  <Text fontSize="lg">{profile?.city || 'Location not set'}{profile?.state ? `, ${profile.state}` : ''}</Text>
                  <Text fontSize="4xl" fontWeight="bold">{weather.temp}°F</Text>
                  <Text color="gray.600">{weather.condition}</Text>
                  <Text fontSize="sm" color="gray.500">{weather.description}</Text>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Upcoming Events Card */}
          {profileLoading ? (
            <SkeletonCard />
          ) : (
            <Card 
              borderRadius="lg" 
              overflow="hidden" 
              boxShadow="md"
            >
              {/* Hero Background */}
              <Box 
                h="80px" 
                bg="linear-gradient(135deg, #E53E3E 0%, #FC8181 100%)" 
                position="relative"
              >
                <Flex 
                  position="absolute" 
                  top="50%" 
                  left="50%" 
                  transform="translate(-50%, -50%)"
                  bg="white" 
                  borderRadius="full" 
                  w="50px" 
                  h="50px" 
                  justifyContent="center" 
                  alignItems="center"
                  boxShadow="md"
                >
                  <Icon as={FaCalendarAlt} w={6} h={6} color="red.500" />
                </Flex>
              </Box>
              <CardBody pt={6}>
                <Heading size="sm" mb={4} textAlign="center">Upcoming Events</Heading>
                <VStack spacing={2} align="start">
                  <Text fontWeight="bold">Annual Track Championship</Text>
                  <HStack w="100%">
                    <Text fontWeight="medium" minW="80px">Date:</Text>
                    <Text>2023-12-10</Text>
                  </HStack>
                  <HStack w="100%">
                    <Text fontWeight="medium" minW="80px">Time:</Text>
                    <Text>9:00 AM</Text>
                  </HStack>
                  <HStack w="100%">
                    <Text fontWeight="medium" minW="80px">Location:</Text>
                    <Text>Central Stadium, New York</Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Team Performance Card */}
          {profileLoading ? (
            <SkeletonCard height="350px" />
          ) : (
            <Card 
              borderRadius="lg" 
              overflow="hidden" 
              boxShadow="md"
              gridColumn={{ lg: 'span 2' }}
            >
              {/* Hero Background */}
              <Box 
                h="80px" 
                bg="linear-gradient(135deg, #D69E2E 0%, #F6E05E 100%)" 
                position="relative"
              >
                <Flex 
                  position="absolute" 
                  top="50%" 
                  left="50%" 
                  transform="translate(-50%, -50%)"
                  bg="white" 
                  borderRadius="full" 
                  w="50px" 
                  h="50px" 
                  justifyContent="center" 
                  alignItems="center"
                  boxShadow="md"
                >
                  <Icon as={FaTrophy} w={6} h={6} color="yellow.500" />
                </Flex>
              </Box>
              <CardBody pt={6}>
                <Heading size="sm" mb={4} textAlign="center">Team Milestones</Heading>
                {isLoadingTeam ? (
                  <VStack spacing={2} align="start">
                    <Skeleton height="20px" width="100%" />
                    <Skeleton height="20px" width="100%" />
                    <Skeleton height="20px" width="100%" />
                  </VStack>
                ) : teamInfo?.accomplishments?.length > 0 ? (
                  <VStack spacing={2} align="start">
                    {teamInfo.accomplishments.map((milestone: string, i: number) => (
                      <HStack key={i} spacing={2}>
                        <Box w="3px" h="3px" bg="gray.400" borderRadius="full" mt="2px" />
                        <Text>{milestone}</Text>
                      </HStack>
                    ))}
                  </VStack>
                ) : (
                  <Text textAlign="center" color="gray.500">No team milestones available</Text>
                )}
              </CardBody>
            </Card>
          )}
        </SimpleGrid>

        {/* Graph - Now full width */}
        <Card 
          my={10}
          borderRadius="lg" 
          overflow="hidden" 
          boxShadow="md"
        >
          {/* Hero Background */}
          <Box 
            h="80px" 
            bg="linear-gradient(135deg, #2C5282 0%, #4299E1 100%)" 
            position="relative"
          >
            <Flex 
              position="absolute" 
              top="50%" 
              left="50%" 
              transform="translate(-50%, -50%)"
              bg="white" 
              borderRadius="full" 
              w="50px" 
              h="50px" 
              justifyContent="center" 
              alignItems="center"
              boxShadow="md"
            >
              <Icon as={FaChartLine} w={6} h={6} color="blue.700" />
            </Flex>
          </Box>
          <CardBody pt={6}>
            <Heading size="md" mb={8} textAlign="center">Weekly Workout Stats</Heading>
              {/* Placeholder Bar Chart */}
              <Box h="250px">
                <Bar data={statsData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              </Box>
            </CardBody>
          </Card>

        {/* --- Exercise Execution Modal --- */}
        <Modal isOpen={execModal.isOpen} onClose={handleModalClose} isCentered>
          <ModalOverlay />
          <ModalContent borderRadius="lg" overflow="hidden">
            {/* Hero Background */}
            <Box 
              h="80px" 
              bg={execModal.running ? "linear-gradient(135deg, #38A169 0%, #68D391 100%)" : "linear-gradient(135deg, #4299E1 0%, #90CDF4 100%)"} 
              position="relative"
            >
              <Flex 
                position="absolute" 
                top="50%" 
                left="50%" 
                transform="translate(-50%, -50%)"
                bg="white" 
                borderRadius="full" 
                w="50px" 
                h="50px" 
                justifyContent="center" 
                alignItems="center"
                boxShadow="md"
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
            <ModalCloseButton top="85px" onClick={handleModalClose} />
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
                      <Text color="gray.500" fontSize="sm">Sets</Text>
                      <Text fontWeight="bold">{execModal.workout.exercises[execModal.exerciseIdx]?.sets}</Text>
                    </VStack>
                    <VStack>
                      <Text color="gray.500" fontSize="sm">Reps</Text>
                      <Text fontWeight="bold">{execModal.workout.exercises[execModal.exerciseIdx]?.reps}</Text>
                    </VStack>
                    {execModal.workout.exercises[execModal.exerciseIdx]?.weight && (
                      <VStack>
                        <Text color="gray.500" fontSize="sm">Weight</Text>
                        <Text fontWeight="bold">{execModal.workout.exercises[execModal.exerciseIdx]?.weight} kg</Text>
                      </VStack>
                    )}
                  </HStack>
                  
                  <Box 
                    bg={execModal.running ? "green.50" : "blue.50"} 
                    p={4} 
                    borderRadius="full" 
                    boxShadow="sm" 
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
                  
                  {/* Main action buttons */}
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
                  
                  <Text fontSize="sm" color="gray.500" mt={4} textAlign="center">
                    Exercise {execModal.exerciseIdx + 1} of {execModal.workout.exercises.length}
                  </Text>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
        {/* --- End Exercise Execution Modal --- */}

        {/* --- Exercise Video Modal --- */}
        <Modal isOpen={videoModal.isOpen} onClose={() => setVideoModal({ ...videoModal, isOpen: false })} isCentered size="xl">
          <ModalOverlay />
          <ModalContent borderRadius="lg" overflow="hidden">
            {/* Hero Background */}
            <Box 
              h="80px" 
              bg="linear-gradient(135deg, #DD6B20 0%, #F6AD55 100%)" 
              position="relative"
            >
              <Flex 
                position="absolute" 
                top="50%" 
                left="50%" 
                transform="translate(-50%, -50%)"
                bg="white" 
                borderRadius="full" 
                w="50px" 
                h="50px" 
                justifyContent="center" 
                alignItems="center"
                boxShadow="md"
              >
                <Icon as={FaPlayCircle} w={6} h={6} color="orange.500" />
              </Flex>
            </Box>
            
            <ModalHeader textAlign="center" pt={8}>How to: {videoModal.exerciseName}</ModalHeader>
            <ModalCloseButton top="85px" onClick={() => setVideoModal({ ...videoModal, isOpen: false })} />
            <ModalBody pb={6} display="flex" flexDirection="column" alignItems="center">
              <Box w="100%" h="0" pb="56.25%" position="relative" borderRadius="md" overflow="hidden" boxShadow="md">
                <iframe
                  src={videoModal.videoUrl}
                  title={`${videoModal.exerciseName} tutorial`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>
        {/* --- End Exercise Video Modal --- */}

        {/* Debug Panel - Only shown in development */}
        {process.env.NODE_ENV !== 'production' && (
          <Card mt={8} borderColor="red.200" borderWidth={1}>
            <CardBody>
              <Heading size="sm" mb={2}>Debug Information</Heading>
              <Text><b>Today Workout ID:</b> {todayWorkout?.id || 'None'}</Text>
              <Text><b>Progress Index:</b> {todayProgressIdx}</Text>
              <Text><b>Today's Date:</b> {new Date().toISOString()}</Text>
              <Button 
                size="sm" 
                colorScheme="red" 
                mt={2} 
                onClick={() => {
                  // Clear workout progress from localStorage
                  if (todayWorkout?.id) {
                    localStorage.removeItem(`workout-progress-${todayWorkout.id}`);
                    alert('Progress cleared! Refresh the page to see changes.');
                  } else {
                    alert('No workout ID available to clear progress.');
                  }
                }}
              >
                Clear Progress
              </Button>
              <Button 
                size="sm" 
                colorScheme="blue" 
                mt={2} 
                ml={2}
                onClick={() => {
                  // Open debug page in new tab
                  window.open('/debug/local-storage.html', '_blank');
                }}
              >
                View LocalStorage
              </Button>
            </CardBody>
          </Card>
        )}
      </Container>
    </Box>
  )
} 