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
import { FaTimes, FaEdit, FaTrash, FaCalendarAlt, FaShare } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useWorkoutStore } from '../lib/workoutStore';
import { startTodaysWorkoutExecution } from '../utils/monthlyPlanWorkoutHelper';
import { WorkoutExecutionRouter } from './WorkoutExecutionRouter';

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
  
  // Workout execution state
  const [execModal, setExecModal] = useState({
    isOpen: false,
    workout: null as any,
    exerciseIdx: 0,
    timer: 0,
    running: false
  });
  
  const { user } = useAuth();
  const workoutStore = useWorkoutStore();
  const toast = useToast();
  
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
      const workoutStarted = await startTodaysWorkoutExecution(
        user.id,
        workoutStore,
        setExecModal
      );

      if (!workoutStarted) {
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
                Today's Schedule
              </Text>
              
              {/* Close Button */}
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

            {/* Menu Content */}
            <VStack spacing={0} flex="1" align="stretch" p={4}>
              {/* Edit Schedule */}
              <Button
                leftIcon={<FaEdit />}
                variant="ghost"
                size="lg"
                justifyContent="flex-start"
                h="60px"
                color={drawerText}
                _hover={{ bg: buttonHoverBg }}
                onClick={() => {
                  setIsDrawerOpen(false);
                  onMenuClick?.();
                }}
              >
                Edit Schedule
              </Button>
              
              <Divider />
              
              {/* View Calendar */}
              <Button
                leftIcon={<FaCalendarAlt />}
                variant="ghost"
                size="lg"
                justifyContent="flex-start"
                h="60px"
                color={drawerText}
                _hover={{ bg: buttonHoverBg }}
                onClick={() => {
                  setIsDrawerOpen(false);
                  // Add calendar navigation logic here
                }}
              >
                View Full Calendar
              </Button>
              
              <Divider />
              
              {/* Share Schedule */}
              <Button
                leftIcon={<FaShare />}
                variant="ghost"
                size="lg"
                justifyContent="flex-start"
                h="60px"
                color={drawerText}
                _hover={{ bg: buttonHoverBg }}
                onClick={() => {
                  setIsDrawerOpen(false);
                  // Add share functionality here
                }}
              >
                Share Schedule
              </Button>
              
              <Divider />
              
              {/* Delete Schedule */}
              <Button
                leftIcon={<FaTrash />}
                variant="ghost"
                size="lg"
                justifyContent="flex-start"
                h="60px"
                color="red.500"
                _hover={{ bg: buttonHoverBg }}
                onClick={() => {
                  setIsDrawerOpen(false);
                  // Add delete confirmation logic here
                }}
              >
                Delete Schedule
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Workout Execution Modal */}
      {execModal.workout && (
        <WorkoutExecutionRouter
          isOpen={execModal.isOpen}
          onClose={() => setExecModal(prev => ({ ...prev, isOpen: false }))}
          workout={execModal.workout}
          exerciseIdx={execModal.exerciseIdx}
          timer={execModal.timer}
          running={execModal.running}
          onUpdateTimer={(timer) => setExecModal(prev => ({ ...prev, timer }))}
          onUpdateRunning={(running) => setExecModal(prev => ({ ...prev, running }))}
          onNextExercise={() => {
            // Handle next exercise logic
            const nextIdx = execModal.exerciseIdx + 1;
            if (nextIdx < execModal.workout.exercises.length) {
              setExecModal(prev => ({ ...prev, exerciseIdx: nextIdx, timer: 0, running: false }));
            }
          }}
          onPreviousExercise={() => {
            // Handle previous exercise logic
            const prevIdx = execModal.exerciseIdx - 1;
            if (prevIdx >= 0) {
              setExecModal(prev => ({ ...prev, exerciseIdx: prevIdx, timer: 0, running: false }));
            }
          }}
          onFinishWorkout={() => {
            setExecModal({ isOpen: false, workout: null, exerciseIdx: 0, timer: 0, running: false });
            toast({
              title: 'Workout completed!',
              description: 'Great job on finishing your workout',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
          }}
          onShowVideo={(exerciseName, videoUrl) => {
            // Handle video display - could open a video modal
            console.log('Show video for:', exerciseName, videoUrl);
          }}
        />
      )}
    </>
  );
}; 