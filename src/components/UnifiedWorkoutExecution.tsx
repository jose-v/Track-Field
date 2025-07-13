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
  Spinner,
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
  rest_between_exercises?: number | string; // Rest time between exercises
  instructions?: string;
  notes?: string; // Exercise notes
  movement_notes?: string; // Movement instructions
  timed_duration?: number; // Duration in seconds for timed exercises
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

  // Extract exercises from assignment based on type - WITH LOADING STATES
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [totalExercises, setTotalExercises] = useState(0);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [exerciseLoadError, setExerciseLoadError] = useState<string | null>(null);
  const [isRestDay, setIsRestDay] = useState(false);
  const [restDayInfo, setRestDayInfo] = useState<{ day: string; message?: string } | null>(null);

  // Load exercises with proper loading states and error handling
  useEffect(() => {
    if (!assignment || !isOpen) {
      setIsLoadingExercises(false);
      return;
    }

    // Start loading
    setIsLoadingExercises(true);
    setExerciseLoadError(null);
    setIsRestDay(false);
    setRestDayInfo(null);

    console.log('UnifiedWorkoutExecution: Loading exercises for assignment:', assignment.id, assignment.assignment_type);

    try {
      if (assignment.assignment_type === 'single') {
        const exerciseList = assignment.exercise_block?.exercises || [];
        console.log('Single assignment exercises:', exerciseList);
        
        if (exerciseList.length === 0) {
          setExerciseLoadError('This workout has no exercises assigned.');
        } else {
          setExercises(exerciseList.map(exercise => ({
            ...exercise,
            sets: parsePositiveInt(exercise.sets, 1),
            reps: parsePositiveInt(exercise.reps, 1)
          })));
          setTotalExercises(exerciseList.length);
        }
      } else if (assignment.assignment_type === 'weekly') {
        // Weekly plan - extract today's exercises with comprehensive error handling
        const dailyWorkouts = assignment.exercise_block?.daily_workouts || {};
        const legacyExercises = assignment.exercise_block?.exercises || [];
        
        console.log('Weekly assignment daily_workouts:', dailyWorkouts);
        console.log('Weekly assignment legacy exercises:', legacyExercises);
        console.log('Full exercise_block:', assignment.exercise_block);
        
        // Check if we have any weekly plan data at all
        const hasDailyWorkouts = Object.keys(dailyWorkouts).length > 0;
        const hasLegacyExercises = Array.isArray(legacyExercises) && legacyExercises.length > 0;
        
        if (!hasDailyWorkouts && !hasLegacyExercises) {
          setExerciseLoadError('This weekly plan has no workouts configured.');
          setIsLoadingExercises(false);
          return;
        }
        
        const today = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDayName = dayNames[today.getDay()];
        console.log('Current day:', currentDayName);
        
        let todaysWorkout: any = null;
        let selectedDay = currentDayName;
        let workoutSource = '';
        
        // Try to find today's workout in the new format first
        if (hasDailyWorkouts) {
          todaysWorkout = dailyWorkouts[currentDayName];
          workoutSource = 'daily_workouts';
          console.log('Found in daily_workouts - Today\'s workout:', todaysWorkout);
        }
        
        // If not found, try the legacy format
        if (!todaysWorkout && hasLegacyExercises) {
          console.log('Trying legacy format...');
          // Check if it's a weekly plan structure with day objects
          if (legacyExercises.length > 0 && typeof legacyExercises[0] === 'object' && 'day' in legacyExercises[0]) {
            console.log('Found legacy weekly plan structure');
            const todaysPlan = legacyExercises.find((dayPlan: any) => dayPlan.day === currentDayName);
            if (todaysPlan) {
              todaysWorkout = todaysPlan;
              workoutSource = 'legacy';
              console.log('Found in legacy format - Today\'s workout:', todaysWorkout);
            }
          }
        }
        
        // Check if today's workout is empty (including empty arrays)
        const isTodaysWorkoutEmpty = !todaysWorkout || 
          (Array.isArray(todaysWorkout) && todaysWorkout.length === 0) ||
          (todaysWorkout.exercises && Array.isArray(todaysWorkout.exercises) && todaysWorkout.exercises.length === 0);
        
        console.log('Is today\'s workout empty?', isTodaysWorkoutEmpty);
        
        // If today's workout is empty, treat it as a rest day
        if (isTodaysWorkoutEmpty) {
          console.log('Today appears to be a rest day (empty workout)');
          setIsRestDay(true);
          setRestDayInfo({ 
            day: currentDayName,
            message: `Today is a rest day in your weekly plan. Take time to recover and prepare for tomorrow's training.`
          });
          setIsLoadingExercises(false);
          return;
        }
        
        // If no workout data at all, then search for available days as fallback
        if (!todaysWorkout) {
          console.log('No workout data for today, searching for first available day...');
          let availableDays: string[] = [];
          
          if (hasDailyWorkouts) {
            availableDays = Object.keys(dailyWorkouts).filter(dayKey => {
              const dayWorkout = dailyWorkouts[dayKey];
              if (!dayWorkout) return false;
              
              if (Array.isArray(dayWorkout)) {
                // Check if array has content and at least one block has exercises
                return dayWorkout.length > 0 && dayWorkout.some((block: any) => block.exercises && block.exercises.length > 0);
              } else {
                return dayWorkout.exercises && dayWorkout.exercises.length > 0 && !dayWorkout.is_rest_day;
              }
            });
          } else if (hasLegacyExercises) {
            availableDays = legacyExercises
              .filter((dayPlan: any) => dayPlan.exercises && dayPlan.exercises.length > 0 && !dayPlan.isRestDay)
              .map((dayPlan: any) => dayPlan.day);
          }
          
          console.log('Available days:', availableDays);
          
          if (availableDays.length > 0) {
            selectedDay = availableDays[0];
            if (hasDailyWorkouts) {
              todaysWorkout = dailyWorkouts[selectedDay];
              workoutSource = 'daily_workouts';
            } else {
              todaysWorkout = legacyExercises.find((dayPlan: any) => dayPlan.day === selectedDay);
              workoutSource = 'legacy';
            }
            console.log('Switched to available day:', selectedDay);
            console.log('New workout data:', todaysWorkout);
          } else {
            // Check if all days are rest days
            let hasRestDays = false;
            if (hasDailyWorkouts) {
              hasRestDays = Object.values(dailyWorkouts).some((workout: any) => 
                workout && (workout.is_rest_day || (Array.isArray(workout) && workout.length === 0))
              );
            } else if (hasLegacyExercises) {
              hasRestDays = legacyExercises.some((dayPlan: any) => dayPlan.isRestDay);
            }
            
            if (hasRestDays) {
              // If all days are rest days, show rest day UI with special message
              setIsRestDay(true);
              setRestDayInfo({ 
                day: 'week',
                message: `This week appears to be a rest week. All days are scheduled for recovery. Enjoy your well-deserved break!`
              });
            } else {
              setExerciseLoadError('This weekly plan has no exercises configured for any day.');
            }
            setIsLoadingExercises(false);
            return;
          }
        }
        
        console.log('Final workout source:', workoutSource);
        console.log('Final selected day:', selectedDay);
        console.log('Final workout data:', todaysWorkout);
        
        let exerciseList: any[] = [];
        
        if (todaysWorkout) {
          try {
            if (workoutSource === 'legacy') {
              // Legacy format: { day: 'monday', exercises: [...], isRestDay: false }
              console.log('Processing legacy format');
              if (todaysWorkout.isRestDay) {
                setIsRestDay(true);
                setRestDayInfo({ 
                  day: selectedDay,
                  message: `Today is a rest day in your weekly plan. Take time to recover and prepare for tomorrow's training.`
                });
                setIsLoadingExercises(false);
                return;
              } else if (todaysWorkout.exercises && Array.isArray(todaysWorkout.exercises)) {
                console.log('Legacy exercises:', todaysWorkout.exercises);
                exerciseList = todaysWorkout.exercises.map((exercise: any) => ({
                  ...exercise,
                  sets: parsePositiveInt(exercise.sets, 1),
                  reps: parsePositiveInt(exercise.reps, 1),
                  rest_seconds: exercise.rest || exercise.rest_seconds || 60
                }));
              } else {
                console.log('Legacy workout found but no exercises');
                setExerciseLoadError(`The workout for ${selectedDay} has no exercises configured.`);
                setIsLoadingExercises(false);
                return;
              }
            } else if (Array.isArray(todaysWorkout)) {
              // New blocks format from daily_workouts
              console.log('Processing new blocks format');
              console.log('Total blocks:', todaysWorkout.length);
              
              if (todaysWorkout.length === 0) {
                console.log('Empty blocks array found');
                setExerciseLoadError(`The workout for ${selectedDay} has no exercise blocks configured.`);
                setIsLoadingExercises(false);
                return;
              }
              
              exerciseList = todaysWorkout.flatMap((block: any, blockIndex: number) => {
                const exercises = block.exercises || [];
                console.log(`Block ${blockIndex + 1} exercises:`, exercises);
                return exercises.map((exercise: any) => ({
                  ...exercise,
                  sets: parsePositiveInt(exercise.sets, 1),
                  reps: parsePositiveInt(exercise.reps, 1),
                  rest_seconds: exercise.rest || exercise.rest_seconds || block.restBetweenExercises || 60
                }));
              });
            } else if (todaysWorkout.exercises && !todaysWorkout.is_rest_day) {
              // Old object format from daily_workouts
              console.log('Processing old daily_workouts format, exercises:', todaysWorkout.exercises);
              exerciseList = todaysWorkout.exercises.map((exercise: any) => ({
                ...exercise,
                sets: parsePositiveInt(exercise.sets, 1),
                reps: parsePositiveInt(exercise.reps, 1),
                rest_seconds: exercise.rest || exercise.rest_seconds || 60
              }));
            } else if (todaysWorkout.is_rest_day) {
              setIsRestDay(true);
              setRestDayInfo({ 
                day: selectedDay,
                message: `Today is a rest day in your weekly plan. Take time to recover and prepare for tomorrow's training.`
              });
              setIsLoadingExercises(false);
              return;
            } else {
              console.log('Workout found but no exercises, workout data:', todaysWorkout);
              setExerciseLoadError(`The workout for ${selectedDay} has no exercises configured.`);
              setIsLoadingExercises(false);
              return;
            }
          } catch (error) {
            console.error('Error processing weekly workout:', error);
            console.error('Workout data that caused error:', todaysWorkout);
            setExerciseLoadError('Error processing the weekly workout data.');
            setIsLoadingExercises(false);
            return;
          }
        }
        
        console.log('Final exercise list:', exerciseList);
        
        if (exerciseList.length === 0) {
          setExerciseLoadError(`No exercises found for ${selectedDay} in this weekly plan.`);
        } else {
          setExercises(exerciseList);
          setTotalExercises(exerciseList.length);
        }
      } else if (assignment.assignment_type === 'monthly') {
        // Monthly plans should show weekly structure, not daily exercises
        setExerciseLoadError('Monthly plans should be executed week by week, not as individual workouts.');
      } else {
        setExerciseLoadError(`Unsupported assignment type: ${assignment.assignment_type}`);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
      setExerciseLoadError('An unexpected error occurred while loading the workout.');
    }

    // Always finish loading
    setIsLoadingExercises(false);
  }, [assignment, isOpen]);

  // Local state for current position (unified system only)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(assignment.progress?.current_exercise_index || 0);
  const [currentSet, setCurrentSet] = useState(assignment.progress?.current_set || 1);
  const [currentRep, setCurrentRep] = useState(assignment.progress?.current_rep || 1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(false); // Always start with overlay, regardless of status
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false); // Track when workout is being completed
  
  // Timer state
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [countdownRef, setCountdownRef] = useState<NodeJS.Timeout | null>(null);

  // Rest timer state
  const [isResting, setIsResting] = useState(false);
  const [restCountdown, setRestCountdown] = useState(0);
  const [restCountdownRef, setRestCountdownRef] = useState<NodeJS.Timeout | null>(null);

  // Green countdown timer state for timed exercises
  const [timedCountdown, setTimedCountdown] = useState(0);
  const [timedCountdownRef, setTimedCountdownRef] = useState<NodeJS.Timeout | null>(null);
  const [isTimedCountdown, setIsTimedCountdown] = useState(false);
  
  // Preparatory countdown states (red countdown before green timer)
  const [prepCountdown, setPrepCountdown] = useState(0);
  const [prepCountdownRef, setPrepCountdownRef] = useState<NodeJS.Timeout | null>(null);
  const [isPrepCountdown, setIsPrepCountdown] = useState(false);
  
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

  // Helper function to check if current exercise is a timed exercise
  const isTimedExercise = useCallback(() => {
    if (!currentExercise) return false;
    return currentExercise.timed_duration && currentExercise.timed_duration > 0;
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
        // Current exercise - check exercise type for progress calculation
        const exerciseName = exercise.name?.toLowerCase() || '';
        const isRunning = exerciseName.includes('run') || 
                         exerciseName.includes('sprint') || 
                         exerciseName.includes('jog') ||
                         exerciseName.includes('dash') ||
                         exerciseName.includes('meter') ||
                         exerciseName.includes('mile') ||
                         exercise.type === 'running';
        
        if (currentSet >= sets) {
          // Exercise is fully completed
          completedWork += exerciseWork;
        } else {
          // Exercise is in progress
          if (isRunning) {
            // For running exercises: count individual reps completed
            const completedSets = currentSet - 1;
            const completedRepsInCurrentSet = currentRep - 1;
            completedWork += (completedSets * reps) + completedRepsInCurrentSet;
          } else {
            // For non-running exercises: count completed sets only
            const completedSets = currentSet - 1;
            completedWork += completedSets * reps;
          }
        }
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

  // Green countdown timer logic for timed exercises
  const startTimedCountdown = useCallback((duration: number) => {
    if (timedCountdownRef) {
      clearInterval(timedCountdownRef);
    }
    
    setIsTimedCountdown(true);
    setTimedCountdown(duration);
    setHasStartedTimedCountdown(true); // Mark that countdown has started
    
    const interval = setInterval(() => {
      setTimedCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimedCountdown(false);
          setTimedCountdownRef(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimedCountdownRef(interval);
  }, [timedCountdownRef]);

  // Countdown timer logic
  const startCountdown = useCallback(() => {
    if (countdownRef) {
      clearInterval(countdownRef);
    }
    
    setIsCountingDown(true);
    // Use 3 seconds for running exercises (for "Ready, Set, Go"), 5 seconds for others
    const countdownDuration = isRunningExercise() ? 3 : 5;
    setCountdown(countdownDuration);
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCountingDown(false);
          setCountdownRef(null);
          
          // For timed exercises, start green countdown instead of blue timer
          if (isTimedExercise()) {
            const timedDuration = currentExercise?.timed_duration || 30;
            startTimedCountdown(timedDuration);
          } else {
            // For regular exercises, start the blue timer
            setIsActive(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setCountdownRef(interval);
  }, [countdownRef, isRunningExercise, isTimedExercise, currentExercise, startTimedCountdown]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef) {
        clearInterval(countdownRef);
      }
    };
  }, [countdownRef]);

  // Note: Removed automatic countdown start - now user must click the start button

  // Reset blue timer (elapsedTime) when set/rep/block changes
  useEffect(() => {
    if (isOpen) {
      setElapsedTime(0);
      setIsManuallyPaused(false); // Reset manual pause flag when changing exercise/set/rep
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

  // Start preparatory countdown (red countdown before green timer)
  const startPrepCountdown = useCallback((duration: number) => {
    if (prepCountdownRef) {
      clearInterval(prepCountdownRef);
    }
    
    setIsPrepCountdown(true);
    setPrepCountdown(duration);
    
    const interval = setInterval(() => {
      setPrepCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsPrepCountdown(false);
          setPrepCountdownRef(null);
          
          // Start the green timed countdown after prep countdown finishes
          const timedDuration = currentExercise?.timed_duration || 30;
          startTimedCountdown(timedDuration);
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setPrepCountdownRef(interval);
  }, [prepCountdownRef, currentExercise, startTimedCountdown]);

  // Cleanup timed countdown on unmount
  useEffect(() => {
    return () => {
      if (timedCountdownRef) {
        clearInterval(timedCountdownRef);
      }
      if (prepCountdownRef) {
        clearInterval(prepCountdownRef);
      }
    };
  }, [timedCountdownRef, prepCountdownRef]);

  // Start timed countdown when transitioning to a timed exercise
  useEffect(() => {
    // Reset the timer flag when moving to a new exercise
    if (isOpen && totalExercises > 0 && isTimedExercise()) {
      setHasStartedTimedCountdown(false);
    }
    
    // Note: Timed exercises now follow the same pattern as regular exercises:
    // Start button -> Red countdown -> Green timed countdown
    // Note: Timed exercises now follow the same pattern as regular exercises:
    // Start button -> Red countdown -> Green timed countdown
  }, []);

  // Reset completion state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsCompleting(false);
      // Reset state when exiting execution
    }
  }, [isOpen]);

  // Mutations for workout control
  const startExecution = useMutation({
    mutationFn: async () => {
      // Start countdown instead of immediately starting
      if (!isCountingDown) {
        setIsManuallyPaused(false); // Reset manual pause flag when starting
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
      setIsCompleting(true); // Mark as completing to prevent start overlay
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
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSet(1);
        setCurrentRep(1);
      } else {
        // Complete workout - close modal immediately
        setIsCompleting(true);
        if (onComplete) onComplete(); // Close modal immediately
        // Continue with background completion
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
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      setCurrentRep(1);
    } else {
      // Complete workout - close modal immediately
      setIsCompleting(true);
      if (onComplete) onComplete(); // Close modal immediately
      // Continue with background completion
      completeExecution.mutate();
    }
  }, [currentExerciseIndex, totalExercises, completeExecution]);

  // Navigation handlers
  const handleNext = () => {
    const totalSets = currentExerciseSets;
    const totalReps = currentExerciseReps;
    const isRunning = isRunningExercise();
    
    // Stop any active timers first
    setIsActive(false);
    
    if (isRunning) {
      // For running exercises: Use rep-by-rep navigation
      // Progress through reps first
      if (currentRep < totalReps) {
        setCurrentRep(prev => prev + 1);
        // For most exercises, no rest between reps
        // User will see start button to begin next rep
        return; // Exit early to prevent further navigation
      }
      // Then progress through sets
      else if (currentSet < totalSets) {
        setCurrentSet(prev => prev + 1);
        setCurrentRep(1);
        
        // REST BETWEEN SETS
        let restTime = 60; // Default fallback
        
        if (currentExercise?.rest && currentExercise.rest !== '' && parseInt(currentExercise.rest) > 0) {
          restTime = parseInt(currentExercise.rest);
        } else if (currentExercise?.rest_seconds && parseInt(String(currentExercise.rest_seconds)) > 0) {
          restTime = parseInt(String(currentExercise.rest_seconds));
        }
        
        if (restTime > 0) {
          startRestCountdown(restTime);
        }
        // Note: After rest or if no rest, user will see start button to begin next rep
        return; // Exit early to prevent further navigation
      }
    } else {
      // For non-running exercises: Use set-based navigation (skip reps)
      // Progress through sets
      if (currentSet < totalSets) {
        setCurrentSet(prev => prev + 1);
        setCurrentRep(1); // Reset to 1 for the new set
        
        // REST BETWEEN SETS
        let restTime = 60; // Default fallback
        
        if (currentExercise?.rest && currentExercise.rest !== '' && parseInt(currentExercise.rest) > 0) {
          restTime = parseInt(currentExercise.rest);
        } else if (currentExercise?.rest_seconds && parseInt(String(currentExercise.rest_seconds)) > 0) {
          restTime = parseInt(String(currentExercise.rest_seconds));
        }
        
        if (restTime > 0) {
          startRestCountdown(restTime);
        }
        // Note: After rest or if no rest, user will see start button to begin next set
        return; // Exit early to prevent further navigation
      }
    }
    
    // Move to next exercise (applies to both running and non-running exercises)
    // This runs when we've completed all sets/reps for the current exercise
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      setCurrentRep(1);
      
      // REST BETWEEN EXERCISES
      // Use the specific rest_between_exercises field if available
      let exerciseTransitionRest = 90; // Default 1.5 minutes between exercises
      
      if (currentExercise?.rest_between_exercises && parseInt(String(currentExercise.rest_between_exercises)) > 0) {
        // Use the specific rest between exercises value
        exerciseTransitionRest = parseInt(String(currentExercise.rest_between_exercises));
      } else if (currentExercise?.rest && currentExercise.rest !== '' && parseInt(currentExercise.rest) > 0) {
        // Fall back to exercise rest time (but this should be for sets)
        exerciseTransitionRest = parseInt(currentExercise.rest);
      } else if (currentExercise?.rest_seconds && parseInt(String(currentExercise.rest_seconds)) > 0) {
        // Fall back to rest_seconds field
        exerciseTransitionRest = parseInt(String(currentExercise.rest_seconds));
      }
      
      // Apply rest between exercises
      if (exerciseTransitionRest > 0) {
        startRestCountdown(exerciseTransitionRest);
      }
      // Note: After rest or if no rest, user will see start button to begin next exercise
    }
    // Complete workout - we've finished the last exercise
    else {
      // Mark the current exercise as fully completed by ensuring we're at max reps
      const finalSets = currentExerciseSets;
      const finalReps = currentExerciseReps;
      if (currentSet < finalSets || currentRep < finalReps) {
        setCurrentSet(finalSets);
        setCurrentRep(finalReps);
      }
      
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

  // Track whether the timed countdown has ever been started
  const [hasStartedTimedCountdown, setHasStartedTimedCountdown] = useState(false);

  // Auto-progress when timed countdown reaches 0
  useEffect(() => {
    if (!isTimedCountdown && timedCountdown === 0 && isTimedExercise() && hasStartedTimedCountdown) {
      const timer = setTimeout(() => {
        handleNext();
        setHasStartedTimedCountdown(false); // Reset for next exercise
      }, 100); // Small delay to let UI update
      
      return () => clearTimeout(timer);
    }
  }, [isTimedCountdown, timedCountdown, isTimedExercise, handleNext, hasStartedTimedCountdown]);

  const handlePrev = () => {
    const totalReps = currentExerciseReps;
    const isRunning = isRunningExercise();
    
    // Stop any active timers first
    setIsActive(false);
    
    if (isRunning) {
      // For running exercises: Use rep-by-rep navigation
      // Go back through reps first
      if (currentRep > 1) {
        setCurrentRep(prev => prev - 1);
        // User will see start button for previous rep
      }
      // Then go back through sets
      else if (currentSet > 1) {
        setCurrentSet(prev => prev - 1);
        setCurrentRep(totalReps); // Set to max reps for the previous set
        // User will see start button for previous set
      }
      // Go to previous exercise
      else if (currentExerciseIndex > 0) {
        setCurrentExerciseIndex(prev => {
          const prevExerciseIndex = prev - 1;
          const prevExercise = exercises[prevExerciseIndex];
          const prevExerciseSets = parsePositiveInt(prevExercise?.sets, 1);
          const prevExerciseReps = parsePositiveInt(prevExercise?.reps, 1);
          
          // Set the sets and reps for the previous exercise
          setCurrentSet(prevExerciseSets);
          setCurrentRep(prevExerciseReps);
          
          return prevExerciseIndex;
        });
        
        // User will see start button for previous exercise
      }
    } else {
      // For non-running exercises: Use set-based navigation (skip reps)
      // Go back through sets
      if (currentSet > 1) {
        setCurrentSet(prev => prev - 1);
        setCurrentRep(1); // Reset to 1 for the previous set
        // User will see start button for previous set
      }
      // Go to previous exercise
      else if (currentExerciseIndex > 0) {
        setCurrentExerciseIndex(prev => {
          const prevExerciseIndex = prev - 1;
          const prevExercise = exercises[prevExerciseIndex];
          const prevExerciseSets = parsePositiveInt(prevExercise?.sets, 1);
          const prevExerciseReps = parsePositiveInt(prevExercise?.reps, 1);
          
          // Set the sets and reps for the previous exercise
          setCurrentSet(prevExerciseSets);
          setCurrentRep(prevExerciseReps);
          
          return prevExerciseIndex;
        });
        
        // User will see start button for previous exercise
      }
    }
  };

  // Get button text for next action
  const getNextButtonText = () => {
    if (!currentExercise) return 'Next';
    
    const totalSets = currentExerciseSets;
    const totalReps = currentExerciseReps;
    const isRunning = isRunningExercise();
    const isLastExercise = currentExerciseIndex === totalExercises - 1;
    const isLastSet = currentSet === totalSets;
    const isLastRep = currentRep === totalReps;
    
    if (isLastExercise && isLastSet && (!isRunning || isLastRep)) {
      return 'Complete';
    }
    
    if (isRunning && currentRep < totalReps) {
      return 'Next Rep';
    }
    
    if (currentSet < totalSets) {
      return 'Next Set';
    }
    
    return 'Next Exercise';
  };

  // REMOVED: Loading and "No Exercises Found" modals - go directly to main interface

  // Always render the modal - show loading states and errors within the modal instead of preventing render

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
              ) : isRestDay && restDayInfo ? (
                <>
                  <Text fontSize="xs" color="green.500" fontWeight="medium" textTransform="uppercase" textAlign="center">
                    {assignment.exercise_block?.plan_name || 'WEEKLY PLAN'}
                  </Text>
                  <Text fontSize="lg" fontWeight="semibold" textAlign="center">
                    {restDayInfo.day === 'week' ? 'Rest Week' : 'Rest Day'}
                  </Text>
                  <Text fontSize="sm" color={modalTextColor} textAlign="center">
                    Recovery and regeneration
                  </Text>
                </>
              ) : (
                <>
                  <Text fontSize="xs" color={currentColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                    {assignment.exercise_block?.workout_name || assignment.exercise_block?.plan_name || 'WORKOUT'}
                  </Text>
                  <Text fontSize="lg" fontWeight="semibold" textAlign="center">
                    {currentExercise?.name || 'Exercise'}
                  </Text>
                  <Text fontSize="sm" color={modalTextColor} textAlign="center">
                    {(() => {
                      if (currentExerciseIndex >= totalExercises - 1) {
                        return 'Finish Workout';
                      } else {
                        const nextExercise = exercises[currentExerciseIndex + 1];
                        return `Next: ${nextExercise?.name || `Exercise ${currentExerciseIndex + 2}`}`;
                      }
                    })()}
                  </Text>
                </>
              )}
            </VStack>
          </HStack>
        </ModalHeader>

        <ModalBody px={6} py={3} flex="1" overflow="auto">
          <VStack spacing={6} align="stretch">
            
            {/* Loading State */}
            {isLoadingExercises && (
              <VStack spacing={4} py={8}>
                <Spinner size="xl" color={currentColor} thickness="4px" />
                <Text fontSize="lg" fontWeight="medium">
                  Loading workout...
                </Text>
                <Text fontSize="sm" color={modalTextColor} textAlign="center">
                  Preparing your exercises
                </Text>
              </VStack>
            )}
            
            {/* Rest Day State */}
            {!isLoadingExercises && isRestDay && restDayInfo && (
              <VStack spacing={6} py={8} textAlign="center">
                <Circle size="100px" bg="green.100" color="green.500">
                  <Text fontSize="3xl">🛌</Text>
                </Circle>
                <VStack spacing={3}>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {restDayInfo.day === 'week' ? 'Rest Week' : 'Rest Day'}
                  </Text>
                  {restDayInfo.day !== 'week' && (
                    <Text fontSize="lg" fontWeight="medium" color={modalTextColor}>
                      {restDayInfo.day.charAt(0).toUpperCase() + restDayInfo.day.slice(1)}
                    </Text>
                  )}
                  <Text fontSize="md" color={modalTextColor} maxW="400px" lineHeight="1.6">
                    {restDayInfo.message}
                  </Text>
                </VStack>
                
                {/* Rest Day Tips */}
                <Box w="full" maxW="400px" bg={sectionBg} borderRadius="xl" p={4}>
                  <VStack spacing={3} align="start">
                    <Text fontSize="sm" fontWeight="semibold" color={currentColor}>
                      Recovery Tips:
                    </Text>
                    <VStack spacing={2} align="start" fontSize="sm" color={modalTextColor}>
                      <Text>• Stay hydrated and eat nutritious foods</Text>
                      <Text>• Get quality sleep (7-9 hours)</Text>
                      <Text>• Light stretching or gentle walking is okay</Text>
                      <Text>• Listen to your body and relax</Text>
                    </VStack>
                  </VStack>
                </Box>
                
                <Button
                  colorScheme="green"
                  variant="outline"
                  onClick={onExit}
                  size="lg"
                >
                  Got it!
                </Button>
              </VStack>
            )}
            
            {/* Error State */}
            {!isLoadingExercises && !isRestDay && exerciseLoadError && (
              <VStack spacing={6} py={8} textAlign="center">
                <Circle size="80px" bg="red.100" color="red.500">
                  <Text fontSize="2xl">⚠️</Text>
                </Circle>
                <VStack spacing={2}>
                  <Text fontSize="lg" fontWeight="semibold" color="red.500">
                    Unable to Load Workout
                  </Text>
                  <Text fontSize="sm" color={modalTextColor} maxW="400px">
                    {exerciseLoadError}
                  </Text>
                </VStack>
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={onExit}
                  size="lg"
                >
                  Close
                </Button>
              </VStack>
            )}
            
            {/* Main Workout Content - Only show when exercises are loaded successfully */}
            {!isLoadingExercises && !exerciseLoadError && !isRestDay && totalExercises > 0 && (
              <>
            {/* Countdown Display */}
            {isCountingDown && (
              <Box 
                position="absolute" 
                top="50%" 
                left="50%" 
                transform="translate(-50%, -50%)"
                zIndex={1000}
                bg="rgba(0, 0, 0, 0.5)"
                backdropFilter="blur(7px)"
                w="full"
                h="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <VStack spacing={6}>
                  {/* Exercise Name */}
                  {currentExercise && (
                    <Text fontSize="2xl" fontWeight="bold" color="white" textAlign="center">
                      {currentExercise.name}
                    </Text>
                  )}
                  
                  {/* Countdown Display */}
                  <Text fontSize="6xl" fontWeight="bold" color="red.400" textAlign="center">
                    {isRunningExercise() && countdown <= 3 ? 
                      (countdown === 3 ? "Ready" : countdown === 2 ? "Set" : countdown === 1 ? "Go!" : countdown) :
                      countdown
                    }
                  </Text>
                  
                  <Text fontSize="lg" color="white" textAlign="center">
                    Get Ready!
                  </Text>
                </VStack>
              </Box>
            )}

            {/* Start Button - Show when not counting down and not active */}
            {!isLoadingExercises && !exerciseLoadError && !isRestDay && !isCountingDown && !isActive && !isResting && !showRPEScreen && totalExercises > 0 && !isManuallyPaused && !isTimedCountdown && !isCompleting && (
              <Box 
                position="absolute" 
                top="50%" 
                left="50%" 
                transform="translate(-50%, -50%)"
                zIndex={999}
                bg="rgba(0, 0, 0, 0.5)"
                backdropFilter="blur(7px)"
                w="full"
                h="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <VStack spacing={6}>
                  {/* Exercise Name */}
                  {currentExercise && (
                    <Text fontSize="2xl" fontWeight="bold" color="white" textAlign="center">
                      {currentExercise.name}
                    </Text>
                  )}
                  
                  {/* Start Button */}
                  <Button
                    size="xl"
                    borderRadius="full"
                    w="120px"
                    h="120px"
                    bg="green.500"
                    color="white"
                    fontSize="2xl"
                    fontWeight="bold"
                    onClick={startCountdown}
                    _hover={{ bg: "green.600" }}
                    _active={{ bg: "green.700" }}
                  >
                    Start
                  </Button>
                </VStack>
              </Box>
            )}

            {/* Rest Time Overlay */}
            {isResting && (
              <Box 
                position="absolute" 
                top="50%" 
                left="50%" 
                transform="translate(-50%, -50%)"
                zIndex={1000}
                bg="rgba(0, 0, 0, 0.5)"
                backdropFilter="blur(7px)"
                w="full"
                h="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <VStack spacing={6}>
                  {/* Next & Exercise Name */}
                  {currentExercise && (
                    <VStack spacing={2}>
                      <Text fontSize="lg" color="orange.400" fontWeight="bold" textTransform="uppercase" textAlign="center">
                        Next
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold" color="white" textAlign="center">
                        {currentExercise.name}
                      </Text>
                    </VStack>
                  )}
                  
                  {/* Rest Time Display */}
                  <VStack spacing={4}>
                    <Text fontSize="xl" color="orange.400" fontWeight="bold" textTransform="uppercase">
                      Rest Time
                    </Text>
                    <Text fontSize="6xl" fontWeight="bold" color="orange.400" textAlign="center" fontFamily="mono">
                      {`${Math.floor(restCountdown / 60).toString().padStart(2, '0')}:${(restCountdown % 60).toString().padStart(2, '0')}`}
                    </Text>
                    
                    {/* Skip Rest Button */}
                    <Button
                      size="lg"
                      variant="outline"
                      colorScheme="orange"
                      color="white"
                      borderColor="orange.400"
                      _hover={{ bg: "orange.400", borderColor: "orange.500" }}
                      onClick={() => {
                        if (restCountdownRef) {
                          clearInterval(restCountdownRef);
                          setRestCountdownRef(null);
                        }
                        setIsResting(false);
                        setRestCountdown(0);
                      }}
                    >
                      Skip Rest
                    </Button>
                  </VStack>
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
            
            {/* REMOVED: Error and Loading States - eliminated to prevent flickering */}

            {/* Current Exercise Display */}
            {!isLoadingExercises && !exerciseLoadError && !isRestDay && !showRPEScreen && totalExercises > 0 && (
              <Box w="full" bg={sectionBg} borderRadius="xl" p={4}>
                {/* Progress Dots for Sets and Reps */}
                <HStack spacing={8} justify="center" align="start">
                  <ProgressDots 
                    current={currentSet} 
                    total={currentExerciseSets} 
                    label="SET"
                    size="8px"
                  />
                  {isRunningExercise() ? (
                    <ProgressDots 
                      current={currentRep} 
                      total={currentExerciseReps} 
                      label="REP"
                      size="8px"
                    />
                  ) : (
                    <VStack spacing={1} align="center">
                      <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase">
                        REPS
                      </Text>
                      <Text fontSize="xl" fontWeight="bold" color={currentColor}>
                        {currentExerciseReps}
                      </Text>
                    </VStack>
                  )}
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
            {!isLoadingExercises && !exerciseLoadError && !isRestDay && !showRPEScreen && totalExercises > 0 && (
              <Box w="full" bg={sectionBg} borderRadius="xl" p={6}>
                <VStack spacing={4}>
                  {/* Dynamic timer title - only show when not resting and not timed countdown */}
                  {!isResting && !isTimedCountdown && (
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
                      isDisabled={(currentExerciseIndex === 0 && currentSet === 1 && currentRep === 1) || isResting || isTimedCountdown}
                    />
                    
                    {isTimedCountdown ? (
                      <VStack spacing={2}>
                        <Text fontSize="sm" color="green.500" fontWeight="medium" textTransform="uppercase">
                          TIMED EXERCISE
                        </Text>
                        <FixedTimer 
                          seconds={timedCountdown} 
                          color="green.500" 
                          isRest={false}
                        />
                      </VStack>
                    ) : (isTimedExercise() && !isPrepCountdown && prepCountdown === 0) ? (
                      // Hide timer for timed exercises when transitioning from red to green countdown
                      <FixedTimer 
                        seconds={0} 
                        color="gray.400" 
                        isRest={false}
                      />
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
                      isDisabled={showRPEScreen || isCountingDown || isResting || isTimedCountdown}
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
                      isDisabled={isCountingDown || isResting || isTimedCountdown}
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
                      isDisabled={isCountingDown || isResting || isTimedCountdown}
                    />
                    <IconButton
                      aria-label="Tutorial"
                      icon={<FaVideo />}
                      borderRadius="full"
                      size="md"
                      variant="outline"
                      onClick={() => {/* TODO: Show video */}}
                      isDisabled={isCountingDown || isResting || isTimedCountdown}
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
                          setIsManuallyPaused(true);
                        } else if (!isCountingDown && !isResting) {
                          setIsActive(true);
                          setIsManuallyPaused(false);
                        }
                      }}
                      isDisabled={isCountingDown || isResting || isTimedCountdown}
                    />
                    <IconButton
                      aria-label={isResting ? "Skip rest" : isTimedCountdown ? "Skip timed exercise" : "Skip rest"}
                      icon={<FaForward />}
                      borderRadius="full"
                      size="md"
                      variant={isResting || isTimedCountdown ? "solid" : "outline"}
                      colorScheme={isResting ? "orange" : isTimedCountdown ? "green" : "gray"}
                      onClick={isResting ? skipRest : isTimedCountdown ? () => {
                        // Skip timed exercise
                        if (timedCountdownRef) {
                          clearInterval(timedCountdownRef);
                        }
                        setIsTimedCountdown(false);
                        setTimedCountdownRef(null);
                        setTimedCountdown(0);
                        setHasStartedTimedCountdown(false);
                        handleNext();
                      } : skipRest}
                      isDisabled={isCountingDown || (!isResting && !isTimedCountdown)}
                    />
                  </HStack>
                </VStack>
              </Box>
            )}

            {/* Runtime Input for Running Exercises (but not timed exercises) */}
            {!isLoadingExercises && !exerciseLoadError && !isRestDay && !showRPEScreen && totalExercises > 0 && isRunningExercise() && !isTimedExercise() && (
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

            {/* Exercise Notes */}
            {!isLoadingExercises && !exerciseLoadError && !isRestDay && !showRPEScreen && totalExercises > 0 && currentExercise && (currentExercise.notes || currentExercise.movement_notes) && (
              <Box w="full" bg={sectionBg} borderRadius="xl" p={4}>
                <VStack spacing={3} align="stretch">
                  {currentExercise.notes && (
                    <Box>
                      <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" mb={1}>
                        Exercise Notes
                      </Text>
                      <Text fontSize="sm" color={modalTextColor} lineHeight="1.5">
                        {currentExercise.notes}
                      </Text>
                    </Box>
                  )}
                  {currentExercise.movement_notes && (
                    <Box>
                      <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" mb={1}>
                        Movement Instructions
                      </Text>
                      <Text fontSize="sm" color={modalTextColor} lineHeight="1.5">
                        {currentExercise.movement_notes}
                      </Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            )}

            {/* Instructions */}
            {!isLoadingExercises && !exerciseLoadError && !isRestDay && !showRPEScreen && totalExercises > 0 && currentExercise?.instructions && (
              <Box w="full" bg={sectionBg} borderRadius="xl" p={4} textAlign="center">
                <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" mb={2}>
                  Instructions
                </Text>
                <Text fontSize="sm" color={modalTextColor}>
                  {currentExercise.instructions}
                </Text>
              </Box>
            )}
              </>
            )}
          </VStack>
        </ModalBody>

                <ModalFooter p={6}>
          <VStack spacing={4} w="full">
            {/* REMOVED: Go Back button - no longer needed without error states */}
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