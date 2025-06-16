import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  IconButton,
  Icon,
  Progress,
  Divider,
  useColorModeValue,
  useToast,
  Circle,
  SimpleGrid,
  Badge,
  Flex,
  Input
} from '@chakra-ui/react';
import { FaRegClock, FaRunning, FaPlayCircle, FaDumbbell, FaCheckCircle } from 'react-icons/fa';
import { CheckIcon, ChevronLeftIcon } from '@chakra-ui/icons';
import { RunTimeInput } from './RunTimeInput';
import { isRunExercise, validateTime } from '../utils/exerciseUtils';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  rest?: number;
  distance?: number;
  notes?: string;
}

interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
}

interface ExerciseExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: Workout | null;
  exerciseIdx: number;
  timer: number;
  running: boolean;
  onUpdateTimer: (timer: number) => void;
  onUpdateRunning: (running: boolean) => void;
  onNextExercise: () => void;
  onPreviousExercise: () => void;
  onFinishWorkout: () => void;
  onShowVideo: (exerciseName: string, videoUrl: string) => void;
}

// Helper function to get video URL for an exercise
function getVideoUrl(exerciseName: string): string {
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

export const ExerciseExecutionModal: React.FC<ExerciseExecutionModalProps> = ({
  isOpen,
  onClose,
  workout,
  exerciseIdx,
  timer,
  running,
  onUpdateTimer,
  onUpdateRunning,
  onNextExercise,
  onPreviousExercise,
  onFinishWorkout,
  onShowVideo
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerValueRef = useRef(timer);

  // State for run time tracking
  const [runTime, setRunTime] = useState({
    minutes: 0,
    seconds: 0,
    hundredths: 0
  });

  // State for RPE rating
  const [showRPEScreen, setShowRPEScreen] = useState(false);
  const [selectedRPE, setSelectedRPE] = useState<number | null>(null);
  const [isLoggingRPE, setIsLoggingRPE] = useState(false);

  // State for set tracking
  const [setData, setSetData] = useState<Array<{
    completed: boolean;
    actualReps: number;
    targetReps: number;
  }>>([]);

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const modalHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const modalHeaderBorderColor = useColorModeValue('gray.200', 'gray.600');
  const modalHeadingColor = useColorModeValue('gray.800', 'white');
  const modalTextColor = useColorModeValue('gray.500', 'gray.400');
  const modalSpanColor = useColorModeValue('gray.500', 'gray.400');
  const modalIconBg = useColorModeValue('white', 'gray.800');

  // Initialize set data when exercise changes
  useEffect(() => {
    if (workout && workout.exercises[exerciseIdx]) {
      const currentExercise = workout.exercises[exerciseIdx];
      
      // Get exercise data from nested structure
      const exerciseData = (currentExercise as any)?.exercises?.[0] || 
                          (workout as any)?.exercises?.[exerciseIdx] ||
                          (workout as any)?.exercises?.[exerciseIdx]?.exercises?.[0] ||
                          currentExercise;
      
      const sets = parseInt(exerciseData?.sets || currentExercise?.sets || '3');
      const reps = parseInt(exerciseData?.reps || currentExercise?.reps || '10');
      
      const newSetData = Array(sets).fill(null).map(() => ({
        completed: false,
        actualReps: reps,
        targetReps: reps
      }));
      setSetData(newSetData);
    }
  }, [exerciseIdx, workout]);

  // Update timer ref whenever timer changes
  useEffect(() => {
    timerValueRef.current = timer;
  }, [timer]);

  // Timer effect
  useEffect(() => {
    if (isOpen && running) {
      timerRef.current = setInterval(() => {
        onUpdateTimer(timerValueRef.current + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, running]);

  // Reset run time when exercise changes
  useEffect(() => {
    if (isOpen) {
      setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
    }
  }, [exerciseIdx, isOpen]);

  // Helper functions for set tracking
  const handleSetComplete = (setIndex: number) => {
    setSetData(prev => prev.map((set, idx) => 
      idx === setIndex ? { ...set, completed: !set.completed } : set
    ));
  };

  const handleRepsChange = (setIndex: number, reps: number) => {
    setSetData(prev => prev.map((set, idx) => 
      idx === setIndex ? { ...set, actualReps: Math.max(0, reps) } : set
    ));
  };

  const getCompletedSetsCount = () => {
    return setData.filter(set => set.completed).length;
  };

  const isStrengthExercise = (exerciseName: string) => {
    return !isRunExercise(exerciseName);
  };

  const handleDone = async () => {
    if (!workout || !workout.exercises[exerciseIdx]) return;
    
    const currentExercise = workout.exercises[exerciseIdx];
    const totalExercises = workout.exercises.length;
    const isRun = isRunExercise(currentExercise.name);
    
    // Validate and save data based on exercise type
    if (isRun) {
      // Handle run exercise validation and saving
      let timeValidation: { isValid: boolean; error?: string } = { isValid: true };
      
      if (runTime.minutes > 0 || runTime.seconds > 0 || runTime.hundredths > 0) {
        timeValidation = validateTime(runTime.minutes, runTime.seconds, runTime.hundredths);
        
        if (!timeValidation.isValid) {
          toast({
            title: 'Invalid Time',
            description: timeValidation.error || 'Please enter a valid time',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }
      }
      
      // Save exercise result if time was recorded for run exercise
      if (timeValidation.isValid && user?.id && (runTime.minutes > 0 || runTime.seconds > 0 || runTime.hundredths > 0)) {
        try {
          await api.exerciseResults.save({
            athleteId: user.id,
            workoutId: workout.id,
            exerciseIndex: exerciseIdx,
            exerciseName: currentExercise.name,
            timeMinutes: runTime.minutes,
            timeSeconds: runTime.seconds,
            timeHundredths: runTime.hundredths,
            notes: `Workout timer: ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`
          });
          
          toast({
            title: 'Time Recorded!',
            description: `Your time of ${runTime.minutes.toString().padStart(2, '0')}:${runTime.seconds.toString().padStart(2, '0')}.${runTime.hundredths.toString().padStart(2, '0')} has been saved.`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } catch (error) {
          console.error('Error saving exercise result:', error);
          toast({
            title: 'Error Saving Time',
            description: 'Your time could not be saved, but exercise completion was recorded.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    } else {
      // Handle strength exercise - save set/rep data
      const completedSets = getCompletedSetsCount();
      const totalSets = setData.length;
      
      if (user?.id && completedSets > 0) {
        try {
          // Create notes with set/rep breakdown
          const setBreakdown = setData
            .map((set, idx) => `Set ${idx + 1}: ${set.actualReps}/${set.targetReps} reps ${set.completed ? '✓' : '○'}`)
            .join(', ');
          
          const exerciseName = currentExercise?.name || (currentExercise as any)?.exercises?.[0]?.name || (workout as any)?.exercises?.[exerciseIdx]?.name || (workout as any)?.exercises?.[exerciseIdx]?.exercises?.[0]?.name || (currentExercise as any)?.title || (currentExercise as any)?.exercise_name || (currentExercise as any)?.exerciseName || (currentExercise as any)?.label || `Exercise ${exerciseIdx + 1}`;
          
          await api.exerciseResults.save({
            athleteId: user.id,
            workoutId: workout.id,
            exerciseIndex: exerciseIdx,
            exerciseName: exerciseName,
            setsCompleted: completedSets,
            repsCompleted: setData.reduce((total, set) => total + (set.completed ? set.actualReps : 0), 0),
            notes: `${setBreakdown}. Workout timer: ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`
          });
          
          toast({
            title: 'Sets Recorded!',
            description: `${completedSets}/${totalSets} sets completed`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } catch (error) {
          console.error('Error saving exercise result:', error);
          toast({
            title: 'Error Saving Data',
            description: 'Your set data could not be saved, but exercise completion was recorded.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    }
    
    // Check if there are more exercises
    if (exerciseIdx + 1 < totalExercises) {
      // Reset run time for next exercise
      setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
      onNextExercise();
      return;
    }
    
    // Last exercise completed - show RPE rating screen
    setShowRPEScreen(true);
  };

  const handleRPESubmit = async () => {
    if (!selectedRPE || !workout || !user?.id) return;

    setIsLoggingRPE(true);
    try {
      // console.log('ExerciseExecutionModal: Logging RPE', selectedRPE, 'for workout', workout.id);
      
      const insertData = {
        athlete_id: user.id,
        workout_id: workout.id,
        exercise_index: 0,
        exercise_name: 'Workout RPE',
        rpe_rating: selectedRPE,
        notes: `Overall workout RPE: ${selectedRPE}/10`,
        completed_at: new Date().toISOString()
      };
      
      // Log the RPE rating in exercise_results table
      const { data: insertedData, error: rpeError } = await supabase
        .from('exercise_results')
        .insert(insertData)
        .select();

      if (rpeError) {
        console.error('ExerciseExecutionModal: Error inserting RPE:', rpeError);
        throw new Error('Failed to log RPE rating');
      }

              // console.log('ExerciseExecutionModal: Successfully logged RPE rating, inserted data:', insertedData);

      toast({
        title: 'Great job! 💪',
        description: `Workout completed with ${selectedRPE}/10 RPE`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      // Complete the workout
      onFinishWorkout();
      
      // Reset RPE state
      setShowRPEScreen(false);
      setSelectedRPE(null);
      
    } catch (error) {
      console.error('Error logging RPE:', error);
      toast({
        title: 'Error logging RPE',
        description: 'RPE rating could not be saved, but workout completion was recorded.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      
      // Still complete the workout even if RPE fails
      onFinishWorkout();
      setShowRPEScreen(false);
      setSelectedRPE(null);
    } finally {
      setIsLoggingRPE(false);
    }
  };

  const handleSkipRPE = () => {
    // Complete workout without RPE rating
    onFinishWorkout();
    setShowRPEScreen(false);
    setSelectedRPE(null);
  };

  const getRPEColor = (rating: number) => {
    if (rating <= 3) return 'green.500';
    if (rating <= 6) return 'yellow.500';
    if (rating <= 8) return 'orange.500';
    return 'red.500';
  };

  const getRPELabel = (rating: number) => {
    if (rating <= 3) return 'Easy';
    if (rating <= 5) return 'Moderate';
    if (rating <= 7) return 'Hard';
    if (rating <= 9) return 'Very Hard';
    return 'Max Effort';
  };

  const handleVideoClick = () => {
    if (workout && workout.exercises[exerciseIdx]) {
      const currentExercise = workout.exercises[exerciseIdx];
      const exerciseName = currentExercise?.name || (currentExercise as any)?.exercises?.[0]?.name || (workout as any)?.exercises?.[exerciseIdx]?.name || (workout as any)?.exercises?.[exerciseIdx]?.exercises?.[0]?.name || (currentExercise as any)?.title || (currentExercise as any)?.exercise_name || (currentExercise as any)?.exerciseName || (currentExercise as any)?.label || `Exercise ${exerciseIdx + 1}`;
      const videoUrl = getVideoUrl(exerciseName);
      onShowVideo(exerciseName, videoUrl);
    }
  };

  if (!workout || !workout.exercises[exerciseIdx]) {
    return null;
  }

  const currentExercise = workout.exercises[exerciseIdx];
  
  // Debug logging (reduced for performance)
  if (process.env.NODE_ENV === 'development' && !currentExercise?.name) {
    console.warn('ExerciseExecutionModal - Missing exercise name:', {
      workout: workout?.name,
      exerciseIdx,
      hasCurrentExercise: !!currentExercise,
      totalExercises: workout?.exercises?.length
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: 'full', md: 'md' }} motionPreset="none">
      <ModalOverlay 
        bg={{ base: 'blackAlpha.700', md: 'blackAlpha.600' }}
        backdropFilter={{ base: 'none', md: 'blur(10px)' }}
      />
      <ModalContent 
        borderRadius={{ base: '0', md: '2xl' }}
        overflow="hidden"
        boxShadow={{ base: 'none', md: '2xl' }}
        bg={cardBg}
        mx={{ base: 0, md: 4 }}
        w={{ base: '100vw', md: undefined }}
        h={{ base: '100vh', md: 'auto' }}
        maxW={{ base: '100vw', md: '500px' }}
        maxH={{ base: '100vh', md: '85vh' }}
        p={0}
      >
        {/* Conditional Header - Different for RPE screen */}
        <Box 
          h="120px" 
          bg={showRPEScreen 
            ? "linear-gradient(135deg, #38A169 0%, #68D391 50%, #4FD1C7 100%)" 
            : (running 
              ? "linear-gradient(135deg, #38A169 0%, #68D391 50%, #4FD1C7 100%)" 
              : "linear-gradient(135deg, #4299E1 0%, #90CDF4 50%, #A78BFA 100%)"
            )
          } 
          position="relative"
          overflow="hidden"
        >
          {/* Animated background pattern */}
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            opacity="0.1"
            bgImage="radial-gradient(circle at 2px 2px, white 1px, transparent 0)"
            bgSize="20px 20px"
          />
          
          {/* Header Content */}
          <VStack 
            position="absolute" 
            top="50%" 
            left="50%" 
            transform="translate(-50%, -50%)"
            spacing={1}
            zIndex="2"
          >
            {showRPEScreen ? (
              <>
                <Heading 
                  size="lg" 
                  textAlign="center"
                  color="white"
                  lineHeight="shorter"
                  fontWeight="bold"
                >
                  Workout Complete! 🎉
                </Heading>
                <Text 
                  fontSize="sm" 
                  fontWeight="medium" 
                  color="white"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  opacity="0.9"
                >
                  Rate Your Effort
                </Text>
              </>
            ) : (
              <>
                <Heading 
                  size="lg" 
                  textAlign="center"
                  color="white"
                  lineHeight="shorter"
                  fontWeight="bold"
                  mb={2}
                  width="100%"
                >
                  {
                    currentExercise?.name || 
                    (currentExercise as any)?.exercises?.[0]?.name ||
                    (workout as any)?.exercises?.[exerciseIdx]?.name ||
                    (workout as any)?.exercises?.[exerciseIdx]?.exercises?.[0]?.name ||
                    (currentExercise as any)?.title || 
                    (currentExercise as any)?.exercise_name || 
                    (currentExercise as any)?.exerciseName ||
                    (currentExercise as any)?.label ||
                    `Exercise ${exerciseIdx + 1}`
                  }
                </Heading>
                <Text 
                  fontSize="sm" 
                  fontWeight="medium" 
                  color="white"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  opacity="0.9"
                >
                  Exercise Execution
                </Text>
              </>
            )}
          </VStack>
          
          {/* Progress Bar */}
          <Box position="absolute" bottom="0" left="0" right="0">
            <Progress 
              value={showRPEScreen ? 100 : (((exerciseIdx + 1) / workout.exercises.length) * 100)} 
              size="sm" 
              height="8px"
              colorScheme={showRPEScreen ? "green" : (running ? "green" : "blue")} 
              backgroundColor="rgba(255,255,255,0.2)"
              borderRadius="0"
            />
          </Box>
          
          {/* Close Button */}
          <IconButton
            aria-label="Close"
            icon={<Box as="span" fontSize="24px" color="white">×</Box>}
            position="absolute"
            top={4}
            right={4}
            variant="ghost"
            colorScheme="whiteAlpha"
            size="lg"
            onClick={onClose}
            _hover={{ bg: 'whiteAlpha.200' }}
            zIndex="3"
          />
        </Box>

        {/* Modal Body - Conditional Content */}
        <ModalBody p={{ base: 6, md: 8 }} overflowY="auto">
          {showRPEScreen ? (
            /* RPE Rating Screen */
            <VStack spacing={6} align="stretch">
              {/* Success Message */}
              <VStack spacing={3} textAlign="center">
                <Icon as={FaCheckCircle} boxSize={12} color="green.500" />
                <Heading size="lg" color={modalHeadingColor}>
                  {workout.name}
                </Heading>
                <Text color={modalTextColor} fontSize="lg">
                  All exercises completed!
                </Text>
                <Text color={modalTextColor} fontSize="sm">
                  How hard was this workout overall?
                </Text>
              </VStack>

              {/* RPE Scale */}
              <VStack spacing={4}>
                <Text fontSize="md" fontWeight="semibold" color={modalHeadingColor}>
                  Rate Perceived Exertion (1-10):
                </Text>
                
                <SimpleGrid columns={5} spacing={3} w="100%">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                    <Circle
                      key={rating}
                      size="50px"
                      bg={selectedRPE === rating ? getRPEColor(rating) : 'gray.100'}
                      color={selectedRPE === rating ? 'white' : 'gray.600'}
                      cursor="pointer"
                      onClick={() => setSelectedRPE(rating)}
                      _hover={{ 
                        bg: selectedRPE === rating ? getRPEColor(rating) : 'gray.200',
                        transform: 'scale(1.05)'
                      }}
                      _dark={{
                        bg: selectedRPE === rating ? getRPEColor(rating) : 'gray.600',
                        color: selectedRPE === rating ? 'white' : 'gray.300',
                        _hover: {
                          bg: selectedRPE === rating ? getRPEColor(rating) : 'gray.500'
                        }
                      }}
                      transition="all 0.2s"
                      fontWeight="bold"
                      fontSize="lg"
                    >
                      {rating}
                    </Circle>
                  ))}
                </SimpleGrid>

                {selectedRPE && (
                  <Flex justify="center">
                    <Badge 
                      colorScheme={getRPEColor(selectedRPE).split('.')[0]} 
                      variant="solid"
                      px={4}
                      py={2}
                      borderRadius="full"
                      fontSize="sm"
                    >
                      {getRPELabel(selectedRPE)}
                    </Badge>
                  </Flex>
                )}
              </VStack>

              {/* Action Buttons */}
              <VStack spacing={3} pt={4}>
                <Button
                  colorScheme="green"
                  size="lg"
                  onClick={handleRPESubmit}
                  isLoading={isLoggingRPE}
                  loadingText="Saving..."
                  leftIcon={<Icon as={FaDumbbell} />}
                  isDisabled={!selectedRPE}
                  borderRadius="xl"
                  px={8}
                  py={6}
                  fontWeight="semibold"
                  boxShadow="lg"
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                  transition="all 0.2s"
                  w="100%"
                >
                  Complete Workout
                </Button>
                
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleSkipRPE}
                  color={modalTextColor}
                  _hover={{ bg: 'gray.100' }}
                  _dark={{ _hover: { bg: 'gray.600' } }}
                >
                  Skip RPE Rating
                </Button>
              </VStack>
            </VStack>
          ) : (
            /* Original Exercise Execution Content */
            <VStack spacing={6} align="stretch">
              {isStrengthExercise(currentExercise.name) ? (
                /* Interactive Set Tracker for Strength Exercises */
                <Box 
                  bg={modalHeaderBg} 
                  borderRadius="2xl" 
                  p={6}
                  border="1px solid"
                  borderColor={modalHeaderBorderColor}
                >
                  <VStack spacing={4}>
                    {/* Exercise Summary */}
                    <HStack justify="space-between" width="100%">
                      <VStack spacing={1}>
                        <Text 
                          color={modalTextColor} 
                          fontSize="sm"
                          fontWeight="medium"
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          Progress
                        </Text>
                        <Text 
                          fontWeight="bold" 
                          fontSize="xl"
                          color={modalHeadingColor}
                        >
                          {getCompletedSetsCount()}/{currentExercise.sets} Sets
                        </Text>
                      </VStack>
                      
                      <VStack spacing={1}>
                        <Text 
                          color={modalTextColor} 
                          fontSize="sm"
                          fontWeight="medium"
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          Target Reps
                        </Text>
                        <Text 
                          fontWeight="bold" 
                          fontSize="xl"
                          color={modalHeadingColor}
                        >
                          {(() => {
                            // Get sets and reps from the nested exercise structure
                            const exerciseData = (currentExercise as any)?.exercises?.[exerciseIdx] || 
                                                (currentExercise as any)?.exercises?.[0] || 
                                                (workout?.exercises?.[0] as any)?.exercises?.[exerciseIdx] ||
                                                currentExercise;
                            const sets = parseInt(exerciseData?.sets || currentExercise?.sets || '0');
                            const reps = parseInt(exerciseData?.reps || currentExercise?.reps || '0');
                            return sets * reps;
                          })()}
                        </Text>
                      </VStack>
                      
                      <VStack spacing={1}>
                        <Text 
                          color={modalTextColor} 
                          fontSize="sm"
                          fontWeight="medium"
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          Exercise
                        </Text>
                        <Text 
                          fontWeight="bold" 
                          fontSize="xl"
                          color={modalHeadingColor}
                        >
                          {exerciseIdx + 1}/{workout.exercises.length}
                        </Text>
                      </VStack>
                      
                      {currentExercise.weight && (
                        <VStack spacing={1}>
                          <Text 
                            color={modalTextColor} 
                            fontSize="sm"
                            fontWeight="medium"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Weight
                          </Text>
                          <Text 
                            fontWeight="bold" 
                            fontSize="xl"
                            color={modalHeadingColor}
                          >
                            {currentExercise.weight}
                            <Text as="span" fontSize="md" color={modalSpanColor}>
                              kg
                            </Text>
                          </Text>
                        </VStack>
                      )}
                    </HStack>
                    
                    <Divider />
                    
                    {/* Individual Set Tracking */}
                    <VStack spacing={3} width="100%">
                      <Text 
                        color={modalTextColor} 
                        fontSize="sm"
                        fontWeight="medium"
                        textTransform="uppercase"
                        letterSpacing="wider"
                        alignSelf="flex-start"
                      >
                        Set Tracking
                      </Text>
                      
                      {setData.map((set, index) => (
                        <HStack 
                          key={index} 
                          spacing={4} 
                          width="100%" 
                          p={3}
                          bg={set.completed ? 
                            useColorModeValue('green.50', 'green.900') : 
                            cardBg
                          }
                          borderRadius="lg"
                          border="1px solid"
                          borderColor={set.completed ? 
                            useColorModeValue('green.200', 'green.600') : 
                            modalHeaderBorderColor
                          }
                        >
                          <Flex minWidth="60px" align="center">
                            <Text fontWeight="semibold" color={modalHeadingColor}>
                              Set {index + 1}
                            </Text>
                          </Flex>
                          
                          <HStack spacing={2} flex={1}>
                            <Text fontSize="sm" color={modalTextColor}>
                              Reps:
                            </Text>
                            <Input
                              type="number"
                              value={set.actualReps}
                              onChange={(e) => handleRepsChange(index, parseInt(e.target.value) || 0)}
                              size="sm"
                              width="70px"
                              textAlign="center"
                              min={0}
                              bg={cardBg}
                              isDisabled={set.completed}
                            />
                            <Text fontSize="sm" color={modalTextColor}>
                              / {set.targetReps}
                            </Text>
                          </HStack>
                          
                          <IconButton
                            aria-label={set.completed ? "Mark incomplete" : "Mark complete"}
                            icon={<CheckIcon />}
                            colorScheme={set.completed ? "green" : "gray"}
                            variant={set.completed ? "solid" : "outline"}
                            size="sm"
                            onClick={() => handleSetComplete(index)}
                          />
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                </Box>
              ) : (
                /* Static Display for Run Exercises */
                <Box 
                  bg={modalHeaderBg} 
                  borderRadius="2xl" 
                  p={6}
                  border="1px solid"
                  borderColor={modalHeaderBorderColor}
                >
                  <HStack justify="space-around" align="center" spacing={6}>
                    <VStack spacing={1}>
                      <Text 
                        color={modalTextColor} 
                        fontSize="sm"
                        fontWeight="medium"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Sets
                      </Text>
                      <Text 
                        fontWeight="bold" 
                        fontSize="2xl"
                        color={modalHeadingColor}
                      >
                        {currentExercise.sets}
                      </Text>
                    </VStack>
                    
                    <Divider orientation="vertical" h="50px" />
                    
                    <VStack spacing={1}>
                      <Text 
                        color={modalTextColor} 
                        fontSize="sm"
                        fontWeight="medium"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Reps
                      </Text>
                      <Text 
                        fontWeight="bold" 
                        fontSize="2xl"
                        color={modalHeadingColor}
                      >
                        {currentExercise.reps}
                      </Text>
                    </VStack>
                    
                    <Divider orientation="vertical" h="50px" />
                    
                    <VStack spacing={1}>
                      <Text 
                        color={modalTextColor} 
                        fontSize="sm"
                        fontWeight="medium"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Exercise
                      </Text>
                      <Text 
                        fontWeight="bold" 
                        fontSize="2xl"
                        color={modalHeadingColor}
                      >
                        {exerciseIdx + 1}/{workout.exercises.length}
                      </Text>
                    </VStack>
                    
                    {currentExercise.weight && (
                      <>
                        <Divider orientation="vertical" h="50px" />
                        <VStack spacing={1}>
                          <Text 
                            color={modalTextColor} 
                            fontSize="sm"
                            fontWeight="medium"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Weight
                          </Text>
                          <Text 
                            fontWeight="bold" 
                            fontSize="2xl"
                            color={modalHeadingColor}
                          >
                            {currentExercise.weight}
                            <Text as="span" fontSize="lg" color={modalSpanColor}>
                              kg
                            </Text>
                          </Text>
                        </VStack>
                      </>
                    )}
                  </HStack>
                </Box>
              )}

              {/* Timer Display */}
              <VStack spacing={1} w="100%">
                <Text 
                  color={modalTextColor} 
                  fontSize="sm"
                  fontWeight="medium"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Timer
                </Text>
                <Box 
                  bg={modalHeaderBg} 
                  borderRadius="xl" 
                  p={6}
                  border="1px solid"
                  borderColor={modalHeaderBorderColor}
                  w="100%"
                >
                  <Text 
                    fontSize="4xl" 
                    fontWeight="bold" 
                    color={modalHeadingColor}
                    textAlign="center"
                    fontFamily="mono"
                  >
                    {Math.floor(timer / 60).toString().padStart(2, '0')}:
                    {(timer % 60).toString().padStart(2, '0')}
                  </Text>
                </Box>
              </VStack>

              {/* Run Time Input - Only show for run exercises */}
              {isRunExercise(currentExercise.name) && (
                <RunTimeInput
                  onTimeChange={(minutes, seconds, hundredths) => {
                    setRunTime({ minutes, seconds, hundredths });
                  }}
                  initialMinutes={runTime.minutes}
                  initialSeconds={runTime.seconds}
                  initialHundredths={runTime.hundredths}
                  placeholder={`${currentExercise.name} - Record Time`}
                />
              )}

              {/* Action Buttons */}
              <VStack spacing={4} width="100%">
                <HStack spacing={3} width="100%" justify="center">
                  {/* Previous Button - Only show if not on first exercise */}
                  {exerciseIdx > 0 && (
                    <Button 
                      colorScheme="gray" 
                      size="lg"
                      leftIcon={<Icon as={ChevronLeftIcon} />} 
                      onClick={onPreviousExercise}
                      borderRadius="xl"
                      px={6}
                      py={6}
                      fontWeight="semibold"
                      boxShadow="lg"
                      _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                      transition="all 0.2s"
                    >
                      Previous
                    </Button>
                  )}

                  {running ? (
                    <Button 
                      colorScheme="yellow" 
                      size="lg"
                      leftIcon={<Icon as={FaRegClock} />} 
                      onClick={() => onUpdateRunning(false)}
                      borderRadius="xl"
                      px={8}
                      py={6}
                      fontWeight="semibold"
                      boxShadow="lg"
                      _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                      transition="all 0.2s"
                    >
                      Pause
                    </Button>
                  ) : (
                    <Button 
                      colorScheme="blue" 
                      size="lg"
                      leftIcon={<Icon as={FaRunning} />} 
                      onClick={() => onUpdateRunning(true)}
                      borderRadius="xl"
                      px={8}
                      py={6}
                      fontWeight="semibold"
                      boxShadow="lg"
                      _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                      transition="all 0.2s"
                    >
                      Start
                    </Button>
                  )}
                  
                  <Button 
                    colorScheme="green" 
                    size="lg"
                    leftIcon={<Icon as={CheckIcon} />} 
                    onClick={handleDone}
                    borderRadius="xl"
                    px={8}
                    py={6}
                    fontWeight="semibold"
                    boxShadow="lg"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                    transition="all 0.2s"
                  >
                    {exerciseIdx + 1 < workout.exercises.length ? 'Next' : 'Finish'}
                  </Button>
                </HStack>
                
                <Button 
                  colorScheme="purple" 
                  variant="outline"
                  size="md"
                  leftIcon={<Icon as={FaPlayCircle} />} 
                  onClick={handleVideoClick}
                  borderRadius="xl"
                  px={6}
                  fontWeight="medium"
                  _hover={{ bg: 'purple.50', transform: 'translateY(-1px)' }}
                  transition="all 0.2s"
                >
                  Watch Tutorial
                </Button>
              </VStack>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 