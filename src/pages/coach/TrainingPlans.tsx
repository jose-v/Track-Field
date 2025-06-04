import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Text, SimpleGrid, Button, HStack, VStack, useDisclosure,
  useToast, Skeleton, Card, CardBody, useColorModeValue, Flex, 
  IconButton, Badge, Alert, AlertIcon, Spinner, Tabs, TabList, TabPanels, Tab, TabPanel,
  Select
} from '@chakra-ui/react';
import { FaCalendarAlt, FaPlus, FaRedo, FaUsers, FaChartLine, FaLayerGroup, FaTrash, FaFileImport, FaDumbbell, FaUserFriends } from 'react-icons/fa';
import { AddIcon, RepeatIcon } from '@chakra-ui/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { MonthlyPlanCard } from '../../components/MonthlyPlanCard';
import { MonthlyPlanCreator } from '../../components/MonthlyPlanCreator';
import { PlanAssignmentModal } from '../../components/PlanAssignmentModal';
import { PlanDetailView } from '../../components/PlanDetailView';
import { WorkoutCard } from '../../components/WorkoutCard';
import type { TrainingPlan } from '../../services/dbSchema';
import type { Workout } from '../../services/api';
import { useCoachAthletes } from '../../hooks/useCoachAthletes';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useWorkoutCompletionStats } from '../../hooks/useWorkoutCompletionStats';
import { useWorkoutsRealtime } from '../../hooks/useWorkoutsRealtime';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { DeletedItemCard } from '../../components/DeletedItemCard';

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
const WorkoutSkeletonCard = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('blue.400', 'blue.600');
  const avatarBg = useColorModeValue('whiteAlpha.300', 'whiteAlpha.100');
  const barBg = useColorModeValue('whiteAlpha.300', 'whiteAlpha.100');
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

