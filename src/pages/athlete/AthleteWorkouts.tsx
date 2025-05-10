import {
  Box, Heading, Text, Spinner, Alert, AlertIcon, Stack, Card, CardBody, Button, Flex, HStack, Progress, Tag, VStack, Divider, Center, Icon, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, IconButton, SimpleGrid, Container, Tooltip, useDisclosure, Tabs, TabList, TabPanels, Tab, TabPanel
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
function formatDateForComparison(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
}

// Helper to get current date in YYYY-MM-DD format
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Define types for debugging information
interface Assignment {
  workout_id: string;
  athlete_id: string;
  status: string;
  assigned_at?: string;
}

interface RawWorkout {
  id: string;
  name: string;
  date: string;
  type: string;
  [key: string]: any;
}

interface DebugState {
  assignments: Assignment[];
  rawWorkouts: RawWorkout[];
}

export function AthleteWorkouts() {
  const { user } = useAuth();
  const workoutStore = useWorkoutStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const today = getCurrentDate();

  const [execModal, setExecModal] = useState({
    isOpen: false,
    workout: null as Workout | null, // Typed workout
    exerciseIdx: 0,
    timer: 0,
    running: false,
  });
  const [videoModal, setVideoModal] = useState({ isOpen: false, videoUrl: '', exerciseName: '' });

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

  // Refetch workouts when component mounts
  useEffect(() => {
    if (user?.id) {
      console.log('Athlete component mounted, refetching workouts');
      refetch();
    }
  }, [user?.id]);

  // Initialize workouts in the store
  useEffect(() => {
    if (assignedWorkouts && assignedWorkouts.length > 0) {
      assignedWorkouts.forEach(workout => {
        if (workout.exercises && workout.exercises.length > 0) {
          const progress = workoutStore.getProgress(workout.id);
          if (!progress) {
            workoutStore.updateProgress(workout.id, 0, workout.exercises.length);
          }
        }
      });
    }
  }, [assignedWorkouts, workoutStore]);

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
    if (!execModal.workout || !user?.id) return;
    const workoutId = execModal.workout.id;
    const currentAthleteId = user.id;
    const exIdx = execModal.exerciseIdx;
    
    workoutStore.markExerciseCompleted(workoutId, exIdx);
    
    const isLastExercise = exIdx + 1 >= execModal.workout.exercises.length;

    if (isLastExercise) {
      workoutStore.updateProgress(workoutId, execModal.workout.exercises.length, execModal.workout.exercises.length);
      try {
        console.log(`Attempting to mark workout ${workoutId} as completed for athlete ${currentAthleteId}`);
        await api.athleteWorkouts.updateAssignmentStatus(currentAthleteId, workoutId, 'completed');
        console.log(`Workout ${workoutId} successfully marked as completed.`);
      } catch (e) {
        console.error("Failed to update workout completion status:", e);
      }
      setExecModal({ isOpen: false, workout: null, exerciseIdx: 0, timer: 0, running: false });
    } else {
      workoutStore.updateProgress(workoutId, exIdx + 1, execModal.workout.exercises.length, true);
      setExecModal({
        ...execModal,
        exerciseIdx: exIdx + 1,
        timer: 0,
        running: true,
      });
    }
  };

  const renderWorkoutCards = (workouts: Workout[]) => {
    if (!workouts || workouts.length === 0) {
      return (
        <Box p={5} borderWidth="1px" borderRadius="lg" shadow="sm" textAlign="center" mt={4}>
          <Text fontSize="lg" color="gray.500">
            No workouts found.
          </Text>
        </Box>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} alignItems="stretch">
        {workouts.map((workout) => {
          const completedCount = getCompletionCount(workout.id);
          const totalExercises = workout.exercises?.length || 0;
          const progressPercent = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;
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
            />
          );
        })}
      </SimpleGrid>
    );
  };

  // Add this right after the useEffect for refetching workouts
  // Add debug function to directly check database
  const [debugInfo, setDebugInfo] = useState<DebugState>({ 
    assignments: [], 
    rawWorkouts: [] 
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAssignments = async () => {
      if (!user?.id) return;
      
      try {
        console.log('DEBUG: Checking athlete assignments directly');
        
        // 1. Check raw assignments in the database
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('athlete_workouts')
          .select('*')
          .eq('athlete_id', user.id);
          
        if (assignmentError) {
          console.error('DEBUG: Error fetching assignments:', assignmentError);
        } else {
          console.log('DEBUG: Raw assignments found:', assignmentData);
          setDebugInfo(prev => ({ 
            ...prev, 
            assignments: assignmentData as Assignment[] || [] 
          }));
          
          // 2. If assignments exist, check the raw workouts
          if (assignmentData && assignmentData.length > 0) {
            const workoutIds = assignmentData.map(a => a.workout_id);
            
            const { data: workoutData, error: workoutError } = await supabase
              .from('workouts')
              .select('*')
              .in('id', workoutIds);
              
            if (workoutError) {
              console.error('DEBUG: Error fetching raw workouts:', workoutError);
            } else {
              console.log('DEBUG: Raw workouts found:', workoutData);
              setDebugInfo(prev => ({ 
                ...prev, 
                rawWorkouts: workoutData as RawWorkout[] || [] 
              }));
            }
          }
        }
      } catch (err) {
        console.error('DEBUG: Error in diagnostics:', err);
      }
    };
    
    checkAssignments();
  }, [user?.id]);

  // Debug info display
  const DebugInfo = () => {
    if (process.env.NODE_ENV === 'production') return null;
    
    const handleForceRefresh = async () => {
      console.log('Force refreshing athlete workouts');
      try {
        // Clear the cache for athlete workouts
        await queryClient.invalidateQueries({ queryKey: ['athleteAssignedWorkouts'] });
        // Refetch
        await refetch();
        // Re-run direct database checks
        const checkAssignments = async () => {
          if (!user?.id) return;
          
          // Query athlete_workouts directly
          const { data: assignmentData } = await supabase
            .from('athlete_workouts')
            .select('*')
            .eq('athlete_id', user.id);
            
          if (assignmentData) {
            setDebugInfo(prev => ({ 
              ...prev, 
              assignments: assignmentData as Assignment[] || [] 
            }));
            
            // If assignments exist, check the workouts
            if (assignmentData.length > 0) {
              const workoutIds = assignmentData.map(a => a.workout_id);
              
              const { data: workoutData } = await supabase
                .from('workouts')
                .select('*')
                .in('id', workoutIds);
                
              if (workoutData) {
                setDebugInfo(prev => ({ 
                  ...prev, 
                  rawWorkouts: workoutData as RawWorkout[] || [] 
                }));
              }
            }
          }
        };
        
        await checkAssignments();
      } catch (err) {
        console.error('Error during force refresh:', err);
      }
    };
    
    return (
      <Box mt={8} p={4} border="1px dashed" borderColor="red.300" borderRadius="md">
        <Flex justify="space-between" align="center" mb={2}>
          <Heading size="md" color="red.500">Debug Information</Heading>
          <Button 
            onClick={handleForceRefresh}
            colorScheme="red"
            size="sm"
            leftIcon={<Icon as={FaRedo} />}
          >
            Force Refresh
          </Button>
        </Flex>
        <Text fontWeight="bold">User ID: {user?.id || 'Not logged in'}</Text>
        <Text>Raw Assignments: {debugInfo.assignments.length}</Text>
        <Text>Raw Workouts: {debugInfo.rawWorkouts.length}</Text>
        <Text>Query Results: {assignedWorkouts?.length || 0}</Text>
        
        {debugInfo.assignments.length > 0 && (
          <Box mt={2}>
            <Text fontWeight="bold">Assignments:</Text>
            {debugInfo.assignments.map((a, i) => (
              <Text key={i} fontSize="sm">
                Workout ID: {a.workout_id}, Status: {a.status}
              </Text>
            ))}
          </Box>
        )}
        
        {debugInfo.rawWorkouts.length > 0 && (
          <Box mt={2}>
            <Text fontWeight="bold">Raw Workouts:</Text>
            {debugInfo.rawWorkouts.map((w, i) => (
              <Text key={i} fontSize="sm">
                {w.id}: {w.name} (Date: {w.date})
              </Text>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Heading as="h1" size="xl" mb={6}>
        My Workouts
      </Heading>

      {isLoading && (
        <Center py={10}><Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" /></Center>
      )}

      {isError && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          Error fetching assigned workouts: {error?.message}
        </Alert>
      )}

      {!isLoading && !isError && (
        <Box>
          <Heading size="md" mb={4}>All Workouts ({assignedWorkouts?.length || 0})</Heading>
          {renderWorkoutCards(assignedWorkouts || [])}
        </Box>
      )}
      
      {/* Exercise Execution Modal - Copied and adapted from Workouts.tsx */}
      <Modal isOpen={execModal.isOpen} onClose={() => setExecModal({ ...execModal, isOpen: false, running: false })} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="lg" overflow="hidden">
          <Box h="80px" bg={execModal.running ? "linear-gradient(135deg, #38A169 0%, #68D391 100%)" : "linear-gradient(135deg, #4299E1 0%, #90CDF4 100%)"} position="relative">
            <Flex position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" bg="white" borderRadius="full" w="50px" h="50px" justifyContent="center" alignItems="center" boxShadow="md">
              <Icon as={execModal.running ? FaRunning : FaRegClock} w={6} h={6} color={execModal.running ? "green.500" : "blue.500"} />
            </Flex>
            {execModal.workout && execModal.workout.exercises && (
              <Box position="absolute" bottom="0" left="0" right="0">
                <Progress value={((execModal.exerciseIdx +1) / execModal.workout.exercises.length) * 100} size="xs" colorScheme={execModal.running ? "green" : "blue"} backgroundColor="rgba(255,255,255,0.3)"/>
              </Box>
            )}
          </Box>
          <ModalHeader textAlign="center" pt={8}>Exercise Execution</ModalHeader>
          <ModalCloseButton top="85px" onClick={() => setExecModal({ ...execModal, isOpen: false, running: false })} />
          <ModalBody pb={6}>
            {execModal.workout && execModal.workout.exercises && execModal.workout.exercises[execModal.exerciseIdx] && (
              <VStack spacing={4} align="center">
                <Heading size="md">{execModal.workout.exercises[execModal.exerciseIdx].name}</Heading>
                <HStack spacing={4} p={3} bg="gray.50" w="100%" borderRadius="md" justify="center">
                  <VStack><Text color="gray.500" fontSize="sm">Sets</Text><Text fontWeight="bold">{execModal.workout.exercises[execModal.exerciseIdx].sets}</Text></VStack>
                  <VStack><Text color="gray.500" fontSize="sm">Reps</Text><Text fontWeight="bold">{execModal.workout.exercises[execModal.exerciseIdx].reps}</Text></VStack>
                  {execModal.workout.exercises[execModal.exerciseIdx].weight && (
                    <VStack><Text color="gray.500" fontSize="sm">Weight</Text><Text fontWeight="bold">{execModal.workout.exercises[execModal.exerciseIdx].weight} kg</Text></VStack>
                  )}
                </HStack>
                <Box bg={execModal.running ? "green.50" : "blue.50"} p={4} borderRadius="full" boxShadow="sm" mb={2}>
                  <Text fontSize="2xl" fontWeight="bold" color={execModal.running ? "green.500" : "blue.500"}>
                    {Math.floor(execModal.timer / 60).toString().padStart(2, '0')}:{(execModal.timer % 60).toString().padStart(2, '0')}
                  </Text>
                </Box>
                <HStack spacing={3} width="100%" justifyContent="center">
                  {execModal.running ? (
                    <Button colorScheme="yellow" flex="1" maxW="120px" leftIcon={<Icon as={FaRegClock} />} onClick={() => setExecModal({ ...execModal, running: false })}>Stop</Button>
                  ) : (
                    <Button colorScheme="blue" flex="1" maxW="120px" leftIcon={<Icon as={FaRunning} />} onClick={() => setExecModal({ ...execModal, running: true })}>Start</Button>
                  )}
                  <Button colorScheme="green" flex="1" maxW="120px" leftIcon={<Icon as={CheckIcon} />} onClick={handleDone}>
                    {execModal.workout.exercises.length > 0 && execModal.exerciseIdx + 1 < execModal.workout.exercises.length ? 'Next' : 'Finish'}
                  </Button>
                  <Button colorScheme="purple" flex="1" maxW="120px" leftIcon={<Icon as={FaPlayCircle} />} onClick={() => setVideoModal({ isOpen: true, videoUrl: getVideoUrl(execModal.workout!.exercises[execModal.exerciseIdx].name), exerciseName: execModal.workout!.exercises[execModal.exerciseIdx].name || '' })}>
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

      {/* Video Modal - Copied from Workouts.tsx */}
      <Modal isOpen={videoModal.isOpen} onClose={() => setVideoModal({ ...videoModal, isOpen: false })} isCentered size="xl">
        <ModalOverlay />
        <ModalContent borderRadius="lg" overflow="hidden">
          <Box h="80px" bg="linear-gradient(135deg, #DD6B20 0%, #F6AD55 100%)" position="relative">
            <Flex position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" bg="white" borderRadius="full" w="50px" h="50px" justifyContent="center" alignItems="center" boxShadow="md">
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

      <DebugInfo />
    </Box>
  );
} 