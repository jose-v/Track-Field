import React, { useState } from 'react';
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
  HStack
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BiRun } from 'react-icons/bi';
import { FaPlus, FaRedo, FaCalendarDay } from 'react-icons/fa';
import { WorkoutsSidebar } from '../../components';
import PageHeader from '../../components/PageHeader';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { usePageHeader } from '../../hooks/usePageHeader';
import {
  UnifiedAssignmentCard,
  TodaysWorkoutCard,
  CompactAssignmentCard,
  UnifiedWorkoutExecution,
  useUnifiedAssignments,
  useUnifiedTodaysWorkout
} from '../../components/unified';

type WorkoutsSectionId = 'todays-workout' | 'all-assignments' | 'weekly-plans' | 'monthly-plans';

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

  // Unified assignment system hooks
  const { 
    data: assignments, 
    isLoading: loadingAssignments, 
    error: assignmentsError,
    refetch: refetchAssignments
  } = useUnifiedAssignments(user?.id);
  
  const { 
    data: todaysWorkout, 
    isLoading: loadingToday,
    error: todayError,
    refetch: refetchToday
  } = useUnifiedTodaysWorkout(user?.id);

  // Sidebar constants (matching existing layout)
  const mainSidebarWidth = 70; // This should match your actual sidebar width

  // Workout execution handlers
  const handleExecuteWorkout = (assignmentId: string) => {
    setExecutingAssignmentId(assignmentId);
  };

  const handleExitExecution = () => {
    setExecutingAssignmentId(null);
  };

  const handleCompleteWorkout = () => {
    setExecutingAssignmentId(null);
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

  // Filter assignments by type
  const getFilteredAssignments = () => {
    if (!assignments) return [];
    
    switch (activeItem) {
      case 'weekly-plans':
        return assignments.filter(a => a.assignment_type === 'weekly');
      case 'monthly-plans':
        return assignments.filter(a => a.assignment_type === 'monthly');
      case 'all-assignments':
      default:
        return assignments;
    }
  };

  // Get workout counts for sidebar (matching expected interface)
  const workoutCounts = {
    today: todaysWorkout ? 1 : 0,
    thisWeek: assignments?.filter(a => a.assignment_type === 'weekly').length || 0,
    total: assignments?.length || 0,
    completed: assignments?.filter(a => a.status === 'completed').length || 0,
  };

  // If executing a workout, show the execution component
  if (executingAssignmentId) {
    const assignmentToExecute = assignments?.find(a => a.id === executingAssignmentId);
    if (assignmentToExecute) {
      return (
        <Box bg={pageBackgroundColor} minH="100vh">
          <UnifiedWorkoutExecution
            assignment={assignmentToExecute}
            onComplete={handleCompleteWorkout}
            onExit={handleExitExecution}
            isOpen={true}
          />
        </Box>
      );
    }
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
                  <Heading size="lg" mb={2}>Today's Workout</Heading>
                  <Text color="gray.600">Your assigned workout for today</Text>
                  </Box>
                  <Button
                    leftIcon={<FaRedo />}
                  variant="outline"
                    onClick={handleRefresh}
                  size="sm"
                  >
                    Refresh
                  </Button>
              </Flex>
              
              {todaysWorkout ? (
                <TodaysWorkoutCard
                  assignment={todaysWorkout}
                  onExecute={handleExecuteWorkout}
                />
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

        default:
          const filteredAssignments = getFilteredAssignments();
          const sectionTitle = workoutsSections.find(s => s.id === activeItem)?.title || 'Assignments';

    return (
            <VStack spacing={6} align="stretch">
              <Flex justify="space-between" align="center">
                <Box>
                  <HStack spacing={3} align="center">
                    <Heading size="lg">{sectionTitle}</Heading>
                    <Badge colorScheme="blue" variant="subtle" borderRadius="full">
                      {filteredAssignments.length}
                    </Badge>
                  </HStack>
                  <Text color="gray.600" mt={1}>
                    Your assignments and training plans
                  </Text>
                </Box>
            <Button
                  leftIcon={<FaRedo />}
                  variant="outline"
                  onClick={handleRefresh}
                  size="sm"
                >
                  Refresh
            </Button>
          </Flex>
              
              {filteredAssignments.length > 0 ? (
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  {filteredAssignments.map((assignment) => (
                    <UnifiedAssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onExecute={handleExecuteWorkout}
                      showActions={true}
                      compact={false}
                    />
                  ))}
                </SimpleGrid>
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
      {/* Workouts Sidebar */}
      <WorkoutsSidebar
        sections={workoutsSections}
        activeItem={activeItem}
        onItemClick={handleItemClick}
        createWorkoutAction={() => navigate('/athlete/workout-creator-new')}
        workoutCounts={workoutCounts}
      />

      {/* Main Content */}
      <Box
        ml={{ 
          base: 0, 
          md: `${mainSidebarWidth - 50}px`, 
          lg: mainSidebarWidth === 70 
            ? `${mainSidebarWidth + 280 - 50}px`
            : `${mainSidebarWidth + 280 - 180}px`
        }}
        mr={{ 
          base: 0, 
          lg: mainSidebarWidth === 70 ? "30px" : "20px"
        }}
        pt={isHeaderVisible ? "-2px" : "-82px"}
        pb={{ base: 24, lg: 8 }}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        minH="100vh"
        px={{ base: "10px", md: 0 }}
        py={8}
      >
        {/* Desktop Header */}
        <PageHeader
          title="Workouts"
          subtitle="Your Unified Training System"
          icon={BiRun}
        />

        {/* Main Content */}
        {renderContent()}
            </Box>
    </Box>
  );
} 