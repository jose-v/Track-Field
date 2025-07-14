import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Icon,
  IconButton,
  Button,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  useColorModeValue,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { BsThreeDots } from 'react-icons/bs';
import { FaTimes, FaEdit, FaTrash, FaCalendarAlt, FaShare, FaPlay, FaExternalLinkAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { UnifiedWorkoutExecution } from './UnifiedWorkoutExecution';
import { useUnifiedAssignments } from '../hooks/useUnifiedAssignments';
import { useProfile } from '../hooks/useProfile';
import { useNavigate } from 'react-router-dom';

interface TodayWorkout {
  time: string;
  activity: string;
  location: string;
}

interface MobileTodayCardProps {
  workouts?: TodayWorkout[];
  onStartWorkout?: () => void;
  onMenuClick?: () => void;
}

export const MobileTodayCard: React.FC<MobileTodayCardProps> = ({
  workouts = [
    { time: '7AM', activity: 'Gym', location: '' },
    { time: '5PM', activity: 'Track field', location: '' }
  ],
  onStartWorkout,
  onMenuClick
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Unified execution state
  const [executingAssignmentId, setExecutingAssignmentId] = useState<string | null>(null);
  const [cachedAssignmentForExecution, setCachedAssignmentForExecution] = useState<any>(null);
  
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const toast = useToast();
  const navigate = useNavigate();
  
  // Use unified assignments instead of workouts hook
  const { data: assignments, isLoading: assignmentsLoading } = useUnifiedAssignments(user?.id);
  
  // Get top 3 available assignments (not completed)
  const availableAssignments = assignments?.filter(assignment => 
    assignment.status !== 'completed'
  ).slice(0, 3) || [];
  
  // Dark theme colors to match other cards
  const cardBg = 'gray.800';
  const textColor = 'white';
  const timeColor = 'gray.400';
  const badgeBg = 'gray.600';
  const startButtonBg = 'green.500';
  
  // Drawer colors
  const drawerBg = useColorModeValue('white', 'gray.800');
  const drawerBorder = useColorModeValue('gray.200', 'gray.600');
  const drawerText = useColorModeValue('gray.700', 'gray.200');
  const buttonHoverBg = useColorModeValue('gray.100', 'gray.700');

  // Function to start today's workout
  const handleStartTodaysWorkout = async () => {
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to start your workout',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Find today's assignment
      const todayStr = new Date().toISOString().split('T')[0];
      const todaysAssignment = availableAssignments.find(assignment => 
        assignment.start_date?.startsWith(todayStr)
      );

      if (todaysAssignment) {
        setCachedAssignmentForExecution(todaysAssignment);
        setExecutingAssignmentId(todaysAssignment.id);
      } else {
        toast({
          title: 'No workout scheduled',
          description: 'You don\'t have a workout scheduled for today',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error starting today\'s workout:', error);
      toast({
        title: 'Error starting workout',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle assignment execution
  const handleExecuteAssignment = (assignmentId: string) => {
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to start your workout',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Find the assignment to execute
    const assignment = availableAssignments.find(a => a.id === assignmentId);
    if (!assignment) {
      toast({
        title: 'Assignment not found',
        description: 'Could not find the selected assignment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Convert assignment to workout format for the execution modal
    const workoutForExecution = {
      id: assignment.id,
      name: assignment.exercise_block?.workout_name || 'Workout',
      description: assignment.exercise_block?.description || '',
      type: assignment.exercise_block?.workout_type || 'strength',
      exercises: assignment.exercise_block?.exercises || [],
      blocks: assignment.exercise_block?.blocks || [],
      is_block_based: assignment.exercise_block?.is_block_based || false,
      location: assignment.exercise_block?.location || '',
      duration: assignment.exercise_block?.estimated_duration || '',
      user_id: user.id,
      created_at: assignment.created_at
    };

    // Get current progress from the assignment
    const currentProgress = assignment.progress || {
      current_exercise_index: 0,
      current_set: 1,
      current_rep: 1
    };

    // Close the drawer and cache assignment for execution
    setIsDrawerOpen(false);
    setCachedAssignmentForExecution(assignment);
    setExecutingAssignmentId(assignmentId);


  };

  // Function to navigate to workouts page
  const handleGoToWorkouts = () => {
    navigate('/athlete/workouts');
    setIsDrawerOpen(false);
  };

  // Debug logging for context
  if (isDrawerOpen) {
    console.log('Drawer user:', user);
    console.log('Drawer profile:', profile);
    console.log('Drawer assignments:', assignments);
    console.log('Available assignments:', availableAssignments);
  }

  return (
    <>
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={4}
        boxShadow="lg"
        h="120px"
        position="relative"
      >
        {/* Header with Today badge */}
        <Box mb={2}>
          <Badge
            bg={badgeBg}
            color={textColor}
            fontSize="sm"
            px={3}
            py={1}
            borderRadius="lg"
            fontWeight="normal"
          >
            Today
          </Badge>
        </Box>

        {/* Main content area */}
        <Box h="calc(100% - 10px)" pt={1}>
          {/* Left side: Workout schedule */}
          <VStack spacing={0} align="flex-start">
            {workouts.map((workout, index) => (
              <HStack key={index} spacing={3}>
                <Text fontSize="md" color={timeColor} fontWeight="normal">
                  {workout.time}
                </Text>
                <Text fontSize="md" color={textColor} fontWeight="normal">
                  {workout.activity}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* START button - Absolute positioned */}
        <Button
          position="absolute"
          top="50%"
          right="80px"
          transform="translateY(-50%)"
          bg={startButtonBg}
          color="white"
          borderRadius="full"
          w="70px"
          h="70px"
          fontSize="md"
          fontWeight="bold"
          onClick={handleStartTodaysWorkout}
          isLoading={isLoading}
          loadingText="..."
          _hover={{ bg: 'green.600' }}
          _active={{ bg: 'green.700' }}
        >
          START
        </Button>

        {/* Three dots menu in bottom right */}
        <Box position="absolute" bottom={4} right={4}>
          <IconButton
            aria-label="Menu"
            icon={<Icon as={BsThreeDots} />}
            size="sm"
            variant="ghost"
            color={textColor}
            onClick={() => setIsDrawerOpen(true)}
            _hover={{ bg: 'gray.700' }}
          />
        </Box>
      </Box>
      
      {/* Bottom Drawer Menu */}
      <Modal 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        motionPreset="slideInBottom"
        closeOnOverlayClick={true}
      >
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent 
          position="fixed"
          bottom="0"
          left="0"
          right="0"
          top="auto"
          height="50vh"
          maxHeight="50vh"
          minHeight="300px"
          borderRadius="16px 16px 0 0"
          bg={drawerBg}
          border={`1px solid ${drawerBorder}`}
          boxShadow="2xl"
          margin="0"
          maxWidth="100vw"
          width="100vw"
          display="flex"
          flexDirection="column"
        >
          <ModalBody p={0} h="100%" display="flex" flexDirection="column">
            {/* Header */}
            <Flex 
              justify="space-between" 
              align="center" 
              p={6} 
              borderBottom={`1px solid ${drawerBorder}`}
              flexShrink={0}
            >
              <Text fontSize="xl" fontWeight="bold" color={drawerText}>
                Top Workouts
              </Text>
              <IconButton
                aria-label="Close menu"
                icon={<FaTimes />}
                size="lg"
                variant="ghost"
                borderRadius="full"
                onClick={() => setIsDrawerOpen(false)}
                color={drawerText}
                _hover={{ bg: buttonHoverBg }}
                fontSize="18px"
              />
            </Flex>
            {/* List of top 3 workouts */}
            <VStack spacing={2} flex="1" align="stretch" p={4}>
              {assignmentsLoading ? (
                <Text color={drawerText}>Loading assignments...</Text>
              ) : availableAssignments.length > 0 ? (
                availableAssignments.map((assignment) => (
                  <Flex key={assignment.id} align="center" justify="space-between" bg={cardBg} borderRadius="md" px={4} py={3} boxShadow="sm">
                    <Flex align="center" minW={0} flex="1">
                      <Text fontWeight="medium" color={drawerText} isTruncated>
                      {assignment.exercise_block?.workout_name || assignment.meta?.workout_name || 'Workout'}
                    </Text>
                      <IconButton
                        aria-label="Go to workout page"
                        icon={<FaExternalLinkAlt />}
                        size="sm"
                        variant="ghost"
                        color={drawerText}
                        ml={2}
                        onClick={() => {
                          setIsDrawerOpen(false);
                          handleGoToWorkouts();
                        }}
                        _hover={{ bg: buttonHoverBg }}
                      />
                    </Flex>
                                      <IconButton
                    aria-label="Start workout"
                    icon={<FaPlay />}
                    size="md"
                    variant="ghost"
                    color="green.500"
                    borderRadius="full"
                    ml={2}
                    onClick={() => {
                      setIsDrawerOpen(false);
                      handleExecuteAssignment(assignment.id);
                    }}
                  />
                  </Flex>
                ))
              ) : (
                <VStack spacing={3} py={6}>
                  <Text color={drawerText} textAlign="center" fontSize="md">
                    No assignments available
                  </Text>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={handleGoToWorkouts}
                  >
                    View All Workouts
                  </Button>
                </VStack>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Unified Workout Execution */}
      {executingAssignmentId && cachedAssignmentForExecution && (
        <UnifiedWorkoutExecution
          assignment={cachedAssignmentForExecution}
          isOpen={!!executingAssignmentId}
          onExit={() => {
            setExecutingAssignmentId(null);
            setCachedAssignmentForExecution(null);
          }}
          onComplete={() => {
            setExecutingAssignmentId(null);
            setCachedAssignmentForExecution(null);
            toast({
              title: 'Workout completed!',
              description: 'Great job on finishing your workout',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
          }}
        />
      )}
    </>
  );
}; 