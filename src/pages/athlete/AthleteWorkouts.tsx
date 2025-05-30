import {
  Box, Heading, Text, Spinner, Alert, AlertIcon, Stack, Card, CardBody, Button, Flex, HStack, Progress, Tag, VStack, Divider, Center, Icon, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, IconButton, SimpleGrid, Container, Tooltip, useDisclosure, Tabs, TabList, TabPanels, Tab, TabPanel, useToast, useColorModeValue
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye, FaPlayCircle, FaRunning, FaDumbbell, FaRegClock, FaCalendarAlt, FaListUl, FaLeaf, FaRedo } from 'react-icons/fa';
import { CheckIcon, EditIcon } from '@chakra-ui/icons'; // For exec modal
import { FiCalendar, FiClock } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { useWorkoutStore } from '../../lib/workoutStore'; // Import the store
import { WorkoutCard } from '../../components/WorkoutCard'; // Import our shared card component
import { supabase } from '../../lib/supabase';
import { RepeatIcon } from '@chakra-ui/icons';
import { dateUtils } from '../../utils/date';
import { useWorkoutsRealtime } from '../../hooks/useWorkoutsRealtime';
import { handleWorkoutCompletion } from '../../services/integrationService';
import { useFeedback } from '../../components/FeedbackProvider'; // Import the feedback hook
import { MobileHeader } from '../../components';

// Consistent Exercise type
interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  rest?: number;
  distance?: number;
  notes?: string;
}

// Consistent Workout type (matching api.ts and Workouts.tsx structure)
interface Workout {
  id: string;
  user_id: string; // Creator
  name: string;
  type: string;
  date: string; // Planned date
  duration: string;
  time?: string;
  notes: string;
  created_at: string; // When defined
  exercises: Exercise[];
  // Progress will be handled by the store
}

