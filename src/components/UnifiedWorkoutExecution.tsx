import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  VStack,
  HStack,
  Box,
  Text,
  IconButton,
  Button,
  SimpleGrid,
  useColorModeValue,
  Progress,
  Badge,
  Flex,
  Circle,
  useDisclosure
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { FaPlay, FaPause, FaSquare, FaStepBackward, FaStepForward, FaCheckCircle, FaInfoCircle, FaRedo, FaVideo, FaForward } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUnifiedAssignmentActions } from '../hooks/useUnifiedAssignments';
import { supabase } from '../lib/supabase';
import { WorkoutInfoDrawer } from './execution/WorkoutInfoDrawer';
import { RunTimeInput } from './RunTimeInput';

interface AssignmentProgress {
  current_exercise_index: number;
  current_set: number;
  current_rep: number;
  completed_exercises: number[];
  started_at?: string;
  completed_at?: string;
  last_activity_at?: string;
  total_exercises: number;
  completion_percentage: number;
  total_time_seconds?: number;
  exercise_times?: Record<string, number>;
  current_exercise_progress?: {
    completed_sets: Array<{
      set: number;
      reps: number;
      completed_at: string;
    }>;
    current_set_reps_completed?: number;
  };
}

interface WorkoutAssignment {
  id: string;
  athlete_id: string;
  assignment_type: 'single' | 'weekly' | 'monthly';
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  start_date: string;
  end_date?: string;
  exercise_block: {
    exercises?: any[];
    workout_name?: string;
    plan_name?: string;
    // Weekly plan properties
    daily_workouts?: Record<string, {
      exercises: any[];
      is_rest_day: boolean;
    }>;
    // Monthly plan properties
    weekly_structure?: Array<{
      week_number: number;
      workout_id: string;
      is_rest_week: boolean;
    }>;
    duration_weeks?: number;
    description?: string;
  };
  progress: AssignmentProgress;
  current_exercise_index?: number;
  current_set?: number;
  current_rep?: number;
  completion_percentage?: number;
  started_at?: string;
  completed_at?: string;
}

interface UnifiedWorkoutExecutionProps {
  assignment: WorkoutAssignment;
  onComplete?: () => void;
  onExit?: () => void;
  isOpen: boolean;
}

interface Exercise {
  id: string;
  name: string;
  type: string;
  category?: string;
  sets?: number | string;
  reps?: number | string;
  weight?: number | string;
  duration?: string;
  distance?: string;
  rest?: string;
  rest_seconds?: number | string;
  instructions?: string;
}

// Utility function to safely parse positive integers
function parsePositiveInt(value: any, fallback: number = 1): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

// Helper component for progress dots
const ProgressDots = ({ 
  current, 
  total, 
  label,
  size = "8px" 
}: { 
  current: number; 
  total: number; 
  label: string;
  size?: string;
}) => {
  const completedColor = useColorModeValue('green.400', 'green.400');
  const currentColor = useColorModeValue('blue.400', 'blue.400');
  const pendingColor = useColorModeValue('gray.300', 'gray.600');
  
  return (
    <VStack spacing={1} align="center">
      <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} fontWeight="medium" textTransform="uppercase">
        {label}
      </Text>
      <Text fontSize="xl" fontWeight="bold" color={useColorModeValue('blue.500', 'blue.400')}>
        {current}
      </Text>
      <HStack spacing={1} justify="center">
        {Array.from({ length: total }, (_, i) => (
          <Circle
            key={i}
            size={size}
            bg={i < current - 1 ? completedColor : i === current - 1 ? currentColor : pendingColor}
            transition="background-color 0.2s"
          />
        ))}
      </HStack>
    </VStack>
  );
};

// Helper component for fixed-width timer to prevent layout shifting
const FixedTimer = ({ 
  seconds, 
  color, 
  isRest = false 
}: { 
  seconds: number; 
  color: string;
  isRest?: boolean;
}) => {
  const formatTimeWithFixed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      min1: Math.floor(mins / 10),
      min2: mins % 10,
      sec1: Math.floor(secs / 10),
      sec2: secs % 10
    };
  };

  const { min1, min2, sec1, sec2 } = formatTimeWithFixed(seconds);
  
  return (
    <HStack spacing={0} justify="center" align="center">
      <Box w="45px" textAlign="center">
        <Text fontSize="6xl" fontWeight="bold" color={color} fontFamily="mono">
          {min1}
        </Text>
      </Box>
      <Box w="45px" textAlign="center">
        <Text fontSize="6xl" fontWeight="bold" color={color} fontFamily="mono">
          {min2}
        </Text>
      </Box>
      <Box w="30px" textAlign="center">
        <Text fontSize="6xl" fontWeight="bold" color={color} fontFamily="mono">
          :
        </Text>
      </Box>
      <Box w="45px" textAlign="center">
        <Text fontSize="6xl" fontWeight="bold" color={color} fontFamily="mono">
          {sec1}
        </Text>
      </Box>
      <Box w="45px" textAlign="center">
        <Text fontSize="6xl" fontWeight="bold" color={color} fontFamily="mono">
          {sec2}
        </Text>
      </Box>
    </HStack>
  );
};

