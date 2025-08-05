import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Stack,
  Button,
  Flex,
  VStack,
  Center,
  useColorModeValue,
  SimpleGrid,
  Badge,
  HStack,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useBreakpointValue,
  useToast
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { BiRun } from 'react-icons/bi';
import { FaPlus, FaRedo, FaCalendarDay, FaUser } from 'react-icons/fa';
import { BookOpen } from 'lucide-react';
import { WorkoutsSidebar } from '../../components';
import { MobileBottomNavigation } from '../../components/MobileBottomNavigation';
import PageHeader from '../../components/PageHeader';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { usePageHeader } from '../../hooks/usePageHeader';
import {
  UnifiedAssignmentCard,
  TodaysWorkoutCard,
  CompactAssignmentCard,
  UnifiedWorkoutExecution,
  useUnifiedAssignments
} from '../../components/unified';
import { ExerciseLibrary, Exercise } from '../../components/ExerciseLibrary';


type WorkoutsSectionId = 'todays-workout' | 'all-assignments' | 'single-workouts' | 'weekly-plans' | 'monthly-plans' | 'my-workouts' | 'deleted-items' | 'exercise-library';

const workoutsSections = [
  {
    id: 'unified-assignments',
    title: 'Unified Assignments',
      items: [
        {
        id: 'todays-workout',
        label: "Today's Workout",
          icon: FaCalendarDay,
        description: "Your workout for today"
      },
      {
        id: 'all-assignments',
        label: 'All Assignments',
        icon: BiRun,
        description: "All your workout assignments"
      },
      {
        id: 'single-workouts',
        label: 'Single Workouts',
        icon: BiRun,
        description: "Your single workout assignments"
      },
      {
        id: 'weekly-plans',
        label: 'Weekly Plans',
        icon: BiRun,
        description: "Your weekly training plans"
      },
      {
        id: 'monthly-plans',
        label: 'Monthly Plans',
        icon: BiRun,
        description: "Your monthly training programs"
      },
      {
        id: 'my-workouts',
        label: 'My Workouts',
        icon: FaUser,
        description: "Workouts I created"
      },
      {
        id: 'deleted-items',
        label: 'Deleted Items',
        icon: FaRedo,
        description: "Recently deleted workouts"
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
          icon: BookOpen,
          description: 'Browse and manage exercises',
          badge: 0
        }
      ]
    }
  ];

export function AthleteWorkouts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  console.log('useNavigate hook result:', navigate);
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activeItem, setActiveItem] = useState<WorkoutsSectionId>('todays-workout');
  const [executingAssignmentId, setExecutingAssignmentId] = useState<string | null>(null);
  
  // Enhanced filtering states
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<'all' | 'single' | 'weekly' | 'monthly'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'in_progress' | 'completed'>('all');
  
  // Mobile filter modal
  const { isOpen: isFiltersOpen, onOpen: onFiltersOpen, onClose: onFiltersClose } = useDisclosure();

  // Execution state management - robust solution
  const [cachedAssignmentForExecution, setCachedAssignmentForExecution] = useState<any>(null);

  // Exercise Library state
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const exerciseLibraryRef = useRef<{ openAddModal: () => void } | null>(null);
  


  // Responsive design - Clean mobile/desktop separation
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const isDesktop = useBreakpointValue({ base: false, lg: true });

  // Styling
  const pageBackgroundColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const errorTextColor = useColorModeValue('red.600', 'red.300');

  // Page header management
  const { isHeaderVisible } = useScrollDirection();
  usePageHeader({
    title: 'Workouts',
    subtitle: 'Your Unified Training System',
    icon: BiRun
  });

  // Unified assignment system hooks - optimized to prevent duplicate API calls
  const { 
    data: assignments, 
    isLoading: loadingAssignments, 
    error: assignmentsError,
    refetch: refetchAssignments
  } = useUnifiedAssignments(user?.id);

  // Self-created assignments state
  const [createdAssignments, setCreatedAssignments] = useState<any[]>([]);
  const [createdAssignmentsLoading, setCreatedAssignmentsLoading] = useState(false);
  
  // Deleted assignments state
  const [deletedAssignments, setDeletedAssignments] = useState<any[]>([]);
  const [deletedAssignmentsLoading, setDeletedAssignmentsLoading] = useState(false);
  
  // Derive today's workout from assignments using flexible logic like the today cards
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Priority order: 1) Today's date, 2) In progress, 3) Recent assignments
  const todaysWorkout = assignments?.find(assignment => {
    if (assignment.status === 'completed') return false;
    if (!assignment.start_date) return false;
    
    // Handle both date formats: YYYY-MM-DD and YYYY-MM-DDTHH:MM:SS
    const assignmentDate = assignment.start_date.split('T')[0];
    
    // First priority: exact date match
    if (assignmentDate === todayStr || assignmentDate === yesterdayStr) {
      return true;
    }
    
    // Second priority: in-progress workouts (can be continued any day)
    if (assignment.status === 'in_progress') {
      return true;
    }
    
    // Third priority: recent assignments (within 3 days) that aren't completed
    const assignmentDateObj = new Date(assignmentDate);
    const todayDateObj = new Date(todayStr);
    const daysDiff = Math.abs((todayDateObj.getTime() - assignmentDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysDiff <= 3 && assignment.status === 'assigned';
  }) || null;
  const loadingToday = loadingAssignments; // Use same loading state
  const todayError = assignmentsError; // Use same error state
  
  // Debug logging for athlete workouts page
  console.log('=== ATHLETE WORKOUTS PAGE DEBUG ===');
  console.log('Today\'s date string:', todayStr);
  console.log('Yesterday\'s date string:', yesterdayStr);
  console.log('Total assignments:', assignments?.length || 0);
  console.log('Selected today\'s workout:', todaysWorkout ? {
    id: todaysWorkout.id,
    name: todaysWorkout.exercise_block?.workout_name,
    start_date: todaysWorkout.start_date,
    status: todaysWorkout.status,
    reason: (() => {
      if (!todaysWorkout.start_date) return 'No date';
      const assignmentDate = todaysWorkout.start_date.split('T')[0];
      if (assignmentDate === todayStr) return 'Today\'s date';
      if (assignmentDate === yesterdayStr) return 'Yesterday\'s date';
      if (todaysWorkout.status === 'in_progress') return 'In progress';
      return 'Recent assignment';
    })()
  } : null);
  console.log('=== END ATHLETE WORKOUTS DEBUG ===');
  
  // Update refetch function to only use the assignments refetch
  const refetchToday = refetchAssignments;

  // Sidebar constants (matching existing layout)
  const mainSidebarWidth = 70; // This should match your actual sidebar width

  // Workout execution handlers - robust solution
  const handleExecuteWorkout = (assignmentId: string) => {
    // IMMEDIATELY cache the assignment to prevent race conditions
    const assignmentToCache = assignments?.find(a => a.id === assignmentId) || 
                              (todaysWorkout?.id === assignmentId ? todaysWorkout : null);
    
    if (assignmentToCache) {
      setCachedAssignmentForExecution(assignmentToCache);
      setExecutingAssignmentId(assignmentId);
    } else {
      console.error('Assignment not found for execution:', assignmentId);
      console.log('Available assignments:', assignments?.map(a => a.id));
      console.log('Today\'s workout ID:', todaysWorkout?.id);
    }
  };

  const handleExitExecution = () => {
    setExecutingAssignmentId(null);
    setCachedAssignmentForExecution(null);
  };

  const handleCompleteWorkout = () => {
    setExecutingAssignmentId(null);
    setCachedAssignmentForExecution(null);
    // Refresh data after completion
    refetchAssignments();
    refetchToday();
  };

  const handleEditWorkout = (assignment: any) => {
    // Convert assignment data to workout format for editing
    const convertAssignmentToWorkoutForEdit = (assignment: any) => {

      
      const workout = {
        id: assignment.id,
        name: assignment.exercise_block?.workout_name || assignment.exercise_block?.plan_name || 'Assignment Workout',
        description: assignment.exercise_block?.description || '',
        type: assignment.assignment_type,
        date: assignment.start_date,
        duration: assignment.exercise_block?.estimated_duration || '',
        notes: assignment.exercise_block?.notes || '',
        created_at: assignment.created_at,
        user_id: assignment.athlete_id,
        exercises: assignment.exercise_block?.exercises || [],
        blocks: assignment.exercise_block?.blocks || [],
        is_block_based: assignment.exercise_block?.is_block_based || false,
        template_type: assignment.assignment_type as 'single' | 'weekly' | 'monthly',
        daily_workouts: assignment.exercise_block?.daily_workouts || undefined,
        meta: assignment.meta,
      };

      // For single workouts, reconstruct blocks from exercises
      if (assignment.assignment_type === 'single' && assignment.exercise_block?.exercises) {
        const exercises = assignment.exercise_block.exercises;
        if (exercises.length > 0) {
          // Create a single main block with all exercises
          const mainBlock = {
            id: `block-${Date.now()}`,
            name: 'Main Set',
            category: 'main' as const,
            flow: 'sequential' as const,
            exercises: exercises.map((exercise: any) => ({
              id: exercise.id || `${exercise.name}-${Date.now()}`,
              name: exercise.name,
              category: exercise.category || 'main',
              description: exercise.instructions || exercise.description || '',
              sets: exercise.sets || '3',
              reps: exercise.reps || '10',
              weight: exercise.weight || '',
              distance: exercise.distance || '',
              rest: exercise.rest_seconds ? exercise.rest_seconds.toString() : '60',
              rpe: exercise.rpe || '',
              notes: exercise.notes || '',
              contacts: exercise.contacts || '',
              intensity: exercise.intensity || '',
              direction: exercise.direction || '',
              movement_notes: exercise.movement_notes || '',
              timed_duration: exercise.timed_duration || 0
            })),
            restBetweenExercises: exercises[0]?.rest_between_exercises || 90,
            restBetweenSets: exercises[0]?.rest_seconds || 60
          };
          
          workout.blocks = [mainBlock];
          console.log('Reconstructed block from exercises:', mainBlock);
        }
      }
      


      // For weekly assignments, convert daily_workouts to blocks format
      if (assignment.assignment_type === 'weekly') {
        const dailyWorkouts = assignment.exercise_block?.daily_workouts || {};
        
        if (Object.keys(dailyWorkouts).length > 0) {
          const dayBlocks: any = {};
          
          Object.entries(dailyWorkouts).forEach(([dayName, dayData]: [string, any]) => {
            if (dayData && Array.isArray(dayData)) {
              dayBlocks[dayName] = dayData;
            } else if (dayData && dayData.exercises) {
              dayBlocks[dayName] = [{
                name: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} Workout`,
                exercises: dayData.exercises,
                is_rest_day: dayData.is_rest_day || false
              }];
            }
          });
          
          if (Object.keys(dayBlocks).length > 0) {
            workout.blocks = dayBlocks;
          }
        }
      }

      return workout;
    };

    try {
      // Convert assignment to workout format
      const workoutData = convertAssignmentToWorkoutForEdit(assignment);
      
      // Store the workout data in localStorage for the workout creator to access
      localStorage.setItem('editWorkoutData', JSON.stringify(workoutData));
      
      // Navigate to new workout creator without edit parameter since we're using localStorage
      window.location.href = '/athlete/workout-creator-new?step=2';
      
      toast({
        title: "Edit Workout",
        description: "Opening workout creator for editing...",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error preparing workout for editing:', error);
      toast({
        title: "Error",
        description: "Failed to open workout for editing. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Exercise Library handlers
  const loadCustomExercises = async () => {
    if (!user?.id) return;
    
    setExercisesLoading(true);
    try {
      const { getExercisesWithTeamSharing } = await import('../../utils/exerciseQueries');
      const exercises = await getExercisesWithTeamSharing(user.id);
      setCustomExercises(exercises);
    } catch (error) {
      console.error('Error loading custom exercises:', error);
      toast({
        title: 'Error loading exercises',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setExercisesLoading(false);
    }
  };

  const handleAddExercise = async (exerciseData: Omit<Exercise, 'id'>) => {
    if (!user?.id) return;
    
    try {
      const { createExerciseWithSharing } = await import('../../utils/exerciseQueries');
      await createExerciseWithSharing(exerciseData, user.id);
      
      // Refresh exercises
      await loadCustomExercises();
      
      toast({
        title: 'Exercise added',
        description: 'The exercise has been added to your library.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast({
        title: 'Error adding exercise',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdateExercise = async (id: string, exerciseData: Omit<Exercise, 'id'>) => {
    if (!user?.id) return;
    
    try {
      const { updateExerciseWithSharing } = await import('../../utils/exerciseQueries');
      await updateExerciseWithSharing(id, exerciseData, user.id);
      
      // Refresh exercises
      await loadCustomExercises();
      
      toast({
        title: 'Exercise updated',
        description: 'The exercise has been updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating exercise:', error);
      toast({
        title: 'Error updating exercise',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (!user?.id) return;
    
    try {
      const { supabase } = await import('../../lib/supabase');
      const { error } = await supabase
        .from('exercise_library')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setCustomExercises(prev => prev.filter(ex => ex.id !== id));
      
      toast({
        title: 'Exercise deleted',
        description: 'The exercise has been removed from your library.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast({
        title: 'Error deleting exercise',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleRefresh = () => {
    refetchAssignments();
    refetchToday();
  };



  // Handle sidebar item clicks
  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId as WorkoutsSectionId);
  };

  // Filter assignments by type and additional filters
  const getFilteredAssignments = () => {
    if (!assignments) return [];
    
    let filteredAssignments = assignments;
    
    // IMPORTANT: Exclude today's workout from all other sections to prevent duplicates
    // If an assignment is already shown in "Today's Workout" section, don't show it elsewhere
    if (todaysWorkout) {
      filteredAssignments = assignments.filter(a => a.id !== todaysWorkout.id);
    }
    
    // First filter by sidebar item
    switch (activeItem) {
      case 'weekly-plans':
        filteredAssignments = filteredAssignments.filter(a => a.assignment_type === 'weekly');
        break;
      case 'monthly-plans':
        filteredAssignments = filteredAssignments.filter(a => a.assignment_type === 'monthly');
        break;
      case 'all-assignments':
      default:
        // Keep all remaining assignments (already excluded today's workout above)
        break;
    }
    
    // Apply assignment type filter (for all-assignments view)
    if (activeItem === 'all-assignments' && assignmentTypeFilter !== 'all') {
      filteredAssignments = filteredAssignments.filter(a => a.assignment_type === assignmentTypeFilter);
    }
    
    // Apply status filter - by default, exclude completed assignments unless user specifically wants to see them
    if (statusFilter !== 'all') {
      filteredAssignments = filteredAssignments.filter(a => a.status === statusFilter);
    } else {
      // Default behavior: exclude completed assignments from main views
      filteredAssignments = filteredAssignments.filter(a => a.status !== 'completed');
    }
    
    return filteredAssignments;
  };

  // Get workout counts for sidebar (matching expected interface)
  const workoutCounts = {
    today: todaysWorkout ? 1 : 0,
    thisWeek: assignments?.filter(a => a.assignment_type === 'weekly').length || 0,
    total: assignments?.length || 0,
    completed: assignments?.filter(a => a.status === 'completed').length || 0,
  };

  // Clear all filters function
  const handleClearFilters = () => {
    setAssignmentTypeFilter('all');
    setStatusFilter('all');
  };

  // Safeguard: Clear invalid executingAssignmentId values
  useEffect(() => {
    if (executingAssignmentId && !cachedAssignmentForExecution) {
      const assignmentExists = assignments?.find(a => a.id === executingAssignmentId) ||
                              (todaysWorkout?.id === executingAssignmentId ? todaysWorkout : null);
      
      if (!assignmentExists) {
        console.warn('Clearing invalid executingAssignmentId:', executingAssignmentId);
        setExecutingAssignmentId(null);
        setCachedAssignmentForExecution(null);
      }
    }
  }, [executingAssignmentId, cachedAssignmentForExecution, assignments, todaysWorkout]);

  // Fetch self-created assignments
  useEffect(() => {
    if (user?.id) {
      setCreatedAssignmentsLoading(true);
      import('../../services/assignmentService').then(({ AssignmentService }) => {
        const assignmentService = new AssignmentService();
        assignmentService.getAssignments(user.id)
          .then(assignments => {
            // Filter for self-created assignments (meta.self_assigned = true)
            const selfCreatedAssignments = assignments.filter(assignment => 
              assignment.meta?.self_assigned === true
            );
            console.log('Self-created assignments fetched:', selfCreatedAssignments?.length || 0);
            setCreatedAssignments(selfCreatedAssignments || []);
          })
          .catch(error => {
            console.error('Error fetching self-created assignments:', error);
            setCreatedAssignments([]);
          })
          .finally(() => {
            setCreatedAssignmentsLoading(false);
          });
      });
    }
  }, [user?.id]);

  // Fetch deleted assignments when deleted-items section is active
  useEffect(() => {
    if (activeItem === 'deleted-items' && user?.id) {
      setDeletedAssignmentsLoading(true);
      import('../../services/assignmentService').then(({ AssignmentService }) => {
        const assignmentService = new AssignmentService();
        assignmentService.getDeletedAssignments(user.id)
          .then(assignments => {
            console.log('Deleted assignments fetched:', assignments?.length || 0);
            setDeletedAssignments(assignments || []);
          })
          .catch(error => {
            console.error('Error fetching deleted assignments:', error);
            setDeletedAssignments([]);
          })
          .finally(() => {
            setDeletedAssignmentsLoading(false);
          });
      });
    }
  }, [activeItem, user?.id]);

  // Load custom exercises when exercise-library section is active
  useEffect(() => {
    if (activeItem === 'exercise-library' && user?.id) {
      loadCustomExercises();
    }
  }, [activeItem, user?.id]);

  // Robust execution logic - use cached assignment to prevent flickering
  if (executingAssignmentId && cachedAssignmentForExecution) {
    return (
      <Box bg={pageBackgroundColor} minH="100vh">
        <UnifiedWorkoutExecution
          assignment={cachedAssignmentForExecution}
          onComplete={handleCompleteWorkout}
          onExit={handleExitExecution}
          isOpen={true}
        />
      </Box>
    );
  }

  const renderContent = () => {
    const isLoading = loadingAssignments || loadingToday;
    const error = assignmentsError || todayError;

    if (isLoading) {
      return (
        <Center py={10}>
          <Spinner 
            thickness="4px" 
            speed="0.65s" 
            emptyColor="gray.200" 
            color="blue.500" 
            size="xl" 
          />
        </Center>
      );
    }

    if (error) {
      return (
        <Alert status="error" mb={4} borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontWeight="medium">Error loading assignments</Text>
            <Text fontSize="sm" color={errorTextColor}>
              {error.message}
            </Text>
          </Box>
        </Alert>
      );
    }

    const renderSectionContent = () => {
      switch (activeItem) {
        case 'todays-workout':
          return (
            <VStack spacing={6} align="stretch">
              <Flex justify="space-between" align="center">
                <Box>
                  <Heading size="lg" mb={2} display={{ base: "none", md: "block" }}>Today's Workout</Heading>
                  <Text color="gray.600" display={{ base: "none", md: "block" }}>Your assigned workout for today</Text>
                </Box>
                {/* Refresh Button for Today's Workout */}
                {isDesktop && (
                  <Button
                    leftIcon={<FaRedo />}
                    variant="outline"
                    onClick={handleRefresh}
                    size="sm"
                  >
                    Refresh
                  </Button>
                )}
              </Flex>
              
              {todaysWorkout ? (
                <Box 
                  display="grid"
                  gridTemplateColumns="repeat(auto-fill, minmax(300px, 400px))"
                  gap={{ base: 4, md: 6 }}
                  w="100%"
                  justifyContent="start"
                >
                  <TodaysWorkoutCard
                    assignment={todaysWorkout}
                    onExecute={handleExecuteWorkout}
                  />
                </Box>
              ) : (
                <Box 
                  bg={cardBg} 
                  p={8} 
                  borderRadius="lg" 
                  border="1px" 
                  borderColor="gray.200"
                  textAlign="center"
                >
                  <Text color="gray.500" fontSize="lg" mb={2}>
                    No workout assigned for today
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    Check back later or view your other assignments
                  </Text>
                </Box>
              )}
            </VStack>
          );

        case 'single-workouts':
          const filteredSingleAssignments = (assignments || []).filter(a => a.assignment_type === 'single');
          return (
            <VStack spacing={6} align="stretch" w="100%">
              <Heading size="md" display={{ base: "none", md: "block" }}>Single Workouts</Heading>
              {filteredSingleAssignments.length > 0 ? (
                <Box 
                  display="grid"
                  gridTemplateColumns="repeat(auto-fill, minmax(300px, 400px))"
                  gap={{ base: 4, md: 6 }}
                  w="100%"
                  justifyContent="start"
                >
                  {filteredSingleAssignments.map((assignment) => (
                    <UnifiedAssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onExecute={handleExecuteWorkout}
                      showActions={true}
                      compact={false}
                      onEdit={() => handleEditWorkout(assignment)}
                    />
                  ))}
                </Box>
              ) : (
                <Box bg={cardBg} p={8} borderRadius="lg" border="1px" borderColor="gray.200" textAlign="center">
                  <Text color="gray.500" fontSize="lg" mb={2}>
                    No single workouts found
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    Your single workout assignments will appear here when available
                  </Text>
                </Box>
              )}
            </VStack>
          );

        case 'monthly-plans':
          const filteredMonthlyAssignments = (assignments || []).filter(a => a.assignment_type === 'monthly');
          return (
            <VStack spacing={6} align="stretch" w="100%">
              <Heading size="md" display={{ base: "none", md: "block" }}>Monthly Plans</Heading>
              {filteredMonthlyAssignments.length > 0 ? (
                <Box 
                  display="grid"
                  gridTemplateColumns="repeat(auto-fill, minmax(300px, 400px))"
                  gap={{ base: 4, md: 6 }}
                  w="100%"
                  justifyContent="start"
                >
                  {filteredMonthlyAssignments.map((assignment) => (
                    <UnifiedAssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onExecute={handleExecuteWorkout}
                      showActions={true}
                      compact={false}
                      onEdit={() => handleEditWorkout(assignment)}
                    />
                  ))}
                </Box>
              ) : (
                <Box bg={cardBg} p={8} borderRadius="lg" border="1px" borderColor="gray.200" textAlign="center">
                  <Text color="gray.500" fontSize="lg" mb={2}>
                    No monthly plans found
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    Your monthly training plans will appear here when available
                  </Text>
                </Box>
              )}
            </VStack>
          );

        case 'my-workouts':
          return (
            <VStack spacing={6} align="stretch" w="100%">
              <Heading size="md" display={{ base: "none", md: "block" }}>My Workouts</Heading>
              {createdAssignmentsLoading ? (
                <Center py={8}>
                  <Spinner size="lg" />
                </Center>
              ) : createdAssignments.length > 0 ? (
                <Box 
                  display="grid"
                  gridTemplateColumns="repeat(auto-fill, minmax(300px, 400px))"
                  gap={{ base: 4, md: 6 }}
                  w="100%"
                  justifyContent="start"
                >
                  {createdAssignments.map((assignment) => (
                    <UnifiedAssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      isCoach={false}
                      currentUserId={user?.id}
                      onExecute={handleExecuteWorkout}
                      onEdit={() => handleEditWorkout(assignment)}
                    />
                  ))}
                </Box>
              ) : (
                <Box bg={cardBg} p={8} borderRadius="lg" border="1px" borderColor="gray.200" textAlign="center">
                  <Text color="gray.500" fontSize="lg" mb={2}>
                    No self-created workouts found
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    Workouts you create will appear here
                  </Text>
                </Box>
              )}
            </VStack>
          );

        case 'deleted-items':
          return (
            <VStack spacing={6} align="stretch" w="100%">
              <Heading size="md" display={{ base: "none", md: "block" }}>Deleted Items</Heading>
              {deletedAssignmentsLoading ? (
                <Center py={8}>
                  <Spinner size="lg" />
                </Center>
              ) : deletedAssignments.length > 0 ? (
                <Box 
                  display="grid"
                  gridTemplateColumns="repeat(auto-fill, minmax(300px, 400px))"
                  gap={{ base: 4, md: 6 }}
                  w="100%"
                  justifyContent="start"
                >
                  {deletedAssignments.map((assignment) => (
                    <UnifiedAssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      isCoach={false}
                      currentUserId={user?.id}
                      onExecute={handleExecuteWorkout}
                      onRestore={async () => {
                        try {
                          const { AssignmentService } = await import('../../services/assignmentService');
                          const assignmentService = new AssignmentService();
                          await assignmentService.restoreAssignment(assignment.id);
                          
                          // Refresh data
                          setDeletedAssignments(prev => prev.filter(a => a.id !== assignment.id));
                          refetchAssignments();
                          // Invalidate all assignment queries
                          await queryClient.invalidateQueries({ queryKey: ['unified-assignments'] });
                          await queryClient.invalidateQueries({ queryKey: ['unified-todays-assignment'] });
                          await queryClient.invalidateQueries({ queryKey: ['unified-assignments-by-type'] });
                          
                          // Show success message
                          toast({
                            title: 'Workout restored',
                            description: 'The workout has been restored to your active workouts.',
                            status: 'success',
                            duration: 3000,
                            isClosable: true,
                          });
                        } catch (error) {
                          console.error('Error restoring workout:', error);
                          toast({
                            title: 'Error restoring workout',
                            description: 'There was an error restoring the workout. Please try again.',
                            status: 'error',
                            duration: 3000,
                            isClosable: true,
                          });
                        }
                      }}
                      onPermanentDelete={async () => {
                        try {
                          const { AssignmentService } = await import('../../services/assignmentService');
                          const assignmentService = new AssignmentService();
                          await assignmentService.permanentDeleteAssignment(assignment.id);
                          
                          // Remove from deleted assignments list
                          setDeletedAssignments(prev => prev.filter(a => a.id !== assignment.id));
                          
                          // Show success message
                          toast({
                            title: 'Workout permanently deleted',
                            description: 'The workout has been permanently deleted and moved to history.',
                            status: 'success',
                            duration: 3000,
                            isClosable: true,
                          });
                        } catch (error) {
                          console.error('Error permanently deleting workout:', error);
                          toast({
                            title: 'Error deleting workout',
                            description: 'There was an error permanently deleting the workout. Please try again.',
                            status: 'error',
                            duration: 3000,
                            isClosable: true,
                          });
                        }
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Box bg={cardBg} p={8} borderRadius="lg" border="1px" borderColor="gray.200" textAlign="center">
                  <Text color="gray.500" fontSize="lg" mb={2}>
                    No deleted workouts found
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    Deleted workouts will appear here for 30 days
                  </Text>
                </Box>
              )}
            </VStack>
          );

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
              title=""
              subtitle=""
              showAddButton={true}
              enableDrag={false}
            />
          );

        default:
          const filteredDefaultAssignments = getFilteredAssignments();
          const sectionTitle = activeItem.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

          return (
            <VStack spacing={6} align="stretch">
              <Flex justify="flex-start" align="center">
                <Box>
                  <HStack spacing={3} align="center" display={{ base: "none", md: "flex" }}>
                    <Heading size="lg">{sectionTitle}</Heading>
                    <Badge colorScheme="blue" variant="subtle" borderRadius="full">
                      {filteredDefaultAssignments.length}
                    </Badge>
                  </HStack>
                  <Text color="gray.600" mt={1} display={{ base: "none", md: "block" }}>
                    Your assignments and training plans
                  </Text>
                </Box>
              </Flex>
              
              {/* Desktop Filter Controls - Only show on desktop for all-assignments */}
              {isDesktop && activeItem === 'all-assignments' && (
                <Flex gap={4} align="center" wrap="wrap" w="100%">
                  <Text fontSize="sm" fontWeight="medium" color="gray.600" flexShrink={0}>
                    Filters:
                  </Text>
                  
                  <Select
                    value={assignmentTypeFilter}
                    onChange={(e) => setAssignmentTypeFilter(e.target.value as typeof assignmentTypeFilter)}
                    size="sm"
                    bg={cardBg}
                    minW="140px"
                    maxW="140px"
                  >
                    <option value="all">All Types</option>
                    <option value="single">Single</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </Select>
                  
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    size="sm"
                    bg={cardBg}
                    minW="140px"
                    maxW="140px"
                  >
                    <option value="all">All Status</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </Select>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefresh}
                    leftIcon={<FaRedo />}
                    flexShrink={0}
                    whiteSpace="nowrap"
                  >
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearFilters}
                    flexShrink={0}
                    whiteSpace="nowrap"
                  >
                    Clear Filters
                  </Button>
                </Flex>
              )}
              
              {filteredDefaultAssignments.length > 0 ? (
                <Box 
                  display="grid"
                  gridTemplateColumns="repeat(auto-fill, minmax(300px, 400px))"
                  gap={{ base: 4, md: 6 }}
                  w="100%"
                  justifyContent="start"
                >
                  {filteredDefaultAssignments.map((assignment) => (
                    <UnifiedAssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onExecute={handleExecuteWorkout}
                      showActions={true}
                      compact={false}
                      onEdit={() => handleEditWorkout(assignment)}
                    />
                  ))}
                </Box>
              ) : (
                <Box 
                  bg={cardBg} 
                  p={8} 
                  borderRadius="lg" 
                  border="1px" 
                  borderColor="gray.200"
                  textAlign="center"
                >
                  <Text color="gray.500" fontSize="lg" mb={2}>
                    No {activeItem.replace('-', ' ')} found
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    Your assignments will appear here when available
                  </Text>
                </Box>
              )}
            </VStack>
          );
      }
    };

    return renderSectionContent();
  };

  return (
    <Box bg={pageBackgroundColor} minH="100vh" data-testid="athlete-workouts">
      {/* Desktop Sidebar - Only show on desktop */}
      {isDesktop && (
        <WorkoutsSidebar
          sections={workoutsSections}
          activeItem={activeItem}
          onItemClick={handleItemClick}
          createWorkoutAction={() => navigate('/athlete/workout-creator-new')}
          workoutCounts={workoutCounts}
        />
      )}

      {/* Main Content */}
      <Box
        ml={{ 
          base: 0, 
          lg: "280px"
        }}
        pb={{ base: 24, lg: 8 }}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        minH="100vh"
      >
        {/* Desktop Header - Only show on desktop */}
        {isDesktop && (
          <PageHeader
            title="Workouts"
            subtitle="Your Unified Training System"
            icon={BiRun}
          />
        )}

        {/* Mobile Navigation - Only show on mobile */}
        {isMobile && (
          <VStack spacing={4} align="stretch" mb={2}>
            
            {/* Mobile Section Navigation */}
            <Box>
              <Select
                value={activeItem}
                onChange={(e) => setActiveItem(e.target.value as WorkoutsSectionId)}
                bg={cardBg}
                size="md"
                borderColor="blue.200"
                _focus={{
                  borderColor: "blue.500",
                  boxShadow: "0 0 0 1px blue.500"
                }}
              >
                <option value="todays-workout">Today's Workout</option>
                <option value="all-assignments">All Assignments</option>
                <option value="single-workouts">Single Workouts</option>
                <option value="my-workouts">My Workouts</option>
                <option value="weekly-plans">Weekly Plans</option>
                <option value="monthly-plans">Monthly Plans</option>
                <option value="deleted-items">Deleted Items</option>
              </Select>
            </Box>
          </VStack>
        )}

        {/* Main Content */}
        {renderContent()}
      </Box>

      {/* Mobile Filter Modal - Only accessible on mobile */}
      {isMobile && (
        <Modal isOpen={isFiltersOpen} onClose={onFiltersClose} size="md">
          <ModalOverlay />
          <ModalContent mx={4}>
            <ModalHeader>
              Filter {activeItem.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {(activeItem === 'all-assignments' || activeItem === 'single-workouts') ? (
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>Assignment Type</Text>
                    <Select
                      value={assignmentTypeFilter}
                      onChange={(e) => setAssignmentTypeFilter(e.target.value as typeof assignmentTypeFilter)}
                      bg={cardBg}
                    >
                      <option value="all">All Types</option>
                      <option value="single">Single</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </Select>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>Status</Text>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                      bg={cardBg}
                    >
                      <option value="all">All Status</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </Select>
                  </Box>
                  <Button
                    onClick={() => {
                      handleClearFilters();
                      onFiltersClose();
                    }}
                    variant="outline"
                    mt={2}
                  >
                    Clear All Filters
                  </Button>
                </VStack>
              ) : (
                <VStack spacing={4} align="center" py={4}>
                  <Text color="gray.500" textAlign="center">
                    Filters are only available for "All Assignments" and "Single Workouts" sections.
                  </Text>
                  <Button
                    onClick={() => {
                      setActiveItem('all-assignments');
                      onFiltersClose();
                    }}
                    colorScheme="blue"
                  >
                    Go to All Assignments
                  </Button>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}





      {/* Mobile Bottom Navigation - Only show on mobile */}
      {isMobile && (
        <MobileBottomNavigation
          onCreateWorkout={() => navigate('/athlete/workout-creator-new')}
          onRefresh={handleRefresh}
          onFilters={onFiltersOpen}
          onSettings={() => navigate('/athlete/settings')}
        />
      )}
    </Box>
  );
} 