import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Heading, Text, SimpleGrid, Button, HStack, VStack, useDisclosure,
  useToast, Skeleton, Card, CardBody, useColorModeValue, Flex, 
  IconButton, Badge, Alert, AlertIcon, Spinner, Icon, Tabs, TabList, TabPanels, Tab, TabPanel,
  Select, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton
} from '@chakra-ui/react';
import { FaCalendarAlt, FaPlus, FaRedo, FaUsers, FaChartLine, FaLayerGroup, FaTrash, FaFileImport, FaDumbbell, FaUserFriends, FaListUl, FaCalendarWeek, FaCalendarDay, FaClock, FaBookOpen, FaHistory, FaFilter, FaCog, FaHeartbeat, FaBolt, FaTh, FaList } from 'react-icons/fa';
import { AddIcon, RepeatIcon } from '@chakra-ui/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { MonthlyPlanCreator } from '../../components/MonthlyPlanCreator';
import { AssignmentDrawer } from '../../components/AssignmentDrawer';
import { PlanDetailView } from '../../components/PlanDetailView';
import { WorkoutDetailView } from '../../components/WorkoutDetailView';
import { CoachWorkoutCard, CoachWorkoutListItem } from '../../components/UnifiedAssignmentCard';
import { WorkoutDeletionWarningModal } from '../../components/WorkoutDeletionWarningModal';
import { ConvertTemplateModal } from '../../components/modals/ConvertTemplateModal';
import type { TrainingPlan } from '../../services/dbSchema';
import type { Workout } from '../../services/api';
import { useCoachAthletes } from '../../hooks/useCoachAthletes';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useWorkoutCompletionStats } from '../../hooks/useWorkoutCompletionStats';
import { useWorkoutsRealtime } from '../../hooks/useWorkoutsRealtime';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { DeletedItemCard } from '../../components/DeletedItemCard';
import { ExerciseLibrary, Exercise } from '../../components/ExerciseLibrary';
import { getExercisesWithTeamSharing, createExerciseWithSharing, updateExerciseWithSharing } from '../../utils/exerciseQueries';
import { WorkoutsSidebar } from '../../components';
import type { WorkoutsSection, WorkoutsItem } from '../../components';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { getWorkoutExerciseCount } from '../../utils/workoutUtils';
import { usePageHeader } from '../../hooks/usePageHeader';

// Type for monthly plan with assignment stats
interface MonthlyPlanWithStats extends TrainingPlan {
  totalAssignments: number;
  activeAssignments: number;
  completedAssignments: number;
}

// Athlete assignment type for workouts
interface AthleteAssignment {
  id: string;
  athlete_id: string;
  workout_id: string; 
  status: string;
}

// Create a skeleton workout card component for loading states
const WorkoutSkeletonCard = ({ 
  cardBg, 
  cardBorder, 
  headerBg, 
  avatarBg, 
  barBg 
}: {
  cardBg: string;
  cardBorder: string;
  headerBg: string;
  avatarBg: string;
  barBg: string;
}) => {
  return (
    <Card 
      borderRadius="xl" 
      overflow="hidden" 
      boxShadow="md" 
      borderWidth="1px" 
      borderColor={cardBorder}
      h="100%"
      bg={cardBg}
    >
      {/* Skeleton header */}
      <Box height="80px" bg={headerBg} position="relative">
        <Box 
          position="absolute" 
          top="20px" 
          left="20px" 
          width="40px" 
          height="40px" 
          borderRadius="full" 
          bg={avatarBg}
        />
        <Box 
          position="absolute" 
          top="25px" 
          left="75px" 
          width="100px" 
          height="30px" 
          borderRadius="md" 
          bg={barBg}
        />
      </Box>
      <CardBody>
        {/* Title */}
        <Skeleton height="28px" width="70%" mb={6} startColor={barBg} endColor={avatarBg} />
        {/* Date and time */}
        <HStack spacing={4} mb={4}>
          <Skeleton height="18px" width="120px" borderRadius="md" startColor={barBg} endColor={avatarBg} />
          <Skeleton height="18px" width="80px" borderRadius="md" startColor={barBg} endColor={avatarBg} />
        </HStack>
        {/* Duration and location */}
        <HStack spacing={4} mb={4}>
          <Skeleton height="18px" width="80px" borderRadius="md" startColor={barBg} endColor={avatarBg} />
          <Skeleton height="18px" width="100px" borderRadius="md" startColor={barBg} endColor={avatarBg} />
        </HStack>
        {/* Exercises */}
        <Box width="100%" py={2} mb={4}>
          <Skeleton height="20px" width="130px" borderRadius="md" mb={3} startColor={barBg} endColor={avatarBg} />
          <Skeleton height="14px" width="90%" borderRadius="md" mb={2} startColor={barBg} endColor={avatarBg} />
          <Skeleton height="14px" width="85%" borderRadius="md" mb={2} startColor={barBg} endColor={avatarBg} />
          <Skeleton height="14px" width="60%" borderRadius="md" startColor={barBg} endColor={avatarBg} />
        </Box>
        {/* Assigned to */}
        <Skeleton height="18px" width="80%" borderRadius="md" mb={5} startColor={barBg} endColor={avatarBg} />
        {/* Progress section */}
        <Skeleton height="16px" width="150px" borderRadius="md" mb={2} startColor={barBg} endColor={avatarBg} />
        <Skeleton height="8px" width="100%" borderRadius="full" mb={2} startColor={barBg} endColor={avatarBg} />
        <Skeleton height="14px" width="100px" borderRadius="md" ml="auto" startColor={barBg} endColor={avatarBg} />
      </CardBody>
    </Card>
  );
};

// View Toggle Component with Refresh Icon
const ViewToggle = ({ viewMode, setViewMode, toggleBorderColor, onRefresh, isLoading }: { 
  viewMode: 'grid' | 'list', 
  setViewMode: (mode: 'grid' | 'list') => void,
  toggleBorderColor: string,
  onRefresh?: () => void,
  isLoading?: boolean
}) => (
  <HStack spacing={1} border="1px" borderColor={toggleBorderColor} borderRadius="lg" p={1}>
    <IconButton
      aria-label="Grid view"
      icon={<FaTh />}
      onClick={() => setViewMode('grid')}
      variant={viewMode === 'grid' ? 'solid' : 'ghost'}
      colorScheme={viewMode === 'grid' ? 'blue' : 'gray'}
      size="sm"
    />
    <IconButton
      aria-label="List view"
      icon={<FaList />}
      onClick={() => setViewMode('list')}
      variant={viewMode === 'list' ? 'solid' : 'ghost'}
      colorScheme={viewMode === 'list' ? 'blue' : 'gray'}
      size="sm"
    />
    {onRefresh && (
      <IconButton
        aria-label="Refresh"
        icon={<FaRedo />}
        onClick={onRefresh}
        variant="ghost"
        colorScheme="gray"
        size="sm"
        isLoading={isLoading}
      />
    )}
  </HStack>
);