// Helper: get video URL for an exercise based on its name (copied from Workouts.tsx)
function getVideoUrl(exerciseName: string) {
  const exercise = exerciseName.toLowerCase();
  if (exercise.includes('sprint') || exercise.includes('dash')) return 'https://www.youtube.com/embed/6kNvYDTT-NU';
  if (exercise.includes('hurdle')) return 'https://www.youtube.com/embed/6Wk65Jf_qSc';
  if (exercise.includes('jump') || exercise.includes('leap')) return 'https://www.youtube.com/embed/7O454Z8efs0';
  if (exercise.includes('shot put') || exercise.includes('throw')) return 'https://www.youtube.com/embed/axc0FXuTdI8';
  if (exercise.includes('javelin')) return 'https://www.youtube.com/embed/ZG3_Rfo6_VE';
  if (exercise.includes('squat')) return 'https://www.youtube.com/embed/aclHkVaku9U';
  if (exercise.includes('push') || exercise.includes('pushup')) return 'https://www.youtube.com/embed/_l3ySVKYVJ8';
  if (exercise.includes('lunge')) return 'https://www.youtube.com/embed/QOVaHwm-Q6U';
  if (exercise.includes('plank')) return 'https://www.youtube.com/embed/pSHjTRCQxIw';
  if (exercise.includes('deadlift')) return 'https://www.youtube.com/embed/r4MzxtBKyNE';
  if (exercise.includes('bench press')) return 'https://www.youtube.com/embed/SCVCLChPQFY';
  if (exercise.includes('stretch') || exercise.includes('dynamic')) return 'https://www.youtube.com/embed/nPHfEnZD1Wk';
  if (exercise.includes('warm up') || exercise.includes('warmup')) return 'https://www.youtube.com/embed/R0mMyV5OtcM';
  return 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // Default
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

// Helper to get the current date in YYYY-MM-DD format
function getCurrentDate(): string {
  return dateUtils.localDateString(new Date());
}

export function AthleteWorkouts() {
  // Theme-aware colors - ALL useColorModeValue calls MUST be at the top level
  const noWorkoutsColor = useColorModeValue('gray.500', 'gray.300');
  const exerciseDetailColor = useColorModeValue('gray.500', 'gray.300');
  const exerciseCountColor = useColorModeValue('gray.500', 'gray.300');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const errorTextColor = useColorModeValue('red.600', 'red.300');
  const headingColor = useColorModeValue('gray.700', 'gray.200');
  const modalHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const modalHeaderBorderColor = useColorModeValue('gray.200', 'gray.600');
  const modalTextColor = useColorModeValue('gray.500', 'gray.400');
  const modalHeadingColor = useColorModeValue('gray.800', 'white');
  const modalSpanColor = useColorModeValue('gray.500', 'gray.400');
  const modalProgressBg = useColorModeValue('gray.100', 'gray.700');
  const modalProgressBorderColor = useColorModeValue('gray.200', 'gray.600');
  const modalProgressTextColor = useColorModeValue('gray.600', 'gray.300');
  const modalIconBg = useColorModeValue('white', 'gray.800');
  
  const { user } = useAuth();
  const workoutStore = useWorkoutStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const today = getCurrentDate();
  const toast = useToast();
  const { triggerFeedback, recordAppUsage } = useFeedback(); // Use the feedback hook

  const [execModal, setExecModal] = useState({
    isOpen: false,
    workout: null as Workout | null, // Typed workout
    exerciseIdx: 0,
    timer: 0,
    running: false,
  });
  const [videoModal, setVideoModal] = useState({ isOpen: false, videoUrl: '', exerciseName: '' });

  // Add a state to track if user has completed their first workout
  const [hasCompletedFirstWorkout, setHasCompletedFirstWorkout] = useState(() => {
    // Check localStorage to see if user has completed a workout before
    return localStorage.getItem('hasCompletedFirstWorkout') === 'true';
  });

  const { 
    data: assignedWorkouts, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useQuery<Workout[], Error>({
    queryKey: ['athleteAssignedWorkouts', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for fetching workouts');
        return [];
      }
      
      console.log('Fetching assigned workouts for athlete:', user.id);
      try {
        const workouts = await api.workouts.getAssignedToAthlete(user.id);
        console.log('Received assigned workouts:', workouts?.length || 0);
        return workouts;
      } catch (err) {
        console.error('Error fetching assigned workouts:', err);
        throw err;
      }
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 60000, // Consider data stale after 1 minute
  });

  // Record app usage on component mount
  useEffect(() => {
    recordAppUsage();
  }, [recordAppUsage]);

  // Refetch workouts when component mounts
  useEffect(() => {
    if (user?.id) {
      console.log('Athlete component mounted, refetching workouts');
      refetch();
    }
  }, [user?.id]);

  // Modify the initialization useEffect to include syncing with database completed status
  useEffect(() => {
    if (assignedWorkouts && assignedWorkouts.length > 0) {
      // First fetch the completed status for all workouts from the database
      const syncWithDatabase = async () => {
        if (!user?.id) return;
        
        try {
          console.log('Syncing workoutStore with database completion status');
          const { data: assignments, error } = await supabase
            .from('athlete_workouts')
            .select('workout_id, status')
            .eq('athlete_id', user.id);
            
          if (error) {
            console.error('Error fetching assignment statuses:', error);
            return;
          }
          
          if (assignments) {
            assignments.forEach(assignment => {
              const workout = assignedWorkouts.find(w => w.id === assignment.workout_id);
              if (!workout) return;
              
              const totalExercises = workout.exercises?.length || 0;
              
              // If workout is completed in database, mark all exercises as completed in store
              if (assignment.status === 'completed') {
                console.log(`Setting workout ${assignment.workout_id} as fully completed`);
                // Create an array of all exercise indices
                const allExercises = Array.from({ length: totalExercises }, (_, i) => i);
                // Mark all exercises as completed
                allExercises.forEach(idx => {
                  workoutStore.markExerciseCompleted(assignment.workout_id, idx);
                });
                // Update progress to show as complete
                workoutStore.updateProgress(assignment.workout_id, totalExercises, totalExercises);
              } 
              // For in_progress workouts, just initialize with zero or previously stored values
              else if (assignment.status === 'in_progress') {
                // Get progress from the local store, but don't override with database data
                // since we're not storing per-exercise completion anymore
                const progress = workoutStore.getProgress(assignment.workout_id);
                if (!progress) {
                  // Initialize with zero completed
                }
              }
            });
          }
        } catch (syncErr) {
          console.error('Error syncing with database:', syncErr);
        }
      };
      
      syncWithDatabase();
    }
  }, [assignedWorkouts, user?.id, workoutStore]);

  const getCompletionCount = (workoutId: string): number => {
    const progress = workoutStore.getProgress(workoutId);
    return progress?.completedExercises?.length || 0;
  };

  const handleGo = (workout: Workout, idx: number) => {
    setExecModal({
      isOpen: true,
      workout,
      exerciseIdx: idx,
      timer: 0,
      running: true,
    });
  };

  // Filter workouts for today
  const todaysWorkouts = assignedWorkouts?.filter(workout => 
    formatDateForComparison(workout.date) === today
  ) || [];

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

  const handleDone = async () => {
    if (!execModal.workout) return;
    
    const workout = execModal.workout;
    const exerciseIdx = execModal.exerciseIdx;
    const totalExercises = workout.exercises.length;
    
    // Mark this exercise as completed
    workoutStore.markExerciseCompleted(workout.id, exerciseIdx);
    
    // Get the current completion count for this workout
    const completedCount = getCompletionCount(workout.id) + 1; // +1 for the current exercise
    
    // Update progress in store
    workoutStore.updateProgress(workout.id, completedCount, totalExercises);
    
    // Update database status if it's the last exercise
    let workoutCompleted = false;
    if (completedCount >= totalExercises) {
      // Workout is now fully completed
      workoutCompleted = true;
      
      try {
        console.log(`Marking workout ${workout.id} as completed in database`);
        const { error } = await supabase
          .from('athlete_workouts')
          .update({ status: 'completed' })
          .eq('workout_id', workout.id)
          .eq('athlete_id', user?.id);
          
        if (error) {
          console.error('Error marking workout as completed:', error);
          toast({
            title: 'Error',
            description: 'There was an error saving your completed workout. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } else {
          // Call any integration services that need to know about workout completion
          await handleWorkoutCompletion(user?.id, workout.id, workout);
          
          toast({
            title: 'Workout Completed!',
            description: 'Great job completing your workout. Your progress has been saved.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          
          // Check if this is the user's first completed workout
          if (!hasCompletedFirstWorkout) {
            setHasCompletedFirstWorkout(true);
            localStorage.setItem('hasCompletedFirstWorkout', 'true');
            
            // Trigger the feedback prompt for first success
            setTimeout(() => {
              triggerFeedback('first_success');
            }, 1500); // Delay slightly to show completion toast first
          }
        }
      } catch (err) {
        console.error('Error in workout completion process:', err);
      }
    } else {
      // Move to the next exercise
      setExecModal({
        ...execModal,
        exerciseIdx: exerciseIdx + 1,
        timer: 0,
        running: false
      });
      return; // Don't close modal, go to next exercise
    }
    
    // Close the modal and reset if we're done
    handleModalClose();
    
    // Refresh query cache to update UI
    const queryClient = useQueryClient();
    queryClient.invalidateQueries({ queryKey: ['athleteAssignedWorkouts', user?.id] });
  };

  const renderWorkoutCards = (workouts: Workout[]) => {
    if (!workouts || workouts.length === 0) {
      return (
        <Box 
          p={{ base: 4, md: 5 }} 
          borderWidth="1px" 
          borderRadius="lg" 
          shadow="sm" 
          textAlign="center" 
          mt={{ base: 3, md: 4 }}
          bg={cardBg}
          borderColor={cardBorderColor}
        >
          <Text 
            fontSize={{ base: 'md', md: 'lg' }} 
            color={noWorkoutsColor}
          >
            No workouts found.
          </Text>
        </Box>
      );
    }

    return (
      <SimpleGrid 
        columns={{ base: 1, md: 2, lg: 3 }} 
        spacing={{ base: 4, md: 6 }} 
        alignItems="stretch"
      >
        {workouts.map((workout) => {
          // Get completion data from workoutStore
          const completedCount = getCompletionCount(workout.id);
          const totalExercises = workout.exercises?.length || 0;
          
          const progressPercent = totalExercises > 0 
            ? (completedCount / totalExercises) * 100 
            : 0;
          
          const progress = {
            completed: completedCount,
            total: totalExercises,
            percentage: progressPercent
          };

          return (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              isCoach={false}
              progress={progress}
              onStart={() => handleGo(workout, completedCount === totalExercises ? 0 : completedCount)}
              onRefresh={() => forceRefreshWorkoutProgress(workout.id)}
              showRefresh={true}
            />
          );
        })}
      </SimpleGrid>
    );
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      console.log("Manual refresh initiated by athlete");
      
      // Use the real-time hook to force refresh all related queries
      forceRefresh();
      
      // Also refetch the main data
      await refetch();
      
      // Resync all workout progress data
      if (assignedWorkouts && assignedWorkouts.length > 0 && user?.id) {
        console.log("Resyncing all workout progress data");
        
        // Get all assignments with their status
        const { data: assignments, error } = await supabase
          .from('athlete_workouts')
          .select('workout_id, status, completed_exercises')
          .eq('athlete_id', user.id);
          
        if (error) {
          console.error("Error fetching assignments for sync:", error);
        } else if (assignments) {
          // Process each assignment
          for (const assignment of assignments) {
            const workout = assignedWorkouts.find(w => w.id === assignment.workout_id);
            if (!workout) continue;
            
            const totalExercises = workout.exercises?.length || 0;
            
            // If marked as completed, update the store
            if (assignment.status === 'completed') {
              for (let i = 0; i < totalExercises; i++) {
                workoutStore.markExerciseCompleted(assignment.workout_id, i);
              }
              workoutStore.updateProgress(assignment.workout_id, totalExercises, totalExercises);
            } 
            // Otherwise sync completed_exercises
            else if (assignment.completed_exercises && assignment.completed_exercises.length > 0) {
              assignment.completed_exercises.forEach((idx: number) => {
                workoutStore.markExerciseCompleted(assignment.workout_id, idx);
              });
              workoutStore.updateProgress(
                assignment.workout_id, 
                assignment.completed_exercises.length, 
                totalExercises
              );
            }
          }
        }
      }
      
      toast({
        title: "Workouts refreshed",
        description: "Your workout data has been updated",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error("Error refreshing workouts:", error);
      toast({
        title: "Error refreshing workouts",
        description: "Could not refresh workout data. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle safe modal closing to prevent infinite update loops
  const handleModalClose = () => {
    // Stop the timer if it's running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset the modal state completely
    setExecModal({
      isOpen: false,
      workout: null,
      exerciseIdx: 0,
      timer: 0,
      running: false,
    });
    
    setVideoModal({
      isOpen: false,
      videoUrl: '',
      exerciseName: ''
    });
  };

  // Set up real-time updates for workouts
  const workoutIds = assignedWorkouts?.map(w => w.id) || [];
  const { isSubscribed, lastUpdate, forceRefresh } = useWorkoutsRealtime({
    athleteId: user?.id,
    workoutIds,
    enabled: !!user?.id
  });
  
  // Log real-time status in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Real-time subscription status: ${isSubscribed ? 'Active' : 'Inactive'}`);
      if (lastUpdate) {
        console.log(`Last real-time update: ${lastUpdate.toLocaleTimeString()}`);
      }
    }
  }, [isSubscribed, lastUpdate]);

  // Add a new function to force refresh a specific workout's progress
  const forceRefreshWorkoutProgress = async (workoutId: string) => {
    if (!user?.id) return;
    
    try {
      console.log(`Forcing refresh of workout progress for ${workoutId}`);
      
      // Get the workout assignment from the database
      const { data: assignment, error } = await supabase
        .from('athlete_workouts')
        .select('status, completed_exercises')
        .eq('athlete_id', user.id)
        .eq('workout_id', workoutId)
        .single();
        
      if (error) {
        console.error('Error fetching workout assignment:', error);
        return;
      }
      
      if (assignment) {
        const workout = assignedWorkouts?.find(w => w.id === workoutId);
        if (!workout) return;
        
        const totalExercises = workout.exercises?.length || 0;
        
        // If marked as completed, update the store to show as fully completed
        if (assignment.status === 'completed') {
          // Create an array of all exercise indices
          const allExercises = Array.from({ length: totalExercises }, (_, i) => i);
          // Mark all exercises as completed
          allExercises.forEach(idx => {
            workoutStore.markExerciseCompleted(workoutId, idx);
          });
          // Update progress to show as complete
          workoutStore.updateProgress(workoutId, totalExercises, totalExercises);
          
          toast({
            title: 'Workout Progress Updated',
            description: `"${workout.name}" is marked as completed`,
            status: 'success',
            duration: 3000,
            isClosable: true
          });
        } 
        // Otherwise sync with completed_exercises
        else if (assignment.completed_exercises && assignment.completed_exercises.length > 0) {
          // Mark specific exercises as completed
          assignment.completed_exercises.forEach((idx: number) => {
            workoutStore.markExerciseCompleted(workoutId, idx);
          });
          // Update progress
          workoutStore.updateProgress(
            workoutId, 
            assignment.completed_exercises.length, 
            totalExercises
          );
          
          toast({
            title: 'Workout Progress Updated',
            description: `"${workout.name}" progress synced from database`,
            status: 'info',
            duration: 3000,
            isClosable: true
          });
        }
      }
    } catch (err: any) {
      console.error('Error refreshing workout progress:', err);
      toast({
        title: 'Error',
        description: 'Failed to refresh workout progress',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  return (
    <Container maxW="container.xl" px={{ base: 4, md: 6 }} py={{ base: 6, md: 4 }} data-testid="athlete-workouts">
      {/* Mobile Header - Now using reusable component */}
      <MobileHeader
        title="Workouts"
        subtitle="Your Training Schedule"
        isLoading={isLoading}
      />

      {/* Desktop Header - keep existing */}
      <Box display={{ base: "none", lg: "block" }} mb={6}>
        <Heading size="lg" mb={2}>
          Workouts
        </Heading>
        <Text color={textColor}>
          Your Training Schedule
        </Text>
      </Box>

      {/* Content with mobile spacing */}
      <Box mt={{ base: "20px", lg: 0 }}>
        {isLoading && (
          <Center py={{ base: 8, md: 10 }}>
            <Spinner 
              thickness="4px" 
              speed="0.65s" 
              emptyColor="gray.200" 
              color="blue.500" 
              size={{ base: "lg", md: "xl" }} 
            />
          </Center>
        )}

        {isError && (
          <Alert status="error" mb={{ base: 3, md: 4 }} borderRadius="lg">
            <AlertIcon />
            <Box>
              <Text fontWeight="medium">Error fetching assigned workouts</Text>
              <Text fontSize="sm" color={errorTextColor}>
                {error?.message}
              </Text>
            </Box>
          </Alert>
        )}

        {!isLoading && !isError && (
          <Box>
            <Heading 
              size={{ base: 'sm', md: 'md' }} 
              mb={{ base: 3, md: 4 }}
              color={headingColor}
            >
              All Workouts ({assignedWorkouts?.length || 0})
            </Heading>
            {renderWorkoutCards(assignedWorkouts || [])}
          </Box>
        )}
        
        {/* Exercise Execution Modal - Redesigned with modern styling */}
        <Modal isOpen={execModal.isOpen} onClose={handleModalClose} isCentered size="md">
          <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
          <ModalContent 
            borderRadius="2xl" 
            overflow="hidden" 
            boxShadow="2xl"
            bg={cardBg}
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
                bg={modalIconBg} 
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
                onClick={handleModalClose}
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
                      color={modalTextColor}
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Exercise Execution
                    </Text>
                    <Heading 
                      size="lg" 
                      textAlign="center"
                      color={modalHeadingColor}
                      lineHeight="shorter"
                    >
                      {execModal.workout.exercises[execModal.exerciseIdx].name}
                    </Heading>
                  </VStack>

                  {/* Exercise Details Card */}
                  <Box 
                    bg={modalHeaderBg} 
                    borderRadius="xl" 
                    p={6} 
                    w="100%"
                    border="1px solid"
                    borderColor={modalHeaderBorderColor}
                  >
                    <HStack spacing={6} justify="center">
                      <VStack spacing={1}>
                        <Text 
                          color={modalTextColor} 
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
                          color={modalHeadingColor}
                        >
                          {execModal.workout.exercises[execModal.exerciseIdx].sets}
                        </Text>
                      </VStack>
                      
                      <Divider orientation="vertical" h="50px" />
                      
                      <VStack spacing={1}>
                        <Text 
                          color={modalTextColor} 
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
                          color={modalHeadingColor}
                        >
                          {execModal.workout.exercises[execModal.exerciseIdx].reps}
                        </Text>
                      </VStack>
                      
                      {execModal.workout.exercises[execModal.exerciseIdx].weight && (
                        <>
                          <Divider orientation="vertical" h="50px" />
                          <VStack spacing={1}>
                            <Text 
                              color={modalTextColor} 
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
                              color={modalHeadingColor}
                            >
                              {execModal.workout.exercises[execModal.exerciseIdx].weight}
                              <Text as="span" fontSize="lg" color={modalSpanColor}>
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
                        videoUrl: getVideoUrl(execModal.workout!.exercises[execModal.exerciseIdx].name), 
                        exerciseName: execModal.workout!.exercises[execModal.exerciseIdx].name || '' 
                      })}
                      borderRadius="xl"
                      px={6}
                      fontWeight="medium"
                      _hover={{ bg: 'purple.50', transform: 'translateY(-1px)' }}
                      transition="all 0.2s"
                    >
                      Watch Tutorial
                    </Button>
                  </VStack>

                  {/* Progress Indicator */}
                  <Box 
                    bg={modalProgressBg} 
                    borderRadius="lg" 
                    px={4} 
                    py={2}
                    border="1px solid"
                    borderColor={modalProgressBorderColor}
                  >
                    <Text 
                      fontSize="sm" 
                      color={modalProgressTextColor} 
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

        {/* Video Modal - Copied from Workouts.tsx */}
        <Modal isOpen={videoModal.isOpen} onClose={() => setVideoModal({ ...videoModal, isOpen: false })} isCentered size="xl">
          <ModalOverlay />
          <ModalContent borderRadius="lg" overflow="hidden">
            <Box h="80px" bg="linear-gradient(135deg, #DD6B20 0%, #F6AD55 100%)" position="relative">
              <Flex position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" bg={modalIconBg} borderRadius="full" w="50px" h="50px" justifyContent="center" alignItems="center" boxShadow="md">
                <Icon as={FaPlayCircle} w={6} h={6} color="orange.500" />
              </Flex>
            </Box>
            <ModalHeader textAlign="center" pt={8}>How to: {videoModal.exerciseName}</ModalHeader>
            <ModalCloseButton top="85px" onClick={() => setVideoModal({ ...videoModal, isOpen: false })} />
            <ModalBody pb={6} display="flex" flexDirection="column" alignItems="center">
              <Box w="100%" h="0" pb="56.25%" position="relative" borderRadius="md" overflow="hidden" boxShadow="md">
                <iframe src={videoModal.videoUrl} title={videoModal.exerciseName} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    </Container>
  );
} 