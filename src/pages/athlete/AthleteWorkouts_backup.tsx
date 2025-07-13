import {
  Box, Heading, Text, Spinner, Alert, AlertIcon, Stack, Card, CardBody, Button, Flex, HStack, Progress, Tag, VStack, Divider, Center, Icon, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, IconButton, SimpleGrid, Container, Tooltip, useDisclosure, Tabs, TabList, TabPanels, Tab, TabPanel, useToast, useColorModeValue, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, Select, Badge
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Workout, Exercise } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye, FaPlayCircle, FaRunning, FaDumbbell, FaRegClock, FaCalendarAlt, FaListUl, FaLeaf, FaRedo, FaCog, FaPlus, FaCalendarWeek, FaCalendarDay, FaClock, FaChartLine, FaBookOpen, FaHistory, FaFilter, FaTrash } from 'react-icons/fa';
import { BiRun } from 'react-icons/bi';
import { CheckIcon, EditIcon } from '@chakra-ui/icons'; // For exec modal
import { FiCalendar, FiClock } from 'react-icons/fi';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useWorkoutStore } from '../../lib/workoutStore'; // Import the store
import { WorkoutCard } from '../../components/WorkoutCard';
import { WorkoutCardWithProgress } from '../../components/WorkoutCardWithProgress'; // Import our shared card component
import { supabase } from '../../lib/supabase';
import { RepeatIcon } from '@chakra-ui/icons';
import { dateUtils } from '../../utils/date';
import { useWorkoutsRealtime } from '../../hooks/useWorkoutsRealtime';
import { handleWorkoutCompletion } from '../../services/integrationService';
import { useFeedback } from '../../components/FeedbackProvider'; // Import the feedback hook
import { WorkoutsSidebar, MobileBottomNavigation } from '../../components';
import { WorkoutExecutionRouter } from '../../components/WorkoutExecutionRouter';
import type { WorkoutsSection } from '../../components';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { RunTimeInput } from '../../components/RunTimeInput';
import { isRunExercise, validateTime } from '../../utils/exerciseUtils';
import { ExerciseLibrary, Exercise as LibraryExercise } from '../../components/ExerciseLibrary';
import { getExercisesWithTeamSharing, createExerciseWithSharing, updateExerciseWithSharing } from '../../utils/exerciseQueries';
import { DeletedWorkoutsView } from '../../components/deleted';
import { startTodaysWorkoutExecution, markExerciseCompletedWithSync, getTodaysWorkoutForExecution, getMonthlyPlanCompletionFromDB, resetMonthlyPlanProgress } from '../../utils/monthlyPlanWorkoutHelper';
import { markRegularWorkoutExerciseCompletedWithSync, syncRegularWorkoutCompletionFromDB, markRegularWorkoutAsCompleted } from '../../utils/regularWorkoutHelper';
import PageHeader from '../../components/PageHeader';
import { usePageHeader } from '../../hooks/usePageHeader';
import { getWorkoutExerciseCount, getExercisesFromWorkout } from '../../utils/workoutUtils';

// Using Exercise type from api.ts (imported above)

  // Using shared Workout type from api.ts (imported at top)

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

// Helper: get actual exercise count from workout (handles weekly templates)
function getActualExerciseCount(workout: any): number {
  // Handle block-based workouts first
  if (workout?.is_block_based && workout?.blocks && Array.isArray(workout.blocks)) {
    // For block-based workouts, sum exercises across all blocks
    return workout.blocks.reduce((total: number, block: any) => {
      return total + (block.exercises?.length || 0);
    }, 0);
  }
  
  // Handle regular workouts
  if (!workout?.exercises || !Array.isArray(workout.exercises)) return 0;
  
  const isWeeklyTemplate = workout.exercises.length > 0 && 
                          typeof workout.exercises[0] === 'object' && 
                          'day' in workout.exercises[0] && 
                          'exercises' in workout.exercises[0];
  
  if (isWeeklyTemplate) {
    // For weekly templates, get exercises from current day (assuming Monday for now)
    const currentDayPlan = workout.exercises[0] as any;
    return currentDayPlan.exercises?.length || 0;
  } else {
    return workout.exercises.length;
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

// Helper to get the current date in YYYY-MM-DD format
function getCurrentDate(): string {
  return dateUtils.localDateString(new Date());
}

// Helper to safely get blocks array from workout
function getBlocksFromWorkout(workout: any): any[] {
  if (!workout.blocks) return [];
  
  // If blocks is already an array, return it
  if (Array.isArray(workout.blocks)) {
    return workout.blocks;
  }
  
  // If blocks is a string (JSON), try to parse it
  if (typeof workout.blocks === 'string') {
    try {
      const parsed = JSON.parse(workout.blocks);
      
      // Handle weekly blocks format (object with day keys)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Flatten all daily blocks into a single array
        return Object.values(parsed).flat().filter(Boolean);
      }
      
      // Handle regular blocks array
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse workout blocks:', error);
    }
  }
  
  return [];
}

// Helper to get total block count for block-based workouts
function getTotalBlockCount(workout: any): number {
  if (workout.is_block_based) {
    const blocks = getBlocksFromWorkout(workout);
    return blocks.length;
  }
  return 0;
}

// Helper to calculate completed blocks based on completed exercises
function getCompletedBlockCount(workout: any, completedExercises: number[]): number {
  const blocks = getBlocksFromWorkout(workout);
  if (blocks.length === 0) {
    return 0;
  }

  let completedBlocks = 0;
  let exerciseOffset = 0;

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const block = blocks[blockIndex];
    const blockExerciseCount = block.exercises ? block.exercises.length : 0;
    const blockExerciseIndices = Array.from({ length: blockExerciseCount }, (_, i) => exerciseOffset + i);
    const blockCompleted = blockExerciseIndices.every(index => completedExercises.includes(index));
    
    if (blockCompleted && blockExerciseCount > 0) {
      completedBlocks++;
    }
    
    exerciseOffset += blockExerciseCount;
  }

  return completedBlocks;
}

