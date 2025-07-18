import {
  Box, Heading, Text, SimpleGrid, Spinner, useDisclosure, Button, HStack, IconButton, useToast,
  Skeleton, SkeletonText, Card, CardBody, useColorModeValue, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerBody
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useWorkouts } from '../../hooks/useWorkouts'; 
import type { Workout as ApiWorkout } from '../../services/api'; // Import shared types
import { useCoachAthletes } from '../../hooks/useCoachAthletes';
import { WorkoutModal } from '../../components/WorkoutModal'; // Import component
import type { WorkoutFormData } from '../../components/WorkoutModal'; // Import type properly
import { useWorkoutCompletionStats } from '../../hooks/useWorkoutCompletionStats'; // Import our new hook
import { api } from '../../services/api'; // Import the API instance
import { WorkoutCard } from '../../components/WorkoutCard'; // Import our shared card component
import { WorkoutDeletionWarningModal } from '../../components/WorkoutDeletionWarningModal';
import { WorkoutDetailView } from '../../components/WorkoutDetailView';
import { AssignmentModal } from '../../components/AssignmentModal';
import { supabase } from '../../lib/supabase'; // Import supabase client
import { RepeatIcon, AddIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { FaFileImport } from 'react-icons/fa';
import { getTodayLocalDate } from '../../utils/dateUtils';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkoutsRealtime } from '../../hooks/useWorkoutsRealtime';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkoutExerciseCount } from '../../utils/workoutUtils';

// Athlete assignment type
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