export function UnifiedWorkoutExecution({ 
  assignment, 
  onComplete, 
  onExit,
  isOpen 
}: UnifiedWorkoutExecutionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { updateProgress } = useUnifiedAssignmentActions();

  // Theme colors matching old execution modal
  const cardBg = useColorModeValue('white', 'gray.800');
  const modalTextColor = useColorModeValue('gray.500', 'gray.400');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');
  const progressBg = useColorModeValue('gray.200', 'gray.600');
  const completedColor = useColorModeValue('green.500', 'green.400');
  const currentColor = useColorModeValue('blue.500', 'blue.400');

  // Extract exercises from assignment based on type
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [totalExercises, setTotalExercises] = useState(0);
  const [exerciseLoadingError, setExerciseLoadingError] = useState<string | null>(null);

  // Load exercises based on assignment type
  useEffect(() => {
    const loadExercises = async () => {
      try {
        setExerciseLoadingError(null);

        if (assignment.assignment_type === 'single') {
          const exerciseList = assignment.exercise_block?.exercises || [];
          setExercises(exerciseList.map(exercise => ({
            ...exercise,
            sets: Number(exercise.sets) > 0 ? Number(exercise.sets) : 1,
            reps: Number(exercise.reps) > 0 ? Number(exercise.reps) : 1
          })));
          setTotalExercises(exerciseList.length);
        } else if (assignment.assignment_type === 'weekly') {
          // Weekly plan - extract today's exercises from daily_workouts
          const dailyWorkouts = assignment.exercise_block?.daily_workouts || {};
          const today = new Date();
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const currentDayName = dayNames[today.getDay()];
          
          // Look for today's workout first
          let todaysWorkout = dailyWorkouts[currentDayName];
          
          // If no workout for today, try to find the first available day
          if (!todaysWorkout) {
            const firstAvailableDay = Object.keys(dailyWorkouts).find(dayKey => {
              const dayWorkout = dailyWorkouts[dayKey];
              return dayWorkout && (
                Array.isArray(dayWorkout) ? dayWorkout.length > 0 : 
                (dayWorkout.exercises && dayWorkout.exercises.length > 0)
              );
            });
            
            if (firstAvailableDay) {
              todaysWorkout = dailyWorkouts[firstAvailableDay];
            }
          }
          
          let exerciseList: any[] = [];
          
          if (todaysWorkout) {
            if (Array.isArray(todaysWorkout)) {
              // New blocks format: array of blocks, each with exercises
              exerciseList = todaysWorkout.flatMap((block: any) => {
                const exercises = block.exercises || [];
                // Copy block-level metadata to individual exercises if they don't have it
                return exercises.map((exercise: any) => ({
                  ...exercise,
                  // Use exercise-level values first, then fall back to block-level, then defaults
                  sets: Number(exercise.sets) > 0 ? Number(exercise.sets) : 1, // Default to 1 set if not specified
                  reps: Number(exercise.reps) > 0 ? Number(exercise.reps) : 1, // Default to 1 rep if not specified
                  // Copy block-level rest time if exercise doesn't have one
                  rest_seconds: exercise.rest || exercise.rest_seconds || block.restBetweenExercises || 60
                }));
              });
            } else if (todaysWorkout.exercises && !todaysWorkout.is_rest_day) {
              // Old format: { exercises: [], is_rest_day: boolean }
              exerciseList = todaysWorkout.exercises.map((exercise: any) => ({
                ...exercise,
                // Ensure sets/reps are properly defined
                sets: Number(exercise.sets) > 0 ? Number(exercise.sets) : 1, // Default to 1 set if not specified
                reps: Number(exercise.reps) > 0 ? Number(exercise.reps) : 1, // Default to 1 rep if not specified
                // Preserve any existing rest times
                rest_seconds: exercise.rest || exercise.rest_seconds || 60
              }));
            }
          }
          
          // If no exercises found, try to fallback to first available day
          if (exerciseList.length === 0) {
            const firstAvailableDay = Object.values(dailyWorkouts).find((day: any) => {
              if (Array.isArray(day)) {
                // New blocks format
                return day.some((block: any) => block.exercises && block.exercises.length > 0);
              } else if (day && !day.is_rest_day) {
                // Old format
                return day.exercises && day.exercises.length > 0;
              }
              return false;
            });
            
            if (firstAvailableDay) {
              if (Array.isArray(firstAvailableDay)) {
                // New blocks format
                exerciseList = firstAvailableDay.flatMap((block: any) => {
                  const exercises = block.exercises || [];
                  // Copy block-level metadata to individual exercises if they don't have it
                  return exercises.map((exercise: any) => ({
                    ...exercise,
                    // Use exercise-level values first, then fall back to block-level, then defaults
                    sets: Number(exercise.sets) > 0 ? Number(exercise.sets) : 1, // Default to 1 set if not specified
                    reps: Number(exercise.reps) > 0 ? Number(exercise.reps) : 1, // Default to 1 rep if not specified
                    // Copy block-level rest time if exercise doesn't have one
                    rest_seconds: exercise.rest || exercise.rest_seconds || block.restBetweenExercises || 60
                  }));
                });
              } else {
                // Old format
                exerciseList = (firstAvailableDay as any).exercises.map((exercise: any) => ({
                  ...exercise,
                  // Ensure sets/reps are properly defined
                  sets: Number(exercise.sets) > 0 ? Number(exercise.sets) : 1, // Default to 1 set if not specified
                  reps: Number(exercise.reps) > 0 ? Number(exercise.reps) : 1, // Default to 1 rep if not specified
                  // Preserve any existing rest times
                  rest_seconds: exercise.rest || exercise.rest_seconds || 60
                }));
              }
            }
          }
          
          setExercises(exerciseList);
          setTotalExercises(exerciseList.length);
        } else if (assignment.assignment_type === 'monthly') {
          // Monthly plan - get current week's workout and extract today's exercises
          const weeklyStructure = assignment.exercise_block?.weekly_structure || [];
          
          // Calculate current week
          const startDate = new Date(assignment.start_date);
          const today = new Date();
          const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const weekNumber = Math.floor(daysDiff / 7) + 1;
          
          // Find current week
          const currentWeek = weeklyStructure.find((week: any) => week.week_number === weekNumber) ||
                             weeklyStructure.find((week: any) => !week.is_rest_week); // Fallback to first training week
          
          if (currentWeek && !currentWeek.is_rest_week && currentWeek.workout_id) {
            // Fetch the weekly workout
            const { data: allWorkouts } = await supabase
              .from('workouts')
              .select('*')
              .eq('id', currentWeek.workout_id)
              .single();
            
            if (allWorkouts) {
              let exerciseList: Exercise[] = [];
              
              // Extract today's exercises from the weekly workout
              if (allWorkouts.is_block_based && allWorkouts.blocks) {
                // Block-based workout - extract today's blocks
                const today = new Date();
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const currentDayName = dayNames[today.getDay()];
                
                let blocks = allWorkouts.blocks;
                if (typeof blocks === 'string') {
                  blocks = JSON.parse(blocks);
                }
                
                if (blocks && typeof blocks === 'object') {
                  const todaysBlocks = blocks[currentDayName] || blocks.monday || [];
                  if (Array.isArray(todaysBlocks)) {
                    exerciseList = todaysBlocks.flatMap((block: any) => {
                      const exercises = block.exercises || [];
                      // Copy block-level rest time to individual exercises
                      return exercises.map((exercise: any) => ({
                        ...exercise,
                        // Copy block-level rest time if exercise doesn't have one
                        rest_seconds: exercise.rest || exercise.rest_seconds || block.restBetweenExercises || 60
                      }));
                    });
                  }
                }
              } else if (allWorkouts.exercises) {
                // Legacy exercise format
                if (Array.isArray(allWorkouts.exercises) && allWorkouts.exercises.length > 0) {
                  const firstExercise = allWorkouts.exercises[0];
                  if (firstExercise && typeof firstExercise === 'object' && firstExercise.day) {
                    // Weekly format with days
                    const today = new Date();
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const currentDayName = dayNames[today.getDay()];
                    
                    const todaysWorkout = allWorkouts.exercises.find((dayObj: any) => 
                      dayObj.day?.toLowerCase() === currentDayName.toLowerCase()
                    );
                    
                    if (todaysWorkout && !todaysWorkout.isRestDay) {
                      exerciseList = todaysWorkout.exercises || [];
                    } else {
                      // Fallback to first available day
                      const firstAvailableDay = allWorkouts.exercises.find((dayObj: any) => 
                        dayObj.exercises?.length > 0 && !dayObj.isRestDay
                      );
                      if (firstAvailableDay) {
                        exerciseList = firstAvailableDay.exercises || [];
                      }
                    }
                  } else {
                    // Single day format
                    exerciseList = allWorkouts.exercises;
                  }
                }
              }
              
              setExercises(exerciseList.map(exercise => ({
                ...exercise,
                sets: Number(exercise.sets) > 0 ? Number(exercise.sets) : 1, // Default to 1 set if not specified
                reps: Number(exercise.reps) > 0 ? Number(exercise.reps) : 1, // Default to 1 rep if not specified
                // Preserve rest_seconds if it was set during exercise extraction
                rest_seconds: exercise.rest_seconds || exercise.rest || 60
              })));
              setTotalExercises(exerciseList.length);
            } else {
              setExerciseLoadingError('Weekly workout not found');
              setExercises([]);
              setTotalExercises(0);
            }
          } else {
            setExerciseLoadingError('No training scheduled for this week');
            setExercises([]);
            setTotalExercises(0);
          }
        } else {
          setExercises([]);
          setTotalExercises(0);
        }
      } catch (error) {
        setExerciseLoadingError('Failed to load exercises');
        setExercises([]);
        setTotalExercises(0);
      }
    };

    if (assignment && isOpen) {
      loadExercises();
    }
  }, [assignment, isOpen]);

  // Local state for current position (unified system only)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(assignment.progress?.current_exercise_index || 0);
  const [currentSet, setCurrentSet] = useState(assignment.progress?.current_set || 1);
  const [currentRep, setCurrentRep] = useState(assignment.progress?.current_rep || 1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(assignment.status === 'in_progress');
  
  // Countdown timer state
  const [countdown, setCountdown] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownRef, setCountdownRef] = useState<NodeJS.Timeout | null>(null);
  
  // Rest countdown state
  const [restCountdown, setRestCountdown] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restCountdownRef, setRestCountdownRef] = useState<NodeJS.Timeout | null>(null);
  
  // Details drawer state
  const { isOpen: isDetailsDrawerOpen, onOpen: onDetailsDrawerOpen, onClose: onDetailsDrawerClose } = useDisclosure();
  
  // Runtime state
  const [runTime, setRunTime] = useState({ minutes: 0, seconds: 0, hundredths: 0 });

  // Handle runtime changes
  const handleTimeChange = useCallback((minutes: number, seconds: number, hundredths: number) => {
    setRunTime({ minutes, seconds, hundredths });
  }, []);
  
  // RPE (Rate of Perceived Exertion) state
  const [showRPEScreen, setShowRPEScreen] = useState(false);
  const [selectedRPE, setSelectedRPE] = useState<number | null>(null);
  const [isLoggingRPE, setIsLoggingRPE] = useState(false);

  // RPE Labels
  const getRPELabel = (rating: number) => {
    const rpeLabels: Record<number, string> = {
      1: "Very Easy",
      2: "Easy", 
      3: "Moderate",
      4: "Somewhat Hard",
      5: "Hard",
      6: "Harder",
      7: "Very Hard",
      8: "Very Very Hard", 
      9: "Extremely Hard",
      10: "Maximum Effort"
    };
    return rpeLabels[rating] || "";
  };

  // Refresh assignment data when modal opens to get latest progress
  useEffect(() => {
    if (isOpen && assignment.id) {
      // Only invalidate queries when modal is opening (not closing)
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['unified-assignments'] });
        queryClient.invalidateQueries({ queryKey: ['unified-todays-assignment'] });
      }, 100); // Small delay to ensure modal is fully open
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, assignment.id, queryClient]);

  // Sync local state with assignment progress data when it changes
  useEffect(() => {
    if (assignment.progress) {
      setCurrentExerciseIndex(assignment.progress.current_exercise_index || 0);
      setCurrentSet(assignment.progress.current_set || 1);
      setCurrentRep(assignment.progress.current_rep || 1);
    }
  }, [assignment.progress]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && isOpen) {
      interval = setInterval(() => {
        setElapsedTime(time => time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isOpen]);

  // Cleanup when modal closes to prevent race conditions
  useEffect(() => {
    if (!isOpen) {
      // Cancel any pending mutations when modal closes
      if (updateProgress.isPending) {
        updateProgress.reset();
      }
    }
  }, [isOpen, updateProgress]);

  // Get current exercise
  const getCurrentExercise = useCallback((): Exercise | null => {
    return exercises[currentExerciseIndex] || null;
  }, [exercises, currentExerciseIndex]);

  const currentExercise = getCurrentExercise();
  
  // Calculate sets and reps for current exercise with improved extraction
  const currentExerciseSets = parsePositiveInt(currentExercise?.sets, 1);
  const currentExerciseReps = parsePositiveInt(currentExercise?.reps, 1);

  // Helper function to check if current exercise is a running exercise
  const isRunningExercise = useCallback(() => {
    if (!currentExercise) return false;
    const exerciseName = currentExercise.name.toLowerCase();
    return exerciseName.includes('run') || 
           exerciseName.includes('sprint') || 
           exerciseName.includes('jog') ||
           exerciseName.includes('dash') ||
           exerciseName.includes('meter') ||
           exerciseName.includes('mile') ||
           currentExercise.type === 'running';
  }, [currentExercise]);
    
  // Progress calculation
  const calculateProgress = useCallback(() => {
    // For monthly plans, calculate progress based on weeks even if exercises aren't loaded
    if (assignment.assignment_type === 'monthly') {
      const weeklyStructure = assignment.exercise_block?.weekly_structure || [];
      const totalWeeks = weeklyStructure.filter((week: any) => !week.is_rest_week).length;
      
      if (totalWeeks > 0) {
        // Calculate current week
        const startDate = new Date(assignment.start_date);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const currentWeek = Math.floor(daysDiff / 7) + 1;
        
        // Calculate progress based on current week vs total weeks
        const weekProgress = Math.min(currentWeek, totalWeeks);
        return Math.round((weekProgress / totalWeeks) * 100);
      }
    }
    
    // For single/weekly plans, use exercise-based calculation
    if (totalExercises === 0) return 0;
    
    let completedWork = 0;
    let totalWork = 0;
    
    exercises.forEach((exercise, index) => {
      const sets = parsePositiveInt(exercise.sets, 1);
      const reps = parsePositiveInt(exercise.reps, 1);
      const exerciseWork = sets * reps;
      totalWork += exerciseWork;
      
      if (index < currentExerciseIndex) {
        // Completely finished exercises
        completedWork += exerciseWork;
      } else if (index === currentExerciseIndex) {
        // Current exercise - add completed sets and current rep
        const completedSets = currentSet - 1;
        const completedRepsInCurrentSet = currentRep - 1;
        completedWork += (completedSets * reps) + completedRepsInCurrentSet;
      }
    });
    
    return totalWork > 0 ? Math.round((completedWork / totalWork) * 100) : 0;
  }, [exercises, currentExerciseIndex, currentSet, currentRep, totalExercises, assignment]);

  const progress = useMemo(() => calculateProgress(), [calculateProgress]);

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Save progress to database
  const saveProgressToDB = useCallback(async () => {
    if (!user?.id || !assignment.id || !isOpen) return;
    
    try {
      const isWorkoutComplete = progress === 100;
      
      await updateProgress.mutateAsync({
        assignmentId: assignment.id,
        progressUpdate: {
          current_exercise_index: currentExerciseIndex,
          current_set: currentSet,
          current_rep: currentRep,
          completion_percentage: progress,
          workout_completed: isWorkoutComplete
        }
      });
      
      // Progress saved successfully - log removed to prevent console flooding
    } catch (error) {
      // Only log errors if modal is still open to avoid console flooding when closing
      if (isOpen) {
        console.error('Error saving progress:', error);
      }
    }
  }, [user?.id, assignment.id, currentExerciseIndex, currentSet, currentRep, progress, updateProgress, isOpen]);

  // Save progress when state changes (save progress even when not actively running)
  useEffect(() => {
    if (isOpen) {
      saveProgressToDB();
    }
  }, [currentExerciseIndex, currentSet, currentRep, isOpen]); // Removed saveProgressToDB from deps to prevent loop

  // Countdown timer logic
  const startCountdown = useCallback(() => {
    if (countdownRef) {
      clearInterval(countdownRef);
    }
    
    setIsCountingDown(true);
    setCountdown(5);
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCountingDown(false);
          setCountdownRef(null);
          // Auto-start the timer after countdown
          setIsActive(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setCountdownRef(interval);
  }, [countdownRef]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef) {
        clearInterval(countdownRef);
      }
    };
  }, [countdownRef]);

  // Start countdown when transitioning to a new exercise, set, or rep
  useEffect(() => {
    if (isOpen && !isActive && !isCountingDown && !isResting && !showRPEScreen && totalExercises > 0) {
      // Start countdown for any change in position (exercise, set, or rep)
      const timer = setTimeout(() => {
        startCountdown();
      }, 500); // Small delay to let UI settle
      
      return () => clearTimeout(timer);
    }
  }, [currentExerciseIndex, currentSet, currentRep, isOpen, isActive, isCountingDown, isResting, showRPEScreen, totalExercises, startCountdown]);

  // Reset blue timer (elapsedTime) when set/rep/block changes
  useEffect(() => {
    if (isOpen) {
      setElapsedTime(0);
    }
  }, [currentExerciseIndex, currentSet, currentRep, isOpen]);

  // Rest countdown logic
  const startRestCountdown = useCallback((duration: number = 60) => {
    if (restCountdownRef) {
      clearInterval(restCountdownRef);
    }
    
    setIsResting(true);
    setRestCountdown(duration);
    
    const interval = setInterval(() => {
      setRestCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsResting(false);
          setRestCountdownRef(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setRestCountdownRef(interval);
  }, [restCountdownRef]);

  // Cleanup rest countdown on unmount
  useEffect(() => {
    return () => {
      if (restCountdownRef) {
        clearInterval(restCountdownRef);
      }
    };
  }, [restCountdownRef]);

  // Mutations for workout control
  const startExecution = useMutation({
    mutationFn: async () => {
      // Start countdown instead of immediately starting
      if (!isCountingDown) {
        startCountdown();
      }
      
      if (assignment.status === 'assigned') {
        await updateProgress.mutateAsync({
          assignmentId: assignment.id,
          progressUpdate: {
            current_exercise_index: currentExerciseIndex,
            current_set: currentSet,
            current_rep: currentRep,
            completion_percentage: progress
          }
        });
      }
    }
  });

  const pauseExecution = useMutation({
    mutationFn: async () => {
      setIsActive(false);
    }
  });

  const stopExecution = useMutation({
    mutationFn: async () => {
      setIsActive(false);
      await updateProgress.mutateAsync({
        assignmentId: assignment.id,
        progressUpdate: {
          current_exercise_index: currentExerciseIndex,
          current_set: currentSet,
          current_rep: currentRep,
          completion_percentage: progress
        }
      });
    }
  });

  const resetExecution = useMutation({
    mutationFn: async () => {
      setCurrentExerciseIndex(0);
      setCurrentSet(1);
      setCurrentRep(1);
      setElapsedTime(0);
      setIsActive(false);
      await updateProgress.mutateAsync({
        assignmentId: assignment.id,
        progressUpdate: {
          current_exercise_index: 0,
          current_set: 1,
          current_rep: 1,
          completion_percentage: 0
        }
      });
    }
  });

  const completeExecution = useMutation({
    mutationFn: async () => {
      setIsActive(false);
      await updateProgress.mutateAsync({
        assignmentId: assignment.id,
        progressUpdate: {
          workout_completed: true,
          completion_percentage: 100
        }
      });
      if (onComplete) onComplete();
    }
  });

  // Handle RPE submission
  const handleRPESubmit = useCallback(async () => {
    if (!selectedRPE || !user?.id) return;
    
    setIsLoggingRPE(true);
    try {
      // Save RPE to database - you can implement this based on your backend
      // await api.saveRPE(assignment.id, currentExerciseIndex, selectedRPE);
      
      setShowRPEScreen(false);
      setSelectedRPE(null);
      
      // Move to next exercise or complete workout
      if (currentExerciseIndex < totalExercises - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        setCurrentRep(1);
      } else {
        // Complete workout
        completeExecution.mutate();
      }
    } catch (error) {
      console.error('Error saving RPE:', error);
    } finally {
      setIsLoggingRPE(false);
    }
  }, [selectedRPE, user?.id, assignment.id, currentExerciseIndex, totalExercises, completeExecution]);

  // Skip RPE
  const handleSkipRPE = useCallback(() => {
    setShowRPEScreen(false);
    setSelectedRPE(null);
    
    // Move to next exercise or complete workout
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setCurrentRep(1);
    } else {
      // Complete workout
      completeExecution.mutate();
    }
  }, [currentExerciseIndex, totalExercises, completeExecution]);

  // Navigation handlers
  const handleNext = () => {
    const totalSets = currentExerciseSets;
    const totalReps = currentExerciseReps;
    
    // Stop any active timers first
    setIsActive(false);
    
    // Progress through reps first
    if (currentRep < totalReps) {
      setCurrentRep(currentRep + 1);
      // Trigger countdown for next rep
      setTimeout(() => {
        if (!isResting) {
          startCountdown();
        }
      }, 100);
    }
    // Then progress through sets
    else if (currentSet < totalSets) {
      setCurrentSet(currentSet + 1);
      setCurrentRep(1);
      
            // Start rest countdown between sets
      // Get rest time from exercise data (copied from block level during assignment creation)
      let restTime = 60; // Reasonable default fallback
      
      if (currentExercise?.rest && currentExercise.rest !== '' && parseInt(currentExercise.rest) > 0) {
        // Exercise-specific rest takes priority
        restTime = parseInt(currentExercise.rest);
      } else if (currentExercise?.rest_seconds && parseInt(String(currentExercise.rest_seconds)) > 0) {
        // Check rest_seconds field (used in unified assignments)
        restTime = parseInt(String(currentExercise.rest_seconds));
      }
      
      if (restTime > 0) {
        startRestCountdown(restTime);
      } else {
        // If no rest time, trigger countdown immediately
        setTimeout(() => {
          startCountdown();
        }, 100);
      }
    }
    // Finally move to next exercise
    else if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setCurrentRep(1);
      
      // Trigger countdown for next exercise
      setTimeout(() => {
        if (!isResting) {
          startCountdown();
        }
      }, 100);
    }
    // Complete workout
    else {
      // Show RPE screen before completing workout
      setShowRPEScreen(true);
    }
  };

  // Skip rest function
  const skipRest = useCallback(() => {
    if (isResting && restCountdownRef) {
      clearInterval(restCountdownRef);
      setIsResting(false);
      setRestCountdown(0);
      setRestCountdownRef(null);
    }
  }, [isResting, restCountdownRef]);

  const handlePrev = () => {
    // Stop any active timers first
    setIsActive(false);
    
    // Go back through reps first
    if (currentRep > 1) {
      setCurrentRep(currentRep - 1);
      // Trigger countdown for previous rep
      setTimeout(() => {
        if (!isResting) {
          startCountdown();
        }
      }, 100);
    }
    // Then go back through sets
    else if (currentSet > 1) {
      setCurrentSet(currentSet - 1);
      // Get reps for this exercise
      const totalReps = currentExerciseReps;
      setCurrentRep(totalReps);
      // Trigger countdown for previous set
      setTimeout(() => {
        if (!isResting) {
          startCountdown();
        }
      }, 100);
    }
    // Finally go to previous exercise
    else if (currentExerciseIndex > 0) {
      const prevExerciseIndex = currentExerciseIndex - 1;
      const prevExercise = exercises[prevExerciseIndex];
      const prevExerciseSets = parsePositiveInt(prevExercise?.sets, 1);
      const prevExerciseReps = parsePositiveInt(prevExercise?.reps, 1);
      
      setCurrentExerciseIndex(prevExerciseIndex);
      setCurrentSet(prevExerciseSets);
      setCurrentRep(prevExerciseReps);
      // Trigger countdown for previous exercise
      setTimeout(() => {
        if (!isResting) {
          startCountdown();
        }
      }, 100);
    }
  };

  // Get button text for next action
  const getNextButtonText = () => {
    if (!currentExercise) return 'Next';
    
    const totalSets = currentExerciseSets;
    const totalReps = currentExerciseReps;
    const isLastExercise = currentExerciseIndex === totalExercises - 1;
    const isLastSet = currentSet === totalSets;
    const isLastRep = currentRep === totalReps;
    
    if (isLastExercise && isLastSet && isLastRep) {
      return 'Complete';
    }
    
    if (currentRep < totalReps) {
      return 'Next Rep';
    }
    
    if (currentSet < totalSets) {
      return 'Next Set';
    }
    
    return 'Next Exercise';
  };

  if (exercises.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onExit || (() => {})} isCentered size="md">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg}>
          <ModalBody py={8}>
            <VStack spacing={4} textAlign="center">
              <Text fontSize="xl" fontWeight="semibold" color="gray.600">No Exercises Found</Text>
              <Text color="gray.500">This assignment doesn't have any exercises for today.</Text>
              <Button onClick={onExit} variant="outline">Go Back</Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <>
    <Modal 
      isOpen={isOpen} 
      onClose={onExit || (() => {})} 
      isCentered 
      size="xl"
      closeOnOverlayClick={false}
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent 
        bg={cardBg}
        h={{ base: "100vh", md: "auto" }}
        maxH={{ base: "100vh", md: "90vh" }}
        w={{ base: "100vw", md: "600px" }}
        maxW={{ base: "100vw", md: "600px" }}
        minW={{ base: "100vw", md: "600px" }}
        borderRadius={{ base: 0, md: "md" }}
        m={{ base: 0, md: 4 }}
        overflow="hidden"
        position={{ base: "fixed", md: "relative" }}
        top={{ base: 0, md: "auto" }}
        left={{ base: 0, md: "auto" }}
        right={{ base: 0, md: "auto" }}
        bottom={{ base: 0, md: "auto" }}
        display="flex"
        flexDirection="column"
      >
        {/* Progress Bar - Flush to top */}
        <Box w="full" h="3px" bg={progressBg} position="relative">
          <Box
            h="full"
            bg={currentColor}
            borderRadius="0"
            width={`${progress}%`}
            transition="width 0.3s ease"
          />
        </Box>

        <ModalHeader>
          <HStack w="full" position="relative">
            <IconButton
              aria-label="Back"
              icon={<ChevronLeftIcon />}
              variant="ghost"
              onClick={onExit}
              position="absolute"
              left={0}
              zIndex={2}
            />
            
            <VStack spacing={0} textAlign="center" w="full" align="center">
              {showRPEScreen ? (
                <Text fontSize="lg" fontWeight="semibold" textAlign="center">
                  Rate Your Effort
                </Text>
              ) : (
                <>
                  <Text fontSize="xs" color={currentColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                    {assignment.exercise_block?.workout_name || assignment.exercise_block?.plan_name || 'WORKOUT'}
                  </Text>
                  <Text fontSize="lg" fontWeight="semibold" textAlign="center">
                    {currentExercise?.name || 'Exercise'}
                  </Text>
                  <Text fontSize="sm" color={modalTextColor} textAlign="center">
                    Next Block: Recovery
                  </Text>
                </>
              )}
            </VStack>
          </HStack>
        </ModalHeader>

        <ModalBody px={6} py={3} flex="1" overflow="auto">
          <VStack spacing={6} align="stretch">
            {/* Countdown Display */}
            {isCountingDown && (
              <Box 
                position="absolute" 
                top="50%" 
                left="50%" 
                transform="translate(-50%, -50%)"
                zIndex={1000}
                bg="rgba(0, 0, 0, 0.8)"
                w="full"
                h="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <VStack spacing={2}>
                  <Text fontSize="6xl" fontWeight="bold" color="red.400">
                    {countdown}
                  </Text>
                  <Text fontSize="lg" color="white" textAlign="center">
                    Get Ready!
                  </Text>
                </VStack>
              </Box>
            )}
            
            {/* RPE Screen */}
            {showRPEScreen && (
              <VStack spacing={6} align="stretch" py={8}>
                <VStack spacing={4} textAlign="center">
                  <Text fontSize="3xl" fontWeight="bold" color={currentColor}>
                    Rate Your Effort
                  </Text>
                  <Text fontSize="lg" color={modalTextColor}>
                    How hard did that feel?
                  </Text>
                </VStack>
                
                {/* RPE Scale */}
                <VStack spacing={4}>
                  <SimpleGrid columns={2} spacing={3} w="full">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => (
                      <Button
                        key={rating}
                        h="60px"
                        variant={selectedRPE === rating ? "solid" : "outline"}
                        colorScheme={selectedRPE === rating ? "blue" : "gray"}
                        onClick={() => setSelectedRPE(rating)}
                        size="lg"
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize="xl" fontWeight="bold">
                          {rating}
                        </Text>
                        <Text fontSize="xs" opacity={0.8}>
                          {getRPELabel(rating)}
                        </Text>
                      </Button>
                    ))}
                  </SimpleGrid>
                </VStack>
                
                {/* Selected RPE Display */}
                {selectedRPE && (
                  <Box w="full" bg={sectionBg} borderRadius="xl" p={4} textAlign="center">
                    <Text fontSize="sm" color={modalTextColor}>
                      <Text as="span" fontWeight="bold" color={currentColor}>
                        {selectedRPE}/10
                      </Text>
                      {" - "}
                      {getRPELabel(selectedRPE)}
                    </Text>
                  </Box>
                )}
                
                {/* Action Buttons */}
                <HStack spacing={4} w="full">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={handleSkipRPE}
                    isDisabled={isLoggingRPE}
                    flex={1}
                  >
                    Skip RPE
                  </Button>
                  <Button 
                    size="lg" 
                    colorScheme="blue" 
                    onClick={handleRPESubmit}
                    isDisabled={!selectedRPE || isLoggingRPE}
                    isLoading={isLoggingRPE}
                    loadingText="Saving..."
                    flex={1}
                  >
                    Submit RPE
                  </Button>
                </HStack>
              </VStack>
            )}
            
            {/* Error State */}
            {!showRPEScreen && exerciseLoadingError && (
              <Box w="full" bg={sectionBg} borderRadius="xl" p={6} textAlign="center">
                <Text fontSize="lg" fontWeight="bold" color="red.500" mb={2}>
                  No Exercises Found
                </Text>
                <Text fontSize="sm" color={modalTextColor} mb={4}>
                  {exerciseLoadingError}
                </Text>
                <Button
                  size="sm"
                  onClick={() => {
                    setExerciseLoadingError(null);
                    // Trigger a re-load
                    const loadExercises = async () => {
                      // Re-run the exercise loading logic
                      window.location.reload();
                    };
                    loadExercises();
                  }}
                >
                  Go Back
                </Button>
              </Box>
            )}

            {/* Loading State */}
            {!showRPEScreen && !exerciseLoadingError && totalExercises === 0 && (
              <Box w="full" bg={sectionBg} borderRadius="xl" p={6} textAlign="center">
                <Text fontSize="lg" fontWeight="bold" mb={2}>
                  Loading Exercises...
                </Text>
                <Text fontSize="sm" color={modalTextColor}>
                  Please wait while we load your workout
                </Text>
              </Box>
            )}

            {/* Current Exercise Display */}
            {!showRPEScreen && !exerciseLoadingError && totalExercises > 0 && (
              <Box w="full" bg={sectionBg} borderRadius="xl" p={4}>
                {/* Progress Dots for Sets and Reps */}
                <HStack spacing={8} justify="center" align="start">
                  <ProgressDots 
                    current={currentSet} 
                    total={currentExerciseSets} 
                    label="SET"
                    size="8px"
                  />
                  <ProgressDots 
                    current={currentRep} 
                    total={currentExerciseReps} 
                    label="REP"
                    size="8px"
                  />
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase">
                      BLOCK
                    </Text>
                    <Text fontSize="xl" fontWeight="bold" color={currentColor}>
                      1/2
                    </Text>
                  </VStack>
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase">
                      EXERCISE
                    </Text>
                    <Text fontSize="xl" fontWeight="bold" color={currentColor}>
                      {currentExerciseIndex + 1}/3
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            )}

            {/* Timer Section */}
            {!showRPEScreen && !exerciseLoadingError && totalExercises > 0 && (
              <Box w="full" bg={sectionBg} borderRadius="xl" p={6}>
                <VStack spacing={4}>
                  {/* Dynamic timer title - only show when not resting */}
                  {!isResting && (
                    <Text fontSize="sm" color={modalTextColor} fontWeight="medium" textTransform="uppercase">
                      TIMER
                    </Text>
                  )}
                  
                  {/* Timer Display with Navigation */}
                  <HStack spacing={4} justify="center" align="center">
                    <IconButton
                      aria-label="Previous"
                      icon={<ChevronLeftIcon boxSize={8} />}
                      size="xl"
                      variant="ghost"
                      onClick={handlePrev}
                      isDisabled={currentExerciseIndex === 0 && currentSet === 1 && currentRep === 1}
                    />
                    
                    {isResting ? (
                      <VStack spacing={2}>
                        <Text fontSize="sm" color="orange.500" fontWeight="medium" textTransform="uppercase">
                          REST TIME
                        </Text>
                        <FixedTimer 
                          seconds={restCountdown} 
                          color="orange.500" 
                          isRest={true}
                        />
                      </VStack>
                    ) : (
                      <FixedTimer 
                        seconds={elapsedTime} 
                        color={currentColor} 
                        isRest={false}
                      />
                    )}
                    
                    <IconButton
                      aria-label="Next"
                      icon={<ChevronRightIcon boxSize={8} />}
                      size="xl"
                      variant="ghost"
                      onClick={handleNext}
                      isDisabled={assignment.status === 'completed'}
                    />
                  </HStack>
                  
                  {/* Circular Action Buttons */}
                  <HStack spacing={4} justify="center" mt={4}>
                    <IconButton
                      aria-label="Exercise details"
                      icon={<FaInfoCircle />}
                      borderRadius="full"
                      size="md"
                      variant="outline"
                      onClick={onDetailsDrawerOpen}
                      isDisabled={isCountingDown || isResting}
                    />
                    <IconButton
                      aria-label="Reset timer"
                      icon={<FaRedo />}
                      borderRadius="full"
                      size="md"
                      variant="outline"
                      onClick={() => {
                        // Only reset the blue timer (elapsedTime), not the entire workout
                        setElapsedTime(0);
                      }}
                      isDisabled={isCountingDown}
                    />
                    <IconButton
                      aria-label="Tutorial"
                      icon={<FaVideo />}
                      borderRadius="full"
                      size="md"
                      variant="outline"
                      onClick={() => {/* TODO: Show video */}}
                      isDisabled={isCountingDown || isResting}
                    />
                    <IconButton
                      aria-label={isActive ? "Pause timer" : "Play timer"}
                      icon={isActive ? <FaPause /> : <FaPlay />}
                      borderRadius="full"
                      size="md"
                      variant="outline"
                      onClick={() => {
                        if (isActive) {
                          setIsActive(false);
                        } else if (!isCountingDown && !isResting) {
                          startCountdown();
                        }
                      }}
                      isDisabled={isCountingDown || isResting}
                    />
                    <IconButton
                      aria-label={isResting ? "Skip rest" : "Skip rest"}
                      icon={<FaForward />}
                      borderRadius="full"
                      size="md"
                      variant={isResting ? "solid" : "outline"}
                      colorScheme={isResting ? "orange" : "gray"}
                      onClick={skipRest}
                      isDisabled={isCountingDown || !isResting}
                    />
                  </HStack>
                </VStack>
              </Box>
            )}

            {/* Runtime Input for Running Exercises */}
            {!showRPEScreen && !exerciseLoadingError && totalExercises > 0 && isRunningExercise() && (
              <Box w="full">
                <RunTimeInput
                  onTimeChange={handleTimeChange}
                  initialMinutes={runTime.minutes}
                  initialSeconds={runTime.seconds}
                  initialHundredths={runTime.hundredths}
                  placeholder="ENTER YOUR RUN TIME"
                />
              </Box>
            )}

            {/* Instructions */}
            {!showRPEScreen && !exerciseLoadingError && totalExercises > 0 && currentExercise?.instructions && (
              <Box w="full" bg={sectionBg} borderRadius="xl" p={4} textAlign="center">
                <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" mb={2}>
                  Instructions
                </Text>
                <Text fontSize="sm" color={modalTextColor}>
                  {currentExercise.instructions}
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter p={6}>
          <VStack spacing={4} w="full">
            {/* Show Go Back button when there's an error or no exercises */}
            {(exerciseLoadingError || totalExercises === 0) && (
              <Button
                size="lg"
                onClick={onExit}
                w="full"
              >
                Go Back
              </Button>
            )}
          </VStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
    
    {/* Workout Info Drawer */}
    <WorkoutInfoDrawer
      isOpen={isDetailsDrawerOpen}
      onClose={onDetailsDrawerClose}
      flowType="Sequential"
      category="Main"
      restBetween={
                        (currentExercise?.rest && currentExercise.rest !== '' && parseInt(currentExercise.rest) > 0) ? `${currentExercise.rest}s` :
                        (currentExercise?.rest_seconds && parseInt(String(currentExercise.rest_seconds)) > 0) ? `${currentExercise.rest_seconds}s` : 
                        '60s'
                      }
      contacts={currentExercise?.sets || ''}
      direction={currentExercise?.type || ''}
      movementInstructions={currentExercise?.instructions || ''}
    />
    </>
  );
} 