export function CoachTrainingPlans() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: athletes, isLoading: athletesLoading } = useCoachAthletes();
  
  // Modal state
  const { isOpen: isCreatorOpen, onOpen: onCreatorOpen, onClose: onCreatorClose } = useDisclosure();
  const { isOpen: isAssignmentOpen, onOpen: onAssignmentOpen, onClose: onAssignmentClose } = useDisclosure();
  
  // Tab state - handle URL parameters for direct navigation
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    switch (tabParam) {
      case 'workouts': return 0;
      case 'plans': return 1;
      case 'templates': return 2;
      case 'drafts': return 3;
      case 'deleted': return 4;
      default: return 0; // Default to workouts tab
    }
  };

  const [activeTabIndex, setActiveTabIndex] = useState(getInitialTab);
  
  // Workout filter state
  const [workoutFilter, setWorkoutFilter] = useState<'all' | 'single' | 'weekly'>('all');
  const [selectedAthlete, setSelectedAthlete] = useState<string>('all');

  // Update URL when tab changes
  const handleTabChange = (index: number) => {
    setActiveTabIndex(index);
    const tabNames = ['workouts', 'plans', 'templates', 'drafts', 'deleted'];
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabNames[index]);
    setSearchParams(newParams);
  };

  // Update tab when URL changes
  useEffect(() => {
    setActiveTabIndex(getInitialTab());
  }, [searchParams]);

  // Data state for monthly plans
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlanWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedPlanForAssignment, setSelectedPlanForAssignment] = useState<TrainingPlan | null>(null);
  const [selectedPlanForView, setSelectedPlanForView] = useState<TrainingPlan | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);

  // Data state for workouts (moved from CoachWorkouts)
  const { workouts, isLoading: workoutsLoading, deleteWorkout, createWorkout, updateWorkout, refetch: refetchWorkouts } = useWorkouts();
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

  // Move all useColorModeValue calls to the top level
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerTextColor = useColorModeValue('gray.800', 'white');
  const headerSubtextColor = useColorModeValue('gray.600', 'gray.300');
  const iconColor = useColorModeValue('#4A5568', '#A0AEC0');
  const selectBg = useColorModeValue('white', 'gray.700');
  const selectBorderColor = useColorModeValue('gray.300', 'gray.600');

  // Load data when component mounts
  useEffect(() => {
    loadMonthlyPlans();
    loadTemplateWorkouts();
    loadDraftWorkouts();
    loadDeletedPlans();
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
        const { data, error } = await supabase
          .from('athlete_workouts')
          .select('*')
          .in('workout_id', workoutIds);

        if (error) {
          throw error;
        }

        setAssignments(data || []);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    fetchAssignments();
  }, [JSON.stringify(workoutIds)]);

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
      setDeletedLoading(true);
      
      // Load deleted workouts and monthly plans in parallel
      const [deletedWorkoutsData, deletedPlansData] = await Promise.all([
        api.workouts.getDeleted(user.id),
        api.monthlyPlans.getDeleted(user.id)
      ]);
      
      setDeletedWorkouts(deletedWorkoutsData);
      setDeletedMonthlyPlans(deletedPlansData);
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
      
      // Load assignment stats for each plan
      const plansWithStats = await Promise.all(
        plans.map(async (plan) => {
          try {
            const assignments = await api.monthlyPlanAssignments.getByPlan(plan.id);
            
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
    } catch (error) {
      console.error('Error loading assignment stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Workout progress and athlete assignment functions (moved from CoachWorkouts)
  const getWorkoutProgress = (workout: Workout) => {
    const stats = completionStats?.find(s => s.workoutId === workout.id);
    if (!stats) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    return {
      completed: stats.completedCount || 0,
      total: stats.exerciseCount || 0,
      percentage: stats.percentage || 0
    };
  };

  const getAthleteNames = (workout: Workout) => {
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
          .from('athlete_workouts')
          .select('*')
          .in('workout_id', workoutIds);
          
        if (error) {
          console.error('Error refreshing assignments:', error);
        } else if (data) {
          setAssignments(data);
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
        type === 'workout' ? refetchWorkouts() : loadMonthlyPlans()
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
    // TODO: Implement plan editing
    toast({
      title: 'Edit Plan',
      description: 'Plan editing functionality coming soon.',
      status: 'info',
      duration: 3000,
      isClosable: true
    });
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

  // Render functions for each tab content
  const renderWorkouts = () => {
    if (workoutsLoading || athletesLoading) {
      return (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[...Array(6)].map((_, index) => (
            <WorkoutSkeletonCard key={index} />
          ))}
        </SimpleGrid>
      );
    }

    // Filter out drafts and apply workout type filter
    let filteredWorkouts = workouts?.filter(workout => !workout.is_draft) || [];
    
    // Apply template type filter
    if (workoutFilter === 'single') {
      filteredWorkouts = filteredWorkouts.filter(workout => workout.template_type === 'single' || !workout.template_type);
    } else if (workoutFilter === 'weekly') {
      filteredWorkouts = filteredWorkouts.filter(workout => workout.template_type === 'weekly');
    }
    // 'all' shows everything (no additional filtering)

    // Apply athlete filter
    if (selectedAthlete !== 'all') {
      filteredWorkouts = filteredWorkouts.filter(workout => {
        const workoutAssignments = assignments?.filter(a => a.workout_id === workout.id) || [];
        return workoutAssignments.some(assignment => assignment.athlete_id === selectedAthlete);
      });
    }

    if (filteredWorkouts.length === 0) {
      let filterMessage = 'No Workouts Found';
      let filterSubMessage = 'Try adjusting your filters.';
      
      if (selectedAthlete !== 'all') {
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
            <WorkoutCard
              key={workout.id}
              workout={workout}
              isCoach={true}
              progress={progress}
              assignedTo={athleteNames}
              onEdit={() => navigate(`/coach/workout-creator?edit=${workout.id}`)}
              onDelete={() => deleteWorkout(workout.id)}
              onRefresh={handleWorkoutsRefresh}
              showRefresh={true}
              statsLoading={workoutStatsLoading || assignmentsLoading}
              detailedProgress={true}
            />
          );
        })}
      </SimpleGrid>
    );
  };

  const renderTemplateWorkouts = () => {
    if (templateLoading) {
      return (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height="200px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      );
    }

    if (templateWorkouts.length === 0) {
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium">No Template Workouts</Text>
            <Text fontSize="sm">Create workouts and save them as templates to get started.</Text>
          </VStack>
        </Alert>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {templateWorkouts.map((template) => (
          <WorkoutCard
            key={template.id}
            workout={template}
            isCoach={true}
            isTemplate={true}
            onEdit={() => navigate(`/coach/workout-creator?edit=${template.id}`)}
            onDelete={() => deleteWorkout(template.id)}
            onRefresh={handleTemplateRefresh}
            showRefresh={false}
          />
        ))}
      </SimpleGrid>
    );
  };

  const renderDraftWorkouts = () => {
    if (draftsLoading) {
      return (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height="200px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      );
    }

    if (draftWorkouts.length === 0) {
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium">No Draft Workouts</Text>
            <Text fontSize="sm">Draft workouts are automatically saved when you create workouts.</Text>
          </VStack>
        </Alert>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {draftWorkouts.map((draft) => (
          <WorkoutCard
            key={draft.id}
            workout={draft}
            isCoach={true}
            isTemplate={true}
            onEdit={() => navigate(`/coach/workout-creator?edit=${draft.id}`)}
            onDelete={() => deleteWorkout(draft.id)}
          />
        ))}
      </SimpleGrid>
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

  if (showDetailView && selectedPlanForView) {
    return (
      <PlanDetailView
        monthlyPlan={selectedPlanForView}
        onBack={() => setShowDetailView(false)}
        onAssign={() => handleAssignPlan(selectedPlanForView)}
        onEdit={() => handleEditPlan(selectedPlanForView)}
      />
    );
  }

  return (
    <Box minH="calc(100vh - 64px)" bg={bgColor}>
      <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6, lg: 8 }} py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Flex justify="flex-end" align="center" wrap="wrap" gap={4}>
            <VStack align="start" spacing={1} flex="1">
              <Heading size="xl" color={headerTextColor}>
                Training Plans
              </Heading>
              <Text color={headerSubtextColor}>
                Create and manage workouts and training plans for your athletes
              </Text>
            </VStack>
            
            <HStack spacing={4} wrap="wrap" justify="flex-end">
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                onClick={() => navigate('/coach/workout-creator')}
                size="lg"
              >
                Create Workout
              </Button>
              <Button
                leftIcon={<FaFileImport />}
                colorScheme="teal"
                variant="outline"
                onClick={() => navigate('/coach/workouts/import')}
                size="lg"
              >
                Import from File
              </Button>
              <Button
                leftIcon={<FaPlus />}
                colorScheme="green"
                onClick={onCreatorOpen}
                size="lg"
              >
                Create Plan
              </Button>
            </HStack>
          </Flex>

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

          {/* Tabs */}
          <Tabs 
            variant="enclosed" 
            colorScheme="teal"
            index={activeTabIndex}
            onChange={handleTabChange}
          >
            <TabList>
              <Tab>
                <FaDumbbell style={{ marginRight: '8px' }} />
                Workouts ({workouts?.filter(w => !w.is_draft).length || 0})
              </Tab>
              <Tab>
                <FaCalendarAlt style={{ marginRight: '8px' }} />
                Monthly Plans ({monthlyPlans.length})
              </Tab>
              <Tab>
                <FaLayerGroup style={{ marginRight: '8px' }} />
                Templates ({templateWorkouts.length})
              </Tab>
              <Tab>
                <FaUsers style={{ marginRight: '8px' }} />
                Drafts ({draftWorkouts.length})
              </Tab>
              <Tab>
                <FaTrash style={{ marginRight: '8px' }} />
                Deleted ({deletedWorkouts.length + deletedMonthlyPlans.length})
              </Tab>
            </TabList>

            <TabPanels>
              {/* Workouts Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  {/* Stats and Actions - Restructured for better responsive behavior */}
                  <VStack spacing={4} align="stretch">
                    {/* Stats Badges Row */}
                    <Flex justify="flex-start" align="center" wrap="wrap" gap={2}>
                      <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                        {workouts?.filter(w => !w.is_draft).length || 0} Workouts Created
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
                    <Flex justify="flex-start" align="center" wrap="wrap" gap={3}>
                      {/* Workout Type Filter Buttons */}
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          variant={workoutFilter === 'all' ? 'solid' : 'outline'}
                          colorScheme={workoutFilter === 'all' ? 'blue' : 'gray'}
                          onClick={() => setWorkoutFilter('all')}
                        >
                          All
                        </Button>
                        <Button
                          size="sm"
                          variant={workoutFilter === 'single' ? 'solid' : 'outline'}
                          colorScheme={workoutFilter === 'single' ? 'blue' : 'gray'}
                          onClick={() => setWorkoutFilter('single')}
                        >
                          Single
                        </Button>
                        <Button
                          size="sm"
                          variant={workoutFilter === 'weekly' ? 'solid' : 'outline'}
                          colorScheme={workoutFilter === 'weekly' ? 'blue' : 'gray'}
                          onClick={() => setWorkoutFilter('weekly')}
                        >
                          Weekly
                        </Button>
                      </HStack>

                      {/* Athlete Filter Dropdown */}
                      <HStack spacing={2} align="center">
                        <FaUserFriends style={{ color: iconColor }} />
                        <Select
                          value={selectedAthlete}
                          onChange={(e) => setSelectedAthlete(e.target.value)}
                          size="sm"
                          width={{ base: "180px", md: "200px" }}
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
                      
                      <Button
                        leftIcon={<FaRedo />}
                        variant="outline"
                        size="sm"
                        onClick={handleWorkoutsRefresh}
                        isLoading={assignmentsLoading}
                      >
                        Refresh
                      </Button>
                    </Flex>
                  </VStack>

                  {/* Workouts Grid */}
                  {renderWorkouts()}
                </VStack>
              </TabPanel>

              {/* Monthly Plans Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  {/* Stats and Actions */}
                  <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                    <HStack spacing={4}>
                      <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                        {monthlyPlans.length} Plans Created
                      </Badge>
                      {athletes && (
                        <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                          {athletes.length} Athletes
                        </Badge>
                      )}
                    </HStack>
                    
                    <Button
                      leftIcon={<FaRedo />}
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      isLoading={refreshing}
                    >
                      Refresh
                    </Button>
                  </Flex>

                  {/* Monthly Plans Grid */}
                  {loading ? (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} height="300px" borderRadius="lg" />
                      ))}
                    </SimpleGrid>
                  ) : monthlyPlans.length === 0 ? (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">No Training Plans Created</Text>
                        <Text fontSize="sm">Create your first monthly training plan to get started.</Text>
                      </VStack>
                    </Alert>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                      {monthlyPlans.map((plan) => (
                        <MonthlyPlanCard
                          key={plan.id}
                          monthlyPlan={plan}
                          isCoach={true}
                          onView={() => handleViewPlan(plan)}
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
                        />
                      ))}
                    </SimpleGrid>
                  )}
                </VStack>
              </TabPanel>

              {/* Template Workouts Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  {/* Stats and Actions */}
                  <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="lg" fontWeight="semibold" color={headerTextColor}>
                        Template Workouts
                      </Text>
                      <Text fontSize="sm" color={headerSubtextColor}>
                        Workouts saved as templates for creating training plans
                      </Text>
                    </VStack>
                    
                    <Button
                      leftIcon={<FaRedo />}
                      variant="outline"
                      size="sm"
                      onClick={handleTemplateRefresh}
                      isLoading={templateRefreshing}
                    >
                      Refresh
                    </Button>
                  </Flex>

                  {/* Template Workouts Grid */}
                  {renderTemplateWorkouts()}
                </VStack>
              </TabPanel>

              {/* Drafts Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  {/* Stats and Actions */}
                  <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="lg" fontWeight="semibold" color={headerTextColor}>
                        Draft Workouts
                      </Text>
                      <Text fontSize="sm" color={headerSubtextColor}>
                        Workouts saved as drafts for future use
                      </Text>
                    </VStack>
                    
                    <Button
                      leftIcon={<FaRedo />}
                      variant="outline"
                      size="sm"
                      onClick={handleDraftsRefresh}
                      isLoading={draftsRefreshing}
                    >
                      Refresh
                    </Button>
                  </Flex>

                  {/* Draft Workouts Grid */}
                  {renderDraftWorkouts()}
                </VStack>
              </TabPanel>

              {/* Deleted Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  {/* Stats and Actions */}
                  <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="lg" fontWeight="semibold" color={headerTextColor}>
                        Deleted Items
                      </Text>
                      <Text fontSize="sm" color={headerSubtextColor}>
                        Workouts and training plans that have been deleted
                      </Text>
                    </VStack>
                    
                    <Button
                      leftIcon={<FaRedo />}
                      variant="outline"
                      size="sm"
                      onClick={handleDeletedRefresh}
                      isLoading={deletedRefreshing}
                    >
                      Refresh
                    </Button>
                  </Flex>

                  {/* Deleted Plans Grid */}
                  {renderDeletedPlans()}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>

        {/* Training Plan Creator Modal */}
        <MonthlyPlanCreator
          isOpen={isCreatorOpen}
          onClose={onCreatorClose}
          onSuccess={handleCreationSuccess}
        />

        {/* Plan Assignment Modal */}
        {selectedPlanForAssignment && (
          <PlanAssignmentModal
            isOpen={isAssignmentOpen}
            onClose={onAssignmentClose}
            onSuccess={handleAssignmentSuccess}
            monthlyPlan={selectedPlanForAssignment}
          />
        )}
      </Box>
    </Box>
  );
} 