export function CoachWorkouts() {
  // useWorkouts returns Workout[] (imported type from api.ts via useWorkouts.ts)
  const { 
    workouts, 
    isLoading, 
    deleteWorkout, 
    createWorkout, 
    updateWorkout, 
    refetch,
    checkMonthlyPlanUsage,
    batchCheckMonthlyPlanUsage,
    removeFromMonthlyPlans,
    isCheckingUsage,
    isBatchCheckingUsage,
    isRemovingFromPlans
  } = useWorkouts(); 
  const { data: coachAthletes, isLoading: athletesLoading } = useCoachAthletes({
    includeStatuses: ['approved', 'pending']
  });
  const { user } = useAuth();
  const [editingWorkout, setEditingWorkout] = useState<ApiWorkout | null>(null); // Use imported ApiWorkout
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for deletion warning modal
  const { isOpen: isWarningOpen, onOpen: onWarningOpen, onClose: onWarningClose } = useDisclosure();
  const [workoutToDelete, setWorkoutToDelete] = useState<{ id: string; name: string } | null>(null);
  const [monthlyPlansUsing, setMonthlyPlansUsing] = useState<{ id: string; name: string }[]>([]);
  
  // State for assignment modal
  const { isOpen: isAssignmentOpen, onOpen: onAssignmentOpen, onClose: onAssignmentClose } = useDisclosure();
  const [workoutToAssign, setWorkoutToAssign] = useState<ApiWorkout | null>(null);
  
  // State for detail view
  const { isOpen: isDetailViewOpen, onOpen: onDetailViewOpen, onClose: onDetailViewClose } = useDisclosure();
  const [workoutToView, setWorkoutToView] = useState<ApiWorkout | null>(null);
  
  // State for monthly plan usage display
  const [monthlyPlanUsageData, setMonthlyPlanUsageData] = useState<Record<string, {
    isUsed: boolean;
    monthlyPlans: { id: string; name: string }[];
  }>>({});
  
  // State to track assignments
  const [assignments, setAssignments] = useState<AthleteAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  
  // Get all workout IDs for fetching stats
  const workoutIds = workouts?.map(workout => workout.id) || [];
  const { completionStats, isLoading: statsLoading, refetch: refetchStats } = useWorkoutCompletionStats(workoutIds);
  
  // Set up real-time updates
  const { isSubscribed, lastUpdate, forceRefresh } = useWorkoutsRealtime({
    coachId: user?.id,
    workoutIds,
    enabled: !!user?.id
  });
  
  // Only log status in development mode  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Coach real-time status: ${isSubscribed ? 'Active' : 'Inactive'}`);
    }
  }, [isSubscribed]);
  
  // Set up automatic refresh for workout stats - reduce frequency
  useEffect(() => {
    const refreshData = async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Auto-refreshing coach workout data...');
      }
      try {
        await queryClient.invalidateQueries({ queryKey: ['workoutCompletionStats'] });
        await queryClient.invalidateQueries({ queryKey: ['workouts'] });
        await queryClient.invalidateQueries({ queryKey: ['athleteWorkouts'] });
        
        if (workoutIds.length > 0) {
          const { data, error } = await supabase
            .from('athlete_workouts')
            .select('*')
            .in('workout_id', workoutIds);
            
          if (error) {
            console.error('Error refreshing assignments:', error);
          } else if (data) {
            setAssignments(data);
          }
        }
      } catch (err) {
        console.error('Error during auto-refresh:', err);
      }
    };
    
    // Reduced frequency to 5 minutes to improve performance
    // 🚨 DISABLED - Auto-refresh was causing excessive database load
    // const intervalId = setInterval(refreshData, 300000);
    refreshData();

    // return () => clearInterval(intervalId); // Disabled with auto-refresh
  }, [queryClient, JSON.stringify(workoutIds)]);
  
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
        const compatibleAssignments = (data || []).map(assignment => ({
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
  }, [JSON.stringify(workoutIds)]); // Use JSON.stringify to stabilize the dependency

  // Helper to get progress for a workout from completionStats
  const getWorkoutProgress = (workout: ApiWorkout) => {
    // If no workout, return empty stats
    if (!workout || !workout.id) {
      return { 
        completed: 0, 
        total: 0, 
        percentage: 0 
      };
    }
    
    // Get the real-time completion stats 
    const workoutStat = completionStats?.find(stat => stat.workoutId === workout.id);
    
    if (workoutStat) {
      console.log(`Coach: Workout ${workout.name} progress details:`, {
        workoutId: workout.id,
        totalAssigned: workoutStat.totalAssigned,
        completedCount: workoutStat.completedCount,
        inProgressCount: workoutStat.inProgressCount || 0,
        exerciseCount: workoutStat.exerciseCount || workout.exercises?.length || 0,
        percentage: workoutStat.percentage,
      });
      
      return {
        completed: workoutStat.completedCount || 0,
        total: workoutStat.totalAssigned || 0,
        percentage: workoutStat.percentage || 0,
        inProgressCount: workoutStat.inProgressCount || 0,
        exerciseCount: workoutStat.exerciseCount || workout.exercises?.length || 0
      };
    }
    
    // Fallback to manually calculating from assignments if stats not available
    const workoutAssignments = assignments.filter(a => a.workout_id === workout.id);
    const totalAssigned = workoutAssignments.length;
    const completedCount = workoutAssignments.filter(a => a.status === 'completed').length;
    const inProgressCount = workoutAssignments.filter(a => a.status === 'in_progress').length;
    const exerciseCount = getWorkoutExerciseCount(workout);
    
    // Calculate completion percentage based on completed and in-progress assignments
    let percentage = 0;
    
    if (totalAssigned > 0 && exerciseCount > 0) {
      // Calculate total possible completion (all exercises for all athletes)
      const totalPossible = totalAssigned * exerciseCount;
      
      // Estimate completed exercises
      const completedExercises = (completedCount * exerciseCount) + 
                                 (inProgressCount * Math.ceil(exerciseCount / 2));
                                 
      percentage = (completedExercises / totalPossible) * 100;
    } else {
      percentage = totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0;
    }
    
    console.log(`Coach: Workout ${workout.name} fallback calculation:`, {
      totalAssigned,
      completedCount,
      inProgressCount,
      exerciseCount,
      percentage
    });
    
    // Adjust completed count for exercises
    // Better calculation to match what's shown in athlete view
    let adjustedCompletedCount = 0;
    
    if (completedCount > 0) {
      // If workout is completed, count all exercises as done
      adjustedCompletedCount = exerciseCount;
    } else if (inProgressCount > 0) {
      // For in-progress, estimate based on exercise count
      adjustedCompletedCount = Math.floor(exerciseCount * 0.5); // Estimate half completion
      
      // Make sure we show at least 2 completed if in progress (matching athlete view)
      if (adjustedCompletedCount < 2) {
        adjustedCompletedCount = 2;
      }
    }
    
    return { 
      completed: adjustedCompletedCount, 
      total: totalAssigned, 
      percentage,
      inProgressCount,
      exerciseCount
    };
  };

  const getAthleteNames = (workout: ApiWorkout) => {
    if (!workout.id || !coachAthletes || coachAthletes.length === 0) return 'Unassigned';
    
    // Get assignments for this workout
    const workoutAssignments = assignments.filter(a => a.workout_id === workout.id);
    
    if (!workoutAssignments.length) return 'Unassigned';
    
    // Map athlete IDs to names
    const names = workoutAssignments
      .map(assignment => {
        const athlete = coachAthletes?.find(a => a.id === assignment.athlete_id);
        return athlete ? `${athlete.first_name} ${athlete.last_name}` : null;
      })
      .filter(Boolean);
    
    return names.length ? names.join(', ') : 'Unassigned';
  };

  const handleSave = async (dataFromModal: WorkoutFormData) => { 
    // dataFromModal should be shaped by WorkoutModal to provide all necessary fields for ApiWorkout creation.
    // The WorkoutFormData type in WorkoutModal should define name, type, date, duration, notes, exercises as required.
    const { id, assignedAthletes, file, user_id, created_at, ...payloadForApi } = dataFromModal as ApiWorkout & { assignedAthletes?: string[], file?: File };

    try {
      setIsSaving(true);
      let workoutId = id;
      let isUpdate = false;
      
      if (id && editingWorkout) { 
        // Update existing workout
        isUpdate = true;
        await updateWorkout({ id: id, workout: payloadForApi as Partial<ApiWorkout> });
        workoutId = id;
      } else {
        // For new workouts, create and get the created workout
        const newWorkout = await createWorkout(payloadForApi as Omit<ApiWorkout, 'id' | 'user_id' | 'created_at'>);
        workoutId = newWorkout?.id;
      }
      
      // Then assign to athletes if there are any and we have a workout ID
      if (assignedAthletes && assignedAthletes.length > 0 && workoutId) {
        // Use unified assignment system
        const { AssignmentService } = await import('../../services/assignmentService');
        const assignmentService = new AssignmentService();
        
        // Convert workout to unified format
        const exerciseBlock = {
          workout_name: payloadForApi.name,
          description: payloadForApi.description || payloadForApi.notes || '',
          estimated_duration: payloadForApi.duration,
          location: payloadForApi.location,
          workout_type: payloadForApi.type || 'strength',
          exercises: payloadForApi.exercises || []
        };
        
        // Create unified assignments for each athlete
        for (const athleteId of assignedAthletes) {
          try {
            const startDate = payloadForApi.date || getTodayLocalDate();
            await assignmentService.createAssignment({
              athlete_id: athleteId,
              assignment_type: 'single',
              exercise_block: exerciseBlock,
              progress: {
                current_exercise_index: 0,
                current_set: 1,
                current_rep: 1,
                completed_exercises: [],
                total_exercises: (payloadForApi.exercises || []).length,
                completion_percentage: 0
              },
              start_date: startDate,
              end_date: startDate,
              assigned_at: new Date().toISOString(),
              assigned_by: user?.id,
              status: 'assigned',
              meta: {
                original_workout_id: workoutId,
                workout_type: 'single',
                estimated_duration: payloadForApi.duration,
                location: payloadForApi.location
              }
            });
          } catch (error) {
            console.error(`Failed to create unified assignment for athlete ${athleteId}:`, error);
          }
        }
      }
      
      // Close the modal
      setEditingWorkout(null);
      
      // Add a small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force refresh of workouts data
      await refetch();
      
      // Only refresh stats and assignments after the refetch is complete
      await refetchStats();
      
      // Refetch assignments from unified system
      if (workoutIds.length > 0) {
        setAssignmentsLoading(true);
        const { data } = await supabase
          .from('unified_workout_assignments')
          .select('*')
          .in('meta->>original_workout_id', workoutIds);
          
        if (data) {
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
      
      // Show success message
      toast({
        title: isUpdate ? "Workout Updated" : "Workout Created",
        description: isUpdate ? 
          "Workout has been updated successfully." : 
          "New workout has been created successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error("Error saving workout or assigning to athletes:", error);
      toast({
        title: "Error",
        description: "There was an error saving the workout. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Refresh stats when component mounts or when workoutIds change
  useEffect(() => {
    if (workoutIds.length > 0) {
      refetchStats();
    }
  }, [refetchStats]); // Only depend on refetchStats function

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
  //       console.error('❌ Error fetching monthly plan usage:', error);
  //     }
  //   };
  //   fetchMonthlyPlanUsage();
  // }, [workoutIds, batchCheckMonthlyPlanUsage]);

  // Log for debugging - reduced frequency
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && workouts?.length === 0) {
      console.log('Coach workouts loaded:', workouts?.length || 0);
    }
  }, [workouts?.length]); // Only log when counts change

  // Add a refresh function
  const handleRefresh = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
      console.log('Manual refresh initiated by coach');
    }
      
      // Force refetch of stats
      await refetchStats();
      
      // Refetch workouts
      await refetch();
      
      // Refetch assignments directly from unified system
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
        title: 'Progress Refreshed',
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

  // Handle deletion with monthly plan usage check
  const handleDeleteWorkout = async (workout: ApiWorkout) => {
    try {
      // First check if the workout is used in any monthly plans
      const usage = await checkMonthlyPlanUsage(workout.id);
      
      if (usage.isUsed) {
        // Show warning modal
        setWorkoutToDelete({ id: workout.id, name: workout.name });
        setMonthlyPlansUsing(usage.monthlyPlans);
        onWarningOpen();
      } else {
        // Safe to delete immediately
        deleteWorkout(workout.id);
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
  const handleProceedWithDeletion = () => {
    if (!workoutToDelete) return;
    
    deleteWorkout(workoutToDelete.id);
    
    // Close modal and reset state
    onWarningClose();
    setWorkoutToDelete(null);
    setMonthlyPlansUsing([]);
  };

  // Handle modal close
  const handleWarningClose = () => {
    onWarningClose();
    setWorkoutToDelete(null);
    setMonthlyPlansUsing([]);
  };

  const handleAssignWorkout = (workout: ApiWorkout) => {
    setWorkoutToAssign(workout);
    onAssignmentOpen();
  };

  const handleAssignmentSuccess = () => {
    onAssignmentClose();
    // Refresh data to show updated assignments
    refetch();
    refetchStats();
  };

  const handleViewWorkout = (workout: ApiWorkout) => {
    setWorkoutToView(workout);
    onDetailViewOpen();
  };

  const handleEditWorkoutFromDetail = (workout: ApiWorkout) => {
    onDetailViewClose();
    navigate(`/coach/workout-creator-new?edit=${workout.id}`);
  };

  return (
    <Box py={8}>
      <Heading mb={6}>Coach Workouts</Heading>
      <HStack mb={6} spacing={4} wrap="wrap">
        <Button 
          variant="solid"
          colorScheme="blue" 
          leftIcon={<AddIcon />} 
          onClick={() => navigate('/coach/workout-creator')}
          size="md"
        >
          Create New Workout
        </Button>
        <Button
          variant="outline"
          colorScheme="teal"
          leftIcon={<FaFileImport />}
          onClick={() => navigate('/coach/workouts/import')}
          size="md"
        >
          Import from File
        </Button>
        <IconButton
          aria-label="Refresh workouts"
          icon={<RepeatIcon />}
          onClick={handleRefresh}
          variant="ghost"
          colorScheme="blue"
        />
      </HStack>
      
      {/* Add a loading indicator when a workout is being saved */}
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
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {/* When loading initial data, show skeleton cards */}
        {isLoading || athletesLoading ? (
          // Show skeleton loaders during initial load
          <>
            {[...Array(6)].map((_, index) => (
              <WorkoutSkeletonCard key={index} />
            ))}
          </>
        ) : !workouts || workouts.length === 0 ? (
          // Only show "no workouts" when we're done loading and there are truly no workouts
          <Box gridColumn="1 / -1" textAlign="center" p={8} bg="gray.50" borderRadius="lg">
            <Text fontSize="lg" mb={4}>No workouts created yet.</Text>
            <Button 
              colorScheme="blue" 
              size="md" 
              onClick={() => { setEditingWorkout(null); }}
            >
              Create Your First Workout
            </Button>
          </Box>
        ) : (
          // Show the actual workout cards
          (workouts as ApiWorkout[]).map((workout) => { 
            const progress = statsLoading 
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
                assignedTo={athleteNames}
                onEdit={() => navigate(`/coach/workout-creator-new?edit=${workout.id}`)}
                onDelete={() => handleDeleteWorkout(workout)}
                onAssign={() => handleAssignWorkout(workout)}
                onViewDetails={() => handleViewWorkout(workout)}
                // monthlyPlanUsage disabled - checked just-in-time during deletion
              />
            );
          })
        )}
      </SimpleGrid>

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

      {/* Assignment Modal */}
      {workoutToAssign && (
        <AssignmentModal
          isOpen={isAssignmentOpen}
          onClose={onAssignmentClose}
          onSuccess={handleAssignmentSuccess}
          workout={workoutToAssign}
        />
      )}

      {/* Workout Detail View Drawer */}
      <Drawer
        isOpen={isDetailViewOpen}
        placement="right"
        onClose={onDetailViewClose}
        size="xl"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerBody p={0}>
            {workoutToView && (
              <WorkoutDetailView
                workout={workoutToView}
                onBack={onDetailViewClose}
                onAssign={() => handleAssignWorkout(workoutToView)}
                onEdit={() => handleEditWorkoutFromDetail(workoutToView)}
              />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
} 