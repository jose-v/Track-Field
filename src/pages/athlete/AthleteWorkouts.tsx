import {
  Box, Heading, Text, Spinner, Alert, AlertIcon, Stack, Card, CardBody, Button, Flex, HStack, Progress, Tag, VStack, Divider, Center, Icon, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, IconButton, SimpleGrid, Container, Tooltip, useDisclosure, Tabs, TabList, TabPanels, Tab, TabPanel, useToast, useColorModeValue, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye, FaPlayCircle, FaRunning, FaDumbbell, FaRegClock, FaCalendarAlt, FaListUl, FaLeaf, FaRedo, FaCog } from 'react-icons/fa';
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
import { MobileHeader, ExerciseExecutionModal, MonthlyPlanAssignments } from '../../components';
import { RunTimeInput } from '../../components/RunTimeInput';
import { isRunExercise, validateTime } from '../../utils/exerciseUtils';
import { ExerciseLibrary, Exercise as LibraryExercise } from '../../components/ExerciseLibrary';

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
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const workoutStore = useWorkoutStore();
  const today = getCurrentDate();
  const toast = useToast();
  const { triggerFeedback, recordAppUsage } = useFeedback(); // Use the feedback hook

  // State for reset confirmation modal
  const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();
  const [workoutToReset, setWorkoutToReset] = useState<{ id: string; name: string } | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

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

  // State for custom exercises
  const [customExercises, setCustomExercises] = useState<LibraryExercise[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);

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

  // Modal control functions for shared component
  const handleUpdateTimer = (newTimer: number) => {
    setExecModal(prev => ({ ...prev, timer: newTimer }));
  };

  const handleUpdateRunning = (newRunning: boolean) => {
    setExecModal(prev => ({ ...prev, running: newRunning }));
  };

  const handleNextExercise = () => {
    const workoutId = execModal.workout!.id;
    const exIdx = execModal.exerciseIdx;
    const totalExercises = execModal.workout!.exercises.length;
    
    // Mark current exercise as completed
    workoutStore.markExerciseCompleted(workoutId, exIdx);
    
    // Update progress in store - set the next exercise index as current
    workoutStore.updateProgress(workoutId, exIdx + 1, totalExercises, false);
    
    // Update modal state
    setExecModal(prev => ({
      ...prev,
      exerciseIdx: exIdx + 1,
      timer: 0,
      running: true,
    }));
  };

  const handlePreviousExercise = () => {
    const workoutId = execModal.workout!.id;
    const exIdx = execModal.exerciseIdx;
    
    // Only allow going back if not on the first exercise
    if (exIdx > 0) {
      // Reset run time for previous exercise
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
      // Check if we need to trigger first workout completion feedback
      const needsFirstWorkoutFeedback = !hasCompletedFirstWorkout;
      
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
      
      // Trigger feedback if first workout
      if (needsFirstWorkoutFeedback) {
        setHasCompletedFirstWorkout(true);
        localStorage.setItem('hasCompletedFirstWorkout', 'true');
        triggerFeedback('first_success'); // Use correct FeedbackTrigger type
      }
      
      // Handle integration service completion
      try {
        await handleWorkoutCompletion(workoutId, user?.id!);
      } catch (error) {
        console.error('Error handling workout completion:', error);
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
          
          // Get the workout progress to find the first uncompleted exercise
          const workoutProgress = workoutStore.getProgress(workout.id);
          const completedExercises = workoutProgress?.completedExercises || [];
          
          // Find the first exercise that hasn't been completed
          let nextExerciseIndex = 0;
          for (let i = 0; i < totalExercises; i++) {
            if (!completedExercises.includes(i)) {
              nextExerciseIndex = i;
              break;
            }
          }
          
          // If all exercises are completed, start from 0 to restart
          if (completedCount === totalExercises && totalExercises > 0) {
            nextExerciseIndex = 0;
          }
          
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
              onStart={() => handleGo(workout, nextExerciseIndex)}
              onRefresh={() => forceRefreshWorkoutProgress(workout.id)}
              showRefresh={true}
              onReset={() => handleResetProgress(workout.id, workout.name)}
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

  // Exercise Library Functions
  const loadCustomExercises = async () => {
    if (!user?.id) return;
    
    setExercisesLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_exercises')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomExercises(data || []);
    } catch (error) {
      console.error('Error loading custom exercises:', error);
      toast({
        title: 'Error loading exercises',
        description: 'Could not load your custom exercises. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setExercisesLoading(false);
    }
  };

  const handleAddExercise = async (exerciseData: Omit<LibraryExercise, 'id'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('custom_exercises')
      .insert([{
        ...exerciseData,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    
    setCustomExercises(prev => [data, ...prev]);
  };

  const handleUpdateExercise = async (id: string, exerciseData: Omit<LibraryExercise, 'id'>) => {
    const { data, error } = await supabase
      .from('custom_exercises')
      .update({
        ...exerciseData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setCustomExercises(prev => 
      prev.map(ex => ex.id === id ? data : ex)
    );
  };

  const handleDeleteExercise = async (id: string) => {
    const { error } = await supabase
      .from('custom_exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setCustomExercises(prev => prev.filter(ex => ex.id !== id));
  };

  // Load custom exercises on component mount
  useEffect(() => {
    loadCustomExercises();
  }, [user?.id]);

  return (
    <Container maxW="container.xl" px={{ base: 4, md: 6 }} py={{ base: 6, md: 4 }} data-testid="athlete-workouts">
      {/* Mobile Header - Now using reusable component */}
      <MobileHeader
        title="Workouts"
        subtitle="Your Training Schedule"
        isLoading={isLoading}
        actionButton={
          <IconButton
            aria-label="Create Workout"
            icon={<FaCog />}
            size="md"
            colorScheme="blue"
            variant="solid"
            borderRadius="full"
            onClick={() => navigate('/athlete/workout-creator')}
            boxShadow="lg"
            _hover={{ 
              transform: 'scale(1.05)',
              boxShadow: 'xl'
            }}
            transition="all 0.2s"
            _active={{
              transform: 'scale(0.95)'
            }}
          />
        }
      />

      {/* Desktop Header - keep existing */}
      <Box display={{ base: "none", lg: "block" }} mb={6}>
        <Flex justify="space-between" align="center" mb={2}>
          <Heading size="lg">
            Workouts
          </Heading>
          <Button
            leftIcon={<FaCog />}
            colorScheme="blue"
            variant="outline"
            size="md"
            onClick={() => navigate('/athlete/workout-creator')}
          >
            Create Workout
          </Button>
        </Flex>
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
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Daily Workouts</Tab>
              <Tab>Monthly Plans</Tab>
              <Tab>Exercise Library</Tab>
            </TabList>
            
            <TabPanels>
              {/* Daily Workouts Tab */}
              <TabPanel px={0}>
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
              </TabPanel>
              
              {/* Monthly Plans Tab */}
              <TabPanel px={0}>
                <MonthlyPlanAssignments />
              </TabPanel>

              {/* Exercise Library Tab */}
              <TabPanel px={0}>
                <ExerciseLibrary
                  exercises={customExercises}
                  onAddExercise={handleAddExercise}
                  onUpdateExercise={handleUpdateExercise}
                  onDeleteExercise={handleDeleteExercise}
                  isLoading={exercisesLoading}
                  title="My Exercise Library"
                  subtitle="Manage your custom exercises for use in workouts"
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
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

        {/* Video Modal - Copied from Workouts.tsx */}
        <Modal isOpen={videoModal.isOpen} onClose={() => setVideoModal({ ...videoModal, isOpen: false })} isCentered size="xl">
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
    </Container>
  );
} 