// Helper: Load actual exercise data from monthly plan weeks
async function loadMonthlyPlanExercises(plan: any): Promise<{ exercises: any[], totalCount: number }> {
  if (!plan?.weeks || plan.weeks.length === 0) {
    return { exercises: [], totalCount: 0 };
  }

  try {
    // Get all unique workout IDs from the plan weeks
    const workoutIds = [...new Set(
      plan.weeks
        .filter((week: any) => !week.is_rest_week && week.workout_id)
        .map((week: any) => week.workout_id)
    )];

    if (workoutIds.length === 0) {
      return { exercises: [], totalCount: 0 };
    }

    // Fetch all weekly workouts used in this plan - optimized single query
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('*')
      .in('id', workoutIds);
    
    if (error) {
      console.error('Error loading workouts for monthly plan:', error);
      return { exercises: [], totalCount: 0 };
    }

    // Use workouts directly since they're already valid from the query
    const validWorkouts = workouts || [];
    let allExercises: any[] = [];
    let totalCount = 0;

    for (const workout of validWorkouts) {
      const exercises = getExercisesFromWorkout(workout);
      const exerciseCount = getWorkoutExerciseCount(workout);
      
      // Add exercises from this workout (limit to first 3 for display)
      if (allExercises.length < 3) {
        allExercises.push(...exercises.slice(0, 3 - allExercises.length));
      }

      // Count total exercises across all weeks this workout is used
      const weeksUsingThisWorkout = plan.weeks.filter((week: any) => 
        !week.is_rest_week && week.workout_id === workout.id
      ).length;

      totalCount += exerciseCount * weeksUsingThisWorkout;
    }

    return { exercises: allExercises, totalCount };
  } catch (error) {
    console.error('Error loading monthly plan exercises:', error);
    return { exercises: [], totalCount: 0 };
  }
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
  const pageBackgroundColor = useColorModeValue('gray.50', 'gray.900');
  const headerTextColor = useColorModeValue('gray.800', 'white');
  const headerSubtextColor = useColorModeValue('gray.600', 'gray.300');

  // Use the page header hook
  usePageHeader({
    title: 'Workouts',
    subtitle: 'Your Training Schedule',
    icon: BiRun
  });
  const iconColor = useColorModeValue('blue.500', 'blue.300');
  
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

  // Initialize execution modal state with localStorage persistence
  const [execModal, setExecModal] = useState(() => {
    try {
      const savedModal = localStorage.getItem('athlete-exec-modal-state');
      if (savedModal) {
        const parsed = JSON.parse(savedModal);
        // Only restore if the session is recent (within 24 hours)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Restoring execution modal state from localStorage');
          }
          return {
            isOpen: parsed.isOpen || false,
            workout: parsed.workout || null,
            exerciseIdx: parsed.exerciseIdx || 0,
            timer: 0, // Always reset timer on page refresh
            running: false, // Always start paused on page refresh
            currentSet: parsed.currentSet || 1,
            currentRep: parsed.currentRep || 1,
          };
        }
      }
    } catch (error) {
      console.error('Error loading execution modal state:', error);
    }
    
    return {
      isOpen: false,
      workout: null as any,
      exerciseIdx: 0,
      timer: 0,
      running: false,
      currentSet: 1,
      currentRep: 1,
    };
  });
  const [videoModal, setVideoModal] = useState({ isOpen: false, videoUrl: '', exerciseName: '' });

  // Enhanced setExecModal that persists to localStorage
  const setExecModalWithPersistence = useCallback((updater: any) => {
    setExecModal(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;
      
      try {
        // Save to localStorage with timestamp
        const stateToSave = {
          ...newState,
          timestamp: Date.now(),
        };
        localStorage.setItem('athlete-exec-modal-state', JSON.stringify(stateToSave));
        
        // Clear localStorage if modal is closing
        if (!newState.isOpen) {
          localStorage.removeItem('athlete-exec-modal-state');
        }
      } catch (error) {
        console.error('Error saving execution modal state:', error);
      }
      
      return newState;
    });
  }, []);

  // Shared workout sync function to reduce duplication
  const syncWorkoutProgressFromDB = useCallback(async (workout: any, userId: string) => {
    if (!workout || !userId) return { exerciseIdx: 0, currentSet: 1, currentRep: 1 };
    
    const workoutId = workout.id;
    const totalExercises = getActualExerciseCount(workout);
    
    // Initialize progress tracking in workout store
    workoutStore.updateProgress(workoutId, 0, totalExercises);
    
    let currentExerciseIdx = 0;
    let currentSet = 1;
    let currentRep = 1;
    
    try {
      if (workoutId.startsWith('daily-')) {
        // Load both completion status and granular progress from database for monthly plans
        const { getMonthlyPlanCompletionFromDB, getMonthlyPlanProgressFromDB } = await import('../../utils/monthlyPlanWorkoutHelper');
        const completedExercisesFromDB = await getMonthlyPlanCompletionFromDB(userId);
        const granularProgress = await getMonthlyPlanProgressFromDB(userId);
        
        // Sync database completion status to local store
        if (completedExercisesFromDB.length > 0) {
          completedExercisesFromDB.forEach(exerciseIdx => {
            workoutStore.markExerciseCompleted(workoutId, exerciseIdx);
          });
          workoutStore.updateProgress(
            workoutId, 
            completedExercisesFromDB.length, 
            totalExercises,
            completedExercisesFromDB.length >= totalExercises
          );
        }
        
        // Use granular progress if available, otherwise find first uncompleted exercise
        if (granularProgress && granularProgress.currentExerciseIndex >= 0) {
          currentExerciseIdx = granularProgress.currentExerciseIndex;
          currentSet = granularProgress.currentSet || 1;
          currentRep = granularProgress.currentRep || 1;
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 Restored granular progress: Exercise ${currentExerciseIdx}, Set ${currentSet}, Rep ${currentRep}`);
          }
        } else {
          // Find the first uncompleted exercise to resume from
          const completedExercises = completedExercisesFromDB || [];
          for (let i = 0; i < totalExercises; i++) {
            if (!completedExercises.includes(i)) {
              currentExerciseIdx = i;
              break;
            }
          }
          
          // If all exercises are completed, start from the beginning
          if (completedExercises.length >= totalExercises) {
            currentExerciseIdx = 0;
          }
        }
      } else {
        // Load both completion status and granular progress from database for regular workouts
        const { getRegularWorkoutCompletionFromDB, getWorkoutProgressFromDB } = await import('../../utils/regularWorkoutHelper');
        const completedExercisesFromDB = await getRegularWorkoutCompletionFromDB(userId, workoutId);
        const granularProgress = await getWorkoutProgressFromDB(userId, workoutId);
        
        // Sync database completion status to local store
        if (completedExercisesFromDB.length > 0) {
          completedExercisesFromDB.forEach(exerciseIdx => {
            workoutStore.markExerciseCompleted(workoutId, exerciseIdx);
          });
          workoutStore.updateProgress(
            workoutId, 
            completedExercisesFromDB.length, 
            totalExercises,
            completedExercisesFromDB.length >= totalExercises
          );
        }
        
        // Use granular progress if available, otherwise find first uncompleted exercise
        if (granularProgress && granularProgress.currentExerciseIndex >= 0) {
          currentExerciseIdx = granularProgress.currentExerciseIndex;
          currentSet = granularProgress.currentSet || 1;
          currentRep = granularProgress.currentRep || 1;
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 Restored granular progress: Exercise ${currentExerciseIdx}, Set ${currentSet}, Rep ${currentRep}`);
          }
        } else {
          // Find the first uncompleted exercise to resume from
          const completedExercises = completedExercisesFromDB || [];
          for (let i = 0; i < totalExercises; i++) {
            if (!completedExercises.includes(i)) {
              currentExerciseIdx = i;
              break;
            }
          }
          
          // If all exercises are completed, start from the beginning
          if (completedExercises.length >= totalExercises) {
            currentExerciseIdx = 0;
          }
        }
      }
    } catch (error) {
      console.error('Error syncing workout progress from database:', error);
    }
    
    return { exerciseIdx: currentExerciseIdx, currentSet, currentRep };
  }, []); // Remove workoutStore dependency to prevent infinite loops

  // Simplified sync for restored modal - runs only when modal is restored from localStorage
  useEffect(() => {
    // Use a ref to track if we've already synced to prevent multiple calls
    let hasSynced = false;
    
    const syncRestoredModal = async () => {
      if (!execModal.isOpen || !execModal.workout || !user?.id || hasSynced) return;
      hasSynced = true;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Syncing restored modal with database...');
      }
      
      // Clear any existing progress for this workout to ensure fresh start
      workoutStore.resetProgress(execModal.workout.id);
      
      const granularProgress = await syncWorkoutProgressFromDB(execModal.workout, user.id);
      
      // Update modal with granular progress if different
      if (granularProgress.exerciseIdx !== execModal.exerciseIdx || 
          granularProgress.currentSet !== execModal.currentSet ||
          granularProgress.currentRep !== execModal.currentRep) {
        setExecModalWithPersistence(prev => ({
          ...prev,
          exerciseIdx: granularProgress.exerciseIdx,
          currentSet: granularProgress.currentSet,
          currentRep: granularProgress.currentRep,
        }));
      }
      
      // Remove automatic refresh to prevent infinite loops
      // The UI will update naturally when the store changes
    };
    
    // Only sync once when modal is restored from localStorage and we have the necessary data
    if (execModal.isOpen && execModal.workout && user?.id) {
      syncRestoredModal();
    }
  }, [execModal.isOpen, execModal.workout?.id, user?.id]); // Remove syncWorkoutProgressFromDB dependency

  // Add a state to track if user has completed their first workout
  const [hasCompletedFirstWorkout, setHasCompletedFirstWorkout] = useState(() => {
    // Check localStorage to see if user has completed a workout before
    return localStorage.getItem('hasCompletedFirstWorkout') === 'true';
  });

  // State for custom exercises
  const [customExercises, setCustomExercises] = useState<LibraryExercise[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);

  // State for user teams
  const [userTeams, setUserTeams] = useState<Array<{ id: string; name: string }>>([]);

  // State for monthly plans
  const [monthlyPlans, setMonthlyPlans] = useState<any[]>([]);
  const [monthlyPlansLoading, setMonthlyPlansLoading] = useState(false);
  
  // State to force re-render when workout store is updated - debounced to prevent excessive re-renders
  const [workoutStoreUpdateTrigger, setWorkoutStoreUpdateTrigger] = useState(0);
  
  // Simple force refresh function for workout store updates (without infinite loop)
  const forceWorkoutStoreRefresh = useCallback(() => {
    setWorkoutStoreUpdateTrigger(prev => prev + 1);
  }, []);

  // Helper: Get workout IDs that are used in monthly plans
  const usedWorkoutIdsInMonthlyPlans = useMemo(() => {
    if (!monthlyPlans || monthlyPlans.length === 0) return new Set<string>();
    
    const usedWorkoutIds = new Set<string>();
    
    monthlyPlans.forEach((plan: any) => {
      if (plan.training_plans?.weeks) {
        plan.training_plans.weeks.forEach((week: any) => {
          if (!week.is_rest_week && week.workout_id) {
            usedWorkoutIds.add(week.workout_id);
          }
        });
      }
    });
    
    // Remove the console.log that was causing spam
    // console.log('Workout IDs used in monthly plans:', Array.from(usedWorkoutIds));
    return usedWorkoutIds;
  }, [monthlyPlans]);

  // Add ref for ExerciseLibrary
  const exerciseLibraryRef = React.useRef<{ openAddModal: () => void } | null>(null);

  // Sidebar state and configuration
  const [activeItem, setActiveItem] = useState('all-workouts');
  const [mainSidebarWidth, setMainSidebarWidth] = useState(() => {
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    return savedSidebarState === 'true' ? 70 : 200;
  });
  const { isHeaderVisible } = useScrollDirection(15);

  // Enhanced filtering states
  const [workoutFilter, setWorkoutFilter] = useState<'all' | 'single' | 'weekly' | 'monthly'>('all');
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'mine' | 'coaches'>('all');

  // State for deleted workouts count
  const [deletedCount, setDeletedCount] = useState(0);

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
        if (process.env.NODE_ENV === 'development') {
          console.log('No user ID available for fetching workouts');
        }
        return [];
      }
      
      if (process.env.NODE_ENV === 'development') {
        // console.log('Fetching assigned workouts for athlete:', user.id);
      }
      try {
        const workouts = await api.workouts.getAssignedToAthlete(user.id);
        if (process.env.NODE_ENV === 'development') {
          // console.log('Received assigned workouts:', workouts?.length || 0);
        }
        return workouts;
      } catch (err) {
        console.error('Error fetching assigned workouts:', err);
        throw err;
      }
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false, // STOP window focus refetching
    staleTime: 10 * 60 * 1000, // 10 minutes instead of 1 minute
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnMount: false, // Don't refetch on mount if data exists
  });

  // Record app usage on component mount
  useEffect(() => {
    recordAppUsage();
  }, [recordAppUsage]);

  // Listen for main sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      const newWidth = event.detail.width;
      setMainSidebarWidth(newWidth);
    };
    
    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  // Calculate workout statistics
  const workoutStats = useMemo(() => {
    if (!assignedWorkouts) return { today: 0, thisWeek: 0, total: 0, completed: 0 };
    
    const today = getCurrentDate();
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfWeekStr = dateUtils.localDateString(startOfWeek);
    
    const todayWorkouts = assignedWorkouts.filter(w => formatDateForComparison(w.date) === today);
    const thisWeekWorkouts = assignedWorkouts.filter(w => {
      const workoutDate = formatDateForComparison(w.date);
      return workoutDate >= startOfWeekStr && workoutDate <= today;
    });
    const completedWorkouts = assignedWorkouts.filter(w => {
      const progress = workoutStore.getProgress(w.id);
      const completedExercisesList = progress ? progress.completedExercises || [] : [];
      
      if ((w as any).is_block_based) {
        // For block-based workouts, check if all blocks are completed
        const totalBlocks = getTotalBlockCount(w);
        const completedBlocks = getCompletedBlockCount(w, completedExercisesList);
        return totalBlocks > 0 && completedBlocks === totalBlocks;
      } else {
        // For regular workouts, check if all exercises are completed
        const totalExercises = getActualExerciseCount(w);
        const completedExercises = completedExercisesList.length;
        return totalExercises > 0 && completedExercises === totalExercises;
      }
    });

    return {
      today: todayWorkouts.length,
      thisWeek: thisWeekWorkouts.length,
      total: assignedWorkouts.length,
      completed: completedWorkouts.length
    };
  }, [assignedWorkouts, workoutStoreUpdateTrigger]); // Use trigger instead of workoutStore

  // Filter workouts based on active sidebar item and filters
  const filteredWorkouts = useMemo(() => {
    if (!assignedWorkouts) return [];
    
    const today = getCurrentDate();
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfWeekStr = dateUtils.localDateString(startOfWeek);
    
    // Get workout IDs used in monthly plans
    const usedInMonthlyPlans = usedWorkoutIdsInMonthlyPlans;
    
    // First filter by sidebar item
    let workouts = assignedWorkouts;
    
    // Create a base filtered list that excludes templates and monthly-plan-used workouts
    const baseFilteredWorkouts = assignedWorkouts.filter(workout => 
      !usedInMonthlyPlans.has(workout.id) && !workout.is_template
    );

    switch (activeItem) {
      case 'today':
        workouts = baseFilteredWorkouts.filter(w => formatDateForComparison(w.date) === today);
        break;
      case 'this-week':
        workouts = baseFilteredWorkouts.filter(w => {
          const workoutDate = formatDateForComparison(w.date);
          return workoutDate >= startOfWeekStr && workoutDate <= today;
        });
        break;
      case 'upcoming':
        workouts = baseFilteredWorkouts.filter(w => formatDateForComparison(w.date) > today);
        break;
      case 'completed':
        workouts = baseFilteredWorkouts.filter(w => {
          const progress = workoutStore.getProgress(w.id);
          const completedExercisesList = progress ? progress.completedExercises || [] : [];
          
          if ((w as any).is_block_based) {
            const totalBlocks = getTotalBlockCount(w);
            const completedBlocks = getCompletedBlockCount(w, completedExercisesList);
            return totalBlocks > 0 && completedBlocks === totalBlocks;
          } else {
            const totalExercises = w.exercises?.length || 0;
            const completedExercises = completedExercisesList.length;
            return totalExercises > 0 && completedExercises === totalExercises;
          }
        });
        break;
      case 'in-progress':
        workouts = baseFilteredWorkouts.filter(w => {
          const progress = workoutStore.getProgress(w.id);
          const completedExercisesList = progress ? progress.completedExercises || [] : [];
          
          if ((w as any).is_block_based) {
            const totalBlocks = getTotalBlockCount(w);
            const completedBlocks = getCompletedBlockCount(w, completedExercisesList);
            return completedBlocks > 0 && completedBlocks < totalBlocks;
          } else {
            const totalExercises = w.exercises?.length || 0;
            const completedExercises = completedExercisesList.length;
            return completedExercises > 0 && completedExercises < totalExercises;
          }
        });
        break;
      case 'strength':
        workouts = baseFilteredWorkouts.filter(w => w.type?.toLowerCase().includes('strength') || w.type?.toLowerCase().includes('weight'));
        break;
      case 'cardio':
        workouts = baseFilteredWorkouts.filter(w => w.type?.toLowerCase().includes('cardio') || w.type?.toLowerCase().includes('running') || w.type?.toLowerCase().includes('endurance'));
        break;
      case 'speed':
        workouts = baseFilteredWorkouts.filter(w => w.type?.toLowerCase().includes('speed') || w.type?.toLowerCase().includes('sprint'));
        break;
      case 'all-workouts':
      default:
        workouts = baseFilteredWorkouts;
        break;
    }

    // Then apply additional filters
    if (workoutFilter !== 'all') {
      if (workoutFilter === 'single') {
        workouts = workouts.filter(w => w.template_type === 'single' || !w.template_type);
      } else if (workoutFilter === 'weekly') {
        workouts = workouts.filter(w => w.template_type === 'weekly');
      } else if (workoutFilter === 'monthly') {
        // For monthly filter, show monthly plans instead of workouts
        workouts = [];
      }
    }

    // Filter by creator
    if (creatorFilter !== 'all' && user?.id) {
      if (creatorFilter === 'mine') {
        workouts = workouts.filter(w => w.user_id === user.id);
      } else if (creatorFilter === 'coaches') {
        workouts = workouts.filter(w => w.user_id !== user.id);
      }
    }

    return workouts;
  }, [assignedWorkouts, activeItem, workoutStoreUpdateTrigger, workoutFilter, creatorFilter, user?.id, usedWorkoutIdsInMonthlyPlans]); // Use trigger instead of workoutStore

  // Combine workouts and monthly plans for filtering
  const filteredItems = useMemo(() => {
    // For monthly filter, show monthly plans with creator filtering applied
    if (workoutFilter === 'monthly') {
      let filteredMonthlyPlans = monthlyPlans;
      
      // Apply creator filter to monthly plans
      if (creatorFilter !== 'all' && user?.id) {
        if (creatorFilter === 'mine') {
          // Athletes don't create monthly plans, so show none for "My Workouts"
          filteredMonthlyPlans = [];
        } else if (creatorFilter === 'coaches') {
          // Monthly plans are always from coaches, so show all
          filteredMonthlyPlans = monthlyPlans;
        }
      }
      
      const monthlyItems = filteredMonthlyPlans.map(plan => ({
        ...plan,
        isMonthlyPlan: true
      }));
      
      return monthlyItems;
    }
    
    // For all workouts filter and activeItem is all-workouts, include both with creator filtering
    if (workoutFilter === 'all' && activeItem === 'all-workouts') {
      const workoutsWithType = filteredWorkouts.map(workout => ({
        ...workout,
        isMonthlyPlan: false
      }));
      
      // Apply creator filter to monthly plans
      let filteredMonthlyPlans = monthlyPlans;
      if (creatorFilter !== 'all' && user?.id) {
        if (creatorFilter === 'mine') {
          // Athletes don't create monthly plans, so show none for "My Workouts"
          filteredMonthlyPlans = [];
        } else if (creatorFilter === 'coaches') {
          // Monthly plans are always from coaches, so show all
          filteredMonthlyPlans = monthlyPlans;
        }
      }
      
      const plansWithType = filteredMonthlyPlans.map(plan => ({
        ...plan,
        isMonthlyPlan: true
      }));
      
      return [...workoutsWithType, ...plansWithType];
    }
    
    // Otherwise, just return filtered workouts
    return filteredWorkouts.map(workout => ({
      ...workout,
      isMonthlyPlan: false
    }));
  }, [filteredWorkouts, monthlyPlans, workoutFilter, activeItem, creatorFilter, user?.id]);

  // Sidebar configuration
  const workoutsSections: WorkoutsSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      items: [
        {
          id: 'all-workouts',
          label: 'All Workouts',
          icon: FaListUl,
          description: 'View all assigned workouts',
          badge: workoutStats.total
        },
        {
          id: 'today',
          label: 'Today',
          icon: FaCalendarDay,
          description: 'Today\'s scheduled workouts',
          badge: workoutStats.today
        },
        {
          id: 'this-week',
          label: 'This Week',
          icon: FaCalendarWeek,
          description: 'This week\'s workouts',
          badge: workoutStats.thisWeek
        }
      ]
    },
    {
      id: 'status',
      title: 'By Status',
      items: [
        {
          id: 'upcoming',
          label: 'Upcoming',
          icon: FaClock,
          description: 'Future scheduled workouts'
        },
        {
          id: 'in-progress',
          label: 'In Progress',
          icon: FaPlayCircle,
          description: 'Partially completed workouts'
        },
        {
          id: 'completed',
          label: 'Completed',
          icon: FaChartLine,
          description: 'Finished workouts',
          badge: workoutStats.completed
        }
      ]
    },
    {
      id: 'type',
      title: 'By Type',
      items: [
        {
          id: 'strength',
          label: 'Strength',
          icon: FaDumbbell,
          description: 'Weight and resistance training'
        },
        {
          id: 'cardio',
          label: 'Cardio',
          icon: FaRunning,
          description: 'Endurance and running workouts'
        },
        {
          id: 'speed',
          label: 'Speed',
          icon: FaLeaf,
          description: 'Sprint and speed training'
        }
      ]
    },
    {
      id: 'management',
      title: 'Management',
      items: [
        {
          id: 'deleted',
          label: 'Deleted Workouts',
          icon: FaHistory,
          description: 'Restore or permanently delete workouts',
          badge: deletedCount
        }
      ]
    },
    {
      id: 'tools',
      title: 'Tools & Library',
      items: [
        {
          id: 'exercise-library',
          label: 'Exercise Library',
          icon: FaBookOpen,
          description: 'Manage custom exercises',
          badge: customExercises.length
        }
      ]
    }
  ];

  // Remove automatic refetch on mount to prevent unnecessary API calls
  // React Query will handle this automatically based on the query configuration

  // Modify the initialization useEffect to include syncing with database completed status
  useEffect(() => {
    if (assignedWorkouts && assignedWorkouts.length > 0) {
      // First fetch the completed status for all workouts from the database
      const syncWithDatabase = async () => {
        if (!user?.id) return;
        
        try {
          if (process.env.NODE_ENV === 'development') {
        // console.log('Syncing workoutStore with database completion status');
      }
          
          // Sync regular workouts
          const { data: assignments, error } = await supabase
            .from('athlete_workouts')
            .select('workout_id, status, completed_exercises')
            .eq('athlete_id', user.id);
            
          if (error) {
            console.error('Error fetching assignment statuses:', error);
          } else if (assignments) {
            for (const assignment of assignments) {
              const workout = assignedWorkouts.find(w => w.id === assignment.workout_id);
              if (!workout) continue;
              
              const totalExercises = getActualExerciseCount(workout);
              
              // Load specific completed exercises from database
              const completedExercises = assignment.completed_exercises || [];
              
              // Sync each completed exercise to the local store
              completedExercises.forEach((exerciseIdx: number) => {
                workoutStore.markExerciseCompleted(assignment.workout_id, exerciseIdx);
              });
              
              // Update progress with correct completion count
              const isCompleted = assignment.status === 'completed' || completedExercises.length >= totalExercises;
              workoutStore.updateProgress(
                assignment.workout_id, 
                completedExercises.length, 
                totalExercises,
                isCompleted
              );
            }
          }
          
          // Also sync monthly plan workouts (daily- prefix)
          try {
            const { getMonthlyPlanCompletionFromDB } = await import('../../utils/monthlyPlanWorkoutHelper');
            const monthlyPlanCompleted = await getMonthlyPlanCompletionFromDB(user.id);
            
            // Apply monthly plan progress to any daily workouts in the list
            assignedWorkouts.forEach(workout => {
              if (workout.id.startsWith('daily-')) {
                const totalExercises = getActualExerciseCount(workout);
                
                // Sync each completed exercise to the local store
                monthlyPlanCompleted.forEach((exerciseIdx: number) => {
                  workoutStore.markExerciseCompleted(workout.id, exerciseIdx);
                });
                
                // Update progress with correct completion count
                const isCompleted = monthlyPlanCompleted.length >= totalExercises;
                workoutStore.updateProgress(
                  workout.id, 
                  monthlyPlanCompleted.length, 
                  totalExercises,
                  isCompleted
                );
              }
            });
          } catch (monthlyPlanError) {
            console.error('Error syncing monthly plan workouts:', monthlyPlanError);
          }
          
        } catch (syncErr) {
          console.error('Error syncing with database:', syncErr);
        }
      };
      
      syncWithDatabase();
    }
  }, [assignedWorkouts, user?.id]); // Remove workoutStore dependency to prevent infinite loops

  const getCompletionCount = (workoutId: string): number => {
    const progress = workoutStore.getProgress(workoutId);
    return progress?.completedExercises?.length || 0;
  };

  // Cache for progress checking results to prevent redundant database calls
  const progressCheckCache = useRef<Map<string, { result: boolean; timestamp: number }>>(new Map());
  
  // Helper function to check if a workout has any progress (completed exercises OR granular progress)
  const checkWorkoutHasProgress = useCallback(async (workoutId: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Checking progress for workout ${workoutId}`);
    }
    
    // Check cache first (valid for 5 seconds)
    const cached = progressCheckCache.current.get(workoutId);
    if (cached && Date.now() - cached.timestamp < 5000) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`💾 Using cached result for ${workoutId}: ${cached.result}`);
      }
      return cached.result;
    }
    
    try {
      // Check store progress first for quick response
      const storeProgress = workoutStore.getProgress(workoutId);
      if (storeProgress?.completedExercises && storeProgress.completedExercises.length > 0) {
        const result = true;
        progressCheckCache.current.set(workoutId, { result, timestamp: Date.now() });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🏪 Store progress found for ${workoutId}: ${storeProgress.completedExercises.length} completed exercises`);
        }
        
        return result;
      }
      
      // Check database for granular progress
      if (workoutId.startsWith('daily-')) {
        // Daily workout from monthly plan - check monthly plan progress
        const { getMonthlyPlanProgressFromDB } = await import('../../utils/monthlyPlanWorkoutHelper');
        const granularProgress = await getMonthlyPlanProgressFromDB(user.id);
        
        if (granularProgress) {
          // Has progress if: not at the very beginning (exercise 0, set 1, rep 1) OR has completed exercises
          const result = granularProgress.currentExerciseIndex > 0 || 
                 granularProgress.currentSet > 1 || 
                 granularProgress.currentRep > 1 ||
                 (granularProgress.completedExercises && granularProgress.completedExercises.length > 0);
          progressCheckCache.current.set(workoutId, { result, timestamp: Date.now() });
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`💾 Monthly plan DB progress for ${workoutId}:`, {
              currentExerciseIndex: granularProgress.currentExerciseIndex,
              currentSet: granularProgress.currentSet,
              currentRep: granularProgress.currentRep,
              completedExercises: granularProgress.completedExercises?.length || 0,
              result
            });
          }
          
          return result;
        }
        
        // Also check THIS specific daily workout progress in the store
        const thisWorkoutProgress = workoutStore.getProgress(workoutId);
        if (thisWorkoutProgress?.completedExercises && thisWorkoutProgress.completedExercises.length > 0) {
          const result = true;
          progressCheckCache.current.set(workoutId, { result, timestamp: Date.now() });
          return result;
        }
      } else {
        // Regular workout or monthly plan assignment ID
        const { getWorkoutProgressFromDB } = await import('../../utils/regularWorkoutHelper');
        const granularProgress = await getWorkoutProgressFromDB(user.id, workoutId);
        
        if (granularProgress) {
          // Has progress if: not at the very beginning (exercise 0, set 1, rep 1) OR has completed exercises
          const result = granularProgress.currentExerciseIndex > 0 || 
                 granularProgress.currentSet > 1 || 
                 granularProgress.currentRep > 1 ||
                 (granularProgress.completedExercises && granularProgress.completedExercises.length > 0);
          progressCheckCache.current.set(workoutId, { result, timestamp: Date.now() });
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`💾 Regular workout DB progress for ${workoutId}:`, {
              currentExerciseIndex: granularProgress.currentExerciseIndex,
              currentSet: granularProgress.currentSet,
              currentRep: granularProgress.currentRep,
              completedExercises: granularProgress.completedExercises?.length || 0,
              result
            });
          }
          
          return result;
        }
      }
      
      const result = false;
      progressCheckCache.current.set(workoutId, { result, timestamp: Date.now() });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Final result for ${workoutId}: ${result} (no progress found)`);
      }
      
      return result;
    } catch (error) {
      console.error('Error checking workout progress:', error);
      const result = false;
      progressCheckCache.current.set(workoutId, { result, timestamp: Date.now() });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`❌ Error result for ${workoutId}: ${result}`);
      }
      
      return result;
    }
  }, [user?.id, workoutStore]);

  const handleGo = async (workout: Workout, idx: number) => {
    if (!user?.id) return;
    
    try {
      // Debug logging for specific workouts
      if (process.env.NODE_ENV === 'development' && (workout.id === 'S7925' || workout.id === 'S7725')) {
        console.log(`[HandleGo Debug] Starting ${workout.id}:`, {
          isBlockBased: (workout as any).is_block_based,
          totalBlocks: getTotalBlockCount(workout),
          totalExercises: getActualExerciseCount(workout),
          blocks: getBlocksFromWorkout(workout)
        });
      }
      
      // Clear any existing progress for this workout to ensure fresh start
      workoutStore.resetProgress(workout.id);
      
      // Use the shared sync function to get current progress from database
      const granularProgress = await syncWorkoutProgressFromDB(workout, user.id);
      
      // Force immediate UI update after reset
      forceWorkoutStoreRefresh();
      
      // Open execution modal with proper database-synced granular progress
      setExecModalWithPersistence({
        isOpen: true,
        workout,
        exerciseIdx: granularProgress.exerciseIdx,
        timer: 0,
        running: true,
        currentSet: granularProgress.currentSet,
        currentRep: granularProgress.currentRep,
      });
      
    } catch (error) {
      console.error('Error syncing workout progress from database:', error);
      // Fallback to local progress if database sync fails
      const currentProgress = workoutStore.getProgress(workout.id);
      const currentExerciseIdx = currentProgress?.currentExerciseIndex ?? idx;
      
      setExecModalWithPersistence({
        isOpen: true,
        workout,
        exerciseIdx: currentExerciseIdx,
        timer: 0,
        running: true,
        currentSet: 1, // Default fallback values
        currentRep: 1,
      });
    }
  };

  // Filter workouts for today
  const todaysWorkouts = assignedWorkouts?.filter(workout => 
    formatDateForComparison(workout.date) === today
  ) || [];

  // Modal control functions for shared component
  const handleUpdateTimer = useCallback((newTimer: number) => {
    setExecModalWithPersistence(prev => ({ ...prev, timer: newTimer }));
  }, [setExecModalWithPersistence]);

  const handleUpdateRunning = useCallback((newRunning: boolean) => {
    setExecModalWithPersistence(prev => ({ ...prev, running: newRunning }));
  }, [setExecModalWithPersistence]);

  const handleNextExercise = useCallback(async () => {
    const workoutId = execModal.workout!.id;
    const exIdx = execModal.exerciseIdx;
    
    const totalExercises = getActualExerciseCount(execModal.workout!);
    
    // Check if this is a monthly plan workout (daily- prefix)
    if (workoutId.startsWith('daily-') && user?.id) {
      // Use the sync function for monthly plans
      await markExerciseCompletedWithSync(user.id, workoutId, exIdx, workoutStore);
    } else if (user?.id) {
      // Use the sync function for regular workouts
      await markRegularWorkoutExerciseCompletedWithSync(user.id, workoutId, exIdx, workoutStore);
    } else {
      // Fallback to local-only for when user?.id is not available
      workoutStore.markExerciseCompleted(workoutId, exIdx);
    }
    
    // Update progress in store - set the next exercise index as current
    workoutStore.updateProgress(workoutId, exIdx + 1, totalExercises, false);
    
    // Force UI refresh to show updated progress
    forceWorkoutStoreRefresh();
    
    // Update modal state
    setExecModalWithPersistence(prev => ({
      ...prev,
      exerciseIdx: exIdx + 1,
      timer: 0,
      running: true,
    }));
  }, [execModal.workout, execModal.exerciseIdx, user?.id]);

  const handlePreviousExercise = useCallback(() => {
    const workoutId = execModal.workout!.id;
    const exIdx = execModal.exerciseIdx;
    
    // Only allow going back if not on the first exercise
    if (exIdx > 0) {
      // Reset run time for previous exercise
      setExecModalWithPersistence(prev => ({
        ...prev,
        exerciseIdx: exIdx - 1,
        timer: 0,
        running: false, // Pause when going back
      }));
    }
  }, [execModal.exerciseIdx]);

  const handleFinishWorkout = async () => {
    if (!execModal.workout) return;
    
    const workoutId = execModal.workout.id;
    const totalExercises = getActualExerciseCount(execModal.workout);
    const finalExerciseIdx = execModal.exerciseIdx;
    
    // Check if this is a monthly plan workout (daily- prefix)
    if (workoutId.startsWith('daily-') && user?.id) {
      // Use the sync function for monthly plans
      await markExerciseCompletedWithSync(user.id, workoutId, finalExerciseIdx, workoutStore);
    } else if (user?.id) {
      // Use the sync function for regular workouts
      await markRegularWorkoutExerciseCompletedWithSync(user.id, workoutId, finalExerciseIdx, workoutStore);
    } else {
      // Fallback to local-only for when user?.id is not available
      workoutStore.markExerciseCompleted(workoutId, finalExerciseIdx);
    }
    
    // Check current progress to ensure all exercises are actually completed
    const currentProgress = workoutStore.getProgress(workoutId);
    const completedCount = currentProgress?.completedExercises?.length || 0;
    
    // Only mark as fully completed if all exercises are actually done
    if (completedCount >= totalExercises) {
      // Check if we need to trigger first workout completion feedback
      const needsFirstWorkoutFeedback = !hasCompletedFirstWorkout;
      
      // Mark workout as completed in store
      workoutStore.updateProgress(workoutId, totalExercises, totalExercises, true);
      
      // Force UI refresh to show completed state
      forceWorkoutStoreRefresh();
      
      // Update database assignment status
      if (user?.id) {
        if (workoutId.startsWith('daily-')) {
          // For monthly plan workouts, check if all exercises in the plan are completed
          try {
            const todaysWorkoutResult = await api.monthlyPlanAssignments.getTodaysWorkout(user.id);
            
            if (todaysWorkoutResult?.hasWorkout && todaysWorkoutResult.primaryWorkout?.monthlyPlan) {
              const monthlyPlanId = todaysWorkoutResult.primaryWorkout.monthlyPlan.id;
              
              // Check overall monthly plan completion
              // We'll mark the monthly plan as completed since this workout session is finished
              console.log(`✅ [handleFinishWorkout] Monthly plan workout completed, updating plan status to completed`);
              await api.monthlyPlanAssignments.updateStatus(monthlyPlanId, 'completed');
              
              // Update local state to reflect completion
              setMonthlyPlans(prev => 
                prev.map(plan => 
                  plan.id === monthlyPlanId 
                    ? { ...plan, status: 'completed' }
                    : plan
                )
              );
            }
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`Monthly plan workout ${workoutId} marked as completed`);
            }
    } catch (error) {
            console.error('Error updating monthly plan completion status:', error);
          }
        } else {
          // For regular workouts
          try {
            await markRegularWorkoutAsCompleted(user.id, workoutId);
            if (process.env.NODE_ENV === 'development') {
              console.log(`Workout ${workoutId} marked as completed in database`);
            }
          } catch (error) {
            console.error('Error updating workout completion status:', error);
          }
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
      // Mark as in_progress
      if (user?.id) {
        if (workoutId.startsWith('daily-')) {
          // For monthly plan workouts, update monthly plan status to in_progress
          try {
            const todaysWorkoutResult = await api.monthlyPlanAssignments.getTodaysWorkout(user.id);
            
            if (todaysWorkoutResult?.hasWorkout && todaysWorkoutResult.primaryWorkout?.monthlyPlan) {
              const monthlyPlanId = todaysWorkoutResult.primaryWorkout.monthlyPlan.id;
              
              console.log(`🔄 [handleFinishWorkout] Monthly plan workout in progress, updating plan status`);
              await api.monthlyPlanAssignments.updateStatus(monthlyPlanId, 'in_progress');
              
              // Update local state to reflect progress
              setMonthlyPlans(prev => 
                prev.map(plan => 
                  plan.id === monthlyPlanId 
                    ? { ...plan, status: 'in_progress' }
                    : plan
                )
              );
            }
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`Monthly plan workout ${workoutId} marked as in_progress`);
            }
        } catch (error) {
            console.error('Error updating monthly plan progress status:', error);
          }
        } else {
          // For regular workouts
          try {
            await api.athleteWorkouts.updateAssignmentStatus(user.id, workoutId, 'in_progress');
            if (process.env.NODE_ENV === 'development') {
              console.log(`Workout ${workoutId} marked as in_progress in database`);
            }
          } catch (error) {
            console.error('Error updating workout progress status:', error);
          }
        }
      }
    }
    
    // Close modal using the handler that preserves workout data
    handleModalClose();
  };

  const handleShowVideo = (exerciseName: string, videoUrl: string) => {
    setVideoModal({
      isOpen: true,
      videoUrl,
      exerciseName
    });
  };

  const handleResetProgress = async (workoutId: string, workoutName: string) => {
    setWorkoutToReset({ id: workoutId, name: workoutName });
    onResetOpen();
  };

  // Add reset function for monthly plans
  const handleResetMonthlyPlan = async (monthlyPlanId: string, planName: string) => {
    if (!user?.id) return;

    try {
      // Reset both database completed_exercises and status using the helper function
      await resetMonthlyPlanProgress(user.id);
      
      // Clear ALL daily workout progress from the store, not just today's
      const storeState = workoutStore.workoutProgress;
      const dailyWorkoutIds = Object.keys(storeState).filter(id => id.startsWith('daily-'));
      
      // Clear progress for all daily workouts and their cache entries
      dailyWorkoutIds.forEach(workoutId => {
        workoutStore.resetProgress(workoutId);
        progressCheckCache.current.delete(workoutId);
      });
      
      // Also clear cache for the monthly plan assignment ID itself
      progressCheckCache.current.delete(monthlyPlanId);
      
      // Wait a moment for database updates to propagate
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Update local state
      setMonthlyPlans(prev => 
        prev.map(plan => 
          plan.id === monthlyPlanId 
            ? { ...plan, status: 'assigned' }
            : plan
        )
      );
      
      // Force refresh monthly plans to reflect the reset
      await loadMonthlyPlans();
      
      // Force refresh to update progress counters immediately
      forceWorkoutStoreRefresh();
      
      toast({
        title: 'Monthly Plan Reset',
        description: `${planName} has been reset to start from the beginning.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error resetting monthly plan:', error);
      toast({
        title: 'Reset Failed',
        description: `Failed to reset ${planName}: ${error?.message || 'Unknown error'}`,
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
    }
  };

  const handleResetConfirm = async () => {
    if (!workoutToReset) return;
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Resetting progress for workout ${workoutToReset.id}`);
      }
      
      // Reset progress in the workout store
      workoutStore.resetProgress(workoutToReset.id);
      
      // Clear progress check cache to force WorkoutCardWithProgress to re-check
      progressCheckCache.current.delete(workoutToReset.id);
      
      // Also clear any related cache entries (for daily workouts, etc.)
      if (workoutToReset.id.startsWith('daily-')) {
        // For daily workouts, also clear any monthly plan assignment cache
        const keys = Array.from(progressCheckCache.current.keys());
        keys.forEach(key => {
          if (key.startsWith('daily-') || !key.includes('-')) {
            progressCheckCache.current.delete(key);
          }
        });
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🧹 Cleared progress cache for workout ${workoutToReset.id}`);
      }
      
      // Also reset in the database if the user has an assignment
      if (user?.id) {
        try {
          // Extract actual workout ID if this is a daily workout ID
          let actualWorkoutId = workoutToReset.id;
          if (workoutToReset.id.startsWith('daily-')) {
            actualWorkoutId = workoutToReset.id.replace('daily-', '');
          }
          
          // Use the proper helper function to reset granular progress data
          const { resetRegularWorkoutProgress } = await import('../../utils/regularWorkoutHelper');
          await resetRegularWorkoutProgress(user.id, actualWorkoutId);
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`Workout ${workoutToReset.id} (actual: ${actualWorkoutId}) progress fully reset in database`);
          }
        } catch (error) {
          console.error('Error resetting workout progress in database:', error);
        }
      }
      
      // Add a small delay to ensure database and UI state are in sync
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force refresh to update progress counters and trigger WorkoutCardWithProgress re-render
      forceWorkoutStoreRefresh();
      
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

  // Handle deleting workouts (only ones created by the athlete)
  const handleDeleteWorkout = async (workout: Workout) => {
    if (!user?.id) return;
    
    // Only allow deleting workouts created by this athlete
    if (workout.user_id !== user.id) {
      toast({
        title: "Cannot delete workout",
        description: "You can only delete workouts you created yourself.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    try {
      await api.workouts.softDelete(workout.id);
      
      // Refresh the workouts list and deleted count
      await refetch();
      await loadDeletedCount();
      
      toast({
        title: "Workout deleted",
        description: `"${workout.name}" has been moved to deleted items.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast({
        title: "Error deleting workout",
        description: "Could not delete the workout. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const renderWorkoutCards = useCallback((items: any[]) => {
    // Force re-render when store updates by including the trigger in the dependency
    if (!items || items.length === 0) {
      // Generate appropriate empty state message based on filters
      const getEmptyStateMessage = () => {
        if (workoutFilter === 'monthly') {
          if (creatorFilter === 'mine') {
            return 'You cannot create monthly plans. Monthly plans are created by coaches.';
          } else if (creatorFilter === 'coaches') {
            return 'No monthly plans assigned by coaches yet.';
          }
          return 'No monthly plans assigned yet.';
        } else {
          if (creatorFilter === 'mine') {
            return 'No workouts created by you found.';
          } else if (creatorFilter === 'coaches') {
            return 'No workouts assigned by coaches found.';
          }
          return 'No workouts found.';
        }
      };

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
            {getEmptyStateMessage()}
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
        {items.map((item) => {
          // Check if this is a monthly plan or a workout
          if (item.isMonthlyPlan) {
            // Transform monthly plan data to match WorkoutCard expectations
            const plan = item.training_plans;
            
            // Remove debug logs that were causing console spam
            // console.log('Rendering monthly plan item:', item);
            // console.log('Plan data:', plan);
            
            // Check if plan exists and has valid data
            if (!plan) {
              console.warn('Monthly plan assignment missing training_plans data:', item);
              return null; // Skip this item if no plan data
            }
            
            const trainingWeeks = plan?.weeks?.filter((w: any) => !w.is_rest_week).length || 0;
            const restWeeks = plan?.weeks?.filter((w: any) => w.is_rest_week).length || 0;
            const getMonthName = (month: number): string => {
              const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ];
              return months[month - 1] || 'Unknown';
            };
            
            // For now, use a placeholder count - we'll need to enhance this with pre-loaded data
            // Use actual loaded exercise data
            const monthlyPlanExerciseData = item.exerciseData || { exercises: [], totalCount: 0 };
            
            // Create a workout-like object for the monthly plan
            const monthlyPlanAsWorkout = {
              id: item.id,
              name: plan.name || 'Monthly Plan',
              description: `${getMonthName(plan.month || 0)} ${plan.year || new Date().getFullYear()} - ${plan.weeks?.length || 0} weeks total`,
              type: 'MONTHLY PLAN',
              template_type: 'monthly' as const, // Use monthly to display proper badge
              date: item.assigned_at || item.start_date,
              duration: `${plan.weeks?.length || 0} weeks`,
              exercises: monthlyPlanExerciseData.exercises.length > 0 
                ? monthlyPlanExerciseData.exercises 
                : [{ name: 'Loading exercises...', id: 'loading-1' }],
              user_id: item.athlete_id,
              created_at: item.assigned_at || new Date().toISOString(),
              updated_at: item.assigned_at || new Date().toISOString(),
              // Add total exercise count for display
              totalExerciseCount: monthlyPlanExerciseData.totalCount
            };
            
            // Calculate actual progress for monthly plan based on exercise completion
            // Include workoutStoreUpdateTrigger to ensure recalculation when store updates
            const calculateMonthlyPlanProgress = () => {
              // Reference the trigger to ensure this function recalculates when store updates
              const _ = workoutStoreUpdateTrigger;
              
              const exerciseData = item.exerciseData || { exercises: [], totalCount: 0 };
              const totalExercises = exerciseData.totalCount;
              
              if (totalExercises === 0) {
                // Fallback to status-based calculation if no exercise data
                return {
                  completed: item.status === 'completed' ? 1 : 0,
              total: 1,
                  percentage: item.status === 'completed' ? 100 : 0
                };
              }
              
              // Check for any daily workout progress in the workout store
              const storeState = workoutStore.workoutProgress;
              const dailyWorkoutIds = Object.keys(storeState).filter(id => id.startsWith('daily-'));
              
              let completedExercises = 0;
              
              // Check if we have any progress in any daily workout
              for (const workoutId of dailyWorkoutIds) {
                const progress = workoutStore.getProgress(workoutId);
                if (progress?.completedExercises && progress.completedExercises.length > 0) {
                  // Found some progress - use it
                  completedExercises = Math.max(completedExercises, progress.completedExercises.length);
                  break; // Use the first progress found
                }
              }
              
              // FIXED: Only use status-based fallback if status is 'completed', otherwise use 0
              if (completedExercises === 0) {
                if (item.status === 'completed') {
                  completedExercises = totalExercises;
                }
                // Don't use in_progress status for fallback - if store is empty, progress is 0
              }
              
              // Calculate actual completion percentage
              const percentage = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
              
              return {
                completed: completedExercises,
                total: totalExercises,
                percentage: Math.min(percentage, 100) // Cap at 100%
              };
            };
            
            const monthlyPlanProgress = calculateMonthlyPlanProgress();
            
            return (
              <WorkoutCardWithProgress
                key={item.id}
                workout={monthlyPlanAsWorkout}
                isCoach={false}
                progress={monthlyPlanProgress}
                checkWorkoutHasProgress={checkWorkoutHasProgress}
                onStart={async () => {
                  // For monthly plans, extract today's exercises and open execution modal
                  if (item.status === 'assigned') {
                    // Mark as in progress if needed
                    try {
                      await api.monthlyPlanAssignments.updateStatus(item.id, 'in_progress');
                      // Update local state
                      setMonthlyPlans(prev => 
                        prev.map(plan => 
                          plan.id === item.id 
                            ? { ...plan, status: 'in_progress' }
                            : plan
                        )
                      );
                    } catch (error) {
                      console.error('Error updating plan status:', error);
                    }
                  }
                  
                  // Use the shared helper function to start today's workout
                  const workoutStarted = await startTodaysWorkoutExecution(
                    user.id, 
                    workoutStore, 
                    setExecModalWithPersistence
                  );
                  
                  if (!workoutStarted) {
                    // If no workout available for today, navigate to all workouts page
                    setActiveItem('all-workouts');
                  }
                }}
                onViewDetails={() => setActiveItem('all-workouts')}
                onRefresh={() => loadMonthlyPlans()}
                showRefresh={false}
                onReset={() => handleResetMonthlyPlan(item.id, item.training_plans?.name || 'Monthly Plan')}
                onDelete={() => {}}
                currentUserId={user?.id}
              />
            );
          } else {
            // Render regular workout
          const workout = item;
            
            // Get completion data from workoutStore
            const completedCount = getCompletionCount(workout.id);
            
            const totalExercises = getActualExerciseCount(workout);
            
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
            
            // Calculate progress based on workout type (blocks vs exercises)
            // Get real-time progress from store instead of local calculations
            const storeProgress = workoutStore.getProgress(workout.id);
            
            let progressCompleted, progressTotal, progressPercent;
            
            if ((workout as any).is_block_based) {
              // For block-based workouts, use exercise-level progress for better granularity
              // This shows progress as individual exercises are completed, not just when entire blocks finish
              const totalBlocks = getTotalBlockCount(workout);
              const completedBlocks = getCompletedBlockCount(workout, storeProgress?.completedExercises || []);
              const completedExercises = storeProgress?.completedExercises?.length || 0;
              
              // Debug logging for block progress (only in development and only for problematic workouts)
              if (process.env.NODE_ENV === 'development' && (workout.id === 'S7925' || workout.id === 'S7725')) {
                console.log(`[Block Progress Debug] ${workout.id}:`, {
                  totalBlocks,
                  completedBlocks,
                  completedExercises,
                  totalExercises,
                  storeProgress: storeProgress?.completedExercises || [],
                  blocks: getBlocksFromWorkout(workout)
                });
              }
              
              // Use exercise-level progress for progress bar (more granular)
              progressCompleted = completedExercises;
              progressTotal = totalExercises;
              progressPercent = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
            } else {
              // For regular workouts, use store progress for real-time updates
              progressCompleted = storeProgress?.completedExercises?.length || 0;
              progressTotal = totalExercises;
              // Calculate percentage consistently based on completed/total counts
              progressPercent = progressTotal > 0 ? (progressCompleted / progressTotal) * 100 : 0;
            }
            
            const progress = {
              completed: progressCompleted,
              total: progressTotal,
              percentage: progressPercent
            };

            return (
              <WorkoutCardWithProgress
                key={workout.id}
                workout={workout}
                isCoach={false}
                progress={progress}
                checkWorkoutHasProgress={checkWorkoutHasProgress}
                onStart={() => handleGo(workout, nextExerciseIndex)}
                onRefresh={() => forceRefreshWorkoutProgress(workout.id)}
                showRefresh={true}
                onReset={() => handleResetProgress(workout.id, workout.name)}
                onDelete={() => handleDeleteWorkout(workout)}
                currentUserId={user?.id}
              />
            );
          }
        })}
      </SimpleGrid>
    );
  }, [workoutStoreUpdateTrigger, checkWorkoutHasProgress]); // Add dependency array for useCallback

  // Handle refresh
  const handleRefresh = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
      console.log("Manual refresh initiated by athlete");
    }
      
      // Use the real-time hook to force refresh all related queries
      forceRefresh();
      
      // Also refetch the main data
      await refetch();
      
      // Also refresh monthly plans
      await loadMonthlyPlans();
      
      // Resync all workout progress data
      if (assignedWorkouts && assignedWorkouts.length > 0 && user?.id) {
        if (process.env.NODE_ENV === 'development') {
      console.log("Resyncing all workout progress data");
    }
        
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
            
            const totalExercises = getActualExerciseCount(workout);
            
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

  // Handle safe modal closing to preserve workout state
  const handleModalClose = () => {
    // Only close the modal, preserve workout data and progress in store
    setExecModalWithPersistence(prev => ({
      ...prev,
      isOpen: false,
      timer: 0,
      running: false,
      // Keep workout and exerciseIdx to preserve progress
    }));
    
    setVideoModal({
      isOpen: false,
      videoUrl: '',
      exerciseName: ''
    });
    
    // Force refresh to ensure UI shows updated progress when modal closes
    forceWorkoutStoreRefresh();
  };

  // Set up real-time updates for workouts - memoize workoutIds to prevent subscription resets
  const workoutIds = useMemo(() => {
    return assignedWorkouts?.map(w => w.id) || [];
  }, [assignedWorkouts]);
  
  const { isSubscribed, lastUpdate, forceRefresh } = useWorkoutsRealtime({
    athleteId: user?.id,
    workoutIds,
    enabled: !!user?.id
  });
  
  // Log real-time status in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
          // console.log(`Real-time subscription status: ${isSubscribed ? 'Active' : 'Inactive'}`);
    // if (lastUpdate) {
    //   console.log(`Last real-time update: ${lastUpdate.toLocaleTimeString()}`);
    // }
    }
  }, [isSubscribed, lastUpdate]);

  // Add a new function to force refresh a specific workout's progress
  const forceRefreshWorkoutProgress = async (workoutId: string) => {
    if (!user?.id) return;
    
    try {
      // console.log(`Forcing refresh of workout progress for ${workoutId}`);
      
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
      const exercises = await getExercisesWithTeamSharing(user.id);
      // Exercises loaded successfully
      setCustomExercises(exercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
      toast({
        title: 'Error loading exercises',
        description: 'Could not load exercises. Please try again.',
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

    const transformedData = await createExerciseWithSharing(exerciseData, user.id);
    setCustomExercises(prev => [transformedData, ...prev]);
  };

  const handleUpdateExercise = async (id: string, exerciseData: Omit<LibraryExercise, 'id'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    const transformedData = await updateExerciseWithSharing(id, exerciseData, user.id);
    setCustomExercises(prev => 
      prev.map(ex => ex.id === id ? transformedData : ex)
    );
  };

  const handleDeleteExercise = async (id: string) => {
    const { error } = await supabase
      .from('exercise_library')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setCustomExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const loadUserTeams = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams!inner(
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      const teams = data?.map((item: any) => ({
        id: item.teams.id,
        name: item.teams.name
      })) || [];

      setUserTeams(teams);
      // Teams loaded successfully
    } catch (error) {
      console.error('Error loading user teams:', error);
    }
  };

  // Track if we've already loaded initial data to prevent multiple calls
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  // Load custom exercises and deleted count on component mount - only once
  useEffect(() => {
    if (user?.id && !hasLoadedInitialData) {
      setHasLoadedInitialData(true);
      loadCustomExercises();
      loadUserTeams();
      loadDeletedCount();
      loadMonthlyPlans();
    }
  }, [user?.id, hasLoadedInitialData]);

  // Load deleted workouts count
  const loadDeletedCount = async () => {
    if (!user?.id) return;
    try {
      const deletedWorkouts = await api.workouts.getDeleted(user.id);
      setDeletedCount(deletedWorkouts.length);
    } catch (error) {
      console.error('Error loading deleted count:', error);
    }
  };

  // Load monthly plans
  const loadMonthlyPlans = async () => {
    if (!user?.id) return;

    try {
      setMonthlyPlansLoading(true);
      // Use the updated API method for training plan assignments
      const data = await api.monthlyPlanAssignments.getByAthlete(user.id);
      
      // Load exercise data for each plan
      const plansWithExerciseData = await Promise.all(
        data.map(async (plan: any) => {
          if (plan.training_plans) {
            const exerciseData = await loadMonthlyPlanExercises(plan.training_plans);
            return { ...plan, exerciseData };
          }
          return plan;
        })
      );
      
      setMonthlyPlans(plansWithExerciseData as any[]);
    } catch (error) {
      console.error('Error loading monthly plans:', error);
    } finally {
      setMonthlyPlansLoading(false);
    }
  };

  // Function to render content based on active sidebar item
  const renderContent = () => {
    const getSectionInfo = () => {
      switch (activeItem) {
        case 'today':
          return { title: 'Today\'s Workouts', description: 'Workouts scheduled for today', icon: FaCalendarDay };
        case 'this-week':
          return { title: 'This Week\'s Workouts', description: 'All workouts for this week', icon: FaCalendarWeek };
        case 'upcoming':
          return { title: 'Upcoming Workouts', description: 'Future scheduled workouts', icon: FaClock };
        case 'completed':
          return { title: 'Completed Workouts', description: 'Workouts you\'ve finished', icon: FaChartLine };
        case 'in-progress':
          return { title: 'In Progress', description: 'Partially completed workouts', icon: FaPlayCircle };
        case 'strength':
          return { title: 'Strength Training', description: 'Weight and resistance workouts', icon: FaDumbbell };
        case 'cardio':
          return { title: 'Cardio Workouts', description: 'Endurance and running training', icon: FaRunning };
        case 'speed':
          return { title: 'Speed Training', description: 'Sprint and speed workouts', icon: FaLeaf };
        case 'exercise-library':
          return { title: 'Exercise Library', description: 'Manage your custom exercises', icon: FaBookOpen };
        case 'deleted':
          return { title: 'Deleted Workouts', description: 'Restore or permanently delete workouts', icon: FaHistory };
        case 'all-workouts':
        default:
          return { title: 'All Workouts', description: 'Your complete training schedule', icon: FaListUl };
      }
    };

    const sectionInfo = getSectionInfo();

    const renderMainContent = () => {
      switch (activeItem) {
        case 'exercise-library':
          return (
            <ExerciseLibrary
              ref={exerciseLibraryRef}
              exercises={customExercises}
              onAddExercise={handleAddExercise}
              onUpdateExercise={handleUpdateExercise}
              onDeleteExercise={handleDeleteExercise}
              isLoading={exercisesLoading}
              currentUserId={user?.id}
              userTeams={userTeams}
              title=""
              subtitle=""
              showAddButton={false}
            />
          );
        case 'deleted':
          return (
            <DeletedWorkoutsView
              userId={user?.id || ''}
              userRole="athlete"
              title="Deleted Workouts"
              subtitle="Restore or permanently delete your workouts"
            />
          );
        default:
          return (
            <VStack spacing={6} align="stretch">
              {/* Filter Controls */}
              {activeItem === 'all-workouts' && (
                <HStack spacing={{ base: 2, md: 4 }} wrap="nowrap" align="center" w="100%">
                  {/* Desktop - Keep original layout with Filters: text */}
                  <Box display={{ base: "none", md: "block" }}>
                    <Text fontSize="sm" fontWeight="medium" color={headerSubtextColor}>
                      Filters:
                    </Text>
                  </Box>
                  
                  <Select
                    value={workoutFilter}
                    onChange={(e) => setWorkoutFilter(e.target.value as typeof workoutFilter)}
                    size="sm"
                    bg={cardBg}
                    flex="1"
                  >
                    <option value="all">All Types</option>
                    <option value="single">Single</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </Select>

                  <Select
                    value={creatorFilter}
                    onChange={(e) => setCreatorFilter(e.target.value as typeof creatorFilter)}
                    size="sm"
                    bg={cardBg}
                    flex="1"
                  >
                    <option value="all">All Workouts</option>
                    <option value="mine">My Workouts</option>
                    <option value="coaches">Coach Workouts</option>
                  </Select>

                  {/* Desktop - Button with text */}
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<FaRedo />}
                    onClick={handleRefresh}
                    isLoading={isLoading}
                    display={{ base: "none", md: "flex" }}
                  >
                    Refresh
                  </Button>

                  {/* Mobile - Icon only button */}
                  <IconButton
                    size="sm"
                    variant="outline"
                    aria-label="Refresh"
                    icon={<FaRedo />}
                    onClick={handleRefresh}
                    isLoading={isLoading}
                    display={{ base: "flex", md: "none" }}
                    flexShrink={0}
                  />
                </HStack>
              )}

              {/* Workout Cards */}
            <Box>
              {renderWorkoutCards(filteredItems)}
            </Box>
            </VStack>
          );
      }
    };

    return (
      <VStack spacing={6} align="stretch" w="100%">
        {/* Add Exercise Button - Mobile Only (since desktop has it in header) */}
        {activeItem === 'exercise-library' && (
          <Flex justify="flex-end" w="100%" display={{ base: "flex", md: "none" }}>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="blue"
              onClick={() => {
                if (exerciseLibraryRef.current) {
                  exerciseLibraryRef.current.openAddModal();
                }
              }}
            >
              Add Exercise
            </Button>
          </Flex>
        )}
        
        {/* Main Content */}
        {renderMainContent()}
      </VStack>
    );
  };

  return (
    <Box bg={pageBackgroundColor} minH="100vh" data-testid="athlete-workouts">


      {/* Workouts Sidebar */}
      <WorkoutsSidebar
        sections={workoutsSections}
        activeItem={activeItem}
        onItemClick={setActiveItem}
        createWorkoutAction={() => navigate('/athlete/workout-creator')}
        workoutCounts={workoutStats}
      />

      {/* Main Content */}
      <Box
        ml={{ 
          base: 0, 
          md: `${mainSidebarWidth - 50}px`, 
          lg: mainSidebarWidth === 70 
            ? `${mainSidebarWidth + 280 - 50}px`  // When collapsed: less margin adjustment
            : `${mainSidebarWidth + 280 - 180}px`  // When expanded: more margin adjustment
        }}
        mr={{ 
          base: 0, 
          lg: mainSidebarWidth === 70 ? "30px" : "20px"  // Less right margin when sidebar is collapsed
        }}
        pt={isHeaderVisible ? "-2px" : "-82px"}
        pb={{ base: 24, lg: 8 }} // Add bottom padding for mobile bottom navigation
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        minH="100vh"
        px={{ base: "10px", md: 0 }} // Add 10px padding on mobile, remove on desktop
        py={8}
      >
        {/* Desktop Header */}
        <PageHeader
          title="Workouts"
          subtitle="Your Training Schedule"
          icon={BiRun}
        />
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

        {!isLoading && !isError && renderContent()}
      </Box>
        
      {/* Exercise Execution Modal - Using shared component */}
              <WorkoutExecutionRouter
        isOpen={execModal.isOpen}
        onClose={handleModalClose}
        workout={execModal.workout}
        exerciseIdx={execModal.exerciseIdx}
        timer={execModal.timer}
        running={execModal.running}
        currentSet={execModal.currentSet}
        currentRep={execModal.currentRep}
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation
        onCreateWorkout={() => navigate('/athlete/workout-creator')}
        onRefresh={handleRefresh}
        onFilters={() => {
          // Toggle filter options or show filter modal
          console.log('Filters clicked');
        }}
        onSettings={() => {
          // Navigate to settings or show settings modal
          navigate('/athlete/settings');
        }}
      />
    </Box>
  );
} 