export function CoachTrainingPlans() {
  // ALL color mode values MUST be called first to maintain hooks order
  const pageBackgroundColor = useColorModeValue('gray.50', 'gray.900');
  const toggleBorderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerTextColor = useColorModeValue('gray.800', 'white');
  const headerSubtextColor = useColorModeValue('gray.600', 'gray.300');
  const iconColor = useColorModeValue('#4A5568', '#A0AEC0');
  const selectBg = useColorModeValue('white', 'gray.700');
  const selectBorderColor = useColorModeValue('gray.300', 'gray.600');
  const listViewTextColor = useColorModeValue('gray.800', 'gray.100');
  const blueIconColor = useColorModeValue('blue.500', 'blue.300');
  // Colors for skeleton components
  const skeletonCardBg = useColorModeValue('white', 'gray.800');
  const skeletonCardBorder = useColorModeValue('gray.200', 'gray.700');
  const skeletonHeaderBg = useColorModeValue('blue.400', 'blue.600');
  const skeletonAvatarBg = useColorModeValue('whiteAlpha.300', 'whiteAlpha.100');
  const skeletonBarBg = useColorModeValue('whiteAlpha.300', 'whiteAlpha.100');
  
  // Use page header hook for mobile nav (no icon)
  usePageHeader({
    title: 'Training Plans',
    subtitle: 'Your workout library and training programs'
  });

  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: athletes, isLoading: athletesLoading } = useCoachAthletes({
    includeStatuses: ['approved', 'pending']
  });
  
  // Modal state
  const { isOpen: isCreatorOpen, onOpen: onCreatorOpen, onClose: onCreatorClose } = useDisclosure();
  const { isOpen: isAssignmentOpen, onOpen: onAssignmentOpen, onClose: onAssignmentClose } = useDisclosure();
  const { isOpen: isWorkoutAssignmentOpen, onOpen: onWorkoutAssignmentOpen, onClose: onWorkoutAssignmentClose } = useDisclosure();
  const { isOpen: isWarningOpen, onOpen: onWarningOpen, onClose: onWarningClose } = useDisclosure();
  const { isOpen: isConvertModalOpen, onOpen: onConvertModalOpen, onClose: onConvertModalClose } = useDisclosure();
  
  // State for deletion warning modal
  const [workoutToDelete, setWorkoutToDelete] = useState<{ id: string; name: string } | null>(null);
  const [monthlyPlansUsing, setMonthlyPlansUsing] = useState<{ id: string; name: string }[]>([]);
  
  // State for monthly plan usage display
  const [monthlyPlanUsageData, setMonthlyPlanUsageData] = useState<Record<string, {
    isUsed: boolean;
    monthlyPlans: { id: string; name: string }[];
  }>>({});
  
  // Tab state - handle URL parameters for direct navigation
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    switch (tabParam) {
      case 'workouts': return 0;
      case 'plans': return 1;
      case 'templates': return 2;
      case 'drafts': return 3;
      case 'deleted': return 4;
      case 'exercises': return 5;
      default: return 0; // Default to workouts tab
    }
  };

  const [activeTabIndex, setActiveTabIndex] = useState(getInitialTab);
  
  // Workout filter state
  const [workoutFilter, setWorkoutFilter] = useState<'all' | 'single' | 'weekly' | 'monthly'>('all');
  const [selectedAthlete, setSelectedAthlete] = useState<string>('all');
  
  // Template filter state
  const [templateFilter, setTemplateFilter] = useState<'all' | 'single' | 'weekly' | 'monthly'>('all');
  
  // Draft filter state
  const [draftFilter, setDraftFilter] = useState<'all' | 'single' | 'weekly' | 'monthly'>('all');
  
  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Data state for monthly plans
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlanWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [monthlyPlanAssignments, setMonthlyPlanAssignments] = useState<any[]>([]);
  const [selectedPlanForAssignment, setSelectedPlanForAssignment] = useState<TrainingPlan | null>(null);
  const [selectedPlanForView, setSelectedPlanForView] = useState<TrainingPlan | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedWorkoutForView, setSelectedWorkoutForView] = useState<Workout | null>(null);
  const [showWorkoutDetailView, setShowWorkoutDetailView] = useState(false);
  const [workoutToAssign, setWorkoutToAssign] = useState<Workout | null>(null);
  const [templateToConvert, setTemplateToConvert] = useState<Workout | null>(null);

  // Data state for workouts (moved from CoachWorkouts)
  const { 
    workouts, 
    isLoading: workoutsLoading, 
    deleteWorkout, 
    deleteWorkoutAsync,
    createWorkout, 
    updateWorkout, 
    refetch: refetchWorkouts,
    checkMonthlyPlanUsage,
    batchCheckMonthlyPlanUsage,
    removeFromMonthlyPlans,
    isCheckingUsage,
    isBatchCheckingUsage,
    isRemovingFromPlans
  } = useWorkouts();
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [assignments, setAssignments] = useState<AthleteAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Get all workout IDs for fetching stats
  const workoutIds = workouts?.map(workout => workout.id) || [];
  const { completionStats, isLoading: workoutStatsLoading, refetch: refetchWorkoutStats } = useWorkoutCompletionStats(workoutIds);

  // Set up real-time updates for workouts
  const { isSubscribed, lastUpdate, forceRefresh } = useWorkoutsRealtime({
    coachId: user?.id,
    workoutIds,
    enabled: !!user?.id
  });

  // Data state for template workouts
  const [templateWorkouts, setTemplateWorkouts] = useState<Workout[]>([]);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [templateRefreshing, setTemplateRefreshing] = useState(false);

  // Data state for drafts
  const [draftWorkouts, setDraftWorkouts] = useState<Workout[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [draftsRefreshing, setDraftsRefreshing] = useState(false);

  // State for deleted items
  const [deletedWorkouts, setDeletedWorkouts] = useState<Workout[]>([]);
  const [deletedMonthlyPlans, setDeletedMonthlyPlans] = useState<TrainingPlan[]>([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [deletedRefreshing, setDeletedRefreshing] = useState(false);

  // Sidebar state and configuration
  const [activeItem, setActiveItem] = useState('all-workouts');
  const [mainSidebarWidth, setMainSidebarWidth] = useState(() => {
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    return savedSidebarState === 'true' ? 70 : 200;
  });
  const { isHeaderVisible } = useScrollDirection(15);

  // State for custom exercises
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);

  // State for user teams
  const [userTeams, setUserTeams] = useState<Array<{ id: string; name: string }>>([]);

  // State for plan editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<TrainingPlan | null>(null);

  // Add ref for ExerciseLibrary
  const exerciseLibraryRef = React.useRef<{ openAddModal: () => void } | null>(null);

  // Load data when component mounts
  useEffect(() => {
    loadMonthlyPlans();
    loadTemplateWorkouts();
    loadDraftWorkouts();
    loadDeletedPlans();
    loadUserTeams();
  }, [user?.id]);

  // Ensure workouts are refreshed when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      // Force refresh workouts data on mount
      refetchWorkouts();
    }
  }, [user?.id, refetchWorkouts]);

  // Fetch assignments when workouts change
  useEffect(() => {
    if (!workoutIds.length) return;

    const fetchAssignments = async () => {
      setAssignmentsLoading(true);
      try {
        // Get all athlete-workout assignments for these workout IDs from unified system
        const { data, error } = await supabase
          .from('unified_workout_assignments')
          .select('*')
          .in('meta->>original_workout_id', workoutIds);

        if (error) {
          throw error;
        }

        // Convert unified assignments to old format for compatibility
        const compatibleAssignments = data.map(assignment => ({
          id: assignment.id,
          athlete_id: assignment.athlete_id,
          workout_id: assignment.meta?.original_workout_id || '',
          status: assignment.status
        }));
        setAssignments(compatibleAssignments);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    fetchAssignments();
  }, [JSON.stringify(workoutIds)]);

  // Load deleted items when user navigates to deleted tab
  useEffect(() => {
    if (activeItem === 'deleted' && user?.id) {
      console.log('🗑️ User navigated to deleted tab, loading deleted items...');
      loadDeletedPlans();
    }
  }, [activeItem, user?.id]);

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

  // Calculate statistics for sidebar
  const coachStats = useMemo(() => {
    const totalWorkouts = workouts?.filter(w => !w.is_draft).length || 0;
    const totalPlans = monthlyPlans.length;
    const totalTemplates = templateWorkouts.length;
    const totalDrafts = draftWorkouts.length;
    const totalDeleted = deletedWorkouts.length + deletedMonthlyPlans.length;
    const totalExercises = customExercises.length;
    const totalAthletes = athletes?.length || 0;

    return {
      workouts: totalWorkouts,
      plans: totalPlans,
      templates: totalTemplates,
      drafts: totalDrafts,
      deleted: totalDeleted,
      exercises: totalExercises,
      athletes: totalAthletes
    };
  }, [workouts, monthlyPlans, templateWorkouts, draftWorkouts, deletedWorkouts, deletedMonthlyPlans, customExercises, athletes]);

  // Helper functions - MUST be defined before filteredData useMemo to avoid hoisting issues
  const getWorkoutProgress = React.useCallback((workout: Workout) => {
    const stats = completionStats?.find(s => s.workoutId === workout.id);
    if (!stats) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    return {
      completed: stats.completedCount || 0,
      total: stats.exerciseCount || getWorkoutExerciseCount(workout),
      percentage: stats.percentage || 0
    };
  }, [completionStats]);

  const getAthleteNames = React.useCallback((workout: Workout) => {
    const workoutAssignments = assignments?.filter(a => a.workout_id === workout.id) || [];
    if (workoutAssignments.length === 0) {
      return 'Not assigned';
    }
    
    const athleteNames = workoutAssignments
      .map(assignment => {
        const athlete = athletes?.find(a => a.id === assignment.athlete_id);
        return athlete ? `${athlete.first_name} ${athlete.last_name}`.trim() : 'Unknown Athlete';
      })
      .filter(Boolean)
      .slice(0, 3);
    
    const remaining = workoutAssignments.length - athleteNames.length;
    const nameString = athleteNames.join(', ');
    
    return remaining > 0 ? `${nameString} +${remaining} more` : nameString;
  }, [assignments, athletes]);

  // Helper function to check if a workout is assigned to a specific athlete ID
  const isWorkoutAssignedToAthlete = React.useCallback((workout: Workout, athleteId: string) => {
    if (athleteId === 'all') return true;
    const workoutAssignments = assignments?.filter(a => a.workout_id === workout.id) || [];
    return workoutAssignments.some(assignment => assignment.athlete_id === athleteId);
  }, [assignments]);

  // Helper function to filter monthly plans by athlete
  const getMonthlyPlansForAthlete = React.useCallback((selectedAthleteId: string) => {
    if (selectedAthleteId === 'all') {
      return monthlyPlans;
    }
    
    // Filter monthly plans that are assigned to the selected athlete
    const plansForAthlete = monthlyPlans.filter(plan => {
      const planAssignments = monthlyPlanAssignments.filter(
        assignment => assignment.training_plan_id === plan.id || assignment.monthly_plan_id === plan.id
      );
      return planAssignments.some(assignment => assignment.athlete_id === selectedAthleteId);
    });
    
    return plansForAthlete;
  }, [monthlyPlans, monthlyPlanAssignments]);

  // Filter data based on active sidebar item
  const filteredData = useMemo(() => {
    switch (activeItem) {
      case 'all-workouts':
        // Apply workout filter within all-workouts
        let filteredWorkouts = workouts?.filter(w => !w.is_draft) || [];
        
        // Apply workout type filter - FIXED: Use template_type instead of type
        if (workoutFilter === 'single') {
          filteredWorkouts = filteredWorkouts.filter(w => w.template_type === 'single' || !w.template_type);
          // Apply athlete filter
          if (selectedAthlete !== 'all') {
            filteredWorkouts = filteredWorkouts.filter(w => isWorkoutAssignedToAthlete(w, selectedAthlete));
          }
          return { type: 'workouts', data: filteredWorkouts };
        } else if (workoutFilter === 'weekly') {
          filteredWorkouts = filteredWorkouts.filter(w => w.template_type === 'weekly');
        // Apply athlete filter
        if (selectedAthlete !== 'all') {
            filteredWorkouts = filteredWorkouts.filter(w => isWorkoutAssignedToAthlete(w, selectedAthlete));
          }
          return { type: 'workouts', data: filteredWorkouts };
        } else if (workoutFilter === 'monthly') {
          // Apply athlete filter to monthly plans
          const filteredMonthlyPlans = getMonthlyPlansForAthlete(selectedAthlete);
          return { type: 'plans', data: filteredMonthlyPlans };
        } else if (workoutFilter === 'all') {
          // When 'all' is selected, show both workouts and monthly plans
          // Apply athlete filter to workouts
          if (selectedAthlete !== 'all') {
            filteredWorkouts = filteredWorkouts.filter(w => isWorkoutAssignedToAthlete(w, selectedAthlete));
        }
          // Apply athlete filter to monthly plans
          const filteredMonthlyPlans = getMonthlyPlansForAthlete(selectedAthlete);
          return { type: 'mixed', data: [...filteredWorkouts, ...filteredMonthlyPlans] };
        }
        
        // Fallback (shouldn't reach here)
        return { type: 'workouts', data: filteredWorkouts };
      case 'strength':
        return { type: 'workouts', data: workouts?.filter(w => !w.is_draft && (w.type?.toLowerCase().includes('strength') || w.type?.toLowerCase().includes('weight'))) || [] };
      case 'cardio':
        return { type: 'workouts', data: workouts?.filter(w => !w.is_draft && (w.type?.toLowerCase().includes('cardio') || w.type?.toLowerCase().includes('running') || w.type?.toLowerCase().includes('endurance'))) || [] };
      case 'speed':
        return { type: 'workouts', data: workouts?.filter(w => !w.is_draft && (w.type?.toLowerCase().includes('speed') || w.type?.toLowerCase().includes('sprint'))) || [] };
      case 'templates':
        // Apply template filter - FIXED: Use template_type instead of type
        let filteredTemplates = templateWorkouts;
        if (templateFilter === 'single') {
          filteredTemplates = templateWorkouts.filter(t => t.template_type === 'single' || !t.template_type);
        } else if (templateFilter === 'weekly') {
          filteredTemplates = templateWorkouts.filter(t => t.template_type === 'weekly');
        } else if (templateFilter === 'monthly') {
          filteredTemplates = templateWorkouts.filter(t => t.type === 'monthly');
        }
        return { type: 'templates', data: filteredTemplates };
      case 'drafts':
        // Apply draft filter - FIXED: Use template_type instead of type
        let filteredDrafts = draftWorkouts;
        if (draftFilter === 'single') {
          filteredDrafts = draftWorkouts.filter(d => d.template_type === 'single' || !d.template_type);
        } else if (draftFilter === 'weekly') {
          filteredDrafts = draftWorkouts.filter(d => d.template_type === 'weekly');
        } else if (draftFilter === 'monthly') {
          filteredDrafts = draftWorkouts.filter(d => d.type === 'monthly');
        }
        return { type: 'drafts', data: filteredDrafts };
      case 'deleted':
        return { type: 'deleted', data: [...deletedWorkouts, ...deletedMonthlyPlans] };
      case 'exercise-library':
        return { type: 'exercises', data: customExercises };
      case 'by-athlete':
        // Filter both workouts and monthly plans by athlete
        const filteredAthleteWorkouts = workouts?.filter(w => !w.is_draft && (selectedAthlete === 'all' || isWorkoutAssignedToAthlete(w, selectedAthlete))) || [];
        const filteredAthleteMonthlyPlans = getMonthlyPlansForAthlete(selectedAthlete);
        return { type: 'mixed', data: [...filteredAthleteWorkouts, ...filteredAthleteMonthlyPlans] };
      default:
        return { type: 'workouts', data: workouts?.filter(w => !w.is_draft) || [] };
    }
  }, [activeItem, workouts, monthlyPlans, templateWorkouts, draftWorkouts, deletedWorkouts, deletedMonthlyPlans, customExercises, selectedAthlete, workoutFilter, templateFilter, draftFilter, getAthleteNames, getMonthlyPlansForAthlete, isWorkoutAssignedToAthlete]);

  // Sidebar configuration for coaches
  const coachSections: WorkoutsSection[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      items: [
        {
          id: 'all-workouts',
          label: 'All Workouts',
          icon: FaListUl,
          description: 'View all created workouts',
          badge: coachStats.workouts + coachStats.plans
        }
      ]
    },
    {
      id: 'by-type',
      title: 'By Type',
      items: [
        {
          id: 'strength',
          label: 'Strength',
          icon: FaDumbbell,
          description: 'Weight and resistance training',
          badge: workouts?.filter(w => !w.is_draft && (w.type?.toLowerCase().includes('strength') || w.type?.toLowerCase().includes('weight'))).length || 0
        },
        {
          id: 'cardio',
          label: 'Cardio',
          icon: FaHeartbeat,
          description: 'Endurance and running workouts',
          badge: workouts?.filter(w => !w.is_draft && (w.type?.toLowerCase().includes('cardio') || w.type?.toLowerCase().includes('running') || w.type?.toLowerCase().includes('endurance'))).length || 0
        },
        {
          id: 'speed',
          label: 'Speed',
          icon: FaBolt,
          description: 'Sprint and speed training',
          badge: workouts?.filter(w => !w.is_draft && (w.type?.toLowerCase().includes('speed') || w.type?.toLowerCase().includes('sprint'))).length || 0
        }
      ]
    },
    {
      id: 'management',
      title: 'Management',
      items: [
        {
          id: 'templates',
          label: 'Templates',
          icon: FaLayerGroup,
          description: 'Reusable workout templates',
          badge: coachStats.templates
        },
        {
          id: 'drafts',
          label: 'Drafts',
          icon: FaCog,
          description: 'Unfinished workouts',
          badge: coachStats.drafts
        },
        {
          id: 'deleted',
          label: 'Deleted Items',
          icon: FaTrash,
          description: 'Deleted workouts and plans',
          badge: coachStats.deleted
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
          badge: coachStats.exercises
        }
      ]
    }
  ];

  // Load monthly plans
  const loadMonthlyPlans = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const plans = await api.monthlyPlans.getByCoach(user.id);
      setMonthlyPlans(plans);
      
      // Load assignment stats for each plan
      loadAssignmentStats(plans);
    } catch (error) {
      console.error('Error loading monthly plans:', error);
      toast({
        title: 'Error loading training plans',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Load template workouts
  const loadTemplateWorkouts = async () => {
    if (!user?.id) return;

    try {
      setTemplateLoading(true);
      const templates = await api.workouts.getTemplates(user.id);
      // Filter for templates that are specifically for monthly plans (weekly template type)
      const monthlyPlanTemplates = templates.filter(t => t.template_type === 'weekly' || t.is_template);
      setTemplateWorkouts(monthlyPlanTemplates);
    } catch (error) {
      console.error('Error loading template workouts:', error);
      toast({
        title: 'Error loading template workouts',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setTemplateLoading(false);
    }
  };

  // Load draft workouts
  const loadDraftWorkouts = async () => {
    if (!user?.id) return;

    try {
      setDraftsLoading(true);
      const drafts = await api.workouts.getDrafts(user.id);
      setDraftWorkouts(drafts);
    } catch (error) {
      console.error('Error loading draft workouts:', error);
      toast({
        title: 'Error loading draft workouts',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setDraftsLoading(false);
    }
  };

  // Load deleted plans (placeholder - this would require a soft delete system)
  const loadDeletedPlans = async () => {
    if (!user?.id) return;

    try {
      console.log('🗑️ Loading deleted items for coach:', user.id);
      setDeletedLoading(true);
      
      // Load deleted workouts and monthly plans in parallel
      console.log('🗑️ Fetching deleted workouts and plans...');
      const [deletedWorkoutsData, deletedPlansData] = await Promise.all([
        api.workouts.getDeleted(user.id),
        api.monthlyPlans.getDeleted(user.id)
      ]);
      
      console.log('🗑️ Deleted workouts received:', deletedWorkoutsData);
      console.log('🗑️ Deleted plans received:', deletedPlansData);
      
      setDeletedWorkouts(deletedWorkoutsData);
      setDeletedMonthlyPlans(deletedPlansData);
      
      console.log('🗑️ State updated - deleted workouts:', deletedWorkoutsData.length, 'deleted plans:', deletedPlansData.length);
    } catch (error) {
      console.error('Error loading deleted items:', error);
      toast({
        title: 'Error loading deleted items',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setDeletedLoading(false);
    }
  };

  // Load assignment statistics for plans
  const loadAssignmentStats = async (plans: TrainingPlan[]) => {
    if (!plans.length) return;

    try {
      setStatsLoading(true);
      
      // Store all assignments for filtering
      const allAssignments: any[] = [];
      
      // Load assignment stats for each plan
      const plansWithStats = await Promise.all(
        plans.map(async (plan) => {
          try {
            const assignments = await api.monthlyPlanAssignments.getByPlan(plan.id);
            
            // Add assignments to our collection for filtering
            allAssignments.push(...assignments);
            
            // Calculate stats
            const totalAssigned = assignments.length;
            const completed = assignments.filter(a => a.status === 'completed').length;
            const inProgress = assignments.filter(a => a.status === 'in_progress').length;
            
            return {
              ...plan,
              totalAssignments: totalAssigned,
              activeAssignments: inProgress + completed,
              completedAssignments: completed
            };
          } catch (error) {
            console.error(`Error loading stats for plan ${plan.id}:`, error);
            // Return plan with default stats in case of error
            return {
              ...plan,
              totalAssignments: 0,
              activeAssignments: 0,
              completedAssignments: 0
            };
          }
        })
      );
      
      setMonthlyPlans(plansWithStats);
      setMonthlyPlanAssignments(allAssignments);
    } catch (error) {
      console.error('Error loading assignment stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };



  // Handle clearing all filters
  const handleClearFilters = () => {
    setWorkoutFilter('all');
    setSelectedAthlete('all');
  };

  // Handle refresh for monthly plans
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMonthlyPlans();
      toast({
        title: 'Training plans refreshed',
        description: 'Latest data has been loaded.',
        status: 'success',
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error refreshing monthly plans:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle refresh for workouts
  const handleWorkoutsRefresh = async () => {
    try {
      await refetchWorkoutStats();
      await refetchWorkouts();
      
      if (workoutIds.length > 0) {
        setAssignmentsLoading(true);
        
        const { data, error } = await supabase
          .from('unified_workout_assignments')
          .select('*')
          .in('meta->>original_workout_id', workoutIds);
          
        if (error) {
          console.error('Error refreshing assignments:', error);
        } else if (data) {
          // Convert unified assignments to old format for compatibility
          const compatibleAssignments = data.map(assignment => ({
            id: assignment.id,
            athlete_id: assignment.athlete_id,
            workout_id: assignment.meta?.original_workout_id || '',
            status: assignment.status
          }));
          setAssignments(compatibleAssignments);
        }
        
        setAssignmentsLoading(false);
      }
      
      toast({
        title: 'Workouts refreshed',
        description: 'Latest workout progress data has been loaded.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error refreshing workout data:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Could not refresh workout progress. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTemplateRefresh = async () => {
    setTemplateRefreshing(true);
    try {
      await loadTemplateWorkouts();
      toast({
        title: 'Templates refreshed',
        description: 'Latest template data has been loaded.',
        status: 'success',
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error refreshing templates:', error);
    } finally {
      setTemplateRefreshing(false);
    }
  };

  const handleDraftsRefresh = async () => {
    setDraftsRefreshing(true);
    try {
      await loadDraftWorkouts();
      toast({
        title: 'Drafts refreshed',
        description: 'Latest draft data has been loaded.',
        status: 'success',
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error refreshing drafts:', error);
    } finally {
      setDraftsRefreshing(false);
    }
  };

  const handleDeletedRefresh = async () => {
    setDeletedRefreshing(true);
    try {
      await loadDeletedPlans();
      toast({
        title: 'Deleted items refreshed',
        description: 'Latest deleted data has been loaded.',
        status: 'success',
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error refreshing deleted items:', error);
    } finally {
      setDeletedRefreshing(false);
    }
  };

  // Handle restore deleted item
  const handleRestoreItem = async (id: string, type: 'workout' | 'monthlyPlan') => {
    try {
      if (type === 'workout') {
        await api.workouts.restore(id);
        toast({
          title: 'Workout restored',
          description: 'The workout has been restored successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        await api.monthlyPlans.restore(id);
        toast({
          title: 'Training plan restored',
          description: 'The training plan has been restored successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      }

      // Refresh deleted items and main data
      await Promise.all([
        loadDeletedPlans(),
        type === 'workout' ? Promise.all([refetchWorkouts(), loadTemplateWorkouts()]) : loadMonthlyPlans()
      ]);
    } catch (error) {
      console.error('Error restoring item:', error);
      toast({
        title: 'Restore failed',
        description: 'Failed to restore the item. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = async (id: string, type: 'workout' | 'monthlyPlan') => {
    try {
      if (type === 'workout') {
        await api.workouts.permanentDelete(id);
        toast({
          title: 'Workout permanently deleted',
          description: 'The workout has been permanently removed.',
          status: 'info',
          duration: 3000,
          isClosable: true
        });
      } else {
        await api.monthlyPlans.permanentDelete(id);
        toast({
          title: 'Training plan permanently deleted',
          description: 'The training plan has been permanently removed.',
          status: 'info',
          duration: 3000,
          isClosable: true
        });
      }

      // Refresh deleted items
      await loadDeletedPlans();
    } catch (error) {
      console.error('Error permanently deleting item:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to permanently delete the item. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const handleCreationSuccess = () => {
    onCreatorClose();
    loadMonthlyPlans();
  };

  const handleAssignPlan = (plan: TrainingPlan) => {
    setSelectedPlanForAssignment(plan);
    onAssignmentOpen();
  };

  const handleAssignmentSuccess = () => {
    onAssignmentClose();
    loadMonthlyPlans(); // Reload to get updated assignment stats
  };

  const handleViewPlan = (plan: TrainingPlan) => {
    setSelectedPlanForView(plan);
    setShowDetailView(true);
  };

  const handleEditPlan = (plan: TrainingPlan) => {
    // Navigate to new workout creator for editing monthly plans
    navigate(`/coach/workout-creator-new?edit=${plan.id}`);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setSelectedPlanForEdit(null);
  };

  const handleEditSuccess = () => {
    handleEditModalClose();
    loadMonthlyPlans(); // Refresh the plans list
  };

  const handleDeletePlan = async (plan: TrainingPlan) => {
    try {
      await api.monthlyPlans.softDelete(plan.id);
      
      toast({
        title: 'Training plan moved to recycle bin',
        description: `"${plan.name}" has been moved to the recycle bin.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      // Refresh the plans list and deleted items
      await Promise.all([
        loadMonthlyPlans(),
        loadDeletedPlans()
      ]);
    } catch (error) {
      console.error('Error deleting training plan:', error);
      toast({
        title: 'Error deleting plan',
        description: 'Failed to delete the training plan. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  // Handle deletion with monthly plan usage check
  const handleDeleteWorkout = async (workout: Workout) => {
    try {
      // First check if the workout is used in any monthly plans
      const usage = await checkMonthlyPlanUsage(workout.id);
      
      if (usage.isUsed) {
        // Show warning modal
        setWorkoutToDelete({ id: workout.id, name: workout.name });
        setMonthlyPlansUsing(usage.monthlyPlans);
        onWarningOpen();
      } else {
        // Safe to delete immediately - track if it's a template to refresh correctly
        const isTemplate = workout.is_template;
        
        await deleteWorkoutAsync(workout.id);
        
        // After successful deletion, refresh appropriate lists
        if (isTemplate) {
          await loadTemplateWorkouts();
        } else {
          await refetchWorkouts();
        }
        
        // Also refresh deleted items list
        await loadDeletedPlans();
      }
    } catch (error) {
      console.error('Error checking workout usage:', error);
      toast({
        title: 'Error',
        description: 'Failed to check workout usage. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle removing workout from monthly plans
  const handleRemoveFromPlans = async () => {
    if (!workoutToDelete) return;
    
    try {
      const planIds = monthlyPlansUsing.map(plan => plan.id);
      await removeFromMonthlyPlans({ workoutId: workoutToDelete.id, planIds });
      
      // Clear monthly plans list to enable deletion
      setMonthlyPlansUsing([]);
      
      // Also refresh the monthly plans to reflect the changes
      await loadMonthlyPlans();
      
      toast({
        title: 'Success',
        description: `Workout removed from ${planIds.length} monthly plan(s). You can now delete it.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error removing from monthly plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove workout from monthly plans. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle final deletion after removal from monthly plans
  const handleProceedWithDeletion = async () => {
    if (!workoutToDelete) return;
    
    try {
      // Check if it's a template before deletion (from the current template list)
      const isTemplate = templateWorkouts.some(t => t.id === workoutToDelete.id);
      
      await deleteWorkoutAsync(workoutToDelete.id);
      
      // After successful deletion, refresh appropriate lists
      if (isTemplate) {
        await loadTemplateWorkouts();
      } else {
        await refetchWorkouts();
      }
      
      // Also refresh deleted items list
      await loadDeletedPlans();
      
      // Close modal and reset state
      onWarningClose();
      setWorkoutToDelete(null);
      setMonthlyPlansUsing([]);
    } catch (error) {
      console.error('Error during final deletion:', error);
      // Close modal even on error
      onWarningClose();
      setWorkoutToDelete(null);
      setMonthlyPlansUsing([]);
    }
  };

  // Handle modal close
  const handleWarningClose = () => {
    onWarningClose();
    setWorkoutToDelete(null);
    setMonthlyPlansUsing([]);
  };

  const handleAssignWorkout = (workout: Workout) => {
    setWorkoutToAssign(workout);
    onWorkoutAssignmentOpen();
  };

  const handleWorkoutAssignmentSuccess = () => {
    onWorkoutAssignmentClose();
    refetchWorkouts();
    refetchWorkoutStats();
  };

  const handleViewWorkout = (workout: Workout) => {
    setSelectedWorkoutForView(workout);
    setShowWorkoutDetailView(true);
  };

  const handleEditWorkoutFromDetail = (workout: Workout) => {
    setShowWorkoutDetailView(false);
    navigate(`/coach/workout-creator-new?edit=${workout.id}`);
  };

  const handleConvertTemplate = (template: Workout) => {
    setTemplateToConvert(template);
    onConvertModalOpen();
  };

  const handleConvertSuccess = () => {
    onConvertModalClose();
    setTemplateToConvert(null);
    toast({
      title: 'Success!',
      description: 'Template converted to workout successfully.',
      status: 'success',
      duration: 3000,
    });
    // Refresh workouts to show the new one
    refetchWorkouts();
  };

  // Render functions for each tab content
  const renderWorkouts = () => {
    if (workoutsLoading || athletesLoading) {
      if (viewMode === 'grid') {
        return (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {[...Array(6)].map((_, index) => (
              <WorkoutSkeletonCard 
                key={index} 
                cardBg={skeletonCardBg}
                cardBorder={skeletonCardBorder}
                headerBg={skeletonHeaderBg}
                avatarBg={skeletonAvatarBg}
                barBg={skeletonBarBg}
              />
            ))}
          </SimpleGrid>
        );
      } else {
        return (
          <VStack spacing={3} align="stretch">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} height="80px" borderRadius="lg" />
            ))}
          </VStack>
        );
      }
    }

    // Use the filteredData from the useMemo hook consistently
    let filteredWorkouts: Workout[] = [];
    
    if (filteredData.type === 'workouts') {
      filteredWorkouts = filteredData.data as Workout[];
    } else if (filteredData.type === 'mixed') {
      // For mixed data, filter out only the workouts (not monthly plans)
      filteredWorkouts = (filteredData.data as any[]).filter(item => !('weeks' in item)) as Workout[];
    } else {
      // For other types (plans, exercises, etc.), no workouts to show
      filteredWorkouts = [];
    }

    if (filteredWorkouts.length === 0) {
      let filterMessage = 'No Workouts Found';
      let filterSubMessage = 'Try adjusting your filters.';
      
      if (activeItem === 'strength') {
        filterMessage = 'No Strength Workouts Found';
        filterSubMessage = 'Create strength workouts to see them here.';
      } else if (activeItem === 'cardio') {
        filterMessage = 'No Cardio Workouts Found';
        filterSubMessage = 'Create cardio/running workouts to see them here.';
      } else if (activeItem === 'speed') {
        filterMessage = 'No Speed Workouts Found';
        filterSubMessage = 'Create speed/sprint workouts to see them here.';
      } else if (selectedAthlete !== 'all') {
        const selectedAthleteData = athletes?.find(a => a.id === selectedAthlete);
        const athleteName = selectedAthleteData ? `${selectedAthleteData.first_name} ${selectedAthleteData.last_name}` : 'selected athlete';
        filterMessage = `No Workouts Assigned to ${athleteName}`;
        filterSubMessage = 'Create and assign workouts to this athlete to get started.';
      } else if (workoutFilter !== 'all') {
        filterMessage = `No ${workoutFilter === 'single' ? 'Single' : 'Weekly'} Workouts Created`;
        filterSubMessage = `Create your first ${workoutFilter} workout to get started.`;
      } else {
        filterMessage = 'No Workouts Created';
        filterSubMessage = 'Create your first workout to get started.';
      }
        
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium">{filterMessage}</Text>
            <Text fontSize="sm">{filterSubMessage}</Text>
          </VStack>
        </Alert>
      );
    }

    // Render based on view mode
    if (viewMode === 'grid') {
      return (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredWorkouts.map((workout) => {
            const progress = workoutStatsLoading 
              ? { completed: 0, total: 0, percentage: 0 }
              : getWorkoutProgress(workout);
            const athleteNames = assignmentsLoading
              ? 'Loading assignments...'
              : getAthleteNames(workout);

            return (
              <CoachWorkoutCard
                key={workout.id}
                workout={workout}
                isCoach={true}
                assignedTo={athleteNames}
                currentUserId={user?.id}
                onEdit={() => navigate(`/coach/workout-creator-new?edit=${workout.id}`)}
                onDelete={() => handleDeleteWorkout(workout)}
                onAssign={() => handleAssignWorkout(workout)}
                onViewDetails={() => handleViewWorkout(workout)}
              />
            );
          })}
        </SimpleGrid>
      );
    } else {
      return (
        <VStack spacing={3} align="stretch">
          {filteredWorkouts.map((workout) => {
            const athleteNames = assignmentsLoading
              ? 'Loading assignments...'
              : getAthleteNames(workout);

            return (
              <CoachWorkoutListItem
                key={workout.id}
                workout={workout}
                isCoach={true}
                assignedTo={athleteNames}
                currentUserId={user?.id}
                onEdit={() => navigate(`/coach/workout-creator-new?edit=${workout.id}`)}
                onDelete={() => handleDeleteWorkout(workout)}
                onAssign={() => handleAssignWorkout(workout)}
                onViewDetails={() => handleViewWorkout(workout)}
              />
            );
          })}
        </VStack>
      );
    }
  };

  const renderTemplateWorkouts = () => {
    // Apply template filter
    const filteredTemplates = templateWorkouts.filter(template => {
      if (templateFilter === 'all') return true;
      if (templateFilter === 'single') return template.type !== 'weekly';
      if (templateFilter === 'weekly') return template.type === 'weekly';
      if (templateFilter === 'monthly') return template.type === 'monthly';
      return true;
    });

    return (
      <VStack spacing={6} align="stretch">
        {/* Stats and Filter Controls */}
        <VStack spacing={4} align="stretch">
          {/* Stats Badges Row */}
          <Flex justify="flex-start" align="center" wrap="wrap" gap={2}>
            <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
              {filteredTemplates.length} Templates
            </Badge>
            <Badge colorScheme="gray" fontSize="sm" px={3} py={1}>
              {templateWorkouts.length} Total
            </Badge>
            {templateFilter !== 'all' && (
              <Button
                size="xs"
                variant="ghost"
                colorScheme="gray"
                onClick={() => setTemplateFilter('all')}
              >
                Clear Filter
              </Button>
            )}
          </Flex>
          
          {/* Filter Controls Row */}
          <Flex justify="flex-start" align="center" wrap="wrap" gap={3}>
            {/* Template Type Filter Buttons */}
            <HStack spacing={2}>
              <Button
                size="sm"
                variant={templateFilter === 'all' ? 'solid' : 'outline'}
                colorScheme={templateFilter === 'all' ? 'blue' : 'gray'}
                onClick={() => setTemplateFilter('all')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={templateFilter === 'single' ? 'solid' : 'outline'}
                colorScheme={templateFilter === 'single' ? 'blue' : 'gray'}
                onClick={() => setTemplateFilter('single')}
              >
                Single
              </Button>
              <Button
                size="sm"
                variant={templateFilter === 'weekly' ? 'solid' : 'outline'}
                colorScheme={templateFilter === 'weekly' ? 'blue' : 'gray'}
                onClick={() => setTemplateFilter('weekly')}
              >
                Weekly
              </Button>
              <Button
                size="sm"
                variant={templateFilter === 'monthly' ? 'solid' : 'outline'}
                colorScheme={templateFilter === 'monthly' ? 'green' : 'gray'}
                onClick={() => setTemplateFilter('monthly')}
              >
                Monthly
              </Button>
            </HStack>
            
            <Button
              leftIcon={<FaRedo />}
              variant="outline"
              size="sm"
              onClick={handleTemplateRefresh}
              isLoading={templateRefreshing}
            >
              Refresh
            </Button>
            
            <ViewToggle 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
              toggleBorderColor={toggleBorderColor} 
            />
          </Flex>
        </VStack>

        {        /* Templates Grid/List */}
        {templateLoading ? (
          viewMode === 'grid' ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} height="200px" borderRadius="lg" />
              ))}
            </SimpleGrid>
          ) : (
            <VStack spacing={3} align="stretch">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} height="80px" borderRadius="lg" />
              ))}
            </VStack>
          )
        ) : filteredTemplates.length === 0 ? (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={0}>
              <Text fontWeight="medium">
                {templateFilter === 'all' ? 'No Template Workouts' : `No ${templateFilter === 'monthly' ? 'Monthly' : templateFilter === 'weekly' ? 'Weekly' : 'Single'} Templates`}
              </Text>
              <Text fontSize="sm">
                {templateFilter === 'all' 
                  ? 'Create workouts and save them as templates to get started.'
                  : `No ${templateFilter} templates found. Try a different filter or create new templates.`
                }
              </Text>
            </VStack>
          </Alert>
        ) : viewMode === 'grid' ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredTemplates.map((template) => (
              <CoachWorkoutCard
                key={template.id}
                workout={template}
                isCoach={true}
                assignedTo="Template"
                currentUserId={user?.id}
                onEdit={() => navigate(`/coach/workout-creator-new?edit=${template.id}`)}
                onDelete={() => handleDeleteWorkout(template)}
                onAssign={() => handleAssignWorkout(template)}
                onViewDetails={() => handleViewWorkout(template)}
              />
            ))}
          </SimpleGrid>
        ) : (
          <VStack spacing={3} align="stretch">
            {filteredTemplates.map((template) => (
              <CoachWorkoutListItem
                key={template.id}
                workout={template}
                isCoach={true}
                assignedTo="Template"
                currentUserId={user?.id}
                onEdit={() => navigate(`/coach/workout-creator-new?edit=${template.id}`)}
                onDelete={() => handleDeleteWorkout(template)}
                onAssign={() => handleAssignWorkout(template)}
                onViewDetails={() => handleViewWorkout(template)}
              />
            ))}
          </VStack>
        )}
      </VStack>
    );
  };

  const renderDraftWorkouts = () => {
    // Apply draft filter
    const filteredDrafts = draftWorkouts.filter(draft => {
      if (draftFilter === 'all') return true;
      if (draftFilter === 'single') return draft.type !== 'weekly';
      if (draftFilter === 'weekly') return draft.type === 'weekly';
      if (draftFilter === 'monthly') return draft.type === 'monthly';
      return true;
    });

    return (
      <VStack spacing={6} align="stretch">
        {/* Stats and Filter Controls */}
        <VStack spacing={4} align="stretch">
          {/* Stats Badges Row */}
          <Flex justify="flex-start" align="center" wrap="wrap" gap={2}>
            <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
              {filteredDrafts.length} Drafts
            </Badge>
            <Badge colorScheme="gray" fontSize="sm" px={3} py={1}>
              {draftWorkouts.length} Total
            </Badge>
            {draftFilter !== 'all' && (
              <Button
                size="xs"
                variant="ghost"
                colorScheme="gray"
                onClick={() => setDraftFilter('all')}
              >
                Clear Filter
              </Button>
            )}
          </Flex>
          
          {/* Filter Controls Row */}
          <Flex justify="flex-start" align="center" wrap="wrap" gap={3}>
            {/* Draft Type Filter Buttons */}
            <HStack spacing={2}>
              <Button
                size="sm"
                variant={draftFilter === 'all' ? 'solid' : 'outline'}
                colorScheme={draftFilter === 'all' ? 'blue' : 'gray'}
                onClick={() => setDraftFilter('all')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={draftFilter === 'single' ? 'solid' : 'outline'}
                colorScheme={draftFilter === 'single' ? 'blue' : 'gray'}
                onClick={() => setDraftFilter('single')}
              >
                Single
              </Button>
              <Button
                size="sm"
                variant={draftFilter === 'weekly' ? 'solid' : 'outline'}
                colorScheme={draftFilter === 'weekly' ? 'blue' : 'gray'}
                onClick={() => setDraftFilter('weekly')}
              >
                Weekly
              </Button>
              <Button
                size="sm"
                variant={draftFilter === 'monthly' ? 'solid' : 'outline'}
                colorScheme={draftFilter === 'monthly' ? 'green' : 'gray'}
                onClick={() => setDraftFilter('monthly')}
              >
                Monthly
              </Button>
            </HStack>
            
            <Button
              leftIcon={<FaRedo />}
              variant="outline"
              size="sm"
              onClick={handleDraftsRefresh}
              isLoading={draftsRefreshing}
            >
              Refresh
            </Button>
            
            <ViewToggle 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
              toggleBorderColor={toggleBorderColor} 
            />
          </Flex>
        </VStack>

        {        /* Drafts Grid/List */}
        {draftsLoading ? (
          viewMode === 'grid' ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} height="200px" borderRadius="lg" />
              ))}
            </SimpleGrid>
          ) : (
            <VStack spacing={3} align="stretch">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} height="80px" borderRadius="lg" />
              ))}
            </VStack>
          )
        ) : filteredDrafts.length === 0 ? (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={0}>
              <Text fontWeight="medium">
                {draftFilter === 'all' ? 'No Draft Workouts' : `No ${draftFilter === 'monthly' ? 'Monthly' : draftFilter === 'weekly' ? 'Weekly' : 'Single'} Drafts`}
              </Text>
              <Text fontSize="sm">
                {draftFilter === 'all' 
                  ? 'Draft workouts are automatically saved when you create workouts.'
                  : `No ${draftFilter} drafts found. Try a different filter or create new drafts.`
                }
              </Text>
            </VStack>
          </Alert>
        ) : viewMode === 'grid' ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredDrafts.map((draft) => (
              <CoachWorkoutCard
                key={draft.id}
                workout={draft}
                isCoach={true}
                assignedTo="Draft"
                currentUserId={user?.id}
                onEdit={() => navigate(`/coach/workout-creator-new?edit=${draft.id}`)}
                onDelete={() => handleDeleteWorkout(draft)}
                onAssign={() => handleAssignWorkout(draft)}
                onViewDetails={() => handleViewWorkout(draft)}
              />
            ))}
          </SimpleGrid>
        ) : (
          <VStack spacing={3} align="stretch">
            {filteredDrafts.map((draft) => (
              <CoachWorkoutListItem
                key={draft.id}
                workout={draft}
                isCoach={true}
                assignedTo="Draft"
                currentUserId={user?.id}
                onEdit={() => navigate(`/coach/workout-creator-new?edit=${draft.id}`)}
                onDelete={() => handleDeleteWorkout(draft)}
                onAssign={() => handleAssignWorkout(draft)}
                onViewDetails={() => handleViewWorkout(draft)}
              />
            ))}
          </VStack>
        )}
      </VStack>
    );
  };

  const renderDeletedPlans = () => {
    if (deletedLoading) {
      return (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height="200px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      );
    }

    const totalDeletedItems = deletedWorkouts.length + deletedMonthlyPlans.length;

    if (totalDeletedItems === 0) {
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium">No Deleted Items</Text>
            <Text fontSize="sm">Deleted workouts and training plans will appear here.</Text>
          </VStack>
        </Alert>
      );
    }

    // Combine and sort deleted items by deletion date
    const allDeletedItems = [
      ...deletedWorkouts.map(workout => ({ ...workout, itemType: 'workout' as const })),
      ...deletedMonthlyPlans.map(plan => ({ ...plan, itemType: 'monthlyPlan' as const }))
    ].sort((a, b) => {
      const aDate = (a as any).deleted_at;
      const bDate = (b as any).deleted_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    return (
      <VStack spacing={6} align="stretch">
        {/* Stats */}
        <HStack spacing={4} wrap="wrap">
          <Badge colorScheme="red" fontSize="sm" px={3} py={1}>
            {deletedWorkouts.length} Deleted Workouts
          </Badge>
          <Badge colorScheme="red" fontSize="sm" px={3} py={1}>
            {deletedMonthlyPlans.length} Deleted Plans
          </Badge>
          <Badge colorScheme="gray" fontSize="sm" px={3} py={1}>
            {totalDeletedItems} Total Items
          </Badge>
        </HStack>

        {/* Deleted items grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {allDeletedItems.map((item) => (
            <DeletedItemCard
              key={`${item.itemType}-${item.id}`}
              item={item}
              type={item.itemType}
              onRestore={(id) => handleRestoreItem(id, item.itemType)}
              onPermanentDelete={(id) => handlePermanentDelete(id, item.itemType)}
            />
          ))}
        </SimpleGrid>
      </VStack>
    );
  };

  // Handle loading workout data on component mount
  useEffect(() => {
    if (workoutIds.length > 0) {
      refetchWorkoutStats();
    }
  }, [refetchWorkoutStats]);

  // 🚨 DISABLED - Batch monthly plan usage check was causing excessive database load
  // Monthly plan usage is now checked only when deleting (just-in-time approach)
  // This prevents 100+ database requests on page load and improves performance
  // useEffect(() => {
  //   const fetchMonthlyPlanUsage = async () => {
  //     if (workoutIds.length === 0) {
  //       setMonthlyPlanUsageData({});
  //       return;
  //     }
  //     try {
  //       const usageData = await batchCheckMonthlyPlanUsage(workoutIds);
  //       setMonthlyPlanUsageData(usageData);
  //     } catch (error) {
  //       console.error('❌ [TrainingPlans] Error fetching monthly plan usage:', error);
  //     }
  //   };
  //   fetchMonthlyPlanUsage();
  // }, [workoutIds, batchCheckMonthlyPlanUsage]);

  // Exercise Library Functions
  const loadCustomExercises = async () => {
    if (!user?.id) return;
    
    setExercisesLoading(true);
    try {
      const exercises = await getExercisesWithTeamSharing(user.id);
      if (process.env.NODE_ENV === 'development') {
        const teamExercises = exercises.filter(ex => ex.sharing_info === 'Team');
        console.log('🔍 Coach loaded exercises:', exercises.length, 'team exercises:', teamExercises.length);
      }
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

  const handleAddExercise = async (exerciseData: Omit<Exercise, 'id'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    const transformedData = await createExerciseWithSharing(exerciseData, user.id);
    setCustomExercises(prev => [transformedData, ...prev]);
  };

  const handleUpdateExercise = async (id: string, exerciseData: Omit<Exercise, 'id'>) => {
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
      if (process.env.NODE_ENV === 'development' && teams.length > 0) {
        console.log('🔍 Coach loaded teams:', teams.map(t => t.name));
      }
    } catch (error) {
      console.error('Error loading user teams:', error);
    }
  };

  // Load custom exercises on component mount
  useEffect(() => {
    loadCustomExercises();
  }, [user?.id]);

  // Function to render content based on active sidebar item
  const renderContent = () => {
    const getSectionInfo = () => {
      switch (activeItem) {
        case 'strength':
          return { title: 'Strength Workouts', description: 'Weight and resistance training', icon: FaDumbbell };
        case 'cardio':
          return { title: 'Cardio Workouts', description: 'Endurance and running workouts', icon: FaHeartbeat };
        case 'speed':
          return { title: 'Speed Workouts', description: 'Sprint and speed training', icon: FaBolt };
        case 'templates':
          // Dynamic title based on template filter
          if (templateFilter === 'monthly') {
            return { title: 'Monthly Templates', description: 'Monthly workout templates', icon: FaLayerGroup };
          } else if (templateFilter === 'single') {
            return { title: 'Single Templates', description: 'Individual workout templates', icon: FaLayerGroup };
          } else if (templateFilter === 'weekly') {
            return { title: 'Weekly Templates', description: 'Weekly workout templates', icon: FaLayerGroup };
          } else {
            return { title: 'Workout Templates', description: 'Reusable workout templates', icon: FaLayerGroup };
          }
        case 'drafts':
          // Dynamic title based on draft filter
          if (draftFilter === 'monthly') {
            return { title: 'Monthly Drafts', description: 'Monthly workout drafts', icon: FaCog };
          } else if (draftFilter === 'single') {
            return { title: 'Single Drafts', description: 'Individual workout drafts', icon: FaCog };
          } else if (draftFilter === 'weekly') {
            return { title: 'Weekly Drafts', description: 'Weekly workout drafts', icon: FaCog };
          } else {
            return { title: 'Draft Workouts', description: 'Unfinished workouts saved as drafts', icon: FaCog };
          }
        case 'deleted':
          return { title: 'Deleted Items', description: 'Deleted workouts and training plans', icon: FaTrash };
        case 'exercise-library':
          return { title: 'Exercise Library', description: 'Manage your custom exercises', icon: FaBookOpen };
        case 'by-athlete':
          return { title: 'Workouts by Athlete', description: 'Filter workouts by specific athletes', icon: FaUserFriends };
        case 'all-workouts':
        default:
          // Dynamic title based on filter
          if (workoutFilter === 'monthly') {
            return { title: 'Monthly Plans', description: 'Training plan templates for your athletes', icon: FaCalendarAlt };
          } else if (workoutFilter === 'single') {
            return { title: 'Single Workouts', description: 'Individual workout sessions', icon: FaDumbbell };
          } else if (workoutFilter === 'weekly') {
            return { title: 'Weekly Plans', description: 'Training programs', icon: FaCalendarWeek };
          } else {
            return { title: 'All Workouts', description: 'All created workouts and training sessions', icon: FaListUl };
          }
      }
    };

    const sectionInfo = getSectionInfo();

    const renderMainContent = () => {
      switch (activeItem) {
        case 'strength':
        case 'cardio':
        case 'speed':
          return (
            <VStack spacing={6} align="stretch">
              {/* Stats and Actions */}
              <VStack spacing={4} align="stretch">
                {/* Stats Badges Row - Hidden on mobile */}
                <Flex justify="flex-start" align="center" wrap="wrap" gap={2} display={{ base: "none", lg: "flex" }}>
                  <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                    {filteredData.data.length} {activeItem.charAt(0).toUpperCase() + activeItem.slice(1)} Workouts
                  </Badge>
                  {athletes && (
                    <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                      {athletes.length} Athletes
                    </Badge>
                  )}
                </Flex>
                
                {/* View Toggle - Only show on mobile, desktop has refresh button */}
                <Flex justify={{ base: "flex-end", lg: "space-between" }} align="center" wrap="wrap" gap={3}>
                  <Button
                    leftIcon={<FaRedo />}
                    variant="outline"
                    size="sm"
                    onClick={handleWorkoutsRefresh}
                    isLoading={assignmentsLoading}
                    display={{ base: "none", lg: "flex" }}
                  >
                    Refresh
                  </Button>
                  <ViewToggle 
                    viewMode={viewMode} 
                    setViewMode={setViewMode} 
                    toggleBorderColor={toggleBorderColor}
                    onRefresh={handleWorkoutsRefresh}
                    isLoading={assignmentsLoading}
                  />
                </Flex>
              </VStack>

              {/* Workouts Grid */}
              {renderWorkouts()}
            </VStack>
          );
        case 'templates':
          return renderTemplateWorkouts();
        case 'drafts':
          return renderDraftWorkouts();
        case 'deleted':
          return renderDeletedPlans();
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
        case 'by-athlete':
          return (
            <VStack spacing={6} align="stretch">
              {/* Athlete Filter */}
              <Flex justify="space-between" align="center" gap={3}>
                <HStack spacing={2} align="center" flex="1">
                  <FaUserFriends style={{ color: iconColor }} />
                  <Select
                    value={selectedAthlete}
                    onChange={(e) => setSelectedAthlete(e.target.value)}
                    size="sm"
                    flex="1"
                    bg={selectBg}
                    borderColor={selectBorderColor}
                  >
                    <option value="all">All Athletes</option>
                    {athletes?.map((athlete) => (
                      <option key={athlete.id} value={athlete.id}>
                        {athlete.first_name} {athlete.last_name}
                      </option>
                    ))}
                  </Select>
                </HStack>
                
                {/* Desktop Refresh Button */}
                <Button
                  leftIcon={<FaRedo />}
                  variant="outline"
                  size="sm"
                  onClick={handleWorkoutsRefresh}
                  isLoading={assignmentsLoading}
                  display={{ base: "none", lg: "flex" }}
                >
                  Refresh
                </Button>
                
                <ViewToggle 
                  viewMode={viewMode} 
                  setViewMode={setViewMode} 
                  toggleBorderColor={toggleBorderColor}
                  onRefresh={handleWorkoutsRefresh}
                  isLoading={assignmentsLoading}
                />
              </Flex>
              {renderWorkouts()}
            </VStack>
          );
        default:
          return (
            <VStack spacing={6} align="stretch">
              {/* Stats and Actions */}
              <VStack spacing={4} align="stretch">
                {/* Stats Badges Row - Hidden on mobile */}
                <Flex justify="flex-start" align="center" wrap="wrap" gap={2} display={{ base: "none", lg: "flex" }}>
                  <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                    {workoutFilter === 'monthly' ? monthlyPlans.length : workouts?.filter(w => !w.is_draft).length || 0} {workoutFilter === 'monthly' ? 'Plans' : 'Workouts'} Created
                  </Badge>
                  {athletes && (
                    <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                      {athletes.length} Athletes
                    </Badge>
                  )}
                  {selectedAthlete !== 'all' && (
                    <Badge colorScheme="purple" fontSize="sm" px={3} py={1} maxW="300px" isTruncated>
                      Filtered by: {athletes?.find(a => a.id === selectedAthlete)?.first_name} {athletes?.find(a => a.id === selectedAthlete)?.last_name}
                    </Badge>
                  )}
                  {(workoutFilter !== 'all' || selectedAthlete !== 'all') && (
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="gray"
                      onClick={handleClearFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                </Flex>
                
                {/* Filter Controls Row */}
                <VStack spacing={3} align="stretch">
                  {/* Workout Type Filter Buttons - Full width on mobile */}
                  <HStack spacing={2} w="100%">
                    <Button
                      size="sm"
                      variant={workoutFilter === 'all' ? 'solid' : 'outline'}
                      colorScheme={workoutFilter === 'all' ? 'blue' : 'gray'}
                      onClick={() => setWorkoutFilter('all')}
                      flex="1"
                    >
                      All
                    </Button>
                    <Button
                      size="sm"
                      variant={workoutFilter === 'single' ? 'solid' : 'outline'}
                      colorScheme={workoutFilter === 'single' ? 'blue' : 'gray'}
                      onClick={() => setWorkoutFilter('single')}
                      flex="1"
                    >
                      Single
                    </Button>
                    <Button
                      size="sm"
                      variant={workoutFilter === 'weekly' ? 'solid' : 'outline'}
                      colorScheme={workoutFilter === 'weekly' ? 'blue' : 'gray'}
                      onClick={() => setWorkoutFilter('weekly')}
                      flex="1"
                    >
                      Weekly
                    </Button>
                    <Button
                      size="sm"
                      variant={workoutFilter === 'monthly' ? 'solid' : 'outline'}
                      colorScheme={workoutFilter === 'monthly' ? 'green' : 'gray'}
                      onClick={() => setWorkoutFilter('monthly')}
                      flex="1"
                    >
                      Monthly
                    </Button>
                  </HStack>

                  {/* Bottom Row - Athlete Filter and View Toggle */}
                  <Flex justify="space-between" align="center" gap={3}>
                    {/* Athlete Filter Dropdown - Expanded */}
                    <HStack spacing={2} align="center" flex="1">
                      <FaUserFriends style={{ color: iconColor }} />
                      <Select
                        value={selectedAthlete}
                        onChange={(e) => setSelectedAthlete(e.target.value)}
                        size="sm"
                        flex="1"
                        bg={selectBg}
                        borderColor={selectBorderColor}
                      >
                        <option value="all">All Athletes</option>
                        {athletes?.map((athlete) => (
                          <option key={athlete.id} value={athlete.id}>
                            {athlete.first_name} {athlete.last_name}
                          </option>
                        ))}
                      </Select>
                    </HStack>
                    
                    {/* Desktop Refresh Button */}
                    <Button
                      leftIcon={<FaRedo />}
                      variant="outline"
                      size="sm"
                      onClick={workoutFilter === 'monthly' ? handleRefresh : handleWorkoutsRefresh}
                      isLoading={workoutFilter === 'monthly' ? refreshing : assignmentsLoading}
                      display={{ base: "none", lg: "flex" }}
                    >
                      Refresh
                    </Button>
                    
                    {/* View Toggle with Refresh Icon */}
                    <ViewToggle 
                      viewMode={viewMode} 
                      setViewMode={setViewMode} 
                      toggleBorderColor={toggleBorderColor}
                      onRefresh={workoutFilter === 'monthly' ? handleRefresh : handleWorkoutsRefresh}
                      isLoading={workoutFilter === 'monthly' ? refreshing : assignmentsLoading}
                    />
                  </Flex>
                </VStack>
              </VStack>

              {/* Content Grid - Dynamic based on filter */}
              {workoutFilter === 'monthly' ? (
                // Monthly Plans - Grid or List view
                loading ? (
                  viewMode === 'grid' ? (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} height="300px" borderRadius="lg" />
                      ))}
                    </SimpleGrid>
                  ) : (
                    <VStack spacing={3} align="stretch">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} height="80px" borderRadius="lg" />
                      ))}
                    </VStack>
                  )
                ) : monthlyPlans.length === 0 ? (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">No Training Plans Created</Text>
                      <Text fontSize="sm">Create your first monthly training plan to get started.</Text>
                    </VStack>
                  </Alert>
                ) : viewMode === 'grid' ? (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {monthlyPlans.map((plan) => (
                      <CoachWorkoutCard
                        key={plan.id}
                        monthlyPlan={plan}
                        isCoach={true}
                        onViewDetails={() => handleViewPlan(plan)}
                        onEdit={() => handleEditPlan(plan)}
                        onAssign={() => handleAssignPlan(plan)}
                        onDelete={() => handleDeletePlan(plan)}
                        completionStats={{
                          totalAssigned: plan.totalAssignments,
                          completed: plan.completedAssignments,
                          inProgress: plan.activeAssignments - plan.completedAssignments,
                          percentage: plan.totalAssignments > 0 ? (plan.completedAssignments / plan.totalAssignments) * 100 : 0
                        }}
                        statsLoading={statsLoading}
                        currentUserId={user?.id}
                      />
                    ))}
                  </SimpleGrid>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {monthlyPlans.map((plan) => (
                      <CoachWorkoutListItem
                        key={plan.id}
                        monthlyPlan={plan}
                        isCoach={true}
                        onViewDetails={() => handleViewPlan(plan)}
                        onEdit={() => handleEditPlan(plan)}
                        onAssign={() => handleAssignPlan(plan)}
                        onDelete={() => handleDeletePlan(plan)}
                        completionStats={{
                          totalAssigned: plan.totalAssignments,
                          completed: plan.completedAssignments,
                          inProgress: plan.activeAssignments - plan.completedAssignments,
                          percentage: plan.totalAssignments > 0 ? (plan.completedAssignments / plan.totalAssignments) * 100 : 0
                        }}
                        statsLoading={statsLoading}
                        currentUserId={user?.id}
                      />
                    ))}
                  </VStack>
                )
              ) : filteredData.type === 'mixed' ? (
                // Mixed Content - Grid or List view (All filter - both workouts and monthly plans)
                filteredData.data.length === 0 ? (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">No Content Found</Text>
                      <Text fontSize="sm">Create workouts or training plans to get started.</Text>
                    </VStack>
                  </Alert>
                ) : viewMode === 'grid' ? (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {filteredData.data.map((item: any) => {
                      // Check if it's a monthly plan (has weeks property) or workout
                      if ('weeks' in item) {
                        // It's a monthly plan
                        const plan = item as MonthlyPlanWithStats;
                        return (
                          <CoachWorkoutCard
                            key={`plan-${plan.id}`}
                            monthlyPlan={plan}
                            isCoach={true}
                            onViewDetails={() => handleViewPlan(plan)}
                            onEdit={() => handleEditPlan(plan)}
                            onAssign={() => handleAssignPlan(plan)}
                            onDelete={() => handleDeletePlan(plan)}
                            completionStats={{
                              totalAssigned: plan.totalAssignments || 0,
                              completed: plan.completedAssignments || 0,
                              inProgress: (plan.activeAssignments || 0) - (plan.completedAssignments || 0),
                              percentage: (plan.totalAssignments || 0) > 0 ? ((plan.completedAssignments || 0) / (plan.totalAssignments || 0)) * 100 : 0
                            }}
                            statsLoading={statsLoading}
                            currentUserId={user?.id}
                          />
                        );
                      } else {
                        // It's a workout
                        const workout = item as Workout;
                        const progress = workoutStatsLoading 
                          ? { completed: 0, total: 0, percentage: 0 }
                          : getWorkoutProgress(workout);
                        const athleteNames = assignmentsLoading
                          ? 'Loading assignments...'
                          : getAthleteNames(workout);

                        return (
                          <CoachWorkoutCard
                            key={`workout-${workout.id}`}
                            workout={workout}
                            isCoach={true}
                            assignedTo={athleteNames}
                            currentUserId={user?.id}
                            onEdit={() => navigate(`/coach/workout-creator-new?edit=${workout.id}`)}
                            onDelete={() => handleDeleteWorkout(workout)}
                            onAssign={() => handleAssignWorkout(workout)}
                            onViewDetails={() => handleViewWorkout(workout)}
                          />
                        );
                      }
                    })}
                  </SimpleGrid>
                ) : (
                  // List view - show both monthly plans and workouts in list format
                  <VStack spacing={6} align="stretch">
                    {/* Monthly Plans (if any) - use list format */}
                    {filteredData.data.some((item: any) => 'weeks' in item) && (
                      <>
                        <Text fontSize="lg" fontWeight="bold" color={listViewTextColor}>
                          Monthly Plans
                        </Text>
                        <VStack spacing={3} align="stretch">
                          {filteredData.data.filter((item: any) => 'weeks' in item).map((item: any) => {
                            const plan = item as MonthlyPlanWithStats;
                            return (
                              <CoachWorkoutListItem
                                key={`plan-${plan.id}`}
                                monthlyPlan={plan}
                                isCoach={true}
                                onViewDetails={() => handleViewPlan(plan)}
                                onEdit={() => handleEditPlan(plan)}
                                onAssign={() => handleAssignPlan(plan)}
                                onDelete={() => handleDeletePlan(plan)}
                                completionStats={{
                                  totalAssigned: plan.totalAssignments || 0,
                                  completed: plan.completedAssignments || 0,
                                  inProgress: (plan.activeAssignments || 0) - (plan.completedAssignments || 0),
                                  percentage: (plan.totalAssignments || 0) > 0 ? ((plan.completedAssignments || 0) / (plan.totalAssignments || 0)) * 100 : 0
                                }}
                                statsLoading={statsLoading}
                                currentUserId={user?.id}
                              />
                            );
                          })}
                        </VStack>
                      </>
                    )}
                    
                    {/* Workouts in List Format */}
                    {filteredData.data.some((item: any) => !('weeks' in item)) && (
                      <>
                        {filteredData.data.some((item: any) => 'weeks' in item) && (
                          <Text fontSize="lg" fontWeight="bold" color={listViewTextColor}>
                            Workouts
                          </Text>
                        )}
                        <VStack spacing={3} align="stretch">
                          {filteredData.data.filter((item: any) => !('weeks' in item)).map((item: any) => {
                            const workout = item as Workout;
                            const athleteNames = assignmentsLoading
                              ? 'Loading assignments...'
                              : getAthleteNames(workout);

                            return (
                              <CoachWorkoutListItem
                                key={`workout-${workout.id}`}
                                workout={workout}
                                isCoach={true}
                                assignedTo={athleteNames}
                                currentUserId={user?.id}
                                onEdit={() => navigate(`/coach/workout-creator-new?edit=${workout.id}`)}
                                onDelete={() => handleDeleteWorkout(workout)}
                                onAssign={() => handleAssignWorkout(workout)}
                                onViewDetails={() => handleViewWorkout(workout)}
                              />
                            );
                          })}
                        </VStack>
                      </>
                    )}
                  </VStack>
                )
              ) : (
                // Workouts Grid
                renderWorkouts()
              )}
            </VStack>
          );
      }
    };

    return (
      <VStack spacing={6} align="stretch" w="100%">
        {/* Section Header - Hidden on mobile */}
        <VStack spacing={2} align="start" w="100%" display={{ base: "none", lg: "flex" }}>
          <HStack spacing={3} align="center" justify="space-between" w="100%">
            <HStack spacing={3} align="center">
              <Icon
                as={sectionInfo.icon}
                boxSize={6}
                color={blueIconColor}
              />
              <Heading size="lg" color={headerTextColor}>
                {sectionInfo.title}
              </Heading>
            </HStack>
            {activeItem === 'exercise-library' && (
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                onClick={() => {
                  if (exerciseLibraryRef.current) {
                    exerciseLibraryRef.current.openAddModal();
                  }
                }}
              >
                Add Exercise
              </Button>
            )}
          </HStack>
          <Text color={headerSubtextColor} fontSize="md">
            {sectionInfo.description} ({filteredData.data.length} items)
          </Text>
        </VStack>
        
        {/* Main Content */}
        {renderMainContent()}
      </VStack>
    );
  };

  return (
    <Box bg={pageBackgroundColor} minH="100vh">
      {/* Loading indicator when saving */}
      {isSaving && (
        <Box 
          position="fixed" 
          top="0" 
          left="0" 
          right="0" 
          p={2} 
          bg="blue.500" 
          color="white" 
          textAlign="center"
          zIndex={9999}
        >
          <HStack justify="center" spacing={2}>
            <Spinner size="sm" />
            <Text fontWeight="medium">Saving workout...</Text>
          </HStack>
        </Box>
      )}

      {/* Workouts Sidebar */}
      <WorkoutsSidebar
        sections={coachSections}
        activeItem={activeItem}
        onItemClick={setActiveItem}
        createWorkoutAction={() => navigate('/coach/workout-creator-choice')}
        additionalActions={[
          {
            label: 'Import from File',
            icon: FaFileImport,
            action: () => navigate('/coach/workouts/import')
          },
          {
            label: 'Create Plan',
            icon: FaPlus,
            action: onCreatorOpen
          }
        ]}
        workoutCounts={{
          today: 0, // Coaches don't have "today" workouts like athletes
          thisWeek: 0,
          total: coachStats.workouts,
          completed: 0
        }}
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
        pt={{ base: 0, lg: isHeaderVisible ? "-2px" : "-82px" }}
        pb={{ base: 8, lg: 8 }}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        minH="100vh"
        px={0} // Remove padding since CoachLayout already adds it
      >
        {/* Content */}
        {renderContent()}
      </Box>

      {/* Training Plan Creator Modal */}
      <MonthlyPlanCreator
        isOpen={isCreatorOpen}
        onClose={onCreatorClose}
        onSuccess={handleCreationSuccess}
      />

      {/* Training Plan Editor Modal */}
      <MonthlyPlanCreator
        isOpen={showEditModal}
        onClose={handleEditModalClose}
        onSuccess={handleEditSuccess}
        editingPlan={selectedPlanForEdit}
      />

      {/* Plan Assignment Drawer */}
      {selectedPlanForAssignment && (
        <AssignmentDrawer
          isOpen={isAssignmentOpen}
          onClose={onAssignmentClose}
          onSuccess={handleAssignmentSuccess}
          monthlyPlan={selectedPlanForAssignment}
        />
      )}

      {/* Plan Detail View Drawer */}
      <Drawer
        isOpen={showDetailView}
        placement="right"
        onClose={() => setShowDetailView(false)}
        size="xl"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerBody p={0}>
            {selectedPlanForView && (
              <PlanDetailView
                monthlyPlan={selectedPlanForView}
                onBack={() => setShowDetailView(false)}
                onAssign={() => handleAssignPlan(selectedPlanForView)}
                onEdit={() => handleEditPlan(selectedPlanForView)}
              />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Workout Deletion Warning Modal */}
      <WorkoutDeletionWarningModal
        isOpen={isWarningOpen}
        onClose={handleWarningClose}
        workoutName={workoutToDelete?.name || ''}
        monthlyPlans={monthlyPlansUsing}
        onRemoveFromPlans={handleRemoveFromPlans}
        onProceedWithDeletion={handleProceedWithDeletion}
        isRemoving={isRemovingFromPlans}
      />

      {/* Workout Assignment Drawer */}
      {workoutToAssign && (
        <AssignmentDrawer
          isOpen={isWorkoutAssignmentOpen}
          onClose={onWorkoutAssignmentClose}
          onSuccess={handleWorkoutAssignmentSuccess}
          workout={workoutToAssign}
        />
      )}

      {/* Workout Detail View Drawer */}
      <Drawer
        isOpen={showWorkoutDetailView}
        placement="right"
        onClose={() => setShowWorkoutDetailView(false)}
        size="xl"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerBody p={0}>
            {selectedWorkoutForView && (
              <WorkoutDetailView
                workout={selectedWorkoutForView}
                onBack={() => setShowWorkoutDetailView(false)}
                onAssign={() => handleAssignWorkout(selectedWorkoutForView)}
                onEdit={() => handleEditWorkoutFromDetail(selectedWorkoutForView)}
              />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Convert Template Modal */}
      {templateToConvert && (
        <ConvertTemplateModal
          isOpen={isConvertModalOpen}
          onClose={onConvertModalClose}
          template={templateToConvert}
          onSuccess={handleConvertSuccess}
        />
      )}
    </Box>
  );
} 