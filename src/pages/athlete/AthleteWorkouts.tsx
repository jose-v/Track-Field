import React, { useState, useEffect } from 'react';
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
  useBreakpointValue
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BiRun } from 'react-icons/bi';
import { FaPlus, FaRedo, FaCalendarDay } from 'react-icons/fa';
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

type WorkoutsSectionId = 'todays-workout' | 'all-assignments' | 'single-workouts' | 'weekly-plans' | 'monthly-plans';

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
        }
      ]
    }
  ];

export function AthleteWorkouts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState<WorkoutsSectionId>('todays-workout');
  const [executingAssignmentId, setExecutingAssignmentId] = useState<string | null>(null);
  
  // Enhanced filtering states
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<'all' | 'single' | 'weekly' | 'monthly'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'in_progress' | 'completed'>('all');
  
  // Mobile filter modal
  const { isOpen: isFiltersOpen, onOpen: onFiltersOpen, onClose: onFiltersClose } = useDisclosure();

  // Execution state management - robust solution
  const [cachedAssignmentForExecution, setCachedAssignmentForExecution] = useState<any>(null);
  


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
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filteredAssignments = filteredAssignments.filter(a => a.status === statusFilter);
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
                  w={{ base: "100%", md: "auto" }}
                  minW={{ base: "100%", md: "340px" }}
                  maxW={{ base: "100%", md: "340px" }}
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
                <option value="weekly-plans">Weekly Plans</option>
                <option value="monthly-plans">Monthly Plans</option>
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