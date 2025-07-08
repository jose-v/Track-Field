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
import { WorkoutCard } from '../../components/WorkoutCard'; // Import our shared card component
import { supabase } from '../../lib/supabase';
import { RepeatIcon } from '@chakra-ui/icons';
import { dateUtils } from '../../utils/date';
import { useWorkoutsRealtime } from '../../hooks/useWorkoutsRealtime';
import { handleWorkoutCompletion } from '../../services/integrationService';
import { useFeedback } from '../../components/FeedbackProvider'; // Import the feedback hook
import { MonthlyPlanAssignments, WorkoutsSidebar, MobileBottomNavigation } from '../../components';
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

    // Fetch all weekly workouts used in this plan
    const workouts = await Promise.all(
      workoutIds.map(async (workoutId: string) => {
        try {
          const { data, error } = await supabase
            .from('workouts')
            .select('*')
            .eq('id', workoutId)
            .single();
          
          if (error) throw error;
          return data;
        } catch (error) {
          console.error(`Error loading workout ${workoutId}:`, error);
          return null;
        }
      })
    );

    // Filter out null results and extract exercises
    const validWorkouts = workouts.filter(Boolean);
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

  const [execModal, setExecModal] = useState({
    isOpen: false,
    workout: null as any, // Using any to avoid type conflicts
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

  // State for user teams
  const [userTeams, setUserTeams] = useState<Array<{ id: string; name: string }>>([]);

  // State for monthly plans
  const [monthlyPlans, setMonthlyPlans] = useState<any[]>([]);
  const [monthlyPlansLoading, setMonthlyPlansLoading] = useState(false);
  
  // State to force re-render when workout store is updated
  const [workoutStoreUpdateTrigger, setWorkoutStoreUpdateTrigger] = useState(0);
  
  // Force refresh function for workout store updates
  const forceWorkoutStoreRefresh = () => {
    setWorkoutStoreUpdateTrigger(prev => prev + 1);
  };

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
    refetchOnWindowFocus: true,
    staleTime: 60000, // Consider data stale after 1 minute
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
  }, [assignedWorkouts, workoutStore]);

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
    const baseFilteredWorkouts = (activeItem !== 'monthly-plans') 
      ? assignedWorkouts.filter(workout => 
          !usedInMonthlyPlans.has(workout.id) && !workout.is_template
        )
      : assignedWorkouts;

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
  }, [assignedWorkouts, activeItem, workoutStore, workoutFilter, creatorFilter, user?.id, usedWorkoutIdsInMonthlyPlans]);

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
          id: 'monthly-plans',
          label: 'Monthly Plans',
          icon: FaCalendarAlt,
          description: 'View training plan assignments'
        },
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

  // Refetch workouts when component mounts
  useEffect(() => {
    if (user?.id) {
      if (process.env.NODE_ENV === 'development') {
        // console.log('Athlete component mounted, refetching workouts');
      }
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
          if (process.env.NODE_ENV === 'development') {
        // console.log('Syncing workoutStore with database completion status');
      }
          const { data: assignments, error } = await supabase
            .from('athlete_workouts')
            .select('workout_id, status, completed_exercises')
            .eq('athlete_id', user.id);
            
          if (error) {
            console.error('Error fetching assignment statuses:', error);
            return;
          }
          
          if (assignments) {
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
  const handleUpdateTimer = useCallback((newTimer: number) => {
    setExecModal(prev => ({ ...prev, timer: newTimer }));
  }, []);

  const handleUpdateRunning = useCallback((newRunning: boolean) => {
    setExecModal(prev => ({ ...prev, running: newRunning }));
  }, []);

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
    
    // Force refresh to update progress counters
    forceWorkoutStoreRefresh();
    
    // Update modal state
    setExecModal(prev => ({
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
      setExecModal(prev => ({
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
      
      // Force refresh to update progress counters
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
      
      // Clear progress for all daily workouts
      dailyWorkoutIds.forEach(workoutId => {
        workoutStore.resetProgress(workoutId);
      });
      
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
      
      // Also reset in the database if the user has an assignment
      if (user?.id) {
        try {
          // Extract actual workout ID if this is a daily workout ID
          let actualWorkoutId = workoutToReset.id;
          if (workoutToReset.id.startsWith('daily-')) {
            actualWorkoutId = workoutToReset.id.replace('daily-', '');
          }
          
          await api.athleteWorkouts.updateAssignmentStatus(user.id, actualWorkoutId, 'assigned');
          if (process.env.NODE_ENV === 'development') {
        console.log(`Workout ${workoutToReset.id} (actual: ${actualWorkoutId}) status reset to 'assigned' in database`);
      }
        } catch (error) {
          console.error('Error resetting workout status in database:', error);
        }
      }
      
      // Add a small delay to ensure database and UI state are in sync
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force refresh to update progress counters
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

  const renderWorkoutCards = (items: any[]) => {
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
              <WorkoutCard
                key={item.id}
                workout={monthlyPlanAsWorkout}
                isCoach={false}
                progress={monthlyPlanProgress}
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
                    setExecModal
                  );
                  
                  if (!workoutStarted) {
                    // If no workout available for today, navigate to monthly plans page
                    setActiveItem('monthly-plans');
                  }
                }}
                onViewDetails={() => setActiveItem('monthly-plans')}
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
            let progressCompleted, progressTotal, progressPercent;
            
            if ((workout as any).is_block_based) {
              // For block-based workouts, calculate block progress
              const totalBlocks = getTotalBlockCount(workout);
              const completedBlocks = getCompletedBlockCount(workout, completedExercises);
              
              progressCompleted = completedBlocks;
              progressTotal = totalBlocks;
              progressPercent = totalBlocks > 0 ? (completedBlocks / totalBlocks) * 100 : 0;
            } else {
              // For regular workouts, use exercise progress
              progressCompleted = completedCount;
              progressTotal = totalExercises;
              progressPercent = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;
            }
            
            const progress = {
              completed: progressCompleted,
              total: progressTotal,
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
                onDelete={() => handleDeleteWorkout(workout)}
                currentUserId={user?.id}
              />
            );
          }
        })}
      </SimpleGrid>
    );
  };

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

  // Load custom exercises and deleted count on component mount
  useEffect(() => {
    loadCustomExercises();
    loadUserTeams();
    loadDeletedCount();
    loadMonthlyPlans();
  }, [user?.id]);

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
        case 'monthly-plans':
          return { title: 'Monthly Plans', description: 'Training plan assignments', icon: FaCalendarAlt };
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
        case 'monthly-plans':
          return <MonthlyPlanAssignments